import { SignUpForm } from "@/components/SignUpForm";
import { AuthShell } from "@/components/AuthShell";

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="One login, post to all your Facebook Pages and Instagram Business accounts."
    >
      <SignUpForm />
    </AuthShell>
  );
}
