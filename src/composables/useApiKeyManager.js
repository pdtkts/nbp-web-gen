import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalStorage } from './useLocalStorage'

/**
 * API Key 管理與分流
 *
 * 本專案使用雙 API Key 架構：
 * - 付費金鑰 (Primary): 用於圖片/影片生成，強制使用
 * - Free Tier 金鑰 (Secondary): 用於文字處理，僅使用 Free Tier（不自動 fallback）
 */
export function useApiKeyManager() {
  const {
    getApiKey: getPaidApiKey,
    setApiKey: setPaidApiKey,
    hasApiKey: hasPaidApiKey,
    getFreeTierApiKey,
    setFreeTierApiKey,
    hasFreeTierApiKey,
    getCustomBaseUrl,
    setCustomBaseUrl,
    getFreeTierBaseUrl,
    setFreeTierBaseUrl,
    getFreeTierModel,
    setFreeTierModel,
  } = useLocalStorage()
  const { t } = useI18n()

  // 追蹤當前正在使用的 key 類型（用於 UI 顯示）
  const lastUsedKeyType = ref(null) // 'paid' | 'freeTier' | null

  /**
   * 根據使用情境取得適當的 API Key
   * @param {'image' | 'text'} usage - 使用情境
   * @returns {string} API Key
   */
  const getApiKey = (usage = 'image') => {
    if (usage === 'image') {
      lastUsedKeyType.value = 'paid'
      return getPaidApiKey()
    }

    lastUsedKeyType.value = 'freeTier'
    return getFreeTierApiKey()
  }

  /**
   * 檢查指定使用情境是否有可用的 API Key
   * @param {'image' | 'text'} usage - 使用情境
   * @returns {boolean}
   */
  const hasApiKeyFor = (usage = 'image') => {
    if (usage === 'image') {
      return hasPaidApiKey()
    }
    return hasFreeTierApiKey()
  }

  /**
   * 保留舊名稱以維持相容性：不再做 fallback，只做直接呼叫
   * @param {(apiKey: string) => Promise<T>} apiCall - API 調用函數
   * @param {'image' | 'text'} usage - 使用情境
   * @returns {Promise<T>}
   */
  const callWithFallback = async (apiCall, usage = 'text') => {
    const apiKey = getApiKey(usage)
    if (!apiKey) {
      throw new Error(t('errors.apiKeyNotSet'))
    }
    return await apiCall(apiKey)
  }

  return {
    // API Key 取得
    getApiKey,
    hasApiKeyFor,

    // 直接存取（用於設定頁面）
    getPaidApiKey,
    setPaidApiKey,
    hasPaidApiKey,
    getFreeTierApiKey,
    setFreeTierApiKey,
    hasFreeTierApiKey,

    // 帶相容名稱的直接調用
    callWithFallback,

    // Primary Base URL (API proxy)
    getCustomBaseUrl,
    setCustomBaseUrl,

    // Free Tier Base URL (text API proxy)
    getFreeTierBaseUrl,
    setFreeTierBaseUrl,

    // Free Tier Model selection
    getFreeTierModel,
    setFreeTierModel,

    // 狀態（用於 UI 顯示）
    lastUsedKeyType: computed(() => lastUsedKeyType.value),
  }
}

/**
 * 檢查錯誤是否為額度不足相關
 */
export function isQuotaError(error) {
  // HTTP 狀態碼檢查
  if (error?.status === 429 || error?.code === 429) {
    return true
  }

  // 錯誤訊息檢查
  const message = (error?.message || error?.error?.message || '').toLowerCase()
  return (
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('exhausted') ||
    message.includes('exceeded') ||
    message.includes('too many requests')
  )
}
