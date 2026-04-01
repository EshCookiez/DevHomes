'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSidebarByRoleWithPermissions, ROLE_META } from '@/lib/dashboard-permissions'
import { useDashboardUser } from './DashboardUserProvider'
import LogoutButton from './LogoutButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Props {
  collapsed: boolean
  onToggle: () => void
}

export default function DashboardSidebar({ collapsed, onToggle }: Props) {
  const pathname = usePathname()
  const user     = useDashboardUser()
  const role     = user.roleSegment
  const groups   = getSidebarByRoleWithPermissions(role, user.dashboardPermissions)
  const meta     = ROLE_META[role]

  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'U'

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside className={cn(
      'relative flex flex-col h-screen bg-[#0f172a] border-r border-white/[0.06] transition-all duration-300 shrink-0 z-30',
      collapsed ? 'w-[68px]' : 'w-64',
    )}>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3.5 top-[74px] z-40 flex items-center justify-center w-7 h-7 rounded-full bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white transition-all shadow-md"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Logo */}
      <Link
        href="/"
        className={cn(
          'flex items-center h-16 px-4 border-b border-white/[0.06] shrink-0 hover:opacity-85 transition-opacity',
          collapsed ? 'justify-center' : 'gap-3',
        )}
      >
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 shrink-0 p-0.5">
          <Image
            src="https://rwhtwbbpnhkevhocdmma.supabase.co/storage/v1/object/public/homesph/logo.png"
            alt="HomesPH"
            width={32}
            height={32}
            className="object-contain"
            unoptimized
          />
        </div>
        <span className={cn(
          'font-black text-white text-lg tracking-tight transition-all duration-200 whitespace-nowrap',
          collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100',
        )}>
          HomesPH
        </span>
      </Link>

      {/* Role badge */}
      {!collapsed && meta && (
        <div className="px-4 py-2.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className={cn('w-2 h-2 rounded-full shrink-0', meta.badge)} />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{meta.label}</span>
          </div>
        </div>
      )}

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {groups.map((group, gi) => (
          <div key={gi} className={cn(gi > 0 && 'mt-2')}>
            {!collapsed && group.title && (
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500/80">
                {group.title}
              </p>
            )}
            {group.items.map(item => {
              const Icon   = item.icon
              const active = isActive(item.href)
              const badge = item.href === '/dashboard/inquiries' && user.unreadInquiryCount > 0
                ? String(user.unreadInquiryCount)
                : item.badge
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-[#1428ae] text-white shadow-sm shadow-[#1428ae]/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.07]',
                    collapsed && 'justify-center px-0',
                  )}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className={cn(
                    'transition-all duration-200 whitespace-nowrap',
                    collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100',
                  )}>
                    {item.label}
                  </span>
                  {!collapsed && badge && (
                    <span className="ml-auto text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                      {badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User / Logout */}
      <div className={cn(
        'border-t border-white/[0.06] p-3 shrink-0',
        collapsed ? 'flex justify-center' : '',
      )}>
        {collapsed ? (
          <LogoutButton
            title="Logout"
            className="flex items-center justify-center w-10 h-10 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.07] transition-colors"
          >
            <LogOut size={16} />
          </LogoutButton>
        ) : (
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 shrink-0 border border-white/10">
              <AvatarImage src={user.profileImageUrl ?? undefined} alt={user.fullName} />
              <AvatarFallback className="bg-[#1428ae] text-white text-xs font-black">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
              <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-600 mt-0.5 truncate">{meta?.label ?? 'User'}</p>
            </div>
            <LogoutButton
              title="Logout"
              className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded"
            >
              <LogOut size={15} />
            </LogoutButton>
          </div>
        )}
      </div>
    </aside>
  )
}
