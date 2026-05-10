"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, ExternalLink } from "lucide-react";

const PROMPT_TEMPLATE = `Integrate Cheaper Veo into this project. The full API spec, types, error handling, and drop-in clients (Node.js + Python) are at:

https://cheaperveo.com/llms.txt

Fetch that file, follow the integration agent instructions, and wire up at least one working example using my existing stack. Add CHEAPER_VEO_API_KEY to .env. After you're done, tell me where to get an API key.`;

export function LlmsBanner() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(PROMPT_TEMPLATE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable in insecure contexts; fail silently.
    }
  }

  return (
    <div
      className="card relative my-10 overflow-hidden p-6 md:p-7"
      style={{
        background:
          "radial-gradient(ellipse 70% 100% at 0% 0%, rgba(162, 221, 0, 0.10), transparent 60%), var(--color-card)",
        borderColor: "var(--color-border-accent)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div
            className="mb-2 inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium uppercase"
            style={{
              background: "rgba(162, 221, 0, 0.12)",
              border: "1px solid var(--color-border-accent)",
              color: "var(--color-accent)",
              letterSpacing: "0.06em",
            }}
          >
            <Sparkles className="h-3 w-3" aria-hidden />
            LLM integration
          </div>
          <h3 className="text-[17px] font-semibold tracking-tight">
            Paste into Claude / ChatGPT / Cursor and integrate in seconds
          </h3>
          <p className="mt-1.5 text-[13.5px] text-secondary">
            Copy the prompt below, paste it into your code LLM and it will
            scaffold the client, write the integration and wire it into your
            stack — Node or Python — automatically.
          </p>
        </div>
      </div>

      <div
        className="mt-5 overflow-hidden"
        style={{
          background: "rgba(0, 0, 0, 0.4)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-2 text-[11px] uppercase text-muted"
          style={{
            borderBottom: "1px solid var(--color-border)",
            background: "rgba(255, 255, 255, 0.02)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.08em",
          }}
        >
          <span>prompt for LLM</span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all hover:bg-white/[0.06]"
            style={{
              color: copied
                ? "var(--color-accent)"
                : "var(--color-text-secondary)",
              fontFamily: "var(--font-sans)",
              letterSpacing: "0",
              textTransform: "none",
            }}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </button>
        </div>
        <pre
          className="overflow-x-auto whitespace-pre-wrap px-4 py-3.5 text-[12.5px] leading-relaxed text-secondary"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {PROMPT_TEMPLATE}
        </pre>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[12px] text-muted">
        <a
          href="/llms.txt"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-all hover:bg-white/[0.06] hover:text-[var(--color-text)]"
          style={{ border: "1px solid var(--color-border-strong)" }}
        >
          <ExternalLink className="h-3 w-3" />
          View full llms.txt
        </a>
        <span>
          Convention{" "}
          <a
            href="https://llmstxt.org"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-4 hover:underline"
            style={{ color: "var(--color-text-secondary)" }}
          >
            llmstxt.org
          </a>{" "}
          — works with any modern LLM.
        </span>
      </div>
    </div>
  );
}
