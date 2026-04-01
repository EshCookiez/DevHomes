'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Search, Bell, Plus, ChevronDown,
  User, Settings, LogOut, FolderOpen, Home, UserPlus, Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { canPerformDashboardAction, ROLE_META, type DashboardModuleKey } from '@/lib/dashboard-permissions'
import { useDashboardUser } from './DashboardUserProvider'
import LogoutButton from './LogoutButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Props {
  onMenuToggle: () => void
}

const QUICK_CREATE: Array<{ label: string; icon: typeof FolderOpen; moduleKey: DashboardModuleKey; href: string }> = [
  { label: 'Create Project', icon: FolderOpen, moduleKey: 'projects', href: '/dashboard/projects' },
  { label: 'Add Listing', icon: Home, moduleKey: 'listings', href: '/dashboard/listings' },
  { label: 'Add Lead', icon: UserPlus, moduleKey: 'leads', href: '/dashboard/leads' },
  { label: 'Add Developer', icon: Building2, moduleKey: 'developers', href: '/dashboard/developers' },
]

const NOTIFICATIONS = [
  { id: 1, title: 'New inquiry received',    desc: 'A buyer inquired about Marina Bay Residences', time: '2m ago',  unread: true  },
  { id: 2, title: 'Lead converted',          desc: 'Santos family successfully closed their deal',  time: '1h ago',  unread: true  },
  { id: 3, title: 'Project listing approved', desc: 'Azure Sky Cebu has been approved & published', time: '3h ago',  unread: false },
  { id: 4, title: 'New salesperson joined',  desc: 'Maria Cruz joined your franchise team',            time: '1d ago',  unread: false },
]

function Breadcrumb() {
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
  return (
    <nav className="flex items-center gap-1 text-sm min-w-0 overflow-hidden">
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1
        const label  = part.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        return (
          <span key={i} className="flex items-center gap-1 shrink-0">
            {i > 0 && <span className="text-slate-300 text-xs">/</span>}
            <span className={cn(
              'text-sm',
              isLast ? 'text-slate-800 font-semibold' : 'text-slate-400',
            )}>
              {label}
            </span>
          </span>
        )
      })}
    </nav>
  )
}

