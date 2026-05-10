const stats = [
  { value: "US$0.14", label: "per video" },
  { value: "No", label: "monthly fee" },
  { value: "8s · 1080p", label: "with audio" },
  { value: "Production", label: "ready" },
];

export function Stats() {
  return (
    <section className="py-2">
      <div className="mx-auto max-w-6xl px-6">
        <div
          className="card grid grid-cols-2 overflow-hidden md:grid-cols-4"
          style={{ borderRadius: "var(--radius-2xl)" }}
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-start gap-1 px-6 py-7 md:items-center md:py-8"
              style={{
                borderRight:
                  i % 4 !== 3
                    ? "1px solid var(--color-border)"
                    : "none",
                borderBottom:
                  i < 2 ? "1px solid var(--color-border)" : "none",
              }}
            >
              <span
                className="text-2xl font-semibold tracking-tight md:text-[1.75rem]"
                style={{ letterSpacing: "-0.022em" }}
              >
                {stat.value}
              </span>
              <span
                className="text-[11px] uppercase text-muted md:text-xs"
                style={{ letterSpacing: "0.08em" }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
