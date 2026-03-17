# Phase 5: Search Worker Integration

## Context
- [plan.md](plan.md)
- [src/workers/search.worker.js](../../src/workers/search.worker.js) — Web Worker, no localStorage access
- [src/composables/useSearchWorker.js](../../src/composables/useSearchWorker.js) — main thread orchestrator

## Overview
- **Priority**: P1
- **Status**: completed
- **Description**: Pass `customBaseUrl` to search worker via postMessage so Gemini SDK calls and direct REST embedding calls in the worker also route through the proxy.

## Key Insights
- Worker has TWO types of API calls:
  1. **SDK-based**: `new GoogleGenAI({ apiKey })` at line ~536 — use `buildSdkOptions`
  2. **Direct REST**: `fetch('https://generativelanguage.googleapis.com/v1beta/...')` at line ~758 — needs URL replacement
- Worker receives API keys via `postMessage({ type: 'init', apiKey, freeApiKey })` — add `customBaseUrl` to same message
- `updateApiKeys` message also needs `customBaseUrl`

## Requirements

### Functional
- Worker `init` and `updateApiKeys` messages include `customBaseUrl`
- SDK instantiation in worker uses `buildSdkOptions`
- Direct REST embedding URL uses `customBaseUrl` as prefix when set

### Non-functional
- Worker can import `buildSdkOptions` (it's a pure function, no Vue deps)

## Implementation Steps

1. **`useSearchWorker.js`** — add `customBaseUrl` to init and update messages:
   ```javascript
   // In initialize():
   const customBaseUrl = localStorage.getItem('nanobanana-custom-base-url') || ''
   worker.postMessage({ type: 'init', apiKey, freeApiKey, provider, customBaseUrl })

   // In updateApiKeys():
   const customBaseUrl = localStorage.getItem('nanobanana-custom-base-url') || ''
   worker.postMessage({ type: 'updateApiKeys', apiKey, freeApiKey, customBaseUrl })
   ```

2. **`search.worker.js`** — store and use customBaseUrl:
   ```javascript
   // Module-level variable
   let customBaseUrl = ''

   // In initialize():
   if (keys.customBaseUrl !== undefined) customBaseUrl = keys.customBaseUrl

   // In 'updateApiKeys' handler:
   if (event.data.customBaseUrl !== undefined) customBaseUrl = event.data.customBaseUrl

   // In getAiInstance():
   import { buildSdkOptions } from '../utils/build-sdk-options'
   aiInstance = new GoogleGenAI(buildSdkOptions(apiKey, customBaseUrl))

   // In direct REST embedding call (line ~758):
   const baseApiUrl = customBaseUrl || 'https://generativelanguage.googleapis.com'
   const url = `${baseApiUrl}/v1beta/models/${geminiModel}:embedContent?key=${key}`
   ```

3. **Import path**: Worker uses relative imports (`../utils/build-sdk-options`), not `@/` aliases (Vite resolves these for workers via `import.meta.url`).

## Todo List
- [x] Update `useSearchWorker.js` `initialize()` to pass `customBaseUrl`
- [x] Update `useSearchWorker.js` `updateApiKeys()` to pass `customBaseUrl`
- [x] Update `search.worker.js` to store `customBaseUrl` module-level variable
- [x] Update `search.worker.js` `getAiInstance()` to use `buildSdkOptions`
- [x] Update `search.worker.js` direct REST embedding URL to use `customBaseUrl` prefix
- [x] Run `npm test` to verify no regressions

## Success Criteria
- Search worker SDK calls route through proxy when `customBaseUrl` is set
- Search worker direct REST embedding calls route through proxy when `customBaseUrl` is set
- Empty `customBaseUrl` = direct Google API (no change)
- Search functionality works end-to-end with proxy enabled
