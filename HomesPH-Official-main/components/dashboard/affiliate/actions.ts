'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getVanityCodes() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, codes: [], profileId: null }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
    
  if (!profile) return { success: false, codes: [], profileId: null }

  const { data, error } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_profile_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching vanity codes:', error)
    return { success: false, codes: [], profileId: profile.id }
  }

   // 1. Fetch recruitment registration stats for this affiliate
  const { data: registrationStats } = await supabase
    .from('user_profiles')
    .select('role, account_status')
    .eq('referred_by', profile.id)
    .in('role', ['salesperson', 'franchise'])

  const registeredTotal = registrationStats?.length || 0
  
  const salesperson = {
    total: (registrationStats || []).filter(r => r.role === 'salesperson').length,
    approved: (registrationStats || []).filter(r => r.role === 'salesperson' && r.account_status === 'Active').length
  }
  
  const franchise = {
    total: (registrationStats || []).filter(r => r.role === 'franchise').length,
    approved: (registrationStats || []).filter(r => r.role === 'franchise' && r.account_status === 'Active').length
  }

  const totalRegistrations = salesperson.total + franchise.total

  // 2. Inject placeholder metrics since referral_logs are not fully built
  const codesWithMetrics = (data || []).map(row => ({
    ...row,
    clicks: row.clicks || 0, // In case schema doesn't have it
    // Use the actual registrations instead of the database column if it's 0
    conversions: row.conversions > 0 ? row.conversions : totalRegistrations,
    recruit_salesperson_clicks: row.recruit_salesperson_clicks || 0,
    recruit_franchise_clicks: row.recruit_franchise_clicks || 0,
  }))

  return { 
    success: true, 
    codes: codesWithMetrics, 
    profileId: profile.id,
    recruitmentStats: {
      salesperson: { 
        total: salesperson.total, 
        approved: salesperson.approved 
      },
      franchise: { 
        total: franchise.total, 
        approved: franchise.approved 
      }
    }
  }
}

export async function trackRecruitmentClick(code: string, role: string, source?: string | null, campaign?: string | null) {
  const supabase = await createServerSupabaseClient()
  const upperCode = code.trim().toUpperCase()

  const columnName = role === 'franchise' ? 'recruit_franchise_clicks' : 'recruit_salesperson_clicks'

  // 1. Increment main referral_codes totals
  const { error: mainError } = await supabase.rpc('increment_referral_clicks', { 
    referral_code: upperCode,
    column_to_increment: columnName
  })
  if (mainError) console.error('Error incrementing main clicks:', mainError);

  // 2. Track Campaign Clicks if provided
  if (campaign) {
    let finalSource = source;
    if (!finalSource) {
      // Using createAdminSupabaseClient as a temporary test to bypass RLS
      const { createAdminSupabaseClient } = await import('@/lib/supabase/admin');
      const admin = createAdminSupabaseClient();
      
      const { data: campaignRecord, error: lookupError } = await admin
        .from('referral_source_metrics')
        .select('source_name, affiliate_id, campaign_name')
        .eq('campaign_name', campaign)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); 
        
      if (lookupError) console.error('Lookup Error:', lookupError);
      
      if (campaignRecord) {
        finalSource = campaignRecord.source_name;
      } else {
        finalSource = 'Campaign';
      }
    }

    const { error: rpcError } = await supabase.rpc('increment_campaign_click', {
      p_code: upperCode,
      p_source: finalSource,
      p_campaign: campaign
    })
    if (rpcError) console.error('RPC Error (Campaign Click):', rpcError);
  }

  return { success: true }
}

