#!/usr/bin/env bash
# Clones (if missing), merges latest main, redeploys backend + frontend,
# and reports any errors from server logs. Run as the `deploy` user:
#   bash /var/www/loan-app/deploy/redeploy.sh
set -euo pipefail

APP_DIR="/var/www/loan-app"
BACKEND_DIR="$APP_DIR/kcb-loan-backend"
REPO_URL="git@github.com:jeth-consultant/loan-management-wesbsite.git"
BRANCH="${DEPLOY_BRANCH:-main}"

# --- Clone if this is a fresh droplet with no repo yet ---
if [ ! -d "$APP_DIR/.git" ]; then
  echo "==> No repo at $APP_DIR yet, cloning '$BRANCH'"
  sudo mkdir -p "$APP_DIR"
  sudo chown "$(whoami):$(whoami)" "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

# --- Refuse to merge over uncommitted local changes ---
# All fixes belong in git; if the tree is dirty it's usually a fix that got
# copied directly onto the server instead of committed, and merging would
# either fail outright or silently clobber it.
if [ -n "$(git status --porcelain --untracked-files=all)" ]; then
  echo "!! Working tree has uncommitted/untracked changes — refusing to merge over them."
  echo "!! Inspect with: cd $APP_DIR && git status"
  echo "!! If origin/$BRANCH already has these changes, stash and drop them:"
  echo "!!   git stash -u && git stash drop"
  exit 1
fi

# --- Fetch + merge, but never leave the tree in a conflicted state ---
echo "==> Fetching origin/$BRANCH"
git fetch origin "$BRANCH"

if ! git merge --no-edit "origin/$BRANCH"; then
  echo "!! Merge conflict pulling origin/$BRANCH — aborting so the server is left in its last known-good state."
  echo "!! Resolve manually on your machine, push, then re-run this script:"
  echo "!!   cd $APP_DIR && git status"
  # Only abort if a merge actually started (MERGE_HEAD present) - a failure
  # before that point (e.g. dirty tree) leaves nothing to abort.
  if [ -f .git/MERGE_HEAD ]; then
    git merge --abort
  fi
  exit 1
fi

echo "==> Backend: composer install"
cd "$BACKEND_DIR"
COMPOSER_ALLOW_SUPERUSER=1 composer install --optimize-autoloader --no-dev --no-interaction

echo "==> Backend: migrate"
php artisan migrate --force

echo "==> Backend: rebuild caches"
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Backend: fix storage permissions"
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

echo "==> Frontend: install + build"
cd "$APP_DIR"
npm ci --no-audit --no-fund
npm run build

echo "==> Restarting services"
pm2 restart loan-frontend
sudo systemctl reload php8.3-fpm     # opcache.validate_timestamps=0, so this MUST run to pick up new PHP code
sudo systemctl restart laravel-queue # queue workers cache the booted app in memory
sudo nginx -t && sudo systemctl reload nginx

echo "==> Done. Current commit:"
git log -1 --oneline

# --- Post-deploy health check: surface problems instead of hiding them ---
echo ""
echo "==> Post-deploy checks"

echo "--- Service status ---"
for svc in nginx php8.3-fpm postgresql laravel-queue; do
  status=$(sudo systemctl is-active "$svc" || true)
  echo "$svc: $status"
  if [ "$status" != "active" ]; then
    echo "   !! $svc is not active — recent journal:"
    sudo journalctl -u "$svc" -n 15 --no-pager
  fi
done

echo "--- PM2 status ---"
pm2 status

echo "--- Laravel log: recent errors (last 300 lines scanned) ---"
LARAVEL_LOG="$BACKEND_DIR/storage/logs/laravel.log"
if [ -f "$LARAVEL_LOG" ]; then
  RECENT_ERRORS=$(tail -n 300 "$LARAVEL_LOG" | grep -i "ERROR" || true)
  if [ -n "$RECENT_ERRORS" ]; then
    echo "$RECENT_ERRORS" | tail -20
  else
    echo "No recent errors."
  fi
else
  echo "No laravel.log found yet."
fi

echo "--- Nginx error log: last 10 lines ---"
sudo tail -n 10 /var/log/nginx/loan-app.error.log 2>/dev/null || echo "No nginx error log yet."

echo "--- Frontend (PM2) recent error output ---"
pm2 logs loan-frontend --lines 15 --nostream --err || true
