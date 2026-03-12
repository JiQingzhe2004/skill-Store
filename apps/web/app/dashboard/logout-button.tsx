'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '../../components/ui/button'
import { apiRequest } from '../../lib/api'
import { messages } from '../../messages'

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
    <Button type="button" variant="outline" onClick={handleLogout} disabled={loading}>
      <LogOut className="h-4 w-4" />
      {loading ? messages.dashboard.signingOut : messages.dashboard.signOut}
    </Button>
  )
}
