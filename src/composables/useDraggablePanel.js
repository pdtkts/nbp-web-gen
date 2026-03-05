import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'

/**
 * Reusable composable for draggable, resizable, position-persisted panels.
 * Extracted from LightboxTranscript.vue.
 *
 * @param {string} storagePrefix - localStorage key prefix (e.g. 'nbp-transcript', 'nbp-info-panel')
 * @param {Object} [options]
 * @param {import('vue').Ref<boolean>} [options.visible] - reactive visibility ref (triggers bounds check on show)
 */
export function useDraggablePanel(storagePrefix, options = {}) {
  const panelRef = ref(null)

  // --- Resize ---
  const customWidth = ref(null)
  const customMaxHeight = ref(null)
  const isResizing = ref(false)
  let resizeStart = { x: 0, y: 0, width: 0, height: 0 }

  // Load persisted size
  const savedW = localStorage.getItem(`${storagePrefix}-width`)
  const savedH = localStorage.getItem(`${storagePrefix}-max-height`)
  if (savedW) customWidth.value = parseInt(savedW)
  if (savedH) customMaxHeight.value = parseInt(savedH)

  // Brief guard flag — stays true for 200ms after drag/resize ends
  // to block the synthetic click that browsers fire after mouseup/touchend
  const recentlyInteracted = ref(false)
  let interactionTimer = null
  const markInteractionEnd = () => {
    recentlyInteracted.value = true
    clearTimeout(interactionTimer)
    interactionTimer = setTimeout(() => { recentlyInteracted.value = false }, 200)
  }

  const clampSize = (w, h) => ({
    width: Math.max(280, Math.min(window.innerWidth * 0.9, w)),
    height: Math.max(120, Math.min(window.innerHeight * 0.7, h)),
  })

  const persistSize = () => {
    if (customWidth.value) localStorage.setItem(`${storagePrefix}-width`, String(customWidth.value))
    if (customMaxHeight.value) localStorage.setItem(`${storagePrefix}-max-height`, String(customMaxHeight.value))
  }

  const startResize = (clientX, clientY) => {
    if (!panelRef.value) return
    isResizing.value = true
    const rect = panelRef.value.getBoundingClientRect()
    resizeStart = { x: clientX, y: clientY, width: rect.width, height: rect.height }
  }

  const updateResize = (clientX, clientY) => {
    if (!isResizing.value) return
    const dx = clientX - resizeStart.x
    const dy = clientY - resizeStart.y
    const { width, height } = clampSize(resizeStart.width + dx, resizeStart.height - dy)
    customWidth.value = Math.round(width)
    customMaxHeight.value = Math.round(height)
  }

  const endResize = () => {
    if (!isResizing.value) return
    isResizing.value = false
    persistSize()
    markInteractionEnd()
  }

  // Mouse resize
  const onResizeMouseMove = (e) => updateResize(e.clientX, e.clientY)
  const onResizeMouseUp = () => {
    endResize()
    window.removeEventListener('mousemove', onResizeMouseMove)
    window.removeEventListener('mouseup', onResizeMouseUp)
  }
  const onResizeMouseDown = (e) => {
    e.preventDefault()
    startResize(e.clientX, e.clientY)
    window.addEventListener('mousemove', onResizeMouseMove)
    window.addEventListener('mouseup', onResizeMouseUp)
  }

  // Touch resize
  const onResizeTouchStart = (e) => {
    if (e.touches.length !== 1) return
    startResize(e.touches[0].clientX, e.touches[0].clientY)
  }
  const onResizeTouchMove = (e) => {
    if (!isResizing.value || e.touches.length !== 1) return
    updateResize(e.touches[0].clientX, e.touches[0].clientY)
  }
  const onResizeTouchEnd = () => endResize()

  // --- Drag ---
  const savedX = localStorage.getItem(`${storagePrefix}-offset-x`)
  const savedY = localStorage.getItem(`${storagePrefix}-offset-y`)
  const dragOffset = ref({
    x: savedX ? parseInt(savedX) : 0,
    y: savedY ? parseInt(savedY) : 0,
  })
  const isDragging = ref(false)
  let dragStart = { x: 0, y: 0 }
  let offsetStart = { x: 0, y: 0 }

  const constrainOffset = (newX, newY) => {
    if (!panelRef.value) return { x: newX, y: newY }

    const rect = panelRef.value.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const margin = 48

    // Horizontal: keep panel mostly on screen
    const centerX = vw / 2 + newX
    const halfW = rect.width / 2
    if (centerX - halfW < -halfW + margin) newX = -vw / 2 + margin
    if (centerX + halfW > vw + halfW - margin) newX = vw / 2 - margin

    // Vertical: don't go above toolbar (4rem~64px) or below viewport bottom
    // Default position: bottom: 10rem (160px), so default top = vh - 160 - height
    const defaultTop = vh - 160 - rect.height
    const newTop = defaultTop + newY
    if (newTop < 64) newY = 64 - defaultTop
    if (newTop + rect.height > vh - 16) newY = vh - 16 - rect.height - defaultTop

    return { x: newX, y: newY }
  }

  const updateDragPosition = (clientX, clientY) => {
    const dx = clientX - dragStart.x
    const dy = clientY - dragStart.y
    const { x, y } = constrainOffset(offsetStart.x + dx, offsetStart.y + dy)
    dragOffset.value = { x, y }
  }

  const persistOffset = () => {
    localStorage.setItem(`${storagePrefix}-offset-x`, String(dragOffset.value.x))
    localStorage.setItem(`${storagePrefix}-offset-y`, String(dragOffset.value.y))
  }

  // Mouse drag
  const onMouseMove = (e) => {
    if (!isDragging.value) return
    updateDragPosition(e.clientX, e.clientY)
  }

  const onMouseUp = () => {
    isDragging.value = false
    persistOffset()
    markInteractionEnd()
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  const onDragMouseDown = (e) => {
    e.preventDefault()
    isDragging.value = true
    dragStart = { x: e.clientX, y: e.clientY }
    offsetStart = { ...dragOffset.value }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // Touch drag
  const onDragTouchStart = (e) => {
    if (e.touches.length !== 1) return
    isDragging.value = true
    const touch = e.touches[0]
    dragStart = { x: touch.clientX, y: touch.clientY }
    offsetStart = { ...dragOffset.value }
  }

  const onDragTouchMove = (e) => {
    if (!isDragging.value || e.touches.length !== 1) return
    e.preventDefault()
    const touch = e.touches[0]
    updateDragPosition(touch.clientX, touch.clientY)
  }

  const onDragTouchEnd = () => {
    isDragging.value = false
    persistOffset()
    markInteractionEnd()
  }

  // Double-click resize handle to reset ALL customizations (size + position)
  const onResizeDblClick = () => {
    customWidth.value = null
    customMaxHeight.value = null
    dragOffset.value = { x: 0, y: 0 }
    localStorage.removeItem(`${storagePrefix}-width`)
    localStorage.removeItem(`${storagePrefix}-max-height`)
    localStorage.removeItem(`${storagePrefix}-offset-x`)
    localStorage.removeItem(`${storagePrefix}-offset-y`)
  }

  // --- Viewport bounds check ---
  const checkBoundsAndReset = async () => {
    await nextTick()
    if (!panelRef.value) return
    const rect = panelRef.value.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (rect.left < 0 || rect.right > vw || rect.top < 0 || rect.bottom > vh) {
      dragOffset.value = { x: 0, y: 0 }
      localStorage.removeItem(`${storagePrefix}-offset-x`)
      localStorage.removeItem(`${storagePrefix}-offset-y`)
    }
  }

  // --- Computed style ---
  const panelStyle = computed(() => {
    const style = {}
    if (dragOffset.value.x !== 0 || dragOffset.value.y !== 0) {
      style.transform = `translateX(calc(-50% + ${dragOffset.value.x}px)) translateY(${dragOffset.value.y}px)`
    }
    if (customWidth.value) {
      style.width = `${customWidth.value}px`
      style.maxWidth = 'none'
    }
    if (customMaxHeight.value) {
      style.maxHeight = `${customMaxHeight.value}px`
    }
    return style
  })

  // --- Lifecycle ---
  onMounted(() => {
    checkBoundsAndReset()
  })

  // Also check when toggled visible
  if (options.visible) {
    watch(options.visible, (v) => { if (v) checkBoundsAndReset() })
  }

  // Cleanup global listeners
  onUnmounted(() => {
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    window.removeEventListener('mousemove', onResizeMouseMove)
    window.removeEventListener('mouseup', onResizeMouseUp)
    clearTimeout(interactionTimer)
  })

  return {
    panelRef,
    dragOffset,
    isDragging,
    isResizing,
    recentlyInteracted,
    customWidth,
    customMaxHeight,
    panelStyle,
    // Drag handlers
    onDragMouseDown,
    onDragTouchStart,
    onDragTouchMove,
    onDragTouchEnd,
    // Resize handlers
    onResizeMouseDown,
    onResizeTouchStart,
    onResizeTouchMove,
    onResizeTouchEnd,
    onResizeDblClick,
    // Utility
    checkBoundsAndReset,
  }
}
