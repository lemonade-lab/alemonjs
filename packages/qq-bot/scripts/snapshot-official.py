"""Fetch the official non-guild API/event reference and readable offline copies."""
import concurrent.futures
import datetime
import hashlib
import json
import re
import html
from pathlib import Path
from html.parser import HTMLParser
from urllib.request import urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1] / 'docs/official/non-channel'
BASE = 'https://bot.q.qq.com/wiki/'

class Content(HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0
        self.parts = []
    def handle_starttag(self, tag, attrs):
        if tag == 'main': self.depth += 1
        if self.depth and tag in ('p', 'div', 'tr', 'h1', 'h2', 'h3', 'li', 'pre'): self.parts.append('\n')
    def handle_endtag(self, tag):
        if tag == 'main': self.depth -= 1
    def handle_data(self, data):
        if self.depth and data.strip(): self.parts.append(data.strip() + ' ')

def reference_scope(url):
    """Inventory every generated reference; exclude only explicit channel families."""
    path = url.removeprefix(BASE)
    if not re.fullmatch(r'develop/api-v2/autogen/(api|event)/[^/]+\.html', path):
        return None
    kind, name = path.split('/')[-2:]
    if kind == 'api':
        excluded = name.startswith(('channels_', 'guilds_')) or name == 'users_me_guilds.get.html'
    else:
        excluded = name.startswith(('channel_', 'guild_'))
    return 'channel' if excluded else 'included'

def included(url):
    path = url.removeprefix(BASE)
    scope = reference_scope(url)
    return (scope == 'included'
        or scope is None and (
            path.startswith(('develop/api-v2/server-inter/message/', 'develop/api-v2/server-inter/group/', 'develop/api-v2/server-inter/user/', 'develop/api-v2/server-inter/menu-panel/', 'develop/api-v2/dev-prepare/', 'develop/api-v2/gateway/error/', 'develop/api-v2/openapi/error/'))
            or path.endswith('api-v2/changelog.html')))

def fetch(url):
    with urlopen(url, timeout=45) as response:
        raw = response.read()
    name = url.removeprefix(BASE).strip('/').replace('/', '__')
    if not name.endswith('.html'): name += '__index.html'
    (ROOT / 'html' / name).write_bytes(raw)
    parser = Content()
    parser.feed(raw.decode('utf-8'))
    body = '\n'.join(line.strip() for line in ''.join(parser.parts).splitlines() if line.strip())
    if not body: raise ValueError('No main content: ' + url)
    (ROOT / 'text' / (name + '.txt')).write_text(body + '\n')
    return dict(url=url, html='html/' + name, text='text/' + name + '.txt', sha256=hashlib.sha256(raw).hexdigest(), bytes=len(raw))

if __name__ == '__main__':
    for folder in ('html', 'text'): (ROOT / folder).mkdir(parents=True, exist_ok=True)
    sitemap = urlopen(BASE + 'sitemap.xml', timeout=45).read()
    (ROOT / 'sitemap.xml').write_bytes(sitemap)
    all_urls = sorted({node.text for node in ET.fromstring(sitemap).iter() if node.tag.endswith('loc')})
    catalog = [dict(source=url, scope=reference_scope(url)) for url in all_urls if reference_scope(url)]
    urls = [url for url in all_urls if included(url)]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: pages = list(pool.map(fetch, urls))
    examples = {}
    for page in pages:
        if '/autogen/event/' not in page['url']: continue
        name = page['url'].split('/')[-1].removesuffix('.html').upper()
        examples[name] = []
        for block in re.findall(r'<pre[^>]*>(.*?)</pre>', (ROOT / page['html']).read_text(), re.S):
            raw = html.unescape(re.sub('<[^>]+>', '', block)).strip()
            try: examples[name].append(json.loads(raw))
            except ValueError: pass
    (ROOT / 'event-examples.json').write_text(json.dumps(examples, ensure_ascii=False, indent=2) + '\n')
    (ROOT / 'manifest.json').write_text(json.dumps(dict(fetched_at=datetime.datetime.now(datetime.timezone.utc).isoformat(), scope='Non-channel API, events, message types and shared transport', pages=pages), ensure_ascii=False, indent=2) + '\n')
    endpoints = []
    for page in pages:
        if '/autogen/api/' not in page['url']: continue
        body = (ROOT / page['text']).read_text()
        endpoints.append(dict(endpoint=re.search(r'HTTP Method (\w+)', body)[1] + ' ' + re.search(r'HTTP URL (\S+)', body)[1], source=page['url']))
    fixture = ROOT.parents[2] / 'tests/fixtures/non-channel.json'
    fixture.parent.mkdir(parents=True, exist_ok=True)
    fixture.write_text(json.dumps(dict(fetchedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(), api=endpoints, events=examples, catalog=catalog), ensure_ascii=False, indent=2) + '\n')
    print(f'Saved {len(pages)} official pages to {ROOT}')
