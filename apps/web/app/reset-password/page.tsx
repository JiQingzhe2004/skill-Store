import { ResetPasswordForm } from './reset-password-form'

type ResetPasswordPageProps = {
  searchParams?:
    | {
        email?: string
      }
    | Promise<{
        email?: string
      }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams)

  return <ResetPasswordForm initialEmail={resolvedSearchParams?.email} />
}
