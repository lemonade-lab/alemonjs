#!/usr/bin/env node

/**
 *
 * @param {*} dir
 */
export const run = dir => {
  import('../lib/index.js').then(res => {
    res.start(dir);
  });
};
