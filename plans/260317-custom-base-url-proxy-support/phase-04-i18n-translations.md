# Phase 4: i18n Translations

## Context
- [plan.md](plan.md)
- [src/i18n/locales/en.json](../../src/i18n/locales/en.json)
- [src/i18n/locales/zh-TW.json](../../src/i18n/locales/zh-TW.json)

## Overview
- **Priority**: P1
- **Status**: completed
- **Description**: Add translation keys for Custom API Endpoint UI in both zh-TW and en locales.

## Implementation Steps

1. **Add to `apiKey` object** in both locale files:

### en.json
```json
"customEndpointTitle": "Custom API Endpoint",
"customEndpointSubtitle": "Route API calls through a proxy server (advanced)",
"customEndpointPlaceholder": "https://your-proxy-server.com",
"customEndpointHint": "All Gemini API requests will be routed through this endpoint. Leave empty to use Google's official API directly.",
"setCustomEndpoint": "Set Custom Endpoint",
"customEndpointHttpsOnly": "Only HTTPS URLs are supported for security."
```

### zh-TW.json
```json
"customEndpointTitle": "自訂 API 端點",
"customEndpointSubtitle": "透過代理伺服器轉發 API 請求（進階）",
"customEndpointPlaceholder": "https://your-proxy-server.com",
"customEndpointHint": "所有 Gemini API 請求將透過此端點轉發。留空則使用 Google 官方 API。",
"setCustomEndpoint": "設定自訂端點",
"customEndpointHttpsOnly": "基於安全考量，僅支援 HTTPS 網址。"
```

## Todo List
- [x] Add keys to `src/i18n/locales/en.json` under `apiKey` object
- [x] Add keys to `src/i18n/locales/zh-TW.json` under `apiKey` object
- [x] Verify key names match template usage in Phase 3

## Success Criteria
- All UI text in Custom Endpoint section uses i18n keys
- Both locales have complete translations
- No hardcoded strings in template
