import { cn } from '../lib/utils'

type Props = {
  className?: string
  /** 用于 svg 内部 gradient id，多个 logo 共存时避免冲突 */
  idSuffix?: string
}

export function BrandLogo({ className, idSuffix = 'default' }: Props) {
  const gradId = `brand-grad-${idSuffix}`
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-5 h-5', className)}
      aria-label="Skill Store"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" fill={`url(#${gradId})`} />
      <path
        d="M12 6 L13.2 10.8 L18 12 L13.2 13.2 L12 18 L10.8 13.2 L6 12 L10.8 10.8 Z"
        fill="white"
      />
      <circle cx="17.2" cy="6.8" r="1" fill="white" opacity="0.85" />
    </svg>
  )
}
