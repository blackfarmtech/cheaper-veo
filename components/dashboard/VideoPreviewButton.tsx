"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

interface VideoPreviewButtonProps {
  url: string;
  prompt: string;
}

export function VideoPreviewButton({ url, prompt }: VideoPreviewButtonProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-secondary transition-all hover:text-[var(--color-text)]"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid var(--color-border-strong)",
        }}
      >
        <Play className="h-3.5 w-3.5" />
        View video
      </button>

      {open ? (
        <div
          className="fade-in fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0, 0, 0, 0.78)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Video preview"
        >
          <div
            className="card-solid relative w-full max-w-3xl overflow-hidden"
            style={{
              borderRadius: "var(--radius-2xl)",
              boxShadow: "var(--shadow-lg)",
              animation: "fade-up 0.4s var(--ease-spring) both",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="flex items-start justify-between gap-3 px-6 py-4"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <p className="line-clamp-2 text-sm text-secondary">{prompt}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-secondary transition-colors hover:bg-white/[0.06] hover:text-[var(--color-text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <video
              src={url}
              controls
              autoPlay
              playsInline
              className="block h-auto w-full bg-black"
            />
            <div
              className="px-6 py-4 text-right"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-secondary underline-offset-4 transition-colors hover:text-[var(--color-text)] hover:underline"
              >
                Open in new tab
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
