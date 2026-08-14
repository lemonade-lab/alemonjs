import { Body, Component, Div, DOCTYPE, Head, Html, P, Style, Title, createElement, renderToString } from '../../../../common/react.js';
import type { RuntimeAppRecord } from '../../store.js';

const escapeHtml = (value: string) => {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

const styles = `
  :root { color-scheme: dark; --background: #10100f; --text: #f2f2ed; --muted: #9d9d95; --line: #32322f; --accent: #d6f19a; }
  * { box-sizing: border-box; }
  html, body { margin: 0; min-height: 100%; }
  body {
    font-family: "Avenir Next", "SF Pro Display", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    color: var(--text);
    background: radial-gradient(circle at 90% -18%, rgba(203, 234, 148, 0.12), transparent 34rem), var(--background);
    background-attachment: fixed;
  }
  .page { width: min(1040px, calc(100vw - 40px)); margin: 0 auto; padding: clamp(28px, 6vw, 80px) 0; }
  .page-header { display: flex; align-items: center; gap: 14px; padding: 0 0 26px; border-bottom: 1px solid var(--line); }
  .mark { display: grid; grid-template-columns: repeat(3, 5px); align-items: end; gap: 3px; width: 36px; height: 36px; padding: 8px; border: 1px solid #4a4a46; border-radius: 50%; }
  .mark i { border-radius: 999px; background: var(--accent); }
  .mark i:nth-child(1) { height: 9px; }.mark i:nth-child(2) { height: 18px; }.mark i:nth-child(3) { height: 13px; }
  .eyebrow, .app-type, .app-path, .app-action { font-family: "SF Mono", "Cascadia Code", ui-monospace, monospace; letter-spacing: 0.04em; }
  .eyebrow { margin: 0; color: var(--muted); font-size: 10px; text-transform: uppercase; }
  .page-title { margin: 4px 0 0; font-size: clamp(26px, 4vw, 38px); line-height: 1; letter-spacing: -0.06em; font-weight: 500; }
  .app-list { margin: 0; padding: 0; list-style: none; }
  .app-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 24px 6px; border-bottom: 1px solid var(--line); transition: background 160ms ease; }
  .app-row:hover { background: rgba(255, 255, 255, 0.025); }
  .app-title { margin: 0; font-size: clamp(17px, 2vw, 21px); line-height: 1.15; letter-spacing: -0.035em; overflow-wrap: anywhere; }
  .app-meta { display: flex; gap: 10px; align-items: center; margin-top: 9px; }
  .app-type { color: var(--accent); font-size: 10px; text-transform: uppercase; }
  .app-path { display: block; max-width: 100%; font-size: 11px; letter-spacing: 0; color: var(--muted); overflow-wrap: anywhere; }
  .app-action { flex-shrink: 0; margin-top: 4px; padding: 9px 13px; border-radius: 999px; background: transparent; color: var(--text); border: 1px solid #55554f; font-size: 10px; letter-spacing: 0.05em; text-decoration: none; text-transform: uppercase; transition: background 160ms ease, border-color 160ms ease; }
  .app-row:hover .app-action { border-color: var(--accent); background: var(--accent); color: #20211d; }
  .empty-state { padding: 72px 6px; color: var(--muted); }
  .empty-state__title { margin: 0; color: var(--text); font-size: 16px; letter-spacing: -0.02em; }
  .empty-state__desc { margin: 8px 0 0; color: var(--muted); font-size: 13px; line-height: 1.6; }
  @media (max-width: 600px) { .page { width: min(100vw - 32px, 100%); padding-top: 32px; } .app-row { padding: 20px 0; } .app-action { padding: 8px 10px; } }
`;

const appHref = (app: Pick<RuntimeAppRecord, 'name' | 'kind'>) => {
  return app.kind === 'main' ? '/app/' : `/apps/${app.name}/`;
};

const renderAppHtml = (app: RuntimeAppRecord) => {
  const href = appHref(app);

  return `
    <li class="app-row" data-app-id="${escapeHtml(app.name)}" data-app-kind="${escapeHtml(app.kind)}">
      <div>
        <h2 class="app-title">${escapeHtml(app.name)}</h2>
        <div class="app-meta">
          <span class="app-type">${app.kind === 'main' ? 'Main app' : 'Plugin app'}</span>
          <span class="app-path">${escapeHtml(href)}</span>
        </div>
      </div>
      <a class="app-action" href="${escapeHtml(href)}" aria-label="进入 ${escapeHtml(app.name)}">进入</a>
    </li>
  `;
};

const renderEmptyHtml = () => `
  <div class="empty-state">
    <p class="empty-state__title">暂无可展示的应用。</p>
  </div>
`;

class LaunchpadPage extends Component<{ apps: RuntimeAppRecord[] }> {
  render() {
    const visibleApps = this.props.apps
      .filter(app => app.enabled && app.status === 'ready' && (app.capabilities.web || app.capabilities.httpApi))
      .sort((left, right) => {
        if (left.kind === 'main' && right.kind !== 'main') {
          return -1;
        }
        if (left.kind !== 'main' && right.kind === 'main') {
          return 1;
        }

        return left.name.localeCompare(right.name);
      });
    const appList = visibleApps.length ? visibleApps.map(renderAppHtml).join('') : renderEmptyHtml();

    return Html(
      { lang: 'zh-CN' },
      Head(
        createElement('meta', { charset: 'utf-8' }),
        createElement('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }),
        Title('ALemonJS 应用'),
        Style(styles)
      ),
      Body(
        createElement(
          'main',
          { className: 'page' },
          createElement(
            'header',
            { className: 'page-header' },
            Div({ className: 'mark', 'aria-hidden': 'true' }, createElement('i'), createElement('i'), createElement('i')),
            Div(null, P({ className: 'eyebrow' }, 'ALemonJS / Server'))
          ),
          createElement('ul', { className: 'app-list', id: 'app-list', dangerouslySetInnerHTML: { __html: appList } })
        )
      )
    );
  }
}

export const renderHelloHtml = (apps: RuntimeAppRecord[]) => {
  return DOCTYPE + renderToString(createElement(LaunchpadPage, { apps }));
};

export default renderHelloHtml([]);
