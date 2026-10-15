import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import process from 'node:process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const platforms = JSON.parse(readFileSync(resolve(root, 'scripts/social-platforms.json'), 'utf8'));
const read = path => readFileSync(resolve(root, path), 'utf8');
const parse = path => ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true);
const standard = new Set();
const visit = (node, fn) => { fn(node); ts.forEachChild(node, child => visit(child, fn)); };
for (const path of ['packages/alemonjs/src/types/actions.ts', 'packages/alemonjs/src/types/messaging.ts']) {
  const source = parse(path);
  for (const statement of source.statements) {
    if (!ts.isTypeAliasDeclaration(statement) || !statement.name.text.endsWith('ActionName') && statement.name.text !== 'MessagingActionMap') continue;
    visit(statement.type, node => {
      if (ts.isStringLiteral(node) && node.text.includes('.')) standard.add(node.text);
    });
  }
}

// Inventory registration, not operational support: content limits and native-only
// requirements remain explicit in each package's API.md.
export function inventory(name) {
  const source = parse(`packages/${name}/src/driver.ts`);
  const actions = new Map();
  visit(source, node => {
    if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name) && standard.has(node.name.text)) {
      actions.set(node.name.text, node.initializer.getText(source).replace(/\s+/g, ' '));
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken
      && ts.isElementAccessExpression(node.left) && node.left.expression.getText(source) === 'actions'
      && ts.isStringLiteral(node.left.argumentExpression)) {
      actions.set(node.left.argumentExpression.text, node.right.getText(source).replace(/\s+/g, ' '));
    }
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'sendActions') {
      const scopes = node.arguments[1]?.getText(source) ?? '';
      for (const action of ['message.send', 'message.send.channel', 'message.send.user', 'message.send.target']) {
        if (action.endsWith('.user') && /user\s*:\s*false/.test(scopes)) continue;
        if (action.endsWith('.channel') && /channel\s*:\s*false/.test(scopes)) continue;
        actions.set(action, 'sendActions → destination → platform encoder');
      }
    }
  });
  const media = [];
  visit(source, node => {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'withMedia') media.push(node);
  });
  if (media.length) {
    const types = media[0].arguments[1];
    const files = !types || !ts.isArrayLiteralExpression(types) || types.elements.some(node => ts.isStringLiteral(node) && node.text === 'file');
    for (const action of ['media.send', 'media.send.user', 'media.send.channel', 'file.send.user', 'file.send.channel']) {
      if (action.startsWith('file.') && !files) continue;
      const target = action === 'media.send' ? 'message.send.target' : action.endsWith('.user') ? 'message.send.user' : 'message.send.channel';
      if (actions.has(target) && !actions.has(action)) actions.set(action, `withMedia → ${target}（内容受驱动限制）`);
    }
  }
  actions.set('connection.status', 'index.ts runtime status / capabilities');
  return { actions, source };
}

const start = '<!-- social-api-audit:start -->';
const end = '<!-- social-api-audit:end -->';
let stale = false;
for (const name of platforms) {
  const { actions } = inventory(name);
  const rows = [...standard].sort().map(action => {
    const implementation = actions.get(action);
    const status = !implementation ? '未映射' : implementation.startsWith('withMedia') ? '包装注册，按内容受限' : '已注册';
    // Keep the concrete handler reviewable without dumping its implementation.
    const calls = implementation?.match(/\b(?:client|app|api|robot)\.[\w.]+(?=\()/g) ?? [];
    const target = [...new Set(calls)].join(', ') || (implementation?.startsWith('withMedia') ? implementation : implementation ? '驱动处理；见 driver.ts' : '原生调用或待补齐；不能据此判定平台不支持');
    return `| \`${action}\` | ${status} | ${target.replaceAll('|', '\\|')} |`;
  });
  const block = `${start}\n## 框架动作逐项核对（自动生成）\n\n当前框架声明 ${standard.size} 个标准动作，本包注册 ${actions.size} 个（含 connection.status、发送别名和媒体包装）。这是动作注册范围，不是平台 API 覆盖率；未映射保留为缺口，不自动判定为不适用。\n\n| 框架动作 | 源码状态 | 对应入口 |\n|---|---|---|\n${rows.join('\n')}\n\n${end}`;
  const path = `packages/${name}/API.md`;
  let before;
  try { before = read(path); } catch { throw new Error(`Missing curated API reference: ${path}`); }
  const from = before.indexOf(start);
  const to = before.indexOf(end);
  const after = from === -1 ? `${before.trimEnd()}\n\n${block}\n` : `${before.slice(0, from)}${block}${before.slice(to + end.length)}`;
  if (after !== before) {
    if (process.argv.includes('--write')) writeFileSync(resolve(root, path), after);
    else { process.stderr.write(`${path}: stale\n`); stale = true; }
  }
  process.stdout.write(`${name}: ${actions.size}/${standard.size} registered\n`);
}
if (stale) process.exitCode = 1;
