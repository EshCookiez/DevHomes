import 'server-only'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import type {
  DeveloperContactInformationRecord,
  DeveloperContactPersonRecord,
  DeveloperAddressRecord,
  DeveloperProjectRecord,
  DeveloperProfileRecord,
} from '@/lib/developers-types'

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export interface PublicDeveloperBundle {
  developer: DeveloperProfileRecord & { projectsCount: number }
  contacts: DeveloperContactPersonRecord[]
  addresses: DeveloperAddressRecord[]
  projects: (DeveloperProjectRecord & { main_image_url: string | null })[]
  contactInformation: DeveloperContactInformationRecord | null
}

export async function getPublicDeveloperBySlug(slug: string): Promise<PublicDeveloperBundle | null> {
  const supabase = await createServerSupabaseClient()

  // Fetch all active developers and match by generated slug
  const { data: developers, error: devError } = await supabase
    .from('developers_profiles')
    .select('id,user_profile_id,developer_name,industry,website_url,description,logo_url,is_active,created_at,updated_at')

  if (devError || !developers) return null

  const developer = developers.find(
    (d: any) => toSlug(d.developer_name) === slug && d.is_active !== false
  ) as DeveloperProfileRecord | undefined

  if (!developer) return null

  const id = developer.id

  const [contactsResult, addressesResult, projectsResult, channelsResult] = await Promise.all([
    supabase
      .from('developer_contact_persons')
      .select('id,developer_id,fname,mname,lname,full_name,position,email,mobile_number,telephone,created_at,updated_at')
      .eq('developer_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('addresses')
      .select('id,developer_id,label,full_address,street,city,state,country,zip_code,latitude,longitude,created_at,updated_at')
      .eq('developer_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id,name,slug,province,city_municipality,status,currency,price_range_min,price_range_max,main_image_url,created_at')
      .eq('developer_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('contact_information')
      .select('id,primary_mobile,secondary_mobile,telephone,email,facebook_url,twitter_url,instagram_url,linkedin_url,website_url')
      .eq('developer_id', id)
      .maybeSingle(),
  ])

  return {
    developer: {
      ...developer,
      is_active: Boolean(developer.is_active ?? true),
      projectsCount: (projectsResult.data ?? []).length,
    },
    contacts: (contactsResult.data ?? []) as DeveloperContactPersonRecord[],
    addresses: (addressesResult.data ?? []) as DeveloperAddressRecord[],
    projects: (projectsResult.data ?? []) as (DeveloperProjectRecord & { main_image_url: string | null })[],
    contactInformation: (channelsResult.data ?? null) as DeveloperContactInformationRecord | null,
  }
}
