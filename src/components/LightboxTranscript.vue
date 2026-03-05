<script setup>
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { parseTranscript } from '@/utils/transcript-parser'
import { useDraggablePanel } from '@/composables/useDraggablePanel'

const { t } = useI18n()

const props = defineProps({
  script: {
    type: String,
    default: '',
  },
  speakers: {
    type: Array,
    default: () => [],
  },
  speakerMode: {
    type: String,
    default: 'single',
  },
  visible: {
    type: Boolean,
    default: false,
  },
  progress: {
    type: Number,
    default: 0,
  },
})

const contentRef = ref(null)

// --- Draggable/resizable panel ---
const visibleRef = computed(() => props.visible)
const {
  panelRef,
  isDragging,
  recentlyInteracted,
  panelStyle,
  onDragMouseDown,
  onDragTouchStart,
  onDragTouchMove,
  onDragTouchEnd,
  onResizeMouseDown,
  onResizeTouchStart,
  onResizeTouchMove,
  onResizeTouchEnd,
  onResizeDblClick,
} = useDraggablePanel('nbp-transcript', { visible: visibleRef })

const segments = computed(() => {
  return parseTranscript(props.script, props.speakers, props.speakerMode)
})

// Speaker color mapping (fixed palette for lightbox dark bg)
const speakerColors = {
  0: 'rgba(96, 165, 250, 0.85)',  // blue
  1: 'rgba(251, 146, 60, 0.85)',  // orange
}

const getSpeakerColor = (speakerName) => {
  if (!speakerName || !props.speakers?.length) return null
  const idx = props.speakers.findIndex((s) => s.name === speakerName)
  return speakerColors[idx] || speakerColors[0]
}

// --- Auto-scroll ---
const AUTO_SCROLL_KEY = 'nbp-transcript-auto-scroll'
const AUTO_SCROLL_INTERVAL = 3000 // Scroll every 3 seconds
const MANUAL_SCROLL_PAUSE = 5000 // Pause auto-scroll for 5s after manual scroll

const isAutoScroll = ref(localStorage.getItem(AUTO_SCROLL_KEY) !== 'false')
let autoScrollTimer = null
let manualScrollTimer = null
let isAutoScrolling = false // Flag to distinguish auto-scroll from manual scroll

const toggleAutoScroll = () => {
  isAutoScroll.value = !isAutoScroll.value
  localStorage.setItem(AUTO_SCROLL_KEY, String(isAutoScroll.value))
  if (isAutoScroll.value) {
    startAutoScroll()
  } else {
    stopAutoScroll()
  }
}

const doAutoScroll = () => {
  if (!contentRef.value || !props.progress || props.progress <= 0) return
  const el = contentRef.value
  const maxScroll = el.scrollHeight - el.clientHeight
  if (maxScroll <= 0) return
  // Add forward bias (~25% of visible height) so the "now playing" text
  // sits in the upper portion and upcoming text is visible below
  const bias = el.clientHeight * 0.25
  const target = Math.min(Math.round(props.progress * maxScroll + bias), maxScroll)
  isAutoScrolling = true
  el.scrollTo({ top: target, behavior: 'smooth' })
  // Reset flag after scroll animation (~400ms)
  setTimeout(() => { isAutoScrolling = false }, 400)
}

const startAutoScroll = () => {
  stopAutoScroll()
  if (!isAutoScroll.value) return
  autoScrollTimer = setInterval(doAutoScroll, AUTO_SCROLL_INTERVAL)
}

const stopAutoScroll = () => {
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer)
    autoScrollTimer = null
  }
}

// Detect manual scroll → pause auto-scroll temporarily
const onContentScroll = () => {
  if (isAutoScrolling) return // Ignore scrolls triggered by auto-scroll
  if (!isAutoScroll.value) return
  // Pause auto-scroll
  stopAutoScroll()
  clearTimeout(manualScrollTimer)
  manualScrollTimer = setTimeout(() => {
    startAutoScroll()
  }, MANUAL_SCROLL_PAUSE)
}

// Start/stop auto-scroll based on visibility
watch(() => props.visible, (v) => {
  if (v && isAutoScroll.value) {
    startAutoScroll()
  } else {
    stopAutoScroll()
  }
})

// Scroll to top when script changes (page navigation)
watch(() => props.script, () => {
  if (contentRef.value) {
    contentRef.value.scrollTop = 0
  }
})

// Start auto-scroll on mount if visible
onMounted(() => {
  if (props.visible && isAutoScroll.value) {
    startAutoScroll()
  }
})

defineExpose({ recentlyInteracted })

// Cleanup auto-scroll timers
onUnmounted(() => {
  stopAutoScroll()
  clearTimeout(manualScrollTimer)
})
</script>

