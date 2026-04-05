import { Suspense } from 'react'
import FranchiseRegistrationWizard from '@/components/auth/FranchiseRegistrationWizard'
import RegistrationPageShell from '@/components/auth/RegistrationPageShell'

export default async function RegistrationPage() {
  return (
    <RegistrationPageShell>
      <Suspense
        fallback={
          <div className="flex h-96 w-full max-w-lg items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xl">
            Loading registration...
          </div>
        }
      >
        <FranchiseRegistrationWizard />
      </Suspense>
    </RegistrationPageShell>
  )
}
