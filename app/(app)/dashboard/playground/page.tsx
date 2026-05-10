import { Suspense } from "react";

import { requireUser } from "@/lib/session";
import { getBalance } from "@/lib/credits";
import { MODELS } from "@/lib/pricing";
import { formatCredits } from "@/lib/utils";
import { PlaygroundForm } from "@/components/dashboard/PlaygroundForm";
import { RecentRunsAside } from "@/components/dashboard/RecentRunsAside";

export const metadata = {
  title: "Playground · Cheaper Veo",
  description: "Generate Veo 3.1 videos from the dashboard.",
};

interface PlaygroundPageProps {
  searchParams: Promise<{ r?: string }>;
}

export default async function PlaygroundPage({ searchParams }: PlaygroundPageProps) {
  const sp = await searchParams;
  const refreshKey = sp.r ?? "0";

  const user = await requireUser();
  const balance = await getBalance(user.id);

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1
            className="text-3xl font-semibold tracking-tight"
            style={{ letterSpacing: "-0.024em" }}
          >
            Playground
          </h1>
          <p className="mt-1.5 text-[15px] text-secondary">
            Generate Veo 3.1 videos using your account balance.
          </p>
        </div>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 text-sm"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--color-border-strong)",
            borderRadius: "var(--radius-pill)",
            backdropFilter: "blur(12px)",
          }}
        >
          <span className="text-muted">Balance:</span>
          <span
            className="font-semibold"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {formatCredits(balance)} cr
          </span>
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <PlaygroundForm balance={balance} models={MODELS} />

        <Suspense
          key={refreshKey}
          fallback={
            <div className="card p-6 text-xs text-muted">Loading…</div>
          }
        >
          <RecentRunsAside
            userId={user.id}
            refreshHref={`/dashboard/playground?r=${Number(refreshKey) + 1}`}
          />
        </Suspense>
      </div>
    </div>
  );
}
