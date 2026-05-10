import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Cheaper Veo — Veo 3.1 API a partir de $0.011/sec";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(162, 221, 0, 0.18), transparent 70%), #0a0a0c",
          padding: "80px",
          position: "relative",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top bar with brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#a2dd00",
              boxShadow: "0 0 16px rgba(162, 221, 0, 0.7)",
            }}
          />
          <span
            style={{
              fontSize: "26px",
              fontWeight: 600,
              color: "#f3f0ed",
              letterSpacing: "-0.02em",
            }}
          >
            Cheaper Veo
          </span>
          <span
            style={{
              marginLeft: "12px",
              padding: "4px 12px",
              borderRadius: "999px",
              fontSize: "14px",
              fontWeight: 500,
              background: "rgba(162, 221, 0, 0.12)",
              color: "#a2dd00",
              border: "1px solid rgba(162, 221, 0, 0.4)",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Veo 3.1 API
          </span>
        </div>

        {/* Big headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            marginBottom: "auto",
            gap: "20px",
          }}
        >
          <div
            style={{
              fontSize: "92px",
              fontWeight: 600,
              color: "#f3f0ed",
              letterSpacing: "-0.034em",
              lineHeight: 1.05,
              maxWidth: "1000px",
            }}
          >
            Veo 3.1 Quality.
          </div>
          <div
            style={{
              fontSize: "92px",
              fontWeight: 600,
              color: "#a2dd00",
              letterSpacing: "-0.034em",
              lineHeight: 1.05,
              maxWidth: "1000px",
            }}
          >
            Save up to 90% vs Google.
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "rgba(243, 240, 237, 0.62)",
              letterSpacing: "-0.011em",
              marginTop: "24px",
              maxWidth: "900px",
            }}
          >
            Pay-as-you-go API · From $0.011/sec · No subscription, no lock-in
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "20px",
            color: "rgba(243, 240, 237, 0.45)",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          <span>cheaperveo.com</span>
          <span>$0.011/sec</span>
        </div>
      </div>
    ),
    size,
  );
}
