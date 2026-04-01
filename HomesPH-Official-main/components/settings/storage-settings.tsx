import { Database, HardDrive, ServerCog } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StorageConfig {
  supabaseBucket: string
  s3Bucket: string
  s3Endpoint: string
  s3Region: string
}

const FIELDS = [
  { key: 'supabaseBucket', label: 'Supabase Storage Bucket', icon: Database },
  { key: 's3Bucket', label: 'S3 Bucket', icon: HardDrive },
  { key: 's3Endpoint', label: 'S3 Endpoint', icon: ServerCog },
  { key: 's3Region', label: 'S3 Region', icon: ServerCog },
] as const

export default function StorageSettings({ config }: { config: StorageConfig }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {FIELDS.map(field => {
        const Icon = field.icon
        const value = config[field.key] || 'Not configured'
        return (
          <Card key={field.key} className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Icon size={16} />
                </span>
                {field.label}
              </CardTitle>
              <CardDescription>Read-only environment configuration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700 break-all">
                {value}
              </div>
              <Badge variant="outline" className="rounded-full text-slate-500">
                {value === 'Not configured' ? 'Missing' : 'Loaded from env'}
              </Badge>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
