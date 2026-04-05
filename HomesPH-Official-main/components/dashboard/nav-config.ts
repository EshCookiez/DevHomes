import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard, Users, Building, Building2, Home, Target,
  MessageSquare, MapPin, Settings, BarChart3,
  FileText, Star, Link2, Layers, Image, CreditCard, Sparkles, ClipboardList, FolderOpen, UserPlus,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: string
}

export interface NavGroup {
  title?: string
  items: NavItem[]
}

export const ROLE_META: Record<string, { label: string; badge: string }> = {
  'super-admin':  { label: 'Super Admin',   badge: 'bg-violet-500' },
  'admin':        { label: 'Admin',         badge: 'bg-blue-500'   },
  'franchise':    { label: 'Franchise',     badge: 'bg-amber-500'  },
  'salesperson':  { label: 'Salesperson',   badge: 'bg-emerald-500'},
  'buyer':        { label: 'Buyer',         badge: 'bg-cyan-500'   },
  'ambassador':   { label: 'Ambassador',    badge: 'bg-pink-500'   },
  'developer':    { label: 'Developer',     badge: 'bg-orange-500' },
  'bank-manager': { label: 'Bank Manager',  badge: 'bg-teal-500'   },
  'secretary':    { label: 'Operations',    badge: 'bg-indigo-500' },
}

