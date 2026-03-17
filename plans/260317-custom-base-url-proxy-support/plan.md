---
status: completed
created: 2026-03-17
title: Custom Base URL for Gemini API Proxy Support
---

# Custom Base URL for Gemini API Proxy Support

## Overview

Add optional custom API endpoint (base URL) support so users can route Gemini API calls through a reverse proxy (e.g., Flow2API, self-hosted relay). When no custom URL is set, app works identically to current behavior (direct Gemini API calls).

## Phases

| # | Phase | Status | Priority | Effort |
|---|-------|--------|----------|--------|
| 1 | [Core: SDK options helper + localStorage persistence](phase-01-core-sdk-helper-and-persistence.md) | pending | P0 | S |
| 2 | [Replace all GoogleGenAI instantiations](phase-02-replace-all-sdk-instantiations.md) | pending | P0 | M |
| 3 | [UI: Custom endpoint input in ApiKeyInput.vue](phase-03-ui-custom-endpoint-input.md) | pending | P0 | M |
| 4 | [i18n translations](phase-04-i18n-translations.md) | pending | P1 | S |
| 5 | [Search worker integration](phase-05-search-worker-integration.md) | pending | P1 | S |

## Key Decisions

- **Approach**: Single `customBaseUrl` field → pass as `httpOptions.baseUrl` to `@google/genai` SDK constructor
- **Storage**: `localStorage` via existing `useLocalStorage` pattern (key: `nanobanana-custom-base-url`)
- **Scope**: All SDK-based calls (composables). Search worker's direct REST embedding call also proxied.
- **Backward compat**: Empty URL = direct Gemini (no behavior change for existing users)

## Dependencies

- `@google/genai@1.45.0` — confirmed supports `httpOptions.baseUrl`
- CORS must be configured on the proxy server (server-side responsibility, not app concern)

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Proxy doesn't support all Gemini features | Medium | User can clear URL to revert to direct API |
| CORS issues | Medium | Server-side config; app shows clear error |
| SDK `httpOptions` API changes | Low | Pinned to known-working SDK version |
