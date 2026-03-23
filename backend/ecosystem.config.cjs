module.exports = {
  apps: [{
    name: "eduvault-backend",
    script: "./server.js",
    instances: "max", // Leverages all available CPU cores for high concurrent traffic (5000+ users)
    exec_mode: "cluster", // Enables Node.js clustering
    watch: false,
    max_memory_restart: "1G", // Auto restart if memory limit exceeded
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 5000,
    }
  }]
};
