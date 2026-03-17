# Phase 1: Core SDK Options Helper + localStorage Persistence

## Context
- [plan.md](plan.md)
- [src/composables/useLocalStorage.js](../../src/composables/useLocalStorage.js)
- [src/composables/useApiKeyManager.js](../../src/composables/useApiKeyManager.js)

## Overview
- **Priority**: P0
- **Status**: completed
- **Description**: Create the helper function that builds `GoogleGenAI` constructor options and add localStorage persistence for `customBaseUrl`.

## Key Insights
- SDK accepts: `new GoogleGenAI({ apiKey, httpOptions: { baseUrl: '...' } })` — verified on v1.45.0
- When `baseUrl` is empty/null, SDK uses default Google endpoints — no behavior change
- Follow existing `useLocalStorage` pattern: getter/setter/has functions

## Requirements

### Functional
- Helper function `buildSdkOptions(apiKey, baseUrl?)` returns SDK constructor options object
- `useLocalStorage` exposes `getCustomBaseUrl()`, `setCustomBaseUrl()`, `hasCustomBaseUrl()`
- `useApiKeyManager` exposes `getCustomBaseUrl` for consumers

### Non-functional
- Zero behavior change when `customBaseUrl` is empty
- Helper must be importable by both composables and workers

## Architecture

```
useLocalStorage.js
  └── getCustomBaseUrl() / setCustomBaseUrl() / hasCustomBaseUrl()

useApiKeyManager.js
  └── re-exports getCustomBaseUrl from useLocalStorage

utils/build-sdk-options.js (NEW)
  └── buildSdkOptions(apiKey, baseUrl?) → { apiKey, httpOptions?: { baseUrl } }
```

## Related Code Files

### Modify
- `src/composables/useLocalStorage.js` — add custom base URL getter/setter
- `src/composables/useApiKeyManager.js` — re-export getCustomBaseUrl

### Create
- `src/utils/build-sdk-options.js` — pure function, importable everywhere (composables + workers)

## Implementation Steps

1. **Add localStorage functions** to `useLocalStorage.js`:
   ```javascript
   const CUSTOM_BASE_URL_STORAGE_KEY = 'nanobanana-custom-base-url'

   const getCustomBaseUrl = () => {
     try {
       return localStorage.getItem(CUSTOM_BASE_URL_STORAGE_KEY) || ''
     } catch {
       return ''
     }
   }

   const setCustomBaseUrl = (url) => {
     try {
       if (url) {
         localStorage.setItem(CUSTOM_BASE_URL_STORAGE_KEY, url)
       } else {
         localStorage.removeItem(CUSTOM_BASE_URL_STORAGE_KEY)
       }
       return true
     } catch {
       return false
     }
   }

   const hasCustomBaseUrl = () => !!getCustomBaseUrl()
   ```

2. **Create `src/utils/build-sdk-options.js`**:
   ```javascript
   /**
    * Build GoogleGenAI constructor options.
    * When baseUrl is provided, routes all SDK requests through the custom endpoint.
    * @param {string} apiKey
    * @param {string} [baseUrl] - Custom API endpoint (e.g., 'https://proxy.example.com')
    * @returns {Object} Options for `new GoogleGenAI(options)`
    */
   export function buildSdkOptions(apiKey, baseUrl) {
     const options = { apiKey }
     if (baseUrl) {
       options.httpOptions = { baseUrl }
     }
     return options
   }
   ```

3. **Update `useApiKeyManager.js`** — add `getCustomBaseUrl` to destructured imports and return:
   ```javascript
   const {
     getApiKey: getPaidApiKey,
     // ... existing ...
     getCustomBaseUrl,
     setCustomBaseUrl,
   } = useLocalStorage()

   return {
     // ... existing ...
     getCustomBaseUrl,
     setCustomBaseUrl,
   }
   ```

## Todo List
- [x] Add `CUSTOM_BASE_URL_STORAGE_KEY` and getter/setter/has to `useLocalStorage.js`
- [x] Create `src/utils/build-sdk-options.js` with `buildSdkOptions` pure function
- [x] Update `useApiKeyManager.js` to re-export `getCustomBaseUrl` / `setCustomBaseUrl`
- [x] Verify existing tests still pass (`npm test`)

## Success Criteria
- `buildSdkOptions('key123')` returns `{ apiKey: 'key123' }`
- `buildSdkOptions('key123', 'https://proxy.example.com')` returns `{ apiKey: 'key123', httpOptions: { baseUrl: 'https://proxy.example.com' } }`
- `buildSdkOptions('key123', '')` returns `{ apiKey: 'key123' }` (falsy baseUrl = no httpOptions)
- All existing tests pass
