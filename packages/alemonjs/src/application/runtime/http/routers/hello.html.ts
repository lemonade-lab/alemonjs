import type { RuntimeAppRecord } from '../../store.js';

const escapeHtml = (value: string) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const appHref = (app: Pick<RuntimeAppRecord, 'name' | 'kind'>) => {
  return app.kind === 'main' ? '/app' : `/apps/${app.name}`;
};

const appTags = (app: RuntimeAppRecord) => {
  const tags = [app.kind === 'main' ? '主应用' : '插件'];

  if (app.capabilities.web) {
    tags.push('页面');
  }
  if (app.capabilities.httpApi) {
    tags.push('接口');
  }
  if (app.capabilities.event) {
    tags.push('事件');
  }
  if (app.capabilities.expose) {
    tags.push('Expose');
  }

  return tags;
};

const renderCard = (app: RuntimeAppRecord) => {
  const href = appHref(app);
  const tags = appTags(app)
    .map(tag => `<span class="app-tag">${escapeHtml(tag)}</span>`)
    .join('');
  const desc = app.kind === 'main' ? '访问主应用页面、接口与默认资源。' : '访问插件页面、接口与公开入口。';

  return `
    <a
      class="app-card"
      href="${escapeHtml(href)}"
      data-app-id="${escapeHtml(app.name)}"
      data-app-kind="${escapeHtml(app.kind)}"
      data-app-href="${escapeHtml(href)}"
    >
      <div class="app-card__top">
        <div>
          <p class="app-eyebrow">${app.kind === 'main' ? 'Main App' : 'Plugin App'}</p>
          <h2 class="app-title">${escapeHtml(app.name)}</h2>
        </div>
        <div class="app-rank">
          <span class="app-rank__label">热度</span>
          <span class="app-rank__value" data-click-count>0</span>
        </div>
      </div>
      <p class="app-desc">${escapeHtml(desc)}</p>
      <div class="app-tags">${tags}</div>
      <div class="app-card__bottom">
        <span class="app-link">${escapeHtml(href)}</span>
        <span class="app-action">进入</span>
      </div>
    </a>
  `;
};

const renderEmpty = () => {
  return `
    <div class="empty-state">
      <p class="empty-state__title">当前没有可展示的应用。</p>
      <p class="empty-state__desc">请先加载主应用或插件，再刷新本页查看入口。</p>
    </div>
  `;
};

