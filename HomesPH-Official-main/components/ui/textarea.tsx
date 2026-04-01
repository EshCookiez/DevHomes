import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900',
        'placeholder:text-slate-400',
        'transition-all duration-200 outline-none',
        'focus:border-[#1428ae] focus:ring-2 focus:ring-[#1428ae]/20',
        'field-sizing-content min-h-16 resize-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
