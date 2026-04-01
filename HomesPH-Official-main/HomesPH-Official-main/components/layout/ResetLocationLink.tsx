'use client'

import Link from 'next/link'
import type { MouseEventHandler, ReactNode } from 'react'
import { useSelectedLocation } from '@/hooks/use-selected-location'

interface ResetLocationLinkProps {
  href: string
  className?: string
  children: ReactNode
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

export default function ResetLocationLink({
  href,
  className,
  children,
  onClick,
}: ResetLocationLinkProps) {
  const { clearSelectedLocation } = useSelectedLocation()

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    clearSelectedLocation()
    onClick?.(event)
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}
