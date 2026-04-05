import RegistrationForm from '@/components/auth/RegistrationForm'
import RegistrationPageShell from '@/components/auth/RegistrationPageShell'

export default async function RegistrationPage() {
  return (
    <RegistrationPageShell>
      <RegistrationForm />
    </RegistrationPageShell>
  )
}