export const renderHelloHtml = (apps: RuntimeAppRecord[]) => {
  const visibleApps = apps
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

  const cards = visibleApps.length ? visibleApps.map(renderCard).join('') : renderEmpty();
  const payload = JSON.stringify(
    visibleApps.map(app => ({
      id: app.name,
      href: appHref(app),
      kind: app.kind
    }))
  );

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>ALemonJS 应用入口</title>
    <style>
      :root {
        --bg: #f3efe5;
        --panel: rgba(255, 251, 245, 0.88);
        --panel-strong: #fffaf2;
        --text: #17212b;
        --muted: #6a7684;
        --line: rgba(23, 33, 43, 0.08);
        --accent: #d96c28;
        --accent-strong: #a54a13;
        --shadow: 0 24px 60px rgba(47, 35, 20, 0.12);
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; }
      body {
        font-family: "SF Pro Display", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at top left, rgba(217, 108, 40, 0.18), transparent 28%),
          radial-gradient(circle at right center, rgba(78, 140, 124, 0.14), transparent 26%),
          linear-gradient(180deg, #f8f4ec 0%, var(--bg) 100%);
      }
      .page {
        width: min(1680px, calc(100vw - 32px));
        margin: 0 auto;
        padding: clamp(28px, 4vw, 56px) 0 64px;
      }
      .hero {
        position: relative;
        overflow: hidden;
        padding: clamp(28px, 4vw, 56px);
        border-radius: 32px;
        background: linear-gradient(135deg, rgba(255, 250, 242, 0.95), rgba(255, 244, 231, 0.88));
        border: 1px solid rgba(255, 255, 255, 0.72);
        box-shadow: var(--shadow);
      }
      .hero::after {
        content: "";
        position: absolute;
        inset: auto -8% -48% auto;
        width: min(38vw, 520px);
        aspect-ratio: 1;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(217, 108, 40, 0.18), transparent 62%);
        pointer-events: none;
      }
      .hero-kicker {
        margin: 0 0 12px;
        font-size: clamp(14px, 1.2vw, 18px);
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--accent-strong);
      }
      .hero-title {
        margin: 0;
        max-width: 12ch;
        font-size: clamp(40px, 7vw, 86px);
        line-height: 0.95;
        letter-spacing: -0.04em;
      }
      .hero-desc {
        margin: 18px 0 0;
        max-width: 56rem;
        font-size: clamp(18px, 2vw, 28px);
        line-height: 1.6;
        color: var(--muted);
      }
      .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        margin-top: 28px;
      }
      .hero-pill {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 12px 18px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.78);
        border: 1px solid rgba(23, 33, 43, 0.08);
        font-size: clamp(14px, 1.4vw, 18px);
      }
      .hero-pill strong {
        color: var(--accent-strong);
      }
      .section-head {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 20px;
        margin: 28px 0 18px;
        padding: 0 6px;
      }
      .section-title {
        margin: 0;
        font-size: clamp(28px, 3vw, 42px);
      }
      .section-note {
        margin: 0;
        font-size: clamp(14px, 1.3vw, 18px);
        color: var(--muted);
      }
      .app-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
        gap: 18px;
      }
      .app-card {
        display: flex;
        flex-direction: column;
        gap: 18px;
        min-height: 280px;
        padding: 24px;
        border-radius: 28px;
        text-decoration: none;
        color: inherit;
        background: var(--panel);
        border: 1px solid var(--line);
        box-shadow: 0 14px 40px rgba(30, 37, 44, 0.08);
        transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
      }
      .app-card:hover {
        transform: translateY(-4px);
        border-color: rgba(217, 108, 40, 0.28);
        box-shadow: 0 24px 50px rgba(30, 37, 44, 0.12);
      }
      .app-card__top,
      .app-card__bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .app-eyebrow {
        margin: 0 0 8px;
        font-size: 13px;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: var(--accent-strong);
      }
      .app-title {
        margin: 0;
        font-size: clamp(28px, 2.8vw, 38px);
        line-height: 1;
      }
      .app-desc {
        margin: 0;
        font-size: clamp(16px, 1.4vw, 20px);
        line-height: 1.7;
        color: var(--muted);
      }
      .app-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .app-tag {
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(217, 108, 40, 0.1);
        color: var(--accent-strong);
        font-size: 14px;
      }
      .app-rank {
        min-width: 84px;
        text-align: right;
      }
      .app-rank__label,
      .app-link {
        display: block;
        font-size: 13px;
        color: var(--muted);
      }
      .app-rank__value {
        font-size: clamp(24px, 2vw, 30px);
        font-weight: 700;
      }
      .app-action {
        padding: 12px 18px;
        border-radius: 999px;
        background: #1d2d38;
        color: #fff;
        font-size: 15px;
      }
      .empty-state {
        padding: 32px;
        border-radius: 28px;
        background: var(--panel-strong);
        border: 1px dashed rgba(23, 33, 43, 0.16);
      }
      .empty-state__title {
        margin: 0;
        font-size: 24px;
      }
      .empty-state__desc {
        margin: 10px 0 0;
        color: var(--muted);
        font-size: 16px;
      }
      @media (max-width: 820px) {
        .page { width: min(100vw - 20px, 100%); padding-top: 18px; }
        .hero { border-radius: 24px; padding: 22px; }
        .section-head { align-items: start; flex-direction: column; }
        .app-card { min-height: 0; padding: 20px; border-radius: 22px; }
        .app-card__top,
        .app-card__bottom { align-items: start; flex-direction: column; }
        .app-rank { text-align: left; min-width: 0; }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <p class="hero-kicker">ALemonJS Launchpad</p>
        <h1 class="hero-title">阿柠檬机器人</h1>
      </section>
      <section>
        <div class="section-head">
          <div>
            <h2 class="section-title">应用列表</h2>
          </div>
        </div>
        <div class="app-grid" id="app-grid">${cards}</div>
      </section>
    </main>
    <script>
      (() => {
        const storageKey = 'alemonjs:launchpad:clicks';
        const apps = ${payload};
        const grid = document.getElementById('app-grid');
        if (!grid) return;

        const readClicks = () => {
          try {
            return JSON.parse(localStorage.getItem(storageKey) || '{}');
          } catch {
            return {};
          }
        };

        const writeClicks = (value) => {
          localStorage.setItem(storageKey, JSON.stringify(value));
        };

        const scoreOf = (id, clicks) => Number(clicks[id] || 0);
        const clicks = readClicks();
        const cards = Array.from(grid.querySelectorAll('[data-app-id]'));

        const refreshCounts = () => {
          cards.forEach((card) => {
            const id = card.getAttribute('data-app-id') || '';
            const node = card.querySelector('[data-click-count]');
            if (node) {
              node.textContent = String(scoreOf(id, clicks));
            }
          });
        };

        const sortCards = () => {
          cards
            .sort((left, right) => {
              const leftId = left.getAttribute('data-app-id') || '';
              const rightId = right.getAttribute('data-app-id') || '';
              const diff = scoreOf(rightId, clicks) - scoreOf(leftId, clicks);
              if (diff !== 0) return diff;
              return leftId.localeCompare(rightId);
            })
            .forEach(card => grid.appendChild(card));
        };

        cards.forEach((card) => {
          card.addEventListener('click', () => {
            const id = card.getAttribute('data-app-id') || '';
            clicks[id] = scoreOf(id, clicks) + 1;
            writeClicks(clicks);
            refreshCounts();
            sortCards();
          });
        });

        refreshCounts();
        sortCards();
      })();
    </script>
  </body>
</html>`;
};

export default renderHelloHtml([]);
