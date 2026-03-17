# Brainstorm: Remove Hero Section → Add Navbar

**Date:** 2026-03-17
**Status:** Agreed — proceeding to implementation

## Problem Statement
Hero full-screen section takes too much space. User wants direct access to main content with minimal chrome.

## Decisions

| Item | Decision |
|---|---|
| Hero full-screen | Remove entirely |
| Replace with | Static navbar (logo + theme + lang + tour) |
| HeroTitle, subtitle | Remove |
| Social links + version badge | Remove |
| Scroll snap logic | Remove all (~80 lines JS + listeners) |
| Tour step "docs" | Remove (target element gone) |
| CSS hero animations | Remove (.hero-float, .scroll-indicator) |
| Navbar behavior | Static (scrolls away, not sticky) |

## Impact Analysis

| Area | Severity | Detail |
|---|---|---|
| Hero template | ~200 lines removed | Lines 615-818 in HomeView.vue |
| Scroll logic | ~80 lines removed | asymmetric scroll, snap, throttle |
| Dead imports | Cleanup | GitHubLink, YouTubeLink, DocsLink, HeroTitle |
| Tour | Minor fix | Remove last step targeting docs-link |
| CSS | Cleanup | .hero-float, .scroll-indicator keyframes |

## Risks
1. Tour step "docs" must be removed from useTour.js — otherwise tour crashes on last step
2. Main content needs no `pt-*` padding since navbar is static (part of flow)
3. Background particles still render behind content — verify visual quality
