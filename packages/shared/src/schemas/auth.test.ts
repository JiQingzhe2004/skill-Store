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
