import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900',
        'placeholder:text-slate-400',
        'selection:bg-[#1428ae] selection:text-white',
        'transition-all duration-200 outline-none',
        'focus:border-[#1428ae] focus:ring-2 focus:ring-[#1428ae]/20',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-700',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