export async function createVanityCode(code: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
    
  if (!profile) return { success: false, message: 'Profile not found' }

  const upperCode = code.trim().toUpperCase()
  
  // Validate format (alphanumeric only, 4-20 chars)
  const regex = /^[A-Z0-9_-]{4,20}$/
  if (!regex.test(upperCode)) {
    return { success: false, message: 'Code must be 4-20 characters long and contain only letters, numbers, hyphens, and underscores.' }
  }

  // Check how many they have already (optional limit: 10)
  const { count } = await supabase
    .from('referral_codes')
    .select('*', { count: 'exact', head: true })
    .eq('user_profile_id', profile.id)

  if (count !== null && count >= 10) {
    return { success: false, message: 'You have reached the maximum limit of 10 active codes.' }
  }

  // Insert into DB. Unique constraint on 'code' will block duplicates globally.
  const { error } = await supabase
    .from('referral_codes')
    .insert({
      user_profile_id: profile.id,
      code: upperCode,
      is_active: true
    })

  if (error) {
    if (error.code === '23505' || error.message?.includes('unique constraint')) {
      return { success: false, message: 'This code is already taken. Please choose another one.' }
    }
    console.error('Error creating vanity code:', error)
    return { success: false, message: 'An error occurred while creating your code.' }
  }

  revalidatePath('/dashboard/affiliate/links')
  return { success: true, message: 'Custom vanity code created!' }
}

export async function deleteVanityCode(id: number) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  const { error } = await supabase
    .from('referral_codes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting vanity code:', error)
    return { success: false, message: 'Failed to delete the code.' }
  }

  revalidatePath('/dashboard/affiliate/links')
  return { success: true, message: 'Vanity code deleted!' }
}

export async function getDashboardStats() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, chartData: [], activities: [] }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
    
  if (!profile) return { success: false, chartData: [], activities: [] }

  // 1. Fetch referral data for the chart (grouped by month)
  // We'll fetch the last 8 months of referrals
  // Check both salesperson and franchise registrations where referred_by = profile.id
  const { data: users } = await supabase
    .from('user_profiles')
    .select('created_at')
    .eq('referred_by', profile.id)
    .in('role', ['salesperson', 'franchise'])
    .order('created_at', { ascending: true })

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const chartMap: Record<string, number> = {}
  
  // Initialize last 8 months with 0
  for (let i = 7; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const label = monthNames[d.getMonth()]
    chartMap[label] = 0
  }

  users?.forEach(u => {
    const date = new Date(u.created_at)
    const label = monthNames[date.getMonth()]
    if (chartMap[label] !== undefined) {
      chartMap[label]++
    }
  })

  const chartData = Object.entries(chartMap).map(([name, value]) => ({ name, value }))

  // 2. Fetch recent activities (combination of new referrals and conversions)
  const { data: activities } = await supabase
    .from('referral_logs')
    .select('*')
    .eq('user_profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return { 
    success: true, 
    chartData, 
    activities: activities || [] 
  }
}

export async function getCampaignStats() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, stats: [] }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
    
  if (!profile) return { success: false, stats: [] }

  // Fetch click counts grouped by source for this affiliate's codes
  // Table 'referral_source_metrics' should track: code_id, source_name (e.g. 'Facebook'), clicks
  const { data, error } = await supabase
    .from('referral_source_metrics')
    .select('source_name, campaign_name, clicks, registrations, code_id, referral_codes(code)')
    .eq('affiliate_id', profile.id)

  if (error) {
    console.error('Error fetching campaign stats:', error)
    return { success: false, stats: [] }
  }

  return { success: true, stats: data || [] }
}

export async function createCampaign(code: string, source: string, campaignName: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
    
  if (!profile) return { success: false, message: 'Profile not found' }

  const { data: codeData } = await supabase
    .from('referral_codes')
    .select('id')
    .eq('code', code)
    .eq('user_profile_id', profile.id)
    .single()

  if (!codeData) return { success: false, message: 'Invalid code' }

  const { error } = await supabase
    .from('referral_source_metrics')
    .upsert({
      affiliate_id: profile.id,
      code_id: codeData.id,
      source_name: source,
      campaign_name: campaignName,
    }, { onConflict: 'affiliate_id,code_id,source_name,campaign_name' })

  if (error) {
    console.error('Error creating campaign:', error)
    return { success: false, message: `DB Error: ${error.message} (${error.code})` }
  }

  revalidatePath('/dashboard/affiliate')
  return { success: true, message: `Campaign tracking for ${campaignName} created!` }
}
