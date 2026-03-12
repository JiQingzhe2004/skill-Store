import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { RegisterForm } from './register-form'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
  }),
}))

describe('RegisterForm', () => {
  it('shows validation messages before submit', async () => {
    render(<RegisterForm />)

    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('请输入有效邮箱')).toBeInTheDocument()
      expect(screen.getByText('用户名至少 2 个字符')).toBeInTheDocument()
    })
  })
})
