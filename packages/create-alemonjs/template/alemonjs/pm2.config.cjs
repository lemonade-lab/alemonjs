const fs = require('fs');
const yaml = require('yaml');

// Read and parse the YAML configuration file
const data = fs.readFileSync('./alemon.config.yaml', 'utf8');
const config = yaml.parse(data);

// Extracting PM2 configuration
const pm2 = config?.pm2 ?? {};

/**
 * @type {{ apps: import("pm2").StartOptions[] }}
 */
module.exports = pm2;
