import AmbassadorRegisterForm from '@/components/auth/AmbassadorRegisterForm'
import RegistrationPageShell from '@/components/auth/RegistrationPageShell'

export default async function AmbassadorRegisterPage() {
  return (
    <RegistrationPageShell>
      <AmbassadorRegisterForm />
    </RegistrationPageShell>
  )
}
