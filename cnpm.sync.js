import { spawnSync } from 'child_process';
import { readdirSync } from 'fs';
const dirs = readdirSync('./packages').filter((dir) => !dir.endsWith('-frontend')).filter(name => {
    if (name == 'alemonjs') {
        return false
    } else if (name == 'build') {
        return false
    }
    return true
});
Promise.all(dirs.map(async (name) => {
    const msg = spawnSync('cnpm', ['sync', `@alemonjs/${name}`], {
        stdio: 'inherit',
        shell: process.platform === 'win32',
    });
    if (msg.error) {
        console.error(msg.error);
        process.exit(1);
    }
}));