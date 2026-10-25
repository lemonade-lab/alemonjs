import { Format } from 'alemonjs';
import { QQMarkdown, type QQMarkdownTask, type QQMarkdownMathOptions } from '@alemonjs/qq-bot/markdown';
const task: QQMarkdownTask = { text: '任务', checked: true };
const options: QQMarkdownMathOptions = { block: true };
Format.createMarkdown().addContent(QQMarkdown.taskList(task)).addContent(QQMarkdown.math('x^2', options));
Format.create().addMarkdownOriginal(QQMarkdown.color('提示', 'red'));
// @ts-expect-error QQ extensions do not extend the generic Markdown builder.
Format.createMarkdown().addMath('x^2');
// @ts-expect-error QQ extensions do not extend the generic Markdown builder.
Format.createMarkdown().addColor('提示', 'red');
// @ts-expect-error QQ-specific syntax helpers do not promise generic fallback rendering.
QQMarkdown.math('x^2', { fallback: '平方' });
// @ts-expect-error checked is a boolean.
QQMarkdown.taskList({ text: '任务', checked: 'yes' });
