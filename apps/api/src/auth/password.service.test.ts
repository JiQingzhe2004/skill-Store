import { PasswordService } from './password.service'

describe('PasswordService', () => {
  const service = new PasswordService()

  it('hashes and verifies passwords', async () => {
    const passwordHash = await service.hashPassword('abc12345')

    expect(passwordHash).not.toBe('abc12345')
    await expect(service.verifyPassword('abc12345', passwordHash)).resolves.toBe(true)
    await expect(service.verifyPassword('wrong123', passwordHash)).resolves.toBe(false)
  })
})
