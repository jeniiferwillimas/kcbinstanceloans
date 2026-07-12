// PM2 process file for the Next.js frontend.
// Run from the repo root on the droplet: pm2 start deploy/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "loan-frontend",
      cwd: "/var/www/loan-app",
      script: "npm",
      args: "start -- -p 3000",
      instances: 1, // single vCPU droplet; raise once the droplet has more cores
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      min_uptime: "15s", // avoid restart-loop burning CPU if the app is crash-looping
      max_memory_restart: "400M", // restart before it OOMs the 1GB droplet
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
