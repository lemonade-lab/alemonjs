#!/usr/bin/env node

import { existsSync, writeFileSync } from 'fs';
import { cpSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'node:url';

import GitBody from './str-git.js';
import NpmPublish from './str-npm.js';
import NpmrcBody from './str-npmr.js';
import { readFileSync } from 'node:fs';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);
const alemonjsCliPath = resolve(currentDirPath);

/**
 *
 * @param {*} name
 * @returns
 */
function createTemplate(name: string) {
  // 名字不存在
  if (!name) {
    process.exit();
  }
  // 当前目录下
  const dirPath = `./${name}`;

  // 存在
  if (existsSync(dirPath)) {
    console.error('Robot name already exists!');

    return;
  }
  // 换行
  console.info('\n');
  try {
    const data = join(alemonjsCliPath, '../', 'package.json');
    const pkg = readFileSync(data, 'utf-8');
    const version = JSON.parse(pkg).version;
    //  templatePath  --> dirPath
    const templatePath = join(alemonjsCliPath, '../', 'template', name);

    console.info(`[V${version}] Copying template...`);
    cpSync(templatePath, dirPath, { recursive: true });
    writeFileSync(join(dirPath, '.npmrc'), NpmrcBody);
    writeFileSync(join(dirPath, '.gitignore'), GitBody);
    writeFileSync(join(dirPath, '.npmignore'), NpmPublish);
    // 切换目录
    process.chdir(dirPath);
    console.info('------------------------------------');
    console.info(`cd ${name}`);
    console.info('npm i yarn -g && yarn');
    console.info('------------------------------------');
  } catch (error) {
    console.info(`${name} ${error}`);
  }
}

void createTemplate('alemonjs');
