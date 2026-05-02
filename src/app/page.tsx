import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { ConnectButton } from "@/components/ConnectButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  async function signInWithFacebook() {
    "use server";
    await signIn("facebook", { redirectTo: "/dashboard" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Cross-Poster</CardTitle>
          <CardDescription>
            Post to your Facebook Pages and Instagram Business accounts in one click.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pb-8">
          <ConnectButton action={signInWithFacebook} />
          <p className="px-4 text-center text-xs text-muted-foreground">
            We&apos;ll request permissions to read your Pages and publish content
            on your behalf. You can revoke access at any time from your Facebook
            settings.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
