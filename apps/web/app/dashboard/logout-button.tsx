'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { apiRequest } from '../../lib/api'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    await apiRequest('/auth/logout', {
      method: 'POST',
    })
    router.push('/login')
    router.refresh()
  }

  return (
    <button className="primary-button" type="button" onClick={handleLogout} disabled={loading}>
      {loading ? '退出中...' : '退出登录'}
    </button>
  )
}
