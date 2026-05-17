import {
  normalizeEmail,
  passwordSchema,
  registerSchema,
  usernameSchema,
} from './auth'

describe('auth schemas', () => {
  it('normalizes emails to lowercase and trims whitespace', () => {
    expect(normalizeEmail('  USER@Example.COM  ')).toBe('user@example.com')
  })

  it('rejects invalid usernames', () => {
    const result = usernameSchema.safeParse('a')

    expect(result.success).toBe(false)
  })

  it('requires password with letters and numbers', () => {
    expect(passwordSchema.safeParse('abcdefgh').success).toBe(false)
    expect(passwordSchema.safeParse('abcd1234').success).toBe(true)
  })

  it('normalizes fullwidth digits in passwords (NFKC)', () => {
    // Fullwidth digits and letters that look identical to halfwidth — must
    // collapse to the same string on both register and login.
    const fullwidth = passwordSchema.safeParse('ａｂｃ１２３４５')
    const halfwidth = passwordSchema.safeParse('abc12345')
    expect(fullwidth.success).toBe(true)
    expect(halfwidth.success).toBe(true)
    if (fullwidth.success && halfwidth.success) {
      expect(fullwidth.data).toBe(halfwidth.data)
    }
  })

  it('parses a valid register payload', () => {
    const result = registerSchema.safeParse({
      email: '  TEST@example.com ',
      username: 'user_name',
      password: 'abc12345',
    })

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.email).toBe('test@example.com')
    }
  })
})