export default function DashboardTopbar({ onMenuToggle }: Props) {
  const [notifOpen,  setNotifOpen]  = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [userOpen,   setUserOpen]   = useState(false)
  const user = useDashboardUser()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Live clock
  const [now, setNow] = useState<Date>(() => new Date())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const tick = () => setNow(new Date())
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserOpen(false)
      }
    }
    if (userOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [userOpen])

  const pathname = usePathname()
  const role     = user.roleSegment
  const meta     = ROLE_META[role]
  const unread   = NOTIFICATIONS.filter(n => n.unread).length
  const availableQuickCreate = QUICK_CREATE.filter((item) => canPerformDashboardAction(role, item.moduleKey, 'create', user.dashboardPermissions))

  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'U'

  function closeAll() { setNotifOpen(false); setCreateOpen(false); setUserOpen(false) }

  return (
    <div className="flex flex-col w-full shrink-0 z-20">
      {/* Top info bar */}
      <div className="w-full bg-[#1428ae] border-b border-[#0f1f8a] hidden sm:block">
        <div className="flex items-center justify-between px-4 sm:px-6 h-8 text-[11px] sm:text-xs text-white/90 font-medium tracking-wide">
          <div>
            {new Date(now).toLocaleDateString("en-PH", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "Asia/Manila",
            })}
          </div>
          <div aria-live="polite" className="font-mono font-medium tracking-wider">
            {mounted
              ? new Date(now).toLocaleTimeString("en-PH", {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
                timeZone: "Asia/Manila",
              })
              : ""}
          </div>
        </div>
      </div>

      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 gap-3 shadow-sm">

      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
      >
        <Search size={16} />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1 min-w-0 hidden sm:block">
        <Breadcrumb />
      </div>

      {/* Search (desktop) */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-400 w-60 cursor-pointer hover:border-slate-300 transition-colors">
        <Search size={13} className="shrink-0" />
        <span className="text-sm">Search anything…</span>
        <kbd className="ml-auto text-[10px] border border-slate-200 rounded px-1.5 py-0.5 font-mono text-slate-400">⌘K</kbd>
      </div>

      {/* Quick create */}
      {availableQuickCreate.length > 0 && (
        <div className="relative">
          <button
            onClick={() => { closeAll(); setCreateOpen(v => !v) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1428ae] hover:bg-[#0f1f8a] text-white text-sm font-semibold transition-colors shadow-sm shadow-[#1428ae]/30"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Create</span>
          </button>
          {createOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setCreateOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5">
                {availableQuickCreate.map(item => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setCreateOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Icon size={14} className="text-slate-400" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => { closeAll(); setNotifOpen(v => !v) }}
          className="relative flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <Bell size={17} />
          {unread > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>
        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-white rounded-xl shadow-xl border border-slate-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-900">Notifications</p>
                <button className="text-xs text-[#1428ae] font-semibold hover:underline">Mark all read</button>
              </div>
              <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
                {NOTIFICATIONS.map(n => (
                  <div key={n.id} className={cn('px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors', n.unread && 'bg-[#1428ae]/5')}>
                    <div className="flex items-start gap-2.5">
                      <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', n.unread ? 'bg-[#1428ae]' : 'bg-transparent')} />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                <button className="text-xs text-[#1428ae] font-semibold hover:underline">
                  View all notifications
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User menu */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => { closeAll(); setUserOpen(v => !v) }}
          className="flex items-center gap-3 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full hover:bg-slate-50 transition-all group outline-none"
        >
          {/* Avatar */}
          <div className="relative">
            {user.profileImageUrl ? (
              <Image
                src={user.profileImageUrl}
                alt={user.fullName}
                width={36}
                height={36}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-slate-200 group-hover:border-[#1428ae] transition-all"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#1428ae] to-[#0f1f8a] text-white flex items-center justify-center font-bold text-sm border-2 border-slate-200 group-hover:border-[#fdc700] transition-all">
                {initials}
              </div>
            )}
            {/* Online indicator */}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700 group-hover:text-[#1428ae]">{user.fullName}</span>
            <ChevronDown size={14} className={cn("text-slate-400 transition-transform", userOpen && "rotate-180")} />
          </div>
        </button>

        {userOpen && (
          <>
            <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setUserOpen(false)} />
            <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-5 py-4 bg-gradient-to-r from-[#1428ae] to-[#0f1f8a] text-white">
                <div className="flex items-center gap-3">
                  {user.profileImageUrl ? (
                    <Image
                      src={user.profileImageUrl}
                      alt={user.fullName}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center font-bold text-base border-2 border-white/30">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base truncate">{user.fullName}</p>
                    <p className="text-xs text-white/80 truncate mb-1">{user.email}</p>
                    <span className="inline-block px-2 py-0.5 bg-[#fdc700] text-[#1428ae] text-[10px] font-bold uppercase tracking-wider rounded-full">
                      {meta?.label ?? 'User'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="py-2">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setUserOpen(false)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-slate-700 hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-[#1428ae] group-hover:text-white transition-colors">
                    <User size={16} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-slate-900">My Profile</p>
                    <p className="text-xs text-slate-500">View and edit your profile</p>
                  </div>
                </Link>

                <div className="my-1 px-3">
                  <div className="h-px bg-slate-100"></div>
                </div>

                <LogoutButton
                  className="w-full flex items-center gap-3 px-5 py-3 text-slate-700 hover:bg-rose-50 transition-colors group text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors">
                    <LogOut size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-rose-600">Logout</p>
                    <p className="text-xs text-slate-500">Sign out of your account</p>
                  </div>
                </LogoutButton>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
    </div>
  )
}
