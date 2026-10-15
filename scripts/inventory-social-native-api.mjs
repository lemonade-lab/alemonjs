import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import process from 'node:process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const name = process.argv[2];
const platforms = JSON.parse(readFileSync(resolve(root, 'scripts/social-platforms.json'), 'utf8'));
if (!platforms.includes(name)) throw new Error('Specify one name from scripts/social-platforms.json');
const entry = resolve(root, `packages/${name}/src/index.ts`);
const program = ts.createProgram([entry], {
  skipLibCheck: true, moduleResolution: ts.ModuleResolutionKind.Bundler,
  module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext
});
const checker = program.getTypeChecker();
const source = program.getSourceFile(entry);
const exported = checker.getExportsOfModule(checker.getSymbolAtLocation(source)).find(symbol => symbol.name === 'API');
const symbol = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
const api = checker.getDeclaredTypeOfSymbol(symbol);
const methods = [];
const unresolved = [];
const walk = (type, path = [], ancestors = new Set()) => {
  if (ancestors.has(type) || path.length > 9) return;
  const next = new Set([...ancestors, type]);
  if (type.flags & ts.TypeFlags.Any) { unresolved.push(path.join('.') || '<API>'); return; }
  for (const property of type.getProperties()) {
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(property.name)) continue;
    const declaration = property.valueDeclaration ?? property.declarations?.[0];
    if (!declaration) continue;
    const modifiers = ts.getCombinedModifierFlags(declaration);
    if (modifiers & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected)) continue;
    const file = declaration.getSourceFile();
    if (/\/typescript\/lib\/|\/@types\/node\//.test(file.fileName)) continue;
    const child = checker.getTypeOfSymbolAtLocation(property, declaration);
    const location = [...path, property.name];
    if (child.getCallSignatures().length) {
      methods.push({
        path: location.join('.'),
        parameters: child.getCallSignatures().map(signature => signature.parameters.map(param => param.name)),
        declaration: relative(root, file.fileName),
        line: file.getLineAndCharacterOfPosition(declaration.getStart()).line + 1
      });
    } else if (child.flags & ts.TypeFlags.Object) {
      walk(child, location, next);
    }
  }
};
walk(api);
// These installed SDKs ship JavaScript without declarations. Enumerate their
// actual public methods while retaining the unresolved type flag; do not
// manufacture parameter or response contracts from method names.
if (unresolved.length && ['irc', 'wechat-official', 'zulip'].includes(name)) {
  const require = createRequire(import.meta.url);
  const sdk = name === 'wechat-official' ? 'wechat-api' : name === 'irc' ? 'irc-framework' : 'zulip-js';
  const module = require(sdk);
  const value = name === 'irc' ? module.Client.prototype
    : name === 'wechat-official' ? module.prototype
    : await module({ realm: 'https://example.invalid', username: 'inventory', apiKey: 'inventory' });
  const inspect = (object, prefix = []) => {
    for (const key of Object.getOwnPropertyNames(object)) {
      if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(key) || key === 'constructor' || ['config', 'options'].includes(key)) continue;
      const descriptor = Object.getOwnPropertyDescriptor(object, key);
      if (!descriptor || !('value' in descriptor)) continue;
      const child = descriptor.value;
      if (typeof child === 'function') {
        const args = child.toString().match(/^[^(]*\(([^)]*)\)/)?.[1].split(',').map(param => param.trim()).filter(Boolean) ?? [];
        methods.push({ path: [...prefix, key].join('.'), parameters: [args], declaration: relative(root, require.resolve(sdk)), types: 'unresolved upstream JavaScript' });
      } else if (name === 'zulip' && child && typeof child === 'object' && prefix.length < 2) {
        inspect(child, [...prefix, key]);
      }
    }
  };
  inspect(value);
}
methods.sort((a, b) => a.path.localeCompare(b.path, 'en'));
const manifest = JSON.parse(readFileSync(resolve(root, `packages/${name}/package.json`), 'utf8'));
const driverFile = resolve(root, `packages/${name}/src/driver.ts`);
const driver = ts.createSourceFile(driverFile, readFileSync(driverFile, 'utf8'), ts.ScriptTarget.Latest, true);
const httpOperations = [];
const inspectHttp = node => {
  if (ts.isCallExpression(node) && node.arguments[0]
    && (node.expression.getText(driver) === 'request' || ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'request')) {
    const first = node.arguments[0];
    if (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first) || ts.isTemplateExpression(first)) {
      const method = node.arguments[name === 'dingtalk' && node.expression.getText(driver) === 'request' ? 2 : 1];
      httpOperations.push({
        path: ts.isTemplateExpression(first) ? first.getText(driver).slice(1, -1) : first.text,
        method: method ? ts.isStringLiteral(method) ? method.text : `dynamic: ${method.getText(driver)}`
          : node.expression.getText(driver) === 'request' && ['dingtalk', 'wechat-kf'].includes(name) ? 'POST' : 'GET',
        declaration: relative(root, driverFile), line: driver.getLineAndCharacterOfPosition(node.getStart()).line + 1
      });
    }
  }
  ts.forEachChild(node, inspectHttp);
};
inspectHttp(driver);
const result = {
  platform: name,
  scope: 'Public callable surface of the exported API type in the installed SDK, not the complete vendor API or IPC compatibility',
  dependencies: manifest.dependencies,
  unresolvedTypes: unresolved.sort(),
  httpOperations,
  methods
};
writeFileSync(resolve(root, `packages/${name}/api-inventory.json`), JSON.stringify(result, null, 2) + '\n');
process.stdout.write(`${name}: ${methods.length} public methods, ${unresolved.length} unresolved types\n`);
