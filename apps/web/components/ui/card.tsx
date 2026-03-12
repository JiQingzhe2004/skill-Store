import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

const cardVariants = cva('bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm', {
  variants: {
    size: {
      default: '',
      sm: 'gap-4 py-4',
    },
  },
  defaultVariants: {
    size: 'default',
  },
})

type CardProps = React.ComponentProps<'div'> & VariantProps<typeof cardVariants>

function Card({ className, size, ...props }: CardProps) {
  return <div data-slot="card" className={cn(cardVariants({ size, className }))} {...props} />
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-[>[data-slot=card-action]]:grid-cols-[1fr_auto]', className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return <h3 data-slot="card-title" className={cn('leading-none font-semibold tracking-tight', className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="card-description" className={cn('text-muted-foreground text-sm', className)} {...props} />
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-action" className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-6', className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('flex items-center px-6', className)} {...props} />
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardAction, CardContent }
