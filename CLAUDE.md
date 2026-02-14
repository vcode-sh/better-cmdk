# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this?

`better-cmdk` is a React command palette component library (published to npm) with optional AI chat integration. It's a local fork of [cmdk](https://github.com/dip/cmdk) with a redesigned UI, built on Radix UI and styled with Tailwind CSS v4 / shadcn/ui design tokens.

## Commands

- **Install:** `bun install`
- **Build:** `bun run build` (runs tsdown + builds AGENTS.md prompt files)
- **Lint/Format:** `bunx @biomejs/biome check .` or `bunx @biomejs/biome check --write .`
- **Publish:** `bun run build:publish` (tsdown with exports + prompts)

There are no tests in this repo currently. Use `bun test` if tests are added.

## Tooling

- **Bun** — use `bun` for everything (install, run, test). Never use npm/yarn/pnpm/node/vite.
- **tsdown** — builds the library to `dist/`. Config in `tsdown.config.ts`. Entry points: `index.ts` and `lib/utils.ts`.
- **Biome** — linter and formatter. Config in `biome.jsonc`. Indent: 4 spaces, double quotes, no semicolons (ASI). Organizes imports automatically.

## Architecture

### Entry point and exports

`index.ts` is the public API. It re-exports everything consumers import from `"better-cmdk"`. A secondary export `"better-cmdk/utils"` exposes the `cn()` utility from `lib/utils.ts`.

### Core layers

1. **`lib/cmdk/`** — Local fork of the cmdk library. `index.tsx` implements the core `Command` primitive (search, filtering, keyboard navigation, item/group lifecycle). `command-score.ts` is the fuzzy-match scoring algorithm. These are low-level building blocks, not consumed directly by users.

2. **`components/ui/`** — The UI layer consumers interact with:
   - `command-menu.tsx` — The main `CommandMenu` component and its sub-components (`CommandInput`, `CommandList`, `CommandEmpty`, `CommandContent`). Supports both declarative `commands` prop (array of `CommandDefinition`) and custom children. This is the primary component.
   - `command.tsx` — Thin shadcn/ui-style wrappers around the cmdk primitives (`CommandGroup`, `CommandItem`, `CommandShortcut`, etc.).
   - `assistant-messages.tsx`, `chat.tsx`, `message.tsx` — AI chat rendering (markdown messages, tool call display, streaming indicators).
   - `confirmation.tsx` — Tool approval UI for agentic AI actions.
   - `form-renderer.tsx`, `form-components.tsx` — JSON-driven form rendering for AI tool parameters (uses `@json-render/react`).
   - `task.tsx` — Collapsible task/step display for multi-step AI operations.
   - `dialog.tsx`, `button.tsx`, `collapsible.tsx`, `kbd.tsx` — Base UI primitives.

3. **`context/command-menu-context.tsx`** — React context provider that manages command/chat mode state, integrates with Vercel AI SDK (`useChat`), handles external chat providers (e.g., modifywithai), and manages chat history. The `CommandMenuProvider` wraps `CommandMenuInner`.

4. **`hooks/use-chat-history.ts`** — localStorage-based chat conversation persistence.

### Prompts / AGENTS.md

`prompts/integration.ts` defines framework-specific integration prompts (Next.js, Remix, TanStack Start, Vite). `scripts/build-prompts.ts` generates static `AGENTS.md` files into `dist/<framework>/AGENTS.md` during build. The root `AGENTS.md` links to these. These are shipped in the npm package to help AI coding agents integrate the library.

### Key patterns

- All components use `"use client"` directive (React Server Components compatible).
- The library supports two chat modes: built-in (via `chatEndpoint` prop + Vercel AI SDK) and external (via `chat` prop compatible with modifywithai's `useAssistant()`).
- `CommandMenu` wraps everything in `CommandMenuProvider` > `CommandMenuInner`.
- Path alias `@/*` maps to repo root (tsconfig `paths`).
- The `commands` prop takes precedence over `children` when both are provided.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.