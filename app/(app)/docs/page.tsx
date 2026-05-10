import { CodeBlock } from "@/components/docs/CodeBlock";
import { LlmsBanner } from "@/components/docs/LlmsBanner";
import { SectionAnchor } from "@/components/docs/SectionAnchor";
import {
  MODELS,
  calculateCredits,
  creditsToUsd,
  type Resolution,
} from "@/lib/pricing";

const PLACEHOLDER_KEY = "veo_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const BASE_URL = "https://cheaperveo.com";

const CURL_TEXT_TO_VIDEO = `curl -X POST ${BASE_URL}/api/v1/generate \\
  -H "Authorization: Bearer ${PLACEHOLDER_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "kind": "text_to_video",
    "modelId": "veo3-fast",
    "prompt": "drone shot over neon-lit Tokyo at night, cinematic",
    "resolution": "1080p",
    "aspectRatio": "16:9",
    "durationSeconds": 8,
    "audio": true
  }'`;

const NODE_TEXT_TO_VIDEO = `const res = await fetch("${BASE_URL}/api/v1/generate", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.CHEAPER_VEO_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    kind: "text_to_video",
    modelId: "veo3-fast",
    prompt: "drone shot over neon-lit Tokyo at night, cinematic",
    resolution: "1080p",
    aspectRatio: "16:9",
    durationSeconds: 8,
    audio: true,
  }),
});

const data = await res.json();
console.log(data.taskId, data.creditsCost);`;

const PYTHON_TEXT_TO_VIDEO = `import os
import requests

res = requests.post(
    "${BASE_URL}/api/v1/generate",
    headers={
        "Authorization": f"Bearer {os.environ['CHEAPER_VEO_API_KEY']}",
        "Content-Type": "application/json",
    },
    json={
        "kind": "text_to_video",
        "modelId": "veo3-fast",
        "prompt": "drone shot over neon-lit Tokyo at night, cinematic",
        "resolution": "1080p",
        "aspectRatio": "16:9",
        "durationSeconds": 8,
        "audio": True,
    },
    timeout=30,
)

data = res.json()
print(data["taskId"], data["creditsCost"])`;

const CURL_IMAGE_TO_VIDEO = `curl -X POST ${BASE_URL}/api/v1/generate \\
  -H "Authorization: Bearer ${PLACEHOLDER_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "kind": "image_to_video",
    "modelId": "veo3-quality",
    "prompt": "the character starts walking towards the camera",
    "resolution": "1080p",
    "aspectRatio": "16:9",
    "durationSeconds": 8,
    "audio": true,
    "firstFrame": {
      "bytesBase64Encoded": "iVBORw0KGgoAAAANS...",
      "mimeType": "image/png"
    }
  }'`;

const NODE_IMAGE_TO_VIDEO = `import { readFile } from "node:fs/promises";

const firstFrame = await readFile("./first.png");
const lastFrame = await readFile("./last.png");

const res = await fetch("${BASE_URL}/api/v1/generate", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.CHEAPER_VEO_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    kind: "image_to_video",
    modelId: "veo3-quality",
    prompt: "the character starts walking towards the camera",
    resolution: "1080p",
    aspectRatio: "16:9",
    durationSeconds: 8,
    audio: true,
    firstFrame: {
      bytesBase64Encoded: firstFrame.toString("base64"),
      mimeType: "image/png",
    },
    // lastFrame is only accepted on veo3-quality
    lastFrame: {
      bytesBase64Encoded: lastFrame.toString("base64"),
      mimeType: "image/png",
    },
  }),
});`;

const CURL_REFERENCES = `curl -X POST ${BASE_URL}/api/v1/generate \\
  -H "Authorization: Bearer ${PLACEHOLDER_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "kind": "references",
    "modelId": "veo3-fast",
    "prompt": "the product floats slowly while rotating, studio lighting",
    "resolution": "1080p",
    "aspectRatio": "9:16",
    "durationSeconds": 8,
    "audio": false,
    "referenceImages": [
      { "bytesBase64Encoded": "iVBORw0KGgo...", "mimeType": "image/png", "referenceType": "asset" },
      { "bytesBase64Encoded": "iVBORw0KGgo...", "mimeType": "image/png", "referenceType": "asset" }
    ]
  }'`;

