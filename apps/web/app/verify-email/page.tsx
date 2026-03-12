import { VerifyEmailForm } from './verify-email-form'

type VerifyEmailPageProps = {
  searchParams?:
    | {
        email?: string
      }
    | Promise<{
        email?: string
      }>
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams)

  return <VerifyEmailForm initialEmail={resolvedSearchParams?.email} />
}