export const NAV_CONFIG: Record<string, NavGroup[]> = {
  'secretary': [
    { items: [{ label: 'Dashboard', href: '/dashboard/secretary', icon: LayoutDashboard }] },
    {
      title: 'Operations',
      items: [
        { label: 'Agent Reviews', href: '/dashboard/secretary/applications', icon: ClipboardList, badge: 'New' },
        { label: 'Team Directory', href: '/dashboard/secretary/members', icon: Users },
        { label: 'Leads', href: '/dashboard/secretary/leads', icon: Target },
        { label: 'Inquiries', href: '/dashboard/secretary/inquiries', icon: MessageSquare },
        { label: 'Invitations', href: '/dashboard/secretary/invitations', icon: Link2 },
        { label: 'Office Details', href: '/dashboard/secretary/office', icon: Building2 },
        { label: 'Documents', href: '/dashboard/secretary/documents', icon: FileText },
      ],
    },
    {
      title: 'Personal',
      items: [
        { label: 'My Profile', href: '/dashboard/profile', icon: Users },
      ],
    },
  ],
  'super-admin': [
    { items: [{ label: 'Dashboard', href: '/dashboard/super-admin', icon: LayoutDashboard }] },
    {
      title: 'User Management',
      items: [
        { label: 'Users', href: '/dashboard/users', icon: Users },
        { label: 'Applications', href: '/dashboard/admin/ambassadors', icon: ClipboardList },
      ],
    },
    {
      title: 'Developers',
      items: [
        { label: 'Developers', href: '/dashboard/developers', icon: Building },
      ],
    },
    {
      title: 'Projects',
      items: [
        { label: 'Projects', href: '/dashboard/projects', icon: Building2 },
        { label: 'Listings', href: '/dashboard/listings', icon: Home },
      ],
    },
    {
      title: 'Sales',
      items: [
        { label: 'Leads', href: '/dashboard/leads', icon: Target },
        { label: 'Inquiries', href: '/dashboard/inquiries', icon: MessageSquare },
      ],
    },
    {
      title: 'Content',
      items: [
        { label: 'Amenities', href: '/dashboard/amenities', icon: Sparkles },
        { label: 'Property Types', href: '/dashboard/property-types', icon: Layers },
        { label: 'Locations', href: '/dashboard/locations', icon: MapPin },
      ],
    },
    {
      title: 'Media',
      items: [
        { label: 'Media Library', href: '/dashboard/media', icon: Image },
      ],
    },
    {
      title: 'Analytics',
      items: [
        { label: 'Reports & Analytics', href: '/dashboard/reports', icon: BarChart3 },
        { label: 'Activity Logs', href: '/dashboard/activity-logs', icon: ClipboardList },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      ],
    },
  ],

  'admin': [
    { items: [{ label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard }] },
    {
      title: 'User Management',
      items: [
        { label: 'Users', href: '/dashboard/users', icon: Users },
        { label: 'Applications', href: '/dashboard/admin/ambassadors', icon: ClipboardList },
      ],
    },
    {
      title: 'Developers',
      items: [
        { label: 'Developers', href: '/dashboard/developers', icon: Building },
      ],
    },
    {
      title: 'Projects',
      items: [
        { label: 'Projects', href: '/dashboard/projects', icon: Building2 },
        { label: 'Listings', href: '/dashboard/listings', icon: Home },
      ],
    },
    {
      title: 'Sales',
      items: [
        { label: 'Leads', href: '/dashboard/leads', icon: Target },
        { label: 'Inquiries', href: '/dashboard/inquiries', icon: MessageSquare },
      ],
    },
    {
      title: 'Content',
      items: [
        { label: 'Amenities', href: '/dashboard/amenities', icon: Sparkles },
        { label: 'Property Types', href: '/dashboard/property-types', icon: Layers },
        { label: 'Locations', href: '/dashboard/locations', icon: MapPin },
      ],
    },
    {
      title: 'Media',
      items: [
        { label: 'Media Library', href: '/dashboard/media', icon: Image },
      ],
    },
    {
      title: 'Analytics',
      items: [
        { label: 'Reports & Analytics', href: '/dashboard/reports', icon: BarChart3 },
        { label: 'Activity Logs', href: '/dashboard/activity-logs', icon: ClipboardList },
      ],
    },
    {
      title: 'System',
      items: [
        { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      ],
    },
  ],

  'franchise': [
    { items: [{ label: 'Dashboard', href: '/dashboard/franchise', icon: LayoutDashboard }] },
    {
      title: 'Team',
      items: [
        { label: 'Applications', href: '/dashboard/franchise/applications', icon: ClipboardList },
        { label: 'My Team',    href: '/dashboard/franchise/team',       icon: Users      },
        { label: 'Invitations', href: '/dashboard/franchise/invitations', icon: Link2    },
        { label: 'Suboffices', href: '/dashboard/franchise/suboffices', icon: Building2  },
        { label: 'Org Settings', href: '/dashboard/franchise/settings', icon: Settings   },
      ],
    },
    {
      title: 'Inventory',
      items: [
        { label: 'Projects',   href: '/dashboard/franchise/projects',   icon: FolderOpen },
        { label: 'Listings',   href: '/dashboard/franchise/listings',   icon: Home       },
      ],
    },
    {
      title: 'Sales',
      items: [
        { label: 'Leads',      href: '/dashboard/franchise/leads',      icon: UserPlus   },
        { label: 'Inquiries',  href: '/dashboard/franchise/inquiries',  icon: MessageSquare },
        { label: 'Reports',    href: '/dashboard/franchise/reports',    icon: BarChart3  },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Profile',    href: '/dashboard/profile',              icon: Users      },
      ],
    },
  ],

  'salesperson': [
    { items: [{ label: 'Dashboard', href: '/dashboard/salesperson', icon: LayoutDashboard }] },
    {
      title: 'Pipeline',
      items: [
        { label: 'My Leads',    href: '/dashboard/salesperson/leads',    icon: UserPlus      },
        { label: 'My Listings', href: '/dashboard/salesperson/listings', icon: Home          },
        { label: 'Projects',    href: '/dashboard/salesperson/projects', icon: FolderOpen    },
        { label: 'Inquiries',   href: '/dashboard/salesperson/inquiries',icon: MessageSquare },
        { label: 'Saved',       href: '/dashboard/salesperson/saved',    icon: Star          },
        { label: 'Profile',     href: '/dashboard/profile',               icon: Users         },
      ],
    },
  ],

  'buyer': [
    { items: [{ label: 'Dashboard', href: '/dashboard/buyer', icon: LayoutDashboard }] },
    {
      title: 'Properties',
      items: [
        { label: 'Saved Listings',  href: '/dashboard/buyer/saved-listings',  icon: Home          },
        { label: 'Saved Projects',  href: '/dashboard/buyer/saved-projects',  icon: FolderOpen    },
        { label: 'My Inquiries',    href: '/dashboard/buyer/inquiries',       icon: MessageSquare },
        { label: 'Documents',       href: '/dashboard/buyer/documents',       icon: FileText      },
        { label: 'Profile',         href: '/dashboard/profile',               icon: Users         },
      ],
    },
  ],

  'ambassador': [
    { items: [{ label: 'Dashboard', href: '/dashboard/ambassador', icon: LayoutDashboard }] },
    {
      title: 'Referrals',
      items: [
        { label: 'Links & Codes',  href: '/dashboard/ambassador/links',       icon: Link2      },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Profile',        href: '/dashboard/profile',                icon: Users      },
      ],
    },
  ],

  'developer': [
    { items: [{ label: 'Dashboard', href: '/dashboard/developer', icon: LayoutDashboard }] },
    {
      title: 'Projects',
      items: [
        { label: 'My Projects', href: '/dashboard/developer/projects',   icon: FolderOpen },
        { label: 'Units',       href: '/dashboard/developer/units',      icon: Layers     },
        { label: 'Amenities',   href: '/dashboard/developer/amenities',  icon: Star       },
        { label: 'Galleries',   href: '/dashboard/developer/galleries',  icon: Image      },
        { label: 'Profile',     href: '/dashboard/profile',              icon: Users      },
      ],
    },
    {
      title: 'Sales',
      items: [
        { label: 'Leads',     href: '/dashboard/developer/leads',     icon: UserPlus      },
        { label: 'Inquiries', href: '/dashboard/developer/inquiries', icon: MessageSquare },
        { label: 'Reports',   href: '/dashboard/developer/reports',   icon: BarChart3     },
      ],
    },
  ],

  'bank-manager': [
    { items: [{ label: 'Dashboard', href: '/dashboard/bank-manager', icon: LayoutDashboard }] },
    {
      title: 'Loans',
      items: [
        { label: 'Applications', href: '/dashboard/bank-manager/applications', icon: FileText   },
        { label: 'Buyers',       href: '/dashboard/bank-manager/buyers',       icon: Users      },
        { label: 'Projects',     href: '/dashboard/bank-manager/projects',     icon: FolderOpen },
        { label: 'Reports',      href: '/dashboard/bank-manager/reports',      icon: BarChart3  },
        { label: 'Financing',    href: '/dashboard/bank-manager/financing',    icon: CreditCard },
        { label: 'Profile',      href: '/dashboard/profile',                   icon: Users      },
      ],
    },
  ],
}
