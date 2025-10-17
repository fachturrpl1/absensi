import { describe, it, expect } from 'vitest'
import { getUserInitials } from '@/lib/avatar-utils'

describe('getUserInitials', () => {
  it('returns initials from display name with space', () => {
    expect(getUserInitials(undefined, undefined, 'John Doe', undefined)).toBe('JD')
  })

  it('returns initials from first and last name', () => {
    expect(getUserInitials('Jane', 'Smith', undefined, undefined)).toBe('JS')
  })

  it('falls back to first letter of email', () => {
    expect(getUserInitials(undefined, undefined, undefined, 'user@example.com')).toBe('U')
  })
})
