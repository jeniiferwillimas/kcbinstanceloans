#!/usr/bin/env bash
# Pulls latest code and redeploys backend + frontend on this droplet.
# Run as: bash /var/www/loan-app/deploy/redeploy.sh
set -euo pipefail

APP_DIR="/var/www/loan-app"
BACKEND_DIR="$APP_DIR/kcb-loan-backend"
BRANCH="$(git -C "$APP_DIR" branch --show-current)"

echo "==> Pulling latest '$BRANCH'"
git -C "$APP_DIR" pull origin "$BRANCH"

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
sudo systemctl reload php8.3-fpm    # opcache.validate_timestamps=0, so this MUST run to pick up new PHP code
sudo systemctl restart laravel-queue # queue workers cache the booted app in memory
sudo nginx -t && sudo systemctl reload nginx

echo "==> Done. Current commit:"
git -C "$APP_DIR" log -1 --oneline
