# ALemonJS

<p align="center">
  <a href="https://alemonjs.com">Website</a>
  ·
  <a href="./README.md">中文</a>
  ·
  <a href="https://www.npmjs.com/package/alemonjs">npm</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/alemonjs">
    <img src="https://img.shields.io/npm/v/alemonjs.svg" alt="npm version">
  </a>
  <a href="https://github.com/lemonade-lab/alemonjs/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/alemonjs.svg" alt="license">
  </a>
</p>

ALemonJS is a Node.js framework for building cross-platform chatbots.  
It combines an event-driven runtime, declarative routing, hooks, rich message formatting, and a multi-channel communication layer so the same business logic can run across QQ, Discord, KOOK, Telegram, OneBot, and more.

## Why ALemonJS

- Cross-platform first: one event model, one application layer, fewer platform-specific forks
- Structured architecture: application layer, runtime core, and adapter layer are clearly separated
- Flexible transport: Direct Channel, IPC Bridge, and WebSocket are built in
- Clean routing model: declarative commands, nested groups, lazy handlers, and module lifecycles
- Built for real projects: monorepo layout, split platform packages, and an expanding ecosystem

## Quick Start

```bash
npm create alemonjs@latest
cd alemonjs
yarn install
yarn dev
```

Documentation: <https://alemonjs.com>

## Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                        Application Layer                     │
│   Hooks · Router · Format · Response · Middleware           │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               │ CBP (Cross-platform Protocol)
                               │
┌──────────────────────────────┴───────────────────────────────┐
│                         ALemonJS Core                        │
│   Event Processor · Runtime Store · Module Loader           │
│   Direct Channel · IPC Bridge · WebSocket                  │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────┴───────────────────────────────┐
│                       Platform Adapters                      │
│   Discord · QQ Bot · OneBot · KOOK · Telegram · Bubble     │
└──────────────────────────────────────────────────────────────┘
```

## Core Capabilities

### Event-Driven Runtime

- Built around a `selects + handler` event processing model
- Covers messages, interactions, members, requests, and lifecycle flows
- Composes middleware, subscribe, response, and router layers cleanly

### Declarative Router

- Supports prefix matching, exact matching, nested groups, and lazy handlers
- Works well for command bots, menu-driven interactions, and modular applications

```ts
import { defineChildren, Router } from 'alemonjs';

const router = Router.create({
  events: ['message.create', 'private.message.create']
});

const app = router.group(
  {
    routeText: {
      prefixes: ['/', '#', '＃', '!', '！'],
      stripPrefix: true,
      allowBare: true
    },
    keyPolicy: {
      maxWords: 2
    }
  },
  () => import('@src/response/mw')
);

app.use(['帮助'], () => import('@src/response/help'));

export default defineChildren({
  async register() {
    return {
      responseRouter: app.define
    };
  }
});
```

### Hook System

| Hook | Purpose |
| --- | --- |
| `useMessage` | Send text, image, button, and markdown messages |
| `useMention` | Read and filter mentions |
| `useSubscribe` | Handle cross-stage subscriptions and replies |
| `useChannel` / `useGuild` / `useMember` | Channel, guild, and member operations |
| `usePermission` / `useRole` / `useUser` | Permission, role, and user access |
| `useHistory` / `useMedia` / `useRequest` | History, media, and request handling |
| `useClient` / `useMe` / `useEvent` | Client access, current bot state, and event context |

### Message Formatting

```ts
import { Format, useEvent, useMessage } from 'alemonjs';

export default () => {
  const [event, next] = useEvent({
    selects: ['message.create', 'private.message.create']
  });

  if (!event.match.selects) {
    next();
    return;
  }

  const [message] = useMessage();
  const format = Format.create();

  format.addText('Hello!');
  format.addImage('https://alemonjs.com/me.png');
  format.addButtonGroup(
    Format.createButtonGroup().addRow().addButton('Confirm', { action: 'confirm' })
  );

  message.send({ format });
};
```

Supports text, images, button groups, markdown, mentions, links, attachments, audio, and video payloads.

## Packages

### Platform Adapters

| Package | Description |
| --- | --- |
| [`@alemonjs/qq-bot`](https://www.npmjs.com/package/@alemonjs/qq-bot) | QQ bot adapter |
| [`@alemonjs/discord`](https://www.npmjs.com/package/@alemonjs/discord) | Discord adapter |
| [`@alemonjs/onebot`](https://www.npmjs.com/package/@alemonjs/onebot) | OneBot adapter |
| [`@alemonjs/kook`](https://www.npmjs.com/package/@alemonjs/kook) | KOOK adapter |
| [`@alemonjs/telegram`](https://www.npmjs.com/package/@alemonjs/telegram) | Telegram adapter |
| [`@alemonjs/bubble`](https://www.npmjs.com/package/@alemonjs/bubble) | Bubble adapter |

### Extensions

| Package | Description |
| --- | --- |
| [`@alemonjs/db`](https://www.npmjs.com/package/@alemonjs/db) | Database integration |
| [`@alemonjs/process`](https://www.npmjs.com/package/@alemonjs/process) | Desktop process communication |
| [`create-alemonjs`](https://www.npmjs.com/package/create-alemonjs) | Project scaffold |

## Ecosystem

| Project | Description |
| --- | --- |
| [`lvyjs`](https://github.com/lemonade-lab/lvyjs/tree/main/packages/lvyjs) | Node.js tooling and bundling |
| [`jsxp`](https://github.com/lemonade-lab/lvyjs/tree/main/packages/jsxp) | Screenshot tooling |
| [`alemondesk`](https://github.com/lemonade-lab/alemondesk) | Desktop product |
| [`alemongo`](https://github.com/lemonade-lab/alemongo) | Server product |

## Monorepo Layout

```text
packages/      core packages and platform adapters
packages-ex/   extension packages
packages-cl/   scaffolding tools
frontends/     UI and desktop-related frontends
```

## Contributing

Issues, discussions, and pull requests are welcome.

<a href="https://github.com/lemonade-lab/docs/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=lemonade-lab/alemonjs" alt="contributors" />
</a>
