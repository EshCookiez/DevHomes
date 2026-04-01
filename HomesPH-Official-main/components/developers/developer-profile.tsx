'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Building2, CalendarDays, Globe2, MapPin, Pencil, ShieldCheck, UserRound } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import DeveloperAddress from './developer-address'
import DeveloperContacts from './developer-contacts'
import DeveloperEditModal from './developer-edit-modal'
import type { DeveloperDetailBundle, ManagedDeveloperRecord } from '@/lib/developers-types'

function formatCurrencyRange(currency: string | null, min: number | null, max: number | null) {
  const resolvedCurrency = currency || 'PHP'
  if (min === null && max === null) return 'Not available'
  if (min !== null && max !== null) return `${resolvedCurrency} ${Number(min).toLocaleString()} - ${Number(max).toLocaleString()}`
  return `${resolvedCurrency} ${(min ?? max ?? 0).toLocaleString()}`
}

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default function DeveloperProfile({
  initialBundle,
  initialTab = 'overview',
}: {
  initialBundle: DeveloperDetailBundle
  initialTab?: string
}) {
  const [developer, setDeveloper] = useState(initialBundle.developer)
  const [contacts, setContacts] = useState(initialBundle.contacts)
  const [addresses, setAddresses] = useState(initialBundle.addresses)
  const [projects] = useState(initialBundle.projects)
  const [openEdit, setOpenEdit] = useState(false)

  const validTab = ['overview', 'contacts', 'address', 'projects'].includes(initialTab) ? initialTab : 'overview'

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <Card className="overflow-hidden border-slate-200 shadow-sm bg-gradient-to-br from-white via-white to-slate-50">
        <CardContent className="flex flex-wrap items-start justify-between gap-6 px-6 py-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 rounded-xl border border-slate-200 bg-white">
              <AvatarImage src={developer.logo_url ?? undefined} alt={developer.developer_name} className="object-cover" />
              <AvatarFallback className="rounded-xl bg-slate-900 text-lg font-bold text-white">
                {developer.logo_url ? getInitials(developer.developer_name) : <Building2 size={20} />}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">{developer.developer_name}</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">{developer.description || 'No company description available yet.'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">{developer.industry || 'No industry set'}</Badge>
                <Badge variant="outline" className={developer.is_active ? 'rounded-full border-emerald-200 bg-emerald-50 text-emerald-700' : 'rounded-full border-slate-200 bg-slate-100 text-slate-600'}>
                  {developer.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-100 text-slate-700">{projects.length} projects</Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {developer.website_url ? (
              <Button asChild variant="outline" className="rounded-xl">
                <a href={developer.website_url} target="_blank" rel="noreferrer">
                  <Globe2 size={15} />
                  Visit Website
                </a>
              </Button>
            ) : null}
            <Button onClick={() => setOpenEdit(true)} className="rounded-xl bg-[#1428ae] hover:bg-[#0f1f8a]">
              <Pencil size={15} />
              Edit Developer
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="sticky top-6 border-slate-200 shadow-sm">
          <CardContent className="space-y-4 px-6 py-6">
            <DetailCard icon={Globe2} label="Website" value={developer.website_url || 'Not set'} />
            <DetailCard icon={UserRound} label="Contacts" value={`${contacts.length}`} />
            <DetailCard icon={MapPin} label="Office Addresses" value={`${addresses.length}`} />
            <DetailCard icon={ShieldCheck} label="Status" value={developer.is_active ? 'Active' : 'Inactive'} />
            <DetailCard icon={CalendarDays} label="Created Date" value={developer.created_at ? new Date(developer.created_at).toLocaleDateString() : 'Unknown'} />
          </CardContent>
        </Card>

        <Tabs defaultValue={validTab} className="gap-5">
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-xl bg-slate-100 p-1.5">
            <TabsTrigger value="overview" className="rounded-xl px-4 py-2.5">Developer Overview</TabsTrigger>
            <TabsTrigger value="contacts" className="rounded-xl px-4 py-2.5">Contact Persons</TabsTrigger>
            <TabsTrigger value="address" className="rounded-xl px-4 py-2.5">Office Address</TabsTrigger>
            <TabsTrigger value="projects" className="rounded-xl px-4 py-2.5">Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2">
              <OverviewCard title="Developer Name" value={developer.developer_name} />
              <OverviewCard title="Industry" value={developer.industry || 'Not set'} />
              <OverviewCard title="Website" value={developer.website_url || 'Not set'} />
              <OverviewCard title="Primary Mobile" value={initialBundle.contactInformation?.primary_mobile || 'Not set'} />
              <OverviewCard title="Email" value={initialBundle.contactInformation?.email || 'Not set'} />
              <OverviewCard title="Description" value={developer.description || 'No description available'} wide />
            </div>
          </TabsContent>

          <TabsContent value="contacts">
            <DeveloperContacts developerId={developer.id} contacts={contacts} onUpdated={setContacts} />
          </TabsContent>

          <TabsContent value="address">
            <DeveloperAddress developerId={developer.id} addresses={addresses} onUpdated={setAddresses} />
          </TabsContent>

          <TabsContent value="projects">
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardContent className="px-0">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50/80 text-left text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Project Name</th>
                      <th className="px-4 py-4">Location</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Price Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {projects.map((project) => (
                      <tr key={project.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          <Link href={`/dashboard/projects/${project.id}`} className="text-[#1428ae] hover:text-[#0f1f8a] hover:underline">
                            {project.name}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{[project.city_municipality, project.province].filter(Boolean).join(', ') || 'Not set'}</td>
                        <td className="px-4 py-4 text-slate-600">{project.status || 'Unknown'}</td>
                        <td className="px-4 py-4 text-slate-600">{formatCurrencyRange(project.currency, project.price_range_min, project.price_range_max)}</td>
                      </tr>
                    ))}
                    {projects.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center text-slate-400">No projects linked to this developer yet.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <DeveloperEditModal open={openEdit} onOpenChange={setOpenEdit} developer={developer} onSaved={(nextDeveloper: ManagedDeveloperRecord) => setDeveloper(nextDeveloper)} />
    </div>
  )
}

function DetailCard({ icon: Icon, label, value }: { icon: typeof Globe2; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
        <Icon size={14} />
        {label}
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  )
}

function OverviewCard({ title, value, wide = false }: { title: string; value: string; wide?: boolean }) {
  return (
    <Card className={`border-slate-200 shadow-sm ${wide ? 'md:col-span-2' : ''}`}>
      <CardContent className="px-5 py-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{title}</p>
        <p className="mt-3 text-sm font-semibold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  )
}