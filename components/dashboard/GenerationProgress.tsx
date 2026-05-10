"use client";

import { useEffect, useRef, useState } from "react";
import type { GenerationStatus } from "@prisma/client";
import {
  Loader2,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { pollGenerationAction } from "@/app/(app)/dashboard/playground/_actions";

interface GenerationProgressProps {
  taskId: string;
  initialStatus: GenerationStatus;
  onReset?: () => void;
}

const POLL_INTERVAL_MS = 5_000;
const MAX_POLL_MS = 12 * 60 * 1000;

interface ProgressState {
  status: GenerationStatus;
  videoUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  timedOut?: boolean;
}

function isFinalStatus(status: GenerationStatus): boolean {
  return status === "succeeded" || status === "failed" || status === "refunded";
}

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export function GenerationProgress({
  taskId,
  initialStatus,
  onReset,
}: GenerationProgressProps) {
  const [state, setState] = useState<ProgressState>({
    status: initialStatus,
    videoUrl: null,
    errorCode: null,
    errorMessage: null,
  });
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isFinalStatus(initialStatus)) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      if (cancelled) return;
      if (Date.now() - startedAtRef.current > MAX_POLL_MS) {
        setState((prev) => ({ ...prev, timedOut: true }));
        return;
      }

      let result;
      try {
        result = await pollGenerationAction(taskId);
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          status: "failed",
          errorCode: "POLL_NETWORK_ERROR",
          errorMessage:
            err instanceof Error ? err.message : "Failed to check status.",
        }));
        return;
      }
      if (cancelled) return;

      if (!result.ok) {
        setState((prev) => ({
          ...prev,
          status: "failed",
          errorCode: result.error,
          errorMessage: result.message,
        }));
        return;
      }

      setState({
        status: result.status,
        videoUrl: result.videoUrl,
        errorCode: result.error?.code ?? null,
        errorMessage: result.error?.message ?? null,
      });

      if (isFinalStatus(result.status)) return;

      timer = setTimeout(tick, POLL_INTERVAL_MS);
    };
    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [taskId, initialStatus]);

  useEffect(() => {
    if (isFinalStatus(state.status)) return;
    const id = setInterval(() => {
      setElapsed(Date.now() - startedAtRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [state.status]);

  if (state.status === "succeeded" && state.videoUrl) {
    return (
      <div className="card fade-up flex flex-col gap-5 p-7">
        <div
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--color-accent)" }}
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Video ready
        </div>
        <video
          controls
          src={state.videoUrl}
          className="w-full bg-black"
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
          }}
        />
        {state.errorCode === "STORAGE_FALLBACK" && state.errorMessage ? (
          <p
            className="p-3 text-xs text-secondary"
            style={{
              border: "1px solid var(--color-border)",
              background: "rgba(251, 191, 36, 0.06)",
              borderRadius: "var(--radius-md)",
            }}
          >
            Warning: Supabase Storage failed ({state.errorMessage}). Serving
            directly from the upstream source — may expire soon.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <a
            href={state.videoUrl}
            download={`geraew-${taskId}.mp4`}
            className="btn-primary"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download
          </a>
          {onReset && (
            <button type="button" onClick={onReset} className="btn-ghost">
              <RefreshCw className="h-4 w-4" aria-hidden />
              Generate another
            </button>
          )}
        </div>
        <p
          className="text-xs text-muted"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Task ID: {taskId}
        </p>
      </div>
    );
  }

  if (state.status === "succeeded" && !state.videoUrl) {
    return (
      <div className="card flex flex-col gap-4 p-7">
        <div
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--color-warn)" }}
        >
          <AlertTriangle className="h-4 w-4" aria-hidden />
          Video generated but no URL available
        </div>
        <p className="text-xs text-muted">
          The upstream marked it as complete, but we could not get a
          playable link. Check the server logs (search for &quot;{taskId}&quot;).
        </p>
        <p
          className="text-xs text-muted"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Task ID: {taskId}
        </p>
        {onReset && (
          <div>
            <button type="button" onClick={onReset} className="btn-ghost">
              <RefreshCw className="h-4 w-4" aria-hidden />
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  if (state.status === "failed" || state.status === "refunded") {
    return (
      <div className="card flex flex-col gap-4 p-7">
        <div
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--color-danger)" }}
        >
          <AlertTriangle className="h-4 w-4" aria-hidden />
          {state.status === "refunded"
            ? "Generation refunded"
            : "Generation failed"}
        </div>
        {state.errorCode && (
          <p
            className="text-[11px] uppercase text-muted"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}
          >
            {state.errorCode}
          </p>
        )}
        {state.errorMessage && (
          <p
            className="p-3 text-sm text-secondary"
            style={{
              border: "1px solid var(--color-border)",
              background: "rgba(248, 113, 113, 0.06)",
              borderRadius: "var(--radius-md)",
            }}
          >
            {state.errorMessage}
          </p>
        )}
        <p className="text-xs text-muted">
          {state.status === "refunded"
            ? "Credits refunded — you can try again at no cost."
            : "Check the parameters and try again."}
        </p>
        {onReset && (
          <div>
            <button type="button" onClick={onReset} className="btn-ghost">
              <RefreshCw className="h-4 w-4" aria-hidden />
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  if (state.timedOut) {
    return (
      <div className="card flex flex-col gap-4 p-7">
        <div
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--color-warn)" }}
        >
          <AlertTriangle className="h-4 w-4" aria-hidden />
          Generation took longer than expected
        </div>
        <p className="text-xs text-muted">
          We stopped monitoring after 12 minutes. The video may still finish —
          check &quot;History&quot;. Task ID:{" "}
          <span style={{ fontFamily: "var(--font-mono)" }}>{taskId}</span>
        </p>
        {onReset && (
          <div>
            <button type="button" onClick={onReset} className="btn-ghost">
              <RefreshCw className="h-4 w-4" aria-hidden />
              Back
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-5 p-7">
      <div className="flex items-center gap-3.5">
        <div
          className="flex h-11 w-11 items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(162, 221, 0, 0.18), rgba(162, 221, 0, 0.04))",
            border: "1px solid var(--color-border-accent)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <Loader2
            className={cn("h-5 w-5 animate-spin")}
            style={{ color: "var(--color-accent)" }}
            aria-hidden
          />
        </div>
        <div>
          <p className="text-[15px] font-semibold tracking-tight">
            {state.status === "pending"
              ? "Sending to the queue…"
              : "Processing video on Veo 3.1…"}
          </p>
          <p className="mt-0.5 text-[13px] text-muted">
            Can take 1 to 5 minutes. You can close this screen — the video
            will be in History.
          </p>
        </div>
      </div>
      <div
        className="flex items-center justify-between pt-4"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <span
          className="text-xs text-muted"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          Elapsed
        </span>
        <span
          className="text-sm tabular-nums"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {formatElapsed(elapsed)}
        </span>
      </div>
      <p
        className="text-[11px] text-muted"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Task ID: {taskId}
      </p>
    </div>
  );
}