const NODE_POLLING = `async function waitForVideo(taskId: string): Promise<string> {
  const apiKey = process.env.CHEAPER_VEO_API_KEY!;

  for (;;) {
    const res = await fetch(\`${BASE_URL}/api/v1/status/\${taskId}\`, {
      headers: { Authorization: \`Bearer \${apiKey}\` },
    });

    // Respect rate limits: if 429, sleep for Retry-After then retry.
    if (res.status === 429) {
      const retry = Number(res.headers.get("Retry-After") ?? "5");
      await new Promise((r) => setTimeout(r, retry * 1000));
      continue;
    }

    const job = await res.json();

    if (job.status === "succeeded") return job.videoUrl as string;
    if (job.status === "failed" || job.status === "refunded") {
      throw new Error(job.error?.message ?? "generation failed");
    }

    // pending | processing — wait 5s before next call
    await new Promise((r) => setTimeout(r, 5000));
  }
}`;

const PYTHON_POLLING = `import os
import time
import requests

def wait_for_video(task_id: str) -> str:
    api_key = os.environ["CHEAPER_VEO_API_KEY"]
    headers = {"Authorization": f"Bearer {api_key}"}

    while True:
        res = requests.get(
            f"${BASE_URL}/api/v1/status/{task_id}",
            headers=headers,
            timeout=15,
        )

        # Respect rate limits
        if res.status_code == 429:
            retry = int(res.headers.get("Retry-After", "5"))
            time.sleep(retry)
            continue

        job = res.json()

        if job["status"] == "succeeded":
            return job["videoUrl"]
        if job["status"] in ("failed", "refunded"):
            raise RuntimeError(job.get("error", {}).get("message", "generation failed"))

        time.sleep(5)`;

const RESOLUTIONS: Resolution[] = ["720p", "1080p", "4k"];

function priceCell(
  modelId: string,
  resolution: Resolution,
  audio: boolean,
): string {
  try {
    const credits = calculateCredits({
      modelId,
      resolution,
      audio,
      durationSeconds: 8,
    });
    const usd = creditsToUsd(credits);
    return `${credits} cr · ${usd.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    })}`;
  } catch {
    return "—";
  }
}

