"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

const HERO_VIDEO_URL = "/hero/hero.mp4";
const HERO_POSTER_URL = "/hero/hero-poster.jpg";

export function Hero() {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    const saveData = connection?.saveData ?? false;
    const slowNetwork = /2g|slow-2g/.test(connection?.effectiveType ?? "");

    if (isMobile || reducedMotion || saveData || slowNetwork) return;

    const load = () => setShouldLoadVideo(true);
    const idle = (
      window as Window & {
        requestIdleCallback?: (
          cb: () => void,
          opts?: { timeout: number },
        ) => number;
      }
    ).requestIdleCallback;

    if (idle) {
      idle(load, { timeout: 2000 });
    } else {
      const t = window.setTimeout(load, 1500);
      return () => window.clearTimeout(t);
    }
  }, []);

  return (
    <section
      className="relative -mt-20 flex min-h-[100svh] items-center justify-center overflow-hidden"
      style={{
        isolation: "isolate",
        backgroundColor: "rgb(10, 10, 12)",
        backgroundImage: `url(${HERO_POSTER_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {shouldLoadVideo && (
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ zIndex: 0 }}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={HERO_POSTER_URL}
          aria-hidden
        >
          <source src={HERO_VIDEO_URL} type="video/mp4" />
        </video>
      )}

      {/* Layered overlays for legibility */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 1,
          background:
            "radial-gradient(ellipse 90% 70% at 50% 50%, rgba(10, 10, 12, 0.45), rgba(10, 10, 12, 0.78)), linear-gradient(180deg, rgba(10, 10, 12, 0.55) 0%, rgba(10, 10, 12, 0.78) 100%)",
        }}
        aria-hidden
      />
      <div
        className="grid-bg pointer-events-none absolute inset-0 opacity-25"
        style={{ zIndex: 2 }}
        aria-hidden
      />

      {/* Subtle accent glow */}
      <div
        className="landing-glow-pulse pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
        style={{
          zIndex: 3,
          background: "rgba(162, 221, 0, 0.1)",
        }}
        aria-hidden
      />

      {/* Content */}
      <div
        className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-32 text-center"
        style={{ zIndex: 10 }}
      >
        <h1
          className="fade-up text-balance"
          style={{
            fontSize: "clamp(2.75rem, 7vw, 5.5rem)",
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.034em",
            textShadow: "0 2px 32px rgba(0, 0, 0, 0.6)",
          }}
        >
          Veo 3.1 Quality.{" "}
          <span
            style={{
              color: "var(--color-accent)",
              textShadow: "0 0 40px rgba(162, 221, 0, 0.5)",
            }}
          >
            Save up to 90% vs Google.
          </span>
        </h1>

        <p
          className="body-large fade-up mt-7 max-w-xl text-secondary"
          style={{
            animationDelay: "0.1s",
            textShadow: "0 1px 12px rgba(0, 0, 0, 0.5)",
          }}
        >
          From $0.01/sec on Veo 3.1. The cheapest production-ready VEO 3 API on
          the internet — no subscription, no lock-in.
        </p>

        <div
          className="fade-up mt-10 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "0.2s" }}
        >
          <Link
            href="/login"
            className="btn-primary"
            style={{ padding: "0.875rem 1.75rem", fontSize: "15px" }}
          >
            Generate Video <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/docs" className="btn-ghost">
            <BookOpen className="h-4 w-4" /> View documentation
          </Link>
        </div>

        <div
          className="fade-up mt-7 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px]"
          style={{
            background: "rgba(162, 221, 0, 0.1)",
            border: "1px solid var(--color-border-accent)",
            backdropFilter: "blur(12px)",
            color: "var(--color-accent)",
            animationDelay: "0.3s",
          }}
        >
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          VEO 3.1 & 3.1 Lite Available
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase text-muted"
        style={{
          zIndex: 10,
          letterSpacing: "0.18em",
          fontFamily: "var(--font-mono)",
        }}
        aria-hidden
      >
        scroll
      </div>
    </section>
  );
}
