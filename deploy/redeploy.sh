#!/usr/bin/env bash
# One-shot deploy: syncs code to match origin exactly, builds, restarts, and
# reports errors. Safe to run as root, deploy, or from cron.
#
#   bash /var/www/loan-app/deploy/redeploy.sh
#
# Design notes:
#   - Always re-execs as `deploy` (only account with the GitHub deploy key
#     and correct file ownership) if invoked as anyone else.
#   - Force-syncs the working tree to origin/$BRANCH with fetch + reset
#     --hard + clean, instead of `git pull`/`git merge` - there is no such
#     thing as a merge conflict this way, and no git identity is needed for
#     normal runs. Any local-only edits are discarded on purpose: real
#     changes belong in git, not scp'd or hand-edited on the server.
#   - After syncing, re-execs itself as a fresh process reading this same
#     file back off disk (via --post-sync), since the sync step may have
#     just overwritten this very file - avoids ever running on a stale or
#     half-read copy.
set -euo pipefail

APP_DIR="/var/www/loan-app"
BACKEND_DIR="$APP_DIR/kcb-loan-backend"
REPO_URL="git@github.com:jeth-consultant/loan-management-wesbsite.git"
BRANCH="${DEPLOY_BRANCH:-main}"

if [ "$(whoami)" != "deploy" ]; then
  exec sudo -u deploy -H DEPLOY_BRANCH="$BRANCH" bash "$0" "$@"
fi

# One-time, idempotent - needed for any git operation that creates a commit
# (not used in the normal fetch+reset path, but cheap insurance).
git config --global user.email >/dev/null 2>&1 || git config --global user.email "deploy@loan-app.local"
git config --global user.name  >/dev/null 2>&1 || git config --global user.name  "loan-app deploy"

if [ ! -d "$APP_DIR/.git" ]; then
  echo "==> No repo at $APP_DIR yet, cloning '$BRANCH'"
  sudo mkdir -p "$APP_DIR"
  sudo chown deploy:deploy "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

if [ "${1:-}" != "--post-sync" ]; then
  echo "==> Fetching origin/$BRANCH"
  git fetch origin "$BRANCH"

  BEFORE="$(git rev-parse HEAD)"
  AFTER="$(git rev-parse "origin/$BRANCH")"

  if [ "$BEFORE" = "$AFTER" ] && [ "$(git branch --show-current)" = "$BRANCH" ]; then
    echo "==> Already up to date with origin/$BRANCH ($AFTER) - nothing to deploy."
    exit 0
  fi

  echo "==> Syncing working tree to origin/$BRANCH ($BEFORE -> $AFTER)"
  git checkout -B "$BRANCH" "origin/$BRANCH"
  git clean -fd

  exec bash "$APP_DIR/deploy/redeploy.sh" --post-sync
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
git -C "$APP_DIR" log -1 --oneline

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
