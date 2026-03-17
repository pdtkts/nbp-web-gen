# Phase 2: Replace All GoogleGenAI Instantiations

## Context
- [plan.md](plan.md)
- [Phase 1](phase-01-core-sdk-helper-and-persistence.md) — must be completed first

## Overview
- **Priority**: P0
- **Status**: completed
- **Description**: Replace all 13 `new GoogleGenAI({ apiKey })` calls with `new GoogleGenAI(buildSdkOptions(apiKey, customBaseUrl))`.

## Key Insights
- 10 instances in composables (main thread) — all can use `useApiKeyManager().getCustomBaseUrl()`
- 1 instance in search worker — receives config via `postMessage`, can't access localStorage
- Two patterns exist:
  - **Direct**: `const ai = new GoogleGenAI({ apiKey })` — get baseUrl from composable
  - **Callback**: `callWithFallback(async (apiKey) => { const ai = new GoogleGenAI({ apiKey }) })` — apiKey comes as param, baseUrl from composable closure

## Requirements

### Functional
- ALL Gemini SDK calls route through proxy when `customBaseUrl` is set
- Worker receives `customBaseUrl` via `postMessage` (same pattern as API keys)

### Non-functional
- No behavior change when `customBaseUrl` is empty
- No new dependencies per file (just import `buildSdkOptions`)

## Related Code Files

### Modify (10 composables + 1 worker)

| File | Instances | Pattern | How apiKey is obtained |
|------|-----------|---------|----------------------|
| `src/composables/useApi.js` | 1 (line ~317) | Direct | `getApiKey()` from useLocalStorage |
| `src/composables/useAgentApi.js` | 1 (line ~186) | Callback | `callWithFallback` param |
| `src/composables/useCharacterExtraction.js` | 1 (line ~88) | Callback | `callWithFallback` param |
| `src/composables/useNarrationApi.js` | 2 (lines ~164, ~309) | Callback | `callWithFallback` param |
| `src/composables/useSlidesApi.js` | 2 (lines ~200, ~329) | Callback | `callWithFallback` param |
| `src/composables/useSlideToPptx.js` | 2 (lines ~344, ~420) | Direct | `getApiKey(usage)` from useApiKeyManager |
| `src/composables/useVideoApi.js` | 1 (line ~293) | Direct | `getApiKey()` from useLocalStorage |
| `src/workers/search.worker.js` | 1 (line ~536) | Direct | stored from postMessage |

## Implementation Steps

### Composables (main thread) — Pattern A: Direct apiKey
For files that directly call `getApiKey()`:

```javascript
// Add imports
import { buildSdkOptions } from '@/utils/build-sdk-options'
// In composable setup:
const { getCustomBaseUrl } = useApiKeyManager() // or useLocalStorage

// Replace:
const ai = new GoogleGenAI({ apiKey })
// With:
const ai = new GoogleGenAI(buildSdkOptions(apiKey, getCustomBaseUrl()))
```

### Composables (main thread) — Pattern B: callWithFallback
For files using `callWithFallback(async (apiKey) => ...)`:

```javascript
// Add imports
import { buildSdkOptions } from '@/utils/build-sdk-options'
// In composable setup:
const { getCustomBaseUrl } = useApiKeyManager()

// Inside callback — apiKey comes from parameter, baseUrl from closure:
callWithFallback(async (apiKey) => {
  const ai = new GoogleGenAI(buildSdkOptions(apiKey, getCustomBaseUrl()))
  // ...
})
```

### Worker — Pattern C: postMessage
Handled in Phase 5 (search worker integration).

## Todo List
- [x] `useApi.js` — import buildSdkOptions, get customBaseUrl, replace 1 instance
- [x] `useAgentApi.js` — import buildSdkOptions, get customBaseUrl via useApiKeyManager, replace 1 instance
- [x] `useCharacterExtraction.js` — same pattern, replace 1 instance
- [x] `useNarrationApi.js` — same pattern, replace 2 instances
- [x] `useSlidesApi.js` — same pattern, replace 2 instances
- [x] `useSlideToPptx.js` — same pattern, replace 2 instances
- [x] `useVideoApi.js` — import buildSdkOptions, get customBaseUrl, replace 1 instance
- [x] Run `npm run lint` to verify no errors
- [x] Run `npm test` to verify no regressions

## Success Criteria
- All 10 composable instances use `buildSdkOptions`
- Setting `customBaseUrl` in localStorage routes SDK calls to that endpoint
- Empty `customBaseUrl` = direct Gemini calls (no behavioral change)
- Lint passes, tests pass