export default function DocsPage() {
  return (
    <article className="text-[var(--color-text)]">
      <div className="mb-12">
        <p
          className="mb-4 text-[11px] uppercase text-muted"
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.12em",
          }}
        >
          API v1
        </p>
        <h1
          className="text-[2.5rem] font-semibold tracking-tight md:text-[3rem]"
          style={{ letterSpacing: "-0.028em", lineHeight: 1.1 }}
        >
          Cheaper Veo API Documentation
        </h1>
        <p className="body-large mt-5 text-secondary">
          Generate videos with Veo 3.1 over HTTP. Pay as you go, no monthly fees,
          prepaid credits. This reference covers authentication, generation,
          status polling, available models and error handling.
        </p>
      </div>

      <LlmsBanner />

      <SectionAnchor id="introduction">Introduction</SectionAnchor>
      <p className="text-secondary">
        The Cheaper Veo API is a thin HTTP layer over Google Veo 3.1. You send a
        prompt (and optionally reference images), receive an immediate{" "}
        <code className="docs-inline-code">
          taskId
        </code>{" "}
        and poll until the video is ready. In three steps:
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-secondary">
        <li>
          <strong className="text-[var(--color-text)]">Authenticate:</strong>{" "}
          send your key in the header{" "}
          <code className="docs-inline-code">
            Authorization: Bearer veo_live_…
          </code>
          .
        </li>
        <li>
          <strong className="text-[var(--color-text)]">Generate:</strong>{" "}
          <code className="docs-inline-code">
            POST /api/v1/generate
          </code>{" "}
          with the body of your chosen kind (text-to-video, image-to-video or
          references). The response contains the{" "}
          <code className="docs-inline-code">
            taskId
          </code>{" "}
          and the credit cost already debited.
        </li>
        <li>
          <strong className="text-[var(--color-text)]">Wait:</strong>{" "}
          <code className="docs-inline-code">
            GET /api/v1/status/&#123;taskId&#125;
          </code>{" "}
          every 5–10 seconds until status becomes{" "}
          <code className="docs-inline-code">
            succeeded
          </code>
          . The{" "}
          <code className="docs-inline-code">
            videoUrl
          </code>{" "}
          field points to the final MP4.
        </li>
      </ol>

      <div className="card mt-7 p-5">
        <p
          className="text-[11px] uppercase text-muted"
          style={{
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.08em",
          }}
        >
          Base URL
        </p>
        <p className="mt-2 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
          {BASE_URL}
        </p>
        <p className="mt-2 text-[12.5px] text-muted">
          All routes live under{" "}
          <code className="docs-inline-code">/api/v1</code>. Use HTTPS — HTTP
          calls are rejected.
        </p>
      </div>

      <SectionAnchor id="quickstart">Quickstart</SectionAnchor>
      <p className="text-secondary">
        From zero to first video in 3 steps. Total: ~2 minutes.
      </p>

      <ol className="mt-5 space-y-6 pl-0 text-secondary">
        <li className="card flex gap-4 p-5">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{
              background: "rgba(162, 221, 0, 0.12)",
              border: "1px solid var(--color-border-accent)",
              color: "var(--color-accent)",
              fontFamily: "var(--font-mono)",
            }}
          >
            1
          </span>
          <div className="flex-1">
            <h4 className="text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
              Create an API key
            </h4>
            <p className="mt-1 text-[14px]">
              Go to{" "}
              <a
                href="/dashboard/keys"
                className="text-[var(--color-accent)] underline-offset-4 hover:underline"
              >
                Dashboard → API Keys
              </a>{" "}
              and click <strong className="text-[var(--color-text)]">Generate new key</strong>.
              The key (format{" "}
              <code className="docs-inline-code">veo_live_…</code>) is shown{" "}
              <strong className="text-[var(--color-text)]">only once</strong> —
              copy it to a secrets vault.
            </p>
          </div>
        </li>

        <li className="card flex gap-4 p-5">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{
              background: "rgba(162, 221, 0, 0.12)",
              border: "1px solid var(--color-border-accent)",
              color: "var(--color-accent)",
              fontFamily: "var(--font-mono)",
            }}
          >
            2
          </span>
          <div className="flex-1">
            <h4 className="text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
              Test the balance
            </h4>
            <p className="mt-1 text-[14px]">
              Confirm the key works before generating anything (does not
              consume credits):
            </p>
            <CodeBlock language="bash">
              {`curl ${BASE_URL}/api/v1/account \\
  -H "Authorization: Bearer ${PLACEHOLDER_KEY}"`}
            </CodeBlock>
            <p className="text-[13px] text-muted">
              The response should show your email and{" "}
              <code className="docs-inline-code">balance</code> in credits. If
              you get{" "}
              <code className="docs-inline-code">401</code>, the key is
              wrong or has been revoked.
            </p>
          </div>
        </li>

        <li className="card flex gap-4 p-5">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
            style={{
              background: "rgba(162, 221, 0, 0.12)",
              border: "1px solid var(--color-border-accent)",
              color: "var(--color-accent)",
              fontFamily: "var(--font-mono)",
            }}
          >
            3
          </span>
          <div className="flex-1">
            <h4 className="text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
              Generate and wait
            </h4>
            <p className="mt-1 text-[14px]">
              Cheap video to test (Lite 720p no audio, 4s = 5 credits =
              US$0.05):
            </p>
            <CodeBlock language="bash">
              {`# Start generation — returns taskId immediately
curl -X POST ${BASE_URL}/api/v1/generate \\
  -H "Authorization: Bearer ${PLACEHOLDER_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "kind": "text_to_video",
    "modelId": "veo3-lite",
    "prompt": "a calm wave breaking on a beach at sunset",
    "resolution": "720p",
    "aspectRatio": "16:9",
    "durationSeconds": 4,
    "audio": false
  }'

# Response: { "taskId": "tsk_01HYAB…", "status": "pending", … }

# Take the taskId above and poll every 5s
curl ${BASE_URL}/api/v1/status/tsk_01HYAB… \\
  -H "Authorization: Bearer ${PLACEHOLDER_KEY}"`}
            </CodeBlock>
            <p className="text-[13px] text-muted">
              When{" "}
              <code className="docs-inline-code">status</code> becomes{" "}
              <code className="docs-inline-code">succeeded</code>, the{" "}
              <code className="docs-inline-code">videoUrl</code> field returns the final
              MP4.
            </p>
          </div>
        </li>
      </ol>

      <SectionAnchor id="authentication">Authentication</SectionAnchor>
      <p className="text-secondary">
        Every request needs the header{" "}
        <code className="docs-inline-code">
          Authorization: Bearer veo_live_…
        </code>
        . Keys start with{" "}
        <code className="docs-inline-code">
          veo_live_
        </code>{" "}
        and are generated in{" "}
        <a
          href="/dashboard/keys"
          className="text-[var(--color-accent)] underline-offset-4 hover:underline"
        >
          Dashboard → API keys
        </a>
        . The key is shown only once at creation — store it in a
        secrets vault.
      </p>

      <CodeBlock language="http">
        {`Authorization: Bearer ${PLACEHOLDER_KEY}\nContent-Type: application/json`}
      </CodeBlock>

      <p className="mt-5 text-secondary">
        Recommended convention: store the key in an environment variable{" "}
        <code className="docs-inline-code">CHEAPER_VEO_API_KEY</code> in your{" "}
        <code className="docs-inline-code">.env</code> (or{" "}
        <code className="docs-inline-code">.env.local</code> in Next.js). The
        examples below assume that name.
      </p>

      <CodeBlock language="bash">
        {`# .env
CHEAPER_VEO_API_KEY=${PLACEHOLDER_KEY}`}
      </CodeBlock>

      <p className="mt-3 text-secondary">
        If the key is invalid, revoked or missing, the API responds with{" "}
        <code className="docs-inline-code">
          401 UNAUTHORIZED
        </code>
        . Never expose the key in client-side code: call from
        your backend.
      </p>

      <SectionAnchor id="video-generation">Video generation</SectionAnchor>
      <p className="text-secondary">
        <code className="docs-inline-code">
          POST /api/v1/generate
        </code>{" "}
        accepts a body discriminated by the{" "}
        <code className="docs-inline-code">
          kind
        </code>{" "}
        field. The most common case is{" "}
        <code className="docs-inline-code">
          text_to_video
        </code>
        . The call returns immediately with{" "}
        <code className="docs-inline-code">
          taskId
        </code>
        ,{" "}
        <code className="docs-inline-code">
          status
        </code>{" "}
        and the credit cost.
      </p>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">
        Body
      </h3>
      <CodeBlock language="json">
        {`{
  "kind": "text_to_video",
  "modelId": "veo3-lite | veo3-fast | veo3-quality",
  "prompt": "string (1-8000 chars)",
  "resolution": "720p | 1080p | 4k",
  "aspectRatio": "16:9 | 9:16",
  "durationSeconds": 4 | 6 | 8,
  "audio": true,
  "negativePrompt": "string (optional, max 2000 chars)"
}`}
      </CodeBlock>

      <p className="mt-3 text-[13px] text-muted">
        <strong className="text-[var(--color-text-secondary)]">Note:</strong>{" "}
        the field is <code className="docs-inline-code">modelId</code> (not{" "}
        <code className="docs-inline-code">model</code>) in the request.
        Constraints:{" "}
        <code className="docs-inline-code">veo3-lite</code> only supports
        720p/1080p (no 4K).{" "}
        <code className="docs-inline-code">1080p</code> and{" "}
        <code className="docs-inline-code">4k</code> require{" "}
        <code className="docs-inline-code">durationSeconds: 8</code>.
      </p>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">
        Response
      </h3>
      <p className="text-[13px] text-secondary">
        <code className="docs-inline-code">HTTP 202 Accepted</code> — credits
        already debited, generation queued. Note the response uses{" "}
        <code className="docs-inline-code">model</code> (without &quot;Id&quot;):
      </p>
      <CodeBlock language="json">
        {`{
  "taskId": "tsk_01HYABCDEF…",
  "status": "pending",
  "creditsCost": 30,
  "model": "veo3-fast",
  "durationSeconds": 8
}`}
      </CodeBlock>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">cURL</h3>
      <CodeBlock language="bash">{CURL_TEXT_TO_VIDEO}</CodeBlock>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">Node.js</h3>
      <CodeBlock language="typescript">{NODE_TEXT_TO_VIDEO}</CodeBlock>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">Python</h3>
      <CodeBlock language="python">{PYTHON_TEXT_TO_VIDEO}</CodeBlock>

      <SectionAnchor id="image-to-video">Image-to-video</SectionAnchor>
      <p className="text-secondary">
        Use{" "}
        <code className="docs-inline-code">
          kind: &quot;image_to_video&quot;
        </code>{" "}
        to animate from a starting frame. Send the image in base64 via{" "}
        <code className="docs-inline-code">
          firstFrame
        </code>
        . The optional{" "}
        <code className="docs-inline-code">
          lastFrame
        </code>{" "}
        field (supported only on{" "}
        <code className="docs-inline-code">
          veo3-quality
        </code>
        ) defines the final frame, interpolating between the two.
      </p>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">
        Image object format
      </h3>
      <p className="text-secondary">
        Every image (in <code className="docs-inline-code">firstFrame</code>,{" "}
        <code className="docs-inline-code">lastFrame</code> or{" "}
        <code className="docs-inline-code">referenceImages[]</code>) follows the
        same schema:
      </p>
      <CodeBlock language="json">
        {`{
  "bytesBase64Encoded": "base64_encoded_image_data_here",
  "mimeType": "image/jpeg"
}`}
      </CodeBlock>
      <ul className="mt-3 list-disc space-y-1.5 pl-6 text-[13.5px] text-secondary">
        <li>
          <code className="docs-inline-code">bytesBase64Encoded</code>{" "}
          (required): base64 string without the{" "}
          <code className="docs-inline-code">data:</code> prefix. Limit ~10MB
          decoded.
        </li>
        <li>
          <code className="docs-inline-code">mimeType</code> (optional, default{" "}
          <code className="docs-inline-code">image/jpeg</code>):{" "}
          <code className="docs-inline-code">image/png</code>,{" "}
          <code className="docs-inline-code">image/jpeg</code> ou{" "}
          <code className="docs-inline-code">image/webp</code>.
        </li>
      </ul>

      <CodeBlock language="bash">{CURL_IMAGE_TO_VIDEO}</CodeBlock>
      <CodeBlock language="typescript">{NODE_IMAGE_TO_VIDEO}</CodeBlock>

      <SectionAnchor id="video-with-references">
        Video with references
      </SectionAnchor>
      <p className="text-secondary">
        Use{" "}
        <code className="docs-inline-code">
          kind: &quot;references&quot;
        </code>{" "}
        to guide the style, character or product via 1 to 3 reference images.
        Each item in the{" "}
        <code className="docs-inline-code">
          referenceImages
        </code>{" "}
        array accepts{" "}
        <code className="docs-inline-code">
          base64
        </code>
        ,{" "}
        <code className="docs-inline-code">
          mimeType
        </code>{" "}
        and{" "}
        <code className="docs-inline-code">
          referenceType
        </code>{" "}
        (currently only{" "}
        <code className="docs-inline-code">
          asset
        </code>
        ).
      </p>

      <CodeBlock language="bash">{CURL_REFERENCES}</CodeBlock>

      <SectionAnchor id="status-polling">Status polling</SectionAnchor>
      <p className="text-secondary">
        <code className="docs-inline-code">
          GET /api/v1/status/&#123;taskId&#125;
        </code>{" "}
        returns the current state of the task. Possible values of{" "}
        <code className="docs-inline-code">
          status
        </code>{" "}
        are:
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-6 text-secondary">
        <li>
          <code className="docs-inline-code">
            pending
          </code>{" "}
          — initial queue, not yet sent to the provider.
        </li>
        <li>
          <code className="docs-inline-code">
            processing
          </code>{" "}
          — Veo is generating.
        </li>
        <li>
          <code className="docs-inline-code">
            succeeded
          </code>{" "}
          — ready. Use{" "}
          <code className="docs-inline-code">
            videoUrl
          </code>{" "}
          to download.
        </li>
        <li>
          <code className="docs-inline-code">
            failed
          </code>{" "}
          — definitive failure with no refund (invalid input, content policy,
          etc).
        </li>
        <li>
          <code className="docs-inline-code">
            refunded
          </code>{" "}
          — upstream failure; credits have already been returned to your account.
        </li>
      </ul>

      <p className="mt-4 text-secondary">
        <strong className="text-[var(--color-text)]">Recommended:</strong>{" "}
        5 to 10 second interval between calls. Don&apos;t poll more frequently:
        it only burns rate limit without speeding up generation.
        Typical times:{" "}
        <code className="docs-inline-code">
          lite/fast
        </code>{" "}
        in 1–3 minutes,{" "}
        <code className="docs-inline-code">
          quality
        </code>{" "}
        in 2–5 minutes.
      </p>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">Response</h3>
      <CodeBlock language="json">
        {`{
  "taskId": "tsk_01HYABCDEF…",
  "status": "succeeded",
  "model": "veo3-fast",
  "creditsCost": 30,
  "videoUrl": "https://cheaperveo.com/videos/tsk_01HYABCDEF.mp4",
  "createdAt": "2026-05-08T12:34:56.000Z",
  "completedAt": "2026-05-08T12:36:11.000Z"
}`}
      </CodeBlock>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">Node.js</h3>
      <CodeBlock language="typescript">{NODE_POLLING}</CodeBlock>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">Python</h3>
      <CodeBlock language="python">{PYTHON_POLLING}</CodeBlock>

      <SectionAnchor id="account">Account &amp; balance</SectionAnchor>
      <p className="text-secondary">
        <code className="docs-inline-code">GET /api/v1/account</code> returns
        the current credit balance and the last 10 generations for the account
        owning the API key. Useful for checking balance before calling{" "}
        <code className="docs-inline-code">/generate</code> and avoiding{" "}
        <code className="docs-inline-code">402 INSUFFICIENT_CREDITS</code>.
      </p>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">
        Response
      </h3>
      <CodeBlock language="json">
        {`{
  "email": "you@company.com",
  "balance": 713,
  "recentGenerations": [
    {
      "taskId": "tsk_01HYABCDEF…",
      "kind": "text_to_video",
      "model": "veo3-fast",
      "status": "succeeded",
      "creditsCost": 30,
      "durationSeconds": 8,
      "resolution": "1080p",
      "videoUrl": "https://cheaperveo.com/videos/tsk_01HYABCDEF.mp4",
      "createdAt": "2026-05-08T12:34:56.000Z",
      "completedAt": "2026-05-08T12:36:11.000Z"
    }
  ]
}`}
      </CodeBlock>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">
        cURL
      </h3>
      <CodeBlock language="bash">
        {`curl -X GET ${BASE_URL}/api/v1/account \\
  -H "Authorization: Bearer ${PLACEHOLDER_KEY}"`}
      </CodeBlock>

      <p className="mt-3 text-[13px] text-muted">
        <code className="docs-inline-code">balance</code> is in credits —
        divide by 100 to get the USD equivalent (1 credit = US$0.01).
      </p>

      <SectionAnchor id="models-and-pricing">Models and pricing</SectionAnchor>
      <p className="text-secondary">
        Cost table for 8-second videos with audio. For 6s apply 75%
        and for 4s, 50% (always rounded up). 1 credit = US$0.01.
      </p>

      <div
        className="card mt-5 overflow-hidden"
        style={{ padding: 0 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className="text-[11px] uppercase text-muted"
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  borderBottom: "1px solid var(--color-border)",
                  letterSpacing: "0.08em",
                }}
              >
                <th className="px-5 py-3.5 font-medium">Model</th>
                <th className="px-5 py-3.5 font-medium">Speed</th>
                {RESOLUTIONS.map((r) => (
                  <th key={r} className="px-5 py-3.5 font-medium">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODELS.map((model, i) => (
                <tr
                  key={model.id}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={
                    i !== MODELS.length - 1
                      ? { borderBottom: "1px solid var(--color-border)" }
                      : undefined
                  }
                >
                  <td className="px-5 py-4 align-top">
                    <div className="font-semibold text-[var(--color-text)]">
                      {model.label}
                    </div>
                    <div
                      className="mt-0.5 text-xs text-muted"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {model.id}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top text-secondary">
                    {model.speedHint}
                  </td>
                  {RESOLUTIONS.map((r) => (
                    <td
                      key={r}
                      className="px-5 py-4 align-top text-secondary"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {priceCell(model.id, r, true)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        Values above include audio. Without audio the cost is lower; check the
        pricing page for the full breakdown. The exact cost is
        always reported in the{" "}
        <code className="docs-inline-code">
          creditsCost
        </code>{" "}
        field of the{" "}
        <code className="docs-inline-code">
          /generate
        </code>{" "}
        response.
      </p>

      <SectionAnchor id="errors">Errors</SectionAnchor>
      <p className="text-secondary">
        Errors use standard HTTP status codes and a JSON body with{" "}
        <code className="docs-inline-code">
          error.code
        </code>{" "}
        and{" "}
        <code className="docs-inline-code">
          error.message
        </code>
        :
      </p>

      <CodeBlock language="json">
        {`{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Insufficient balance: 12 credits available, 30 required."
  }
}`}
      </CodeBlock>

      <div className="card mt-5 overflow-hidden" style={{ padding: 0 }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className="text-[11px] uppercase text-muted"
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  borderBottom: "1px solid var(--color-border)",
                  letterSpacing: "0.08em",
                }}
              >
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Code</th>
                <th className="px-5 py-3.5 font-medium">When it happens</th>
              </tr>
            </thead>
            <tbody className="text-secondary">
              {[
                ["401", "UNAUTHORIZED", "Key missing, invalid or revoked."],
                ["400", "VALIDATION_ERROR", "Body fails schema (missing field, invalid value, image too large)."],
                ["402", "INSUFFICIENT_CREDITS", "Balance below generation cost. Top up in the dashboard."],
                ["429", "RATE_LIMITED", "Request limit exceeded for this API key. Retry-After header indicates when to retry."],
                ["502", "UPSTREAM_ERROR", "Veo provider failure. Automatic credit refund."],
                ["500", "INTERNAL_ERROR", "Unexpected error on our end. Try again."],
              ].map(([status, code, when], i, arr) => (
                <tr
                  key={code}
                  className="transition-colors hover:bg-white/[0.02]"
                  style={
                    i !== arr.length - 1
                      ? { borderBottom: "1px solid var(--color-border)" }
                      : undefined
                  }
                >
                  <td
                    className="px-5 py-4"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {status}
                  </td>
                  <td
                    className="px-5 py-4"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-accent)",
                    }}
                  >
                    {code}
                  </td>
                  <td className="px-5 py-4">{when}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SectionAnchor id="best-practices">Best practices</SectionAnchor>
      <ul className="list-disc space-y-3 pl-6 text-secondary">
        <li>
          <strong className="text-[var(--color-text)]">
            Use{" "}
            <code className="docs-inline-code">
              negativePrompt
            </code>
            :
          </strong>{" "}
          describe what you don&apos;t want (&quot;no text, no watermark,
          no distortions&quot;) to reduce rejects.
        </li>
        <li>
          <strong className="text-[var(--color-text)]">
            Retry with exponential backoff:
          </strong>{" "}
          if you get{" "}
          <code className="docs-inline-code">
            500
          </code>{" "}
          or{" "}
          <code className="docs-inline-code">
            502
          </code>
          , wait 1s, 2s, 4s and give up after 3 tries.{" "}
          <code className="docs-inline-code">
            4xx
          </code>{" "}
          errors should not be retried without fixing the body.
        </li>
        <li>
          <strong className="text-[var(--color-text)]">Idempotency:</strong>{" "}
          store the{" "}
          <code className="docs-inline-code">
            taskId
          </code>{" "}
          in your database before proceeding. If your function dies mid-poll,
          recover the taskId and resume — don&apos;t call{" "}
          <code className="docs-inline-code">
            /generate
          </code>{" "}
          again.
        </li>
        <li>
          <strong className="text-[var(--color-text)]">Backend polling:</strong>{" "}
          never poll from the browser with the key embedded. Do it from your
          server or via your own webhook that notifies the front-end when the
          video is ready.
        </li>
        <li>
          <strong className="text-[var(--color-text)]">
            Cache the{" "}
            <code className="docs-inline-code">
              videoUrl
            </code>
            :
          </strong>{" "}
          the output link is long-lived, but download and re-upload to your
          storage if you&apos;ll serve it publicly.
        </li>
      </ul>

      <SectionAnchor id="limits">Limits</SectionAnchor>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">
        Rate limits
      </h3>
      <p className="text-secondary">
        Each API key has two independent buckets, both resetting every
        full hour (UTC):
      </p>

      <div className="card mt-5 overflow-hidden" style={{ padding: 0 }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className="text-[11px] uppercase text-muted"
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  borderBottom: "1px solid var(--color-border)",
                  letterSpacing: "0.08em",
                }}
              >
                <th className="px-5 py-3.5 font-medium">Endpoint</th>
                <th className="px-5 py-3.5 font-medium">Bucket</th>
                <th className="px-5 py-3.5 text-right font-medium">Limit</th>
              </tr>
            </thead>
            <tbody className="text-secondary">
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td className="px-5 py-4">
                  <code className="docs-inline-code">POST /api/v1/generate</code>
                </td>
                <td className="px-5 py-4">
                  <code className="docs-inline-code">generate</code>
                </td>
                <td
                  className="px-5 py-4 text-right font-semibold"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-accent)",
                  }}
                >
                  100 / hour
                </td>
              </tr>
              <tr>
                <td className="px-5 py-4">
                  <code className="docs-inline-code">
                    GET /api/v1/status/&#123;taskId&#125;
                  </code>
                </td>
                <td className="px-5 py-4">
                  <code className="docs-inline-code">status</code>
                </td>
                <td
                  className="px-5 py-4 text-right font-semibold"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-accent)",
                  }}
                >
                  1,000 / hour
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-5 text-secondary">
        Every authenticated response — even errors — carries headers
        with the current state:
      </p>

      <CodeBlock language="http">
        {`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1762531200`}
      </CodeBlock>

      <p className="text-secondary">
        When the limit is hit, the API returns{" "}
        <code className="docs-inline-code">429 RATE_LIMITED</code> with the{" "}
        <code className="docs-inline-code">Retry-After</code> header in seconds:
      </p>

      <CodeBlock language="json">
        {`{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit of 100/hour exceeded for this API key. Try again in 1837s."
  }
}`}
      </CodeBlock>

      <p className="mt-3 text-secondary">
        Limits are <strong className="text-[var(--color-text)]">per API
        key</strong>, not per account — you can issue multiple keys to
        parallelize workloads. Windows are aligned to the UTC hour (e.g. 14:00
        →&nbsp;15:00); it&apos;s not a sliding window.
      </p>

      <h3 className="mt-12 mb-3 text-[1.0625rem] font-semibold tracking-tight">
        Other limits
      </h3>
      <ul className="list-disc space-y-3 pl-6 text-secondary">
        <li>
          <strong className="text-[var(--color-text)]">
            Image size:
          </strong>{" "}
          up to ~10 MB per base64 image. PNG and JPEG accepted.
        </li>
        <li>
          <strong className="text-[var(--color-text)]">Duration:</strong> 4, 6
          or 8 seconds. Resolutions from{" "}
          <code className="docs-inline-code">
            1080p
          </code>{" "}
          and up require{" "}
          <code className="docs-inline-code">
            durationSeconds: 8
          </code>
          .
        </li>
        <li>
          <strong className="text-[var(--color-text)]">Aspect ratio:</strong>{" "}
          <code className="docs-inline-code">
            16:9
          </code>{" "}
          (landscape) and{" "}
          <code className="docs-inline-code">
            9:16
          </code>{" "}
          (portrait).
        </li>
        <li>
          <strong className="text-[var(--color-text)]">References:</strong>{" "}
          1 to 3 images per generation in{" "}
          <code className="docs-inline-code">
            references
          </code>{" "}
          mode.
        </li>
        <li>
          <strong className="text-[var(--color-text)]">
            <code className="docs-inline-code">
              lastFrame
            </code>
            :
          </strong>{" "}
          supported only on{" "}
          <code className="docs-inline-code">
            veo3-quality
          </code>
          .
        </li>
        <li>
          <strong className="text-[var(--color-text)]">4K resolution:</strong>{" "}
          available on{" "}
          <code className="docs-inline-code">
            veo3-fast
          </code>{" "}
          and{" "}
          <code className="docs-inline-code">
            veo3-quality
          </code>
          .{" "}
          <code className="docs-inline-code">
            veo3-lite
          </code>{" "}
          goes up to 1080p.
        </li>
      </ul>

      <div
        className="card relative my-20 overflow-hidden p-10 text-center"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(162, 221, 0, 0.10), transparent 70%), var(--color-card)",
          borderColor: "var(--color-border-accent)",
          borderRadius: "var(--radius-2xl)",
        }}
      >
        <p className="text-xl font-semibold tracking-tight">
          Ready to test?
        </p>
        <p className="mt-2 text-[14px] text-secondary">
          Create your account, generate a key and fire the first video in under
          two minutes.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <a href="/login" className="btn-primary">
            Create account
          </a>
          <a href="/dashboard/keys" className="btn-ghost">
            Generate API key
          </a>
        </div>
      </div>
    </article>
  );
}
