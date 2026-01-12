module.exports = {
  apps: [
    {
      name: 'la-vip-tours',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: './.',
      watch: false,
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--no-deprecation'
      }
    }
  ]
};
