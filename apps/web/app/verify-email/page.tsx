import { redirect } from 'next/navigation'

type Props = {
  searchParams: Promise<{ email?: string }>
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams
  const email = params?.email ? `&email=${encodeURIComponent(params.email)}` : ''
  redirect(`/?auth=verify-email${email}`)
}
