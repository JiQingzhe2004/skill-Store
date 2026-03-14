'use client'

import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { apiRequest } from '../../../lib/api'
import { useRouter } from 'next/navigation'

export function AdminUserActions({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const toggleRole = async () => {
    setLoading(true)
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN'
    await apiRequest(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={toggleRole}
    >
      {currentRole === 'ADMIN' ? '降为用户' : '设为管理员'}
    </Button>
  )
}
