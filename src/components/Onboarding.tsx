import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Facebook,
  Instagram,
  Send,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export function Onboarding() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6 sm:py-10">
      <div className="text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          Welcome to Crosspost
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Let&apos;s get you posting in <span className="brand-text">three steps</span>.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Connect Facebook, sync your destinations, and ship your first cross-post.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StepCard
          step={1}
          title="Connect Facebook"
          done={false}
          description="Grant Crosspost permission to read your Pages and publish content. You can revoke at any time."
          icon={<Facebook className="h-5 w-5" />}
          accent="bg-[#1877F2]/10 text-[#1877F2]"
        />
        <StepCard
          step={2}
          title="We sync your destinations"
          done={false}
          description="Every Facebook Page you admin appears here, plus any linked Instagram Business accounts."
          icon={<Instagram className="h-5 w-5" />}
          accent="bg-[#E1306C]/10 text-[#E1306C]"
        />
        <StepCard
          step={3}
          title="Compose and post"
          done={false}
          description="Upload media, write a caption, pick destinations. We&apos;ll publish in parallel and show you per-platform status."
          icon={<Send className="h-5 w-5" />}
          accent="bg-primary/10 text-primary"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="brand-gradient h-1 w-full" />
        <CardContent className="flex flex-col items-center gap-3 px-6 py-8 text-center sm:px-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-soft">
            <Facebook className="h-7 w-7" />
          </div>
          <div>
            <p className="text-base font-semibold">Connect your Facebook account</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Make sure your Instagram is a Business or Creator account linked
              to a Page you admin.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="bg-[#1877F2] hover:bg-[#1664d9]"
          >
            <Link href="/api/connect/facebook">
              <Facebook className="mr-2 h-4 w-4" />
              Connect Facebook
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            We never post without your explicit click.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  icon,
  accent,
  done,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  done: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent}`}>
            {icon}
          </div>
          {done ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold text-muted-foreground">
              {step}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
