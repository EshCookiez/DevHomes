'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ClipboardList, Clock, AlertCircle } from 'lucide-react'
import { markAgentAsReviewed } from '@/app/dashboard/secretary/actions'
import StatusBadge from '@/components/dashboard/StatusBadge'
import { useRouter } from 'next/navigation'

interface PendingAgentProps {
  agents: any[]
}

export default function PendingReviews({ agents }: PendingAgentProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleReview = async (id: string) => {
    setLoadingId(id)
    try {
      await markAgentAsReviewed(id)
      router.refresh()
    } catch (err) {
      console.error('Failed to review agent:', err)
    } finally {
      setLoadingId(null)
    }
  }

  if (agents.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
            <CheckCircle size={24} />
          </div>
          <CardTitle className="text-slate-900 text-lg">All caught up!</CardTitle>
          <CardDescription className="max-w-xs mt-1">
            There are no pending agent registrations requiring review at the moment.
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <Card key={agent.id} className="overflow-hidden border-slate-200 hover:border-[#0c1f4a]/20 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center p-5 gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900 truncate">{agent.full_name}</h3>
                <StatusBadge status={agent.account_status} />
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 uppercase font-semibold tracking-wider">
                <Clock size={12} /> Registered {new Date(agent.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 rounded-lg px-4 font-bold border-slate-200 hover:bg-slate-50"
                onClick={() => router.push(`/dashboard/profile/${agent.id}`)} // Assuming a view profile route
              >
                View Docs
              </Button>
              
              {agent.account_status === 'pending_approval' && (
                <Button 
                  size="sm" 
                  disabled={loadingId === agent.id}
                  className="h-9 rounded-lg px-4 bg-[#0c1f4a] hover:bg-[#163880] text-white font-black transition-all"
                  onClick={() => handleReview(agent.id)}
                >
                  <ClipboardList size={14} className="mr-2" />
                  {loadingId === agent.id ? 'Processing...' : 'Mark as Reviewed'}
                </Button>
              )}

              {agent.account_status === 'under_review' && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-100">
                  <CheckCircle size={14} />
                  Reviewed
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
