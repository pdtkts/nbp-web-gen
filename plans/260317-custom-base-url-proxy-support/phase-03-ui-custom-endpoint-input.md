# Phase 3: UI — Custom Endpoint Input in ApiKeyInput.vue

## Context
- [plan.md](plan.md)
- [src/components/ApiKeyInput.vue](../../src/components/ApiKeyInput.vue) — 386 lines, 2 sections (paid + free tier)
- [Phase 1](phase-01-core-sdk-helper-and-persistence.md) — must be completed first

## Overview
- **Priority**: P0
- **Status**: completed
- **Description**: Add a collapsible "Custom API Endpoint" section to ApiKeyInput.vue with URL input, save/clear controls.

## Key Insights
- ApiKeyInput.vue already has two sections (Paid Key, Free Tier Key) with glass card pattern
- New section goes AFTER the Free Tier section — it's an advanced/optional feature
- Use collapsible disclosure pattern (click to expand) to keep UI clean for regular users
- File is 386 lines — adding ~60 lines of UI stays under 200-line per-section guideline

## Requirements

### Functional
- Collapsible "Advanced: Custom API Endpoint" section
- URL text input (not password type — URLs aren't sensitive)
- Save / Clear / Cancel buttons matching existing key section pattern
- Display saved URL with option to change/clear
- Basic URL validation (must start with `https://`)

### Non-functional
- Use semantic theme classes (no hardcoded colors)
- Consistent with existing section styling (glass card, icon, title/subtitle)
- Mobile-friendly (tap targets, responsive)

## Architecture

```
ApiKeyInput.vue
  ├── Paid API Key Section (existing)
  ├── Free Tier API Key Section (existing)
  └── Custom API Endpoint Section (NEW)
       ├── Collapsed: "Set Custom API Endpoint" button
       ├── Expanded: URL input + Save/Cancel
       └── Saved: Display URL + Change/Clear buttons
```

## Implementation Steps

1. **Add state refs** in `<script setup>`:
   ```javascript
   // Import setCustomBaseUrl from useApiKeyManager
   const { getCustomBaseUrl, setCustomBaseUrl } = useApiKeyManager()

   // Custom Base URL state
   const customBaseUrlInput = ref('')
   const isEditingBaseUrl = ref(false)
   const savedBaseUrl = ref('')

   // Load on mount
   onMounted(() => {
     savedBaseUrl.value = getCustomBaseUrl()
   })

   // Actions
   const saveBaseUrl = () => {
     const url = customBaseUrlInput.value.trim()
     if (url && url.startsWith('https://')) {
       // Remove trailing slash for consistency
       const normalized = url.replace(/\/+$/, '')
       setCustomBaseUrl(normalized)
       savedBaseUrl.value = normalized
       customBaseUrlInput.value = ''
       isEditingBaseUrl.value = false
     }
   }

   const clearBaseUrl = () => {
     setCustomBaseUrl('')
     savedBaseUrl.value = ''
     customBaseUrlInput.value = ''
     isEditingBaseUrl.value = false
   }

   const startEditingBaseUrl = () => {
     isEditingBaseUrl.value = true
     customBaseUrlInput.value = ''
   }

   const cancelEditingBaseUrl = () => {
     isEditingBaseUrl.value = false
     customBaseUrlInput.value = ''
   }
   ```

2. **Add template section** after Free Tier section:
   - Glass card with server/globe icon
   - Title: `$t('apiKey.customEndpointTitle')` / Subtitle: `$t('apiKey.customEndpointSubtitle')`
   - Three states: no URL (show "Set" button), editing (show input), saved (show URL + change/clear)
   - URL displayed as-is (no masking — URLs aren't secrets)
   - Input type `url` with `https://` placeholder

3. **URL validation**: Only accept `https://` URLs. Show inline hint if user enters `http://`.

## Todo List
- [x] Add state refs and action functions in `<script setup>`
- [x] Add Custom Endpoint section template after Free Tier section
- [x] Test all 3 states: empty, editing, saved
- [x] Verify theme compatibility (check in dark/light themes)
- [x] Verify mobile responsiveness

## Success Criteria
- Custom endpoint section appears below Free Tier section
- URL saves to localStorage and persists across page reloads
- Clearing URL reverts to direct Gemini API
- UI matches existing glass card styling
- All theme variants look correct
