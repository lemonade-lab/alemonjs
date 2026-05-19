import { Body, Component, Div, DOCTYPE, Head, Html, P, Style, Title, createElement, renderToString } from '../../../../common/react.js';
import type { RuntimeAppRecord } from '../../store.js';

const escapeHtml = (value: string) => {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

const styles = `
  :root {
    --bg: #ece5d6;
    --bg-deep: #e4dac6;
    --panel: rgba(255, 251, 244, 0.76);
    --panel-strong: rgba(255, 250, 242, 0.92);
    --text: #17212b;
    --muted: #667281;
    --line: rgba(20, 29, 36, 0.09);
    --line-strong: rgba(20, 29, 36, 0.16);
    --accent: #cf6a2c;
    --accent-strong: #9b4717;
    --accent-soft: rgba(207, 106, 44, 0.16);
    --shadow: 0 24px 80px rgba(49, 34, 17, 0.14);
    --shadow-card: 0 18px 40px rgba(33, 37, 41, 0.08);
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; min-height: 100%; }
  body {
    font-family: "Avenir Next", "SF Pro Display", "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    color: var(--text);
    background:
      radial-gradient(circle at 12% 12%, rgba(207, 106, 44, 0.22), transparent 0 26%),
      radial-gradient(circle at 88% 18%, rgba(69, 119, 104, 0.18), transparent 0 24%),
      radial-gradient(circle at 50% 120%, rgba(33, 58, 78, 0.08), transparent 0 28%),
      linear-gradient(180deg, #f8f4ec 0%, var(--bg) 48%, var(--bg-deep) 100%);
    background-attachment: fixed;
  }
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    background:
      linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)),
      repeating-linear-gradient(
        90deg,
        transparent 0,
        transparent 31px,
        rgba(255, 255, 255, 0.18) 31px,
        rgba(255, 255, 255, 0.18) 32px
      );
    opacity: 0.22;
    pointer-events: none;
  }
  .page {
    position: relative;
    width: min(1520px, calc(100vw - 32px));
    margin: 0 auto;
    padding: clamp(24px, 3vw, 44px) 0 72px;
  }
  .hero {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    display: grid;
    align-items: end;
    min-height: clamp(240px, 32vw, 380px);
    padding: clamp(28px, 4vw, 52px);
    border-radius: 36px;
    background:
      linear-gradient(135deg, rgba(255, 250, 242, 0.84), rgba(247, 236, 220, 0.88)),
      linear-gradient(180deg, rgba(255, 255, 255, 0.24), rgba(255, 255, 255, 0));
    border: 1px solid rgba(255, 255, 255, 0.68);
    box-shadow: var(--shadow);
    backdrop-filter: blur(20px);
  }
  .hero::before,
  .hero::after {
    content: "";
    position: absolute;
    border-radius: 999px;
    pointer-events: none;
  }
  .hero::before {
    inset: -18% auto auto -8%;
    width: min(34vw, 420px);
    aspect-ratio: 1;
    background: radial-gradient(circle, rgba(244, 161, 85, 0.28), transparent 62%);
    filter: blur(8px);
    opacity: 0.95;
  }
  .hero::after {
    inset: auto -8% -44% auto;
    width: min(42vw, 560px);
    aspect-ratio: 1;
    background: radial-gradient(circle, rgba(49, 83, 104, 0.22), transparent 62%);
    filter: blur(16px);
  }
  .hero-kicker {
    position: relative;
    z-index: 1;
    display: inline-flex;
    width: fit-content;
    margin: 0 0 16px;
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid rgba(155, 71, 23, 0.14);
    background: rgba(255, 255, 255, 0.62);
    box-shadow: 0 8px 22px rgba(155, 71, 23, 0.08);
    font-size: clamp(12px, 1vw, 14px);
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent-strong);
  }
  .hero-title {
    position: relative;
    z-index: 1;
    margin: 0;
    max-width: 9ch;
    font-size: clamp(42px, 8vw, 96px);
    line-height: 0.88;
    letter-spacing: -0.06em;
    text-wrap: balance;
  }
  .section-head {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 20px;
    margin: 34px 0 22px;
    padding: 0 6px;
  }
  .section-title {
    margin: 0;
    font-size: clamp(28px, 3vw, 40px);
    line-height: 1;
    letter-spacing: -0.04em;
  }
  .section-note {
    margin: 0;
    font-size: clamp(14px, 1.3vw, 18px);
    color: var(--muted);
  }
  .app-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
    gap: 20px;
  }
  .app-card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 24px;
    min-height: 240px;
    padding: 24px;
    border-radius: 30px;
    text-decoration: none;
    color: inherit;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.14)),
      var(--panel);
    border: 1px solid var(--line);
    box-shadow: var(--shadow-card);
    backdrop-filter: blur(18px);
    transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease;
  }
  .app-card::before,
  .app-card::after {
    content: "";
    position: absolute;
    pointer-events: none;
  }
  .app-card::before {
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0), rgba(207, 106, 44, 0.12));
    -webkit-mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0.85;
  }
  .app-card::after {
    top: -24%;
    right: -10%;
    width: 56%;
    aspect-ratio: 1;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(207, 106, 44, 0.16), transparent 68%);
    transition: transform 180ms ease, opacity 180ms ease;
  }
  .app-card:hover {
    transform: translateY(-6px);
    border-color: rgba(207, 106, 44, 0.3);
    box-shadow: 0 28px 60px rgba(30, 37, 44, 0.14);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.62), rgba(255, 255, 255, 0.18)),
      rgba(255, 251, 244, 0.92);
  }
  .app-card:hover::after {
    transform: scale(1.08);
    opacity: 1;
  }
  .app-card:nth-child(3n + 2)::after {
    background: radial-gradient(circle, rgba(72, 122, 107, 0.18), transparent 68%);
  }
  .app-card:nth-child(3n + 3)::after {
    background: radial-gradient(circle, rgba(53, 92, 128, 0.16), transparent 68%);
  }
  .app-card__top,
  .app-card__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .app-card__top {
    align-items: start;
  }
  .app-eyebrow {
    display: inline-flex;
    margin: 0 0 14px;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.58);
    border: 1px solid rgba(155, 71, 23, 0.1);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--accent-strong);
  }
  .app-title {
    margin: 0;
    max-width: 11ch;
    font-size: clamp(28px, 2.8vw, 40px);
    line-height: 0.95;
    letter-spacing: -0.05em;
    overflow-wrap: anywhere;
  }
  .app-link {
    display: block;
    max-width: 100%;
    font-family: "SF Mono", "ui-monospace", "Menlo", monospace;
    font-size: 13px;
    letter-spacing: 0.02em;
    color: var(--muted);
    overflow-wrap: anywhere;
  }
  .app-action {
    flex-shrink: 0;
    padding: 12px 18px;
    border-radius: 999px;
    background: #1d2d38;
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
    font-size: 14px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    transition: transform 180ms ease, background 180ms ease;
  }
  .app-card:hover .app-action {
    transform: translateX(2px);
    background: #223746;
  }
  .empty-state {
    padding: 40px 32px;
    border-radius: 30px;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0.12)),
      var(--panel-strong);
    border: 1px dashed var(--line-strong);
    box-shadow: var(--shadow-card);
  }
  .empty-state__title {
    margin: 0;
    font-size: 24px;
    letter-spacing: -0.03em;
  }
  .empty-state__desc {
    margin: 10px 0 0;
    color: var(--muted);
    font-size: 16px;
    line-height: 1.7;
  }
  @media (max-width: 820px) {
    body::before {
      opacity: 0.12;
    }
    .page {
      width: min(100vw - 20px, 100%);
      padding-top: 18px;
    }
    .hero {
      min-height: 220px;
      border-radius: 26px;
      padding: 22px;
    }
    .section-head {
      align-items: start;
      flex-direction: column;
      margin-top: 28px;
    }
    .app-card {
      min-height: 0;
      padding: 20px;
      border-radius: 24px;
    }
    .app-card__top,
    .app-card__bottom {
      align-items: start;
      flex-direction: column;
    }
    .app-title {
      max-width: none;
    }
  }
`;

const appHref = (app: Pick<RuntimeAppRecord, 'name' | 'kind'>) => {
  return app.kind === 'main' ? '/app/' : `/apps/${app.name}/`;
};

const renderCardHtml = (app: RuntimeAppRecord) => {
  const href = appHref(app);

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
      </div>
      <div class="app-card__bottom">
        <span class="app-link">${escapeHtml(href)}</span>
        <span class="app-action">进入</span>
      </div>
    </a>
  `;
};

const renderEmptyHtml = () => {
  return `
    <div class="empty-state">
      <p class="empty-state__title">当前没有可展示的应用。</p>
      <p class="empty-state__desc">可能你并启动扩展，或选择的扩展并没有支持WEB应用</p>
    </div>
  `;
};

const renderLaunchpadScript = (apps: RuntimeAppRecord[]) => {
  const payload = JSON.stringify(
    apps.map(app => ({
      id: app.name,
      href: appHref(app),
      kind: app.kind
    }))
  );

  return `
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
  `;
};

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

    const cards = visibleApps.length ? visibleApps.map(renderCardHtml).join('') : renderEmptyHtml();
    const script = renderLaunchpadScript(visibleApps);

    return Html(
      { lang: 'zh-CN' },
      Head(
        createElement('meta', { charset: 'utf-8' }),
        createElement('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }),
        Title('ALemonJS 应用入口'),
        Style(styles)
      ),
      Body(
        createElement(
          'main',
          { className: 'page' },
          createElement(
            'section',
            { className: 'hero' },
            P({ className: 'hero-kicker' }, 'ALemonJS Launchpad'),
            createElement('h1', { className: 'hero-title' }, '阿柠檬机器人')
          ),
          createElement(
            'section',
            null,
            Div(
              { className: 'section-head' },
              Div(null, createElement('h2', { className: 'section-title' }, '应用列表'), P({ className: 'section-note' }, '点击次数越高，卡片排序越靠前。'))
            ),
            Div({ className: 'app-grid', id: 'app-grid', dangerouslySetInnerHTML: { __html: cards } })
          )
        ),
        createElement('script', { dangerouslySetInnerHTML: { __html: script } })
      )
    );
  }
}

export const renderHelloHtml = (apps: RuntimeAppRecord[]) => {
  return DOCTYPE + renderToString(createElement(LaunchpadPage, { apps }));
};

export default renderHelloHtml([]);
