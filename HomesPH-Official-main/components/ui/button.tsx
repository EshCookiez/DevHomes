import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#1428ae]/30 aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-[#1428ae] text-white shadow-lg shadow-[#1428ae]/40 hover:bg-[#1020a0] hover:shadow-xl hover:shadow-[#1428ae]/50',
        destructive:
          'bg-destructive text-white shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/30',
        outline:
          'border border-[#1428ae]/30 bg-white text-[#1428ae] shadow-sm hover:bg-[#1428ae]/5 hover:border-[#1428ae]/50',
        secondary:
          'border border-slate-300 bg-white text-slate-700 shadow-md shadow-slate-300/60 hover:bg-slate-50 hover:border-[#1428ae]/30 hover:shadow-lg',
        ghost:
          'text-slate-500 hover:text-[#1428ae] hover:bg-[#1428ae]/5',
        link: 'text-[#1428ae] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2.5 has-[>svg]:px-4',
        sm: 'h-8 rounded-lg px-4 py-2 text-xs gap-1.5 has-[>svg]:px-3',
        lg: 'h-12 rounded-xl px-8 py-3 text-base has-[>svg]:px-6',
        icon: 'size-10 rounded-xl',
        'icon-sm': 'size-8 rounded-lg',
        'icon-lg': 'size-12 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
