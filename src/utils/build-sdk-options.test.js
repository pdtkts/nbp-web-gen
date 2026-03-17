import { describe, it, expect } from 'vitest'
import { buildSdkOptions } from './build-sdk-options'

describe('buildSdkOptions', () => {
  it('returns apiKey only when no baseUrl', () => {
    expect(buildSdkOptions('key123')).toEqual({ apiKey: 'key123' })
  })

  it('returns apiKey only when baseUrl is empty string', () => {
    expect(buildSdkOptions('key123', '')).toEqual({ apiKey: 'key123' })
  })

  it('returns apiKey only when baseUrl is undefined', () => {
    expect(buildSdkOptions('key123', undefined)).toEqual({ apiKey: 'key123' })
  })

  it('returns apiKey only when baseUrl is null', () => {
    expect(buildSdkOptions('key123', null)).toEqual({ apiKey: 'key123' })
  })

  it('includes httpOptions.baseUrl when baseUrl is provided', () => {
    expect(buildSdkOptions('key123', 'https://proxy.example.com')).toEqual({
      apiKey: 'key123',
      httpOptions: { baseUrl: 'https://proxy.example.com' },
    })
  })

  it('preserves baseUrl as-is without modification', () => {
    const url = 'https://38000.tspy.tech'
    const result = buildSdkOptions('mykey', url)
    expect(result.httpOptions.baseUrl).toBe(url)
  })
})
