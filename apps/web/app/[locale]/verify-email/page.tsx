import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ email?: string }>
}

export default async function VerifyEmailPage({ params, searchParams }: Props) {
  const { locale } = await params
  const sp = await searchParams
  const email = sp?.email ? `&email=${encodeURIComponent(sp.email)}` : ''
  redirect(`/${locale}?auth=verify-email${email}`)
}
