import type { ActionTarget, DataEnums } from '../types/index.js';
import { markdownToPlainText } from '../application/format/markdown-render.js';

export type TestMessage = {
  /** Snapshot of the original Format nodes, including nesting and options. */
  nodes: DataEnums[];
  content?: unknown;
  target?: ActionTarget;
  text: string;
  commands: string[];
  /** Includes failed attempts. Index in this run's actions array. */
  actionIndex: number;
};

export function inspectMessage(nodes: DataEnums[] = []) {
  const commands: string[] = [];
  const walk = (values: any[]) => {
    for (const node of values) {
      if (Array.isArray(node)) {
        walk(node);
        continue;
      }
      if (!node || typeof node !== 'object') {
        continue;
      }
      if (Array.isArray(node.value)) {
        walk(node.value);
      }
      if (['MD.button', 'Button'].includes(node.type) && typeof node.options?.data === 'string' && !['link', 'call'].includes(node.options.type)) {
        commands.push(node.options.data);
      }
    }
  };

  walk(nodes);
  const plain = (node: any): string => {
    if (Array.isArray(node)) {
      return node.map(plain).join('');
    }
    if (!node || typeof node !== 'object') {
      return '';
    }
    if (node.type === 'Markdown') {
      return markdownToPlainText(node.value);
    }
    if (node.type?.startsWith('MD.')) {
      return markdownToPlainText([node] as any);
    }
    if (node.type === 'Text' || node.type === 'Button') {
      return String(node.value);
    }
    if (Array.isArray(node.value)) {
      return node.value.map(plain).join('');
    }

    return '';
  };
  const text = nodes.map(plain).join('');

  return { text, commands };
}
