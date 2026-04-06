import AffiliateRegisterForm from '@/components/auth/AffiliateRegisterForm'
import RegistrationPageShell from '@/components/auth/RegistrationPageShell'

export default async function AffiliateRegisterPage() {
  return (
    <RegistrationPageShell>
      <AffiliateRegisterForm />
    </RegistrationPageShell>
  )
}
