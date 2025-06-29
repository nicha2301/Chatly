module.exports = {
  apps: [
    {
      name: 'chatly-api',
      script: './dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      env_staging: {
        NODE_ENV: 'staging'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      time: true
    }
  ]
}; 