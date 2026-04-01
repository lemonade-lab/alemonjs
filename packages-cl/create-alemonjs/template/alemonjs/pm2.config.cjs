const fs = require('fs');
const yaml = require('yaml');

let pm2 = null;
try {
  // Read and parse the YAML configuration file
  const data = fs.readFileSync('./alemon.config.yaml', 'utf8');
  const config = yaml.parse(data);
  pm2 = config?.pm2 ?? {};
} catch (error) {
  console.error('Error parsing YAML configuration:', error);
}

/**
 * @type {{ apps: import("pm2").StartOptions[] }}
 */
module.exports = pm2 || {
  apps: []
};
