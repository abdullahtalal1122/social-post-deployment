import { Suspense } from "react";
import { SignInForm } from "@/components/SignInForm";
import { AuthShell } from "@/components/AuthShell";

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your Facebook and Instagram posts."
    >
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