<template>
  <Transition name="transcript-slide">
    <div
      v-if="visible && segments.length > 0"
      ref="panelRef"
      class="transcript-panel"
      :style="panelStyle"
      @wheel.stop
      @click.stop
    >
      <!-- Drag handle header -->
      <div
        class="transcript-header"
        :class="{ 'cursor-grabbing': isDragging }"
        @mousedown="onDragMouseDown"
        @touchstart="onDragTouchStart"
        @touchmove="onDragTouchMove"
        @touchend="onDragTouchEnd"
      >
        <!-- Grip indicator -->
        <div class="transcript-grip" aria-hidden="true">
          <span /><span /><span />
        </div>
        <svg class="w-4 h-4 opacity-70 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="flex-1">{{ t('lightbox.transcript.title') }}</span>
        <!-- Auto-scroll toggle -->
        <button
          class="transcript-auto-scroll-btn"
          :class="{ 'active': isAutoScroll }"
          :title="t('lightbox.transcript.autoScroll')"
          @click.stop="toggleAutoScroll"
          @mousedown.stop
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12l7 7 7-7" />
          </svg>
        </button>
      </div>

      <!-- Scrollable content (touchstart.stop prevents lightbox swipe) -->
      <div
        ref="contentRef"
        class="transcript-content"
        @touchstart.stop
        @touchmove.stop
        @scroll="onContentScroll"
      >
        <template v-if="speakerMode === 'dual'">
          <div
            v-for="(seg, idx) in segments"
            :key="idx"
            class="transcript-segment"
          >
            <span
              v-if="seg.speaker"
              class="transcript-speaker-tag"
              :style="{ backgroundColor: getSpeakerColor(seg.speaker) }"
            >
              {{ seg.speaker }}
            </span>
            <p class="transcript-text" v-text="seg.text" />
          </div>
        </template>
        <template v-else>
          <p
            v-for="(seg, idx) in segments"
            :key="idx"
            class="transcript-text"
            v-text="seg.text"
          />
        </template>
      </div>

      <!-- Resize handle (top-right corner — panel grows upward since bottom is anchored) -->
      <div
        class="transcript-resize-handle"
        @mousedown.stop="onResizeMouseDown"
        @touchstart.stop="onResizeTouchStart"
        @touchmove.prevent="onResizeTouchMove"
        @touchend="onResizeTouchEnd"
        @dblclick="onResizeDblClick"
      />
    </div>
  </Transition>
</template>

<style scoped>
.transcript-panel {
  position: absolute;
  bottom: 10rem;
  left: 50%;
  transform: translateX(-50%);
  width: max(300px, 45vw);
  max-width: 700px;
  max-height: 35vh;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  z-index: 2;
  overflow: hidden;
}

.transcript-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8125rem;
  font-weight: 500;
  flex-shrink: 0;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.transcript-header.cursor-grabbing {
  cursor: grabbing;
}

/* Grip indicator (3 horizontal lines) */
.transcript-grip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0;
  flex-shrink: 0;
}

.transcript-grip span {
  display: block;
  width: 14px;
  height: 2px;
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.35);
}

/* Auto-scroll toggle button (margin-right clears the resize handle) */
.transcript-auto-scroll-btn {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  margin-right: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.transcript-auto-scroll-btn:hover {
  color: rgba(255, 255, 255, 0.8);
  border-color: rgba(255, 255, 255, 0.4);
}

.transcript-auto-scroll-btn.active {
  color: white;
  background: var(--color-mode-generate);
  border-color: var(--color-mode-generate);
}

.transcript-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.transcript-content::-webkit-scrollbar {
  width: 4px;
}

.transcript-content::-webkit-scrollbar-track {
  background: transparent;
}

.transcript-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.transcript-segment {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.transcript-speaker-tag {
  display: inline-block;
  align-self: flex-start;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  color: white;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.transcript-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 0;
}

/* Portrait orientation (mobile / rotated) */
@media (orientation: portrait) {
  .transcript-panel {
    width: max(280px, 85vw);
    max-height: 28vh;
    bottom: 10.5rem;
  }
}

/* Resize handle (top-right corner — panel is bottom-anchored, top edge moves) */
.transcript-resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 24px;
  cursor: ne-resize;
  touch-action: none;
  z-index: 1;
  border-radius: 0 0.75rem 0 0;
  /* Expand touch target */
  padding: 4px;
  box-sizing: content-box;
}

/* Diagonal stripe visual indicator */
.transcript-resize-handle::before,
.transcript-resize-handle::after {
  content: '';
  position: absolute;
  background: rgba(255, 255, 255, 0.3);
  height: 1px;
  transform: rotate(-45deg);
  transform-origin: center;
}
.transcript-resize-handle::before {
  width: 10px;
  top: 8px;
  right: 4px;
}
.transcript-resize-handle::after {
  width: 6px;
  top: 11px;
  right: 4px;
}

/* Slide transition */
.transcript-slide-enter-active,
.transcript-slide-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.transcript-slide-enter-from,
.transcript-slide-leave-to {
  transform: translateX(-50%) translateY(1rem);
  opacity: 0;
}
</style>
