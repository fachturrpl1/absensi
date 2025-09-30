/**
 * Tests for avatar utility functions
 */

import { safeAvatarSrc, getUserInitials, isValidImageUrl } from '../avatar-utils'

describe('Avatar Utilities', () => {
  describe('safeAvatarSrc', () => {
    it('should return null for empty string', () => {
      expect(safeAvatarSrc('')).toBe(null)
    })

    it('should return null for undefined', () => {
      expect(safeAvatarSrc(undefined)).toBe(null)
    })

    it('should return null for null', () => {
      expect(safeAvatarSrc(null)).toBe(null)
    })

    it('should return null for string "null"', () => {
      expect(safeAvatarSrc('null')).toBe(null)
    })

    it('should return the URL for valid URLs', () => {
      const validUrl = 'https://example.com/avatar.jpg'
      expect(safeAvatarSrc(validUrl)).toBe(validUrl)
    })
  })

  describe('getUserInitials', () => {
    it('should return initials from first and last name', () => {
      expect(getUserInitials('John', 'Doe')).toBe('JD')
    })

    it('should return initial from first name only', () => {
      expect(getUserInitials('John')).toBe('J')
    })

    it('should return initials from display name', () => {
      expect(getUserInitials('', '', 'Jane Smith')).toBe('JS')
    })

    it('should return single initial for single word display name', () => {
      expect(getUserInitials('', '', 'Madonna')).toBe('M')
    })

    it('should fallback to email initial', () => {
      expect(getUserInitials('', '', '', 'test@example.com')).toBe('T')
    })

    it('should return U as final fallback', () => {
      expect(getUserInitials()).toBe('U')
    })

    it('should prioritize display name over first/last name', () => {
      expect(getUserInitials('John', 'Doe', 'Jane Smith')).toBe('JS')
    })
  })

  describe('isValidImageUrl', () => {
    it('should return false for empty string', () => {
      expect(isValidImageUrl('')).toBe(false)
    })

    it('should return false for null', () => {
      expect(isValidImageUrl(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isValidImageUrl(undefined)).toBe(false)
    })

    it('should return true for valid HTTP URLs', () => {
      expect(isValidImageUrl('https://example.com/image.jpg')).toBe(true)
    })

    it('should return true for valid HTTPS URLs', () => {
      expect(isValidImageUrl('https://example.com/image.png')).toBe(true)
    })

    it('should return false for invalid URLs', () => {
      expect(isValidImageUrl('not-a-url')).toBe(false)
    })

    it('should return false for relative paths', () => {
      expect(isValidImageUrl('/path/to/image.jpg')).toBe(false)
    })
  })
})