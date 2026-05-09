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
const BASE_URL = "https://api.geraew.com";

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
          Documentação da API Cheaper Veo
        </h1>
        <p className="body-large mt-5 text-secondary">
          Gere vídeos com Veo 3.1 via HTTP. Pay as you go, sem mensalidade,
          créditos pré-pagos. Esta referência cobre autenticação, geração,
          polling de status, modelos disponíveis e tratamento de erros.
        </p>
      </div>

      <LlmsBanner />

      <SectionAnchor id="introducao">Introdução</SectionAnchor>
      <p className="text-secondary">
        A API Cheaper Veo é uma camada HTTP fina sobre o Google Veo 3.1. Você envia um
        prompt (e opcionalmente imagens de referência), recebe um{" "}
        <code className="docs-inline-code">
          taskId
        </code>{" "}
        imediato e faz polling até o vídeo ficar pronto. Em três passos:
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-secondary">
        <li>
          <strong className="text-[var(--color-text)]">Autenticar:</strong>{" "}
          envie sua chave no header{" "}
          <code className="docs-inline-code">
            Authorization: Bearer veo_live_…
          </code>
          .
        </li>
        <li>
          <strong className="text-[var(--color-text)]">Gerar:</strong>{" "}
          <code className="docs-inline-code">
            POST /api/v1/generate
          </code>{" "}
          com o body do tipo desejado (text-to-video, image-to-video ou
          references). A resposta contém o{" "}
          <code className="docs-inline-code">
            taskId
          </code>{" "}
          e o custo em créditos já debitado.
        </li>
        <li>
          <strong className="text-[var(--color-text)]">Aguardar:</strong>{" "}
          <code className="docs-inline-code">
            GET /api/v1/status/&#123;taskId&#125;
          </code>{" "}
          a cada 5–10 segundos até o status virar{" "}
          <code className="docs-inline-code">
            succeeded
          </code>
          . O campo{" "}
          <code className="docs-inline-code">
            videoUrl
          </code>{" "}
          aponta para o MP4 final.
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
          <span className="text-secondary">Produção:</span> {BASE_URL}
          <br />
          <span className="text-secondary">Desenvolvimento:</span>{" "}
          http://localhost:3000
        </p>
      </div>

      <SectionAnchor id="quickstart">Quickstart</SectionAnchor>
      <p className="text-secondary">
        Do zero ao primeiro vídeo em 3 passos. Total: ~2 minutos.
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
              Crie uma API key
            </h4>
            <p className="mt-1 text-[14px]">
              Acesse{" "}
              <a
                href="/dashboard/keys"
                className="text-[var(--color-accent)] underline-offset-4 hover:underline"
              >
                Painel → API Keys
              </a>{" "}
              e clique em <strong className="text-[var(--color-text)]">Gerar nova chave</strong>.
              A chave (formato{" "}
              <code className="docs-inline-code">veo_live_…</code>) é exibida{" "}
              <strong className="text-[var(--color-text)]">apenas uma vez</strong> —
              copie pra um cofre de segredos.
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
              Teste o saldo
            </h4>
            <p className="mt-1 text-[14px]">
              Confirma que a chave tá funcionando antes de gerar nada (não
              consome crédito):
            </p>
            <CodeBlock language="bash">
              {`curl ${BASE_URL}/api/v1/account \\
  -H "Authorization: Bearer ${PLACEHOLDER_KEY}"`}
            </CodeBlock>
            <p className="text-[13px] text-muted">
              Resposta deve mostrar seu email e{" "}
              <code className="docs-inline-code">balance</code> em créditos. Se
              receber{" "}
              <code className="docs-inline-code">401</code>, a chave está
              errada ou foi revogada.
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
              Gere e aguarde
            </h4>
            <p className="mt-1 text-[14px]">
              Vídeo barato pra testar (Lite 720p sem áudio, 4s = 5 créditos =
              US$0,05):
            </p>
            <CodeBlock language="bash">
              {`# Inicia geração — retorna taskId imediato
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

# Resposta: { "taskId": "tsk_01HYAB…", "status": "pending", … }

# Pega o taskId acima e faz polling a cada 5s
curl ${BASE_URL}/api/v1/status/tsk_01HYAB… \\
  -H "Authorization: Bearer ${PLACEHOLDER_KEY}"`}
            </CodeBlock>
            <p className="text-[13px] text-muted">
              Quando{" "}
              <code className="docs-inline-code">status</code> virar{" "}
              <code className="docs-inline-code">succeeded</code>, o campo{" "}
              <code className="docs-inline-code">videoUrl</code> traz o MP4
              final.
            </p>
          </div>
        </li>
      </ol>

      <SectionAnchor id="autenticacao">Autenticação</SectionAnchor>
      <p className="text-secondary">
        Toda requisição precisa do header{" "}
        <code className="docs-inline-code">
          Authorization: Bearer veo_live_…
        </code>
        . As chaves começam com{" "}
        <code className="docs-inline-code">
          veo_live_
        </code>{" "}
        e são geradas em{" "}
        <a
          href="/dashboard/keys"
          className="text-[var(--color-accent)] underline-offset-4 hover:underline"
        >
          Painel → API keys
        </a>
        . A chave é exibida apenas uma vez no momento da criação — guarde-a num
        cofre de segredos.
      </p>

      <CodeBlock language="http">
        {`Authorization: Bearer ${PLACEHOLDER_KEY}\nContent-Type: application/json`}
      </CodeBlock>

      <p className="mt-3 text-secondary">
        Se a chave for inválida, revogada ou estiver ausente, a API responde{" "}
        <code className="docs-inline-code">
          401 UNAUTHORIZED
        </code>
        . Nunca exponha a chave em código client-side: faça as chamadas a partir
        do seu backend.
      </p>

      <SectionAnchor id="geracao-de-video">Geração de vídeo</SectionAnchor>
      <p className="text-secondary">
        <code className="docs-inline-code">
          POST /api/v1/generate
        </code>{" "}
        aceita um body discriminado pelo campo{" "}
        <code className="docs-inline-code">
          kind
        </code>
        . O caso mais comum é{" "}
        <code className="docs-inline-code">
          text_to_video
        </code>
        . A chamada retorna imediatamente com{" "}
        <code className="docs-inline-code">
          taskId
        </code>
        ,{" "}
        <code className="docs-inline-code">
          status
        </code>{" "}
        e o custo em créditos.
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
  "negativePrompt": "string (opcional, max 2000 chars)"
}`}
      </CodeBlock>

      <p className="mt-3 text-[13px] text-muted">
        <strong className="text-[var(--color-text-secondary)]">Atenção:</strong>{" "}
        o campo é <code className="docs-inline-code">modelId</code> (não{" "}
        <code className="docs-inline-code">model</code>) na requisição.
        Restrições:{" "}
        <code className="docs-inline-code">veo3-lite</code> só suporta
        720p/1080p (sem 4K).{" "}
        <code className="docs-inline-code">1080p</code> e{" "}
        <code className="docs-inline-code">4k</code> exigem{" "}
        <code className="docs-inline-code">durationSeconds: 8</code>.
      </p>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">
        Resposta
      </h3>
      <p className="text-[13px] text-secondary">
        <code className="docs-inline-code">HTTP 202 Accepted</code> — créditos
        já debitados, geração enfileirada. Note que a resposta usa{" "}
        <code className="docs-inline-code">model</code> (sem o "Id"):
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
        para animar a partir de um quadro inicial. Envie a imagem em base64 com{" "}
        <code className="docs-inline-code">
          firstFrame
        </code>
        . O campo opcional{" "}
        <code className="docs-inline-code">
          lastFrame
        </code>{" "}
        (suportado apenas em{" "}
        <code className="docs-inline-code">
          veo3-quality
        </code>
        ) define o quadro final, fazendo a interpolação entre os dois.
      </p>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">
        Formato do objeto de imagem
      </h3>
      <p className="text-secondary">
        Toda imagem (em <code className="docs-inline-code">firstFrame</code>,{" "}
        <code className="docs-inline-code">lastFrame</code> ou{" "}
        <code className="docs-inline-code">referenceImages[]</code>) segue o
        mesmo schema:
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
          (obrigatório): string base64 sem o prefixo{" "}
          <code className="docs-inline-code">data:</code>. Limite ~10MB
          decodificado.
        </li>
        <li>
          <code className="docs-inline-code">mimeType</code> (opcional, padrão{" "}
          <code className="docs-inline-code">image/jpeg</code>):{" "}
          <code className="docs-inline-code">image/png</code>,{" "}
          <code className="docs-inline-code">image/jpeg</code> ou{" "}
          <code className="docs-inline-code">image/webp</code>.
        </li>
      </ul>

      <CodeBlock language="bash">{CURL_IMAGE_TO_VIDEO}</CodeBlock>
      <CodeBlock language="typescript">{NODE_IMAGE_TO_VIDEO}</CodeBlock>

      <SectionAnchor id="video-com-referencias">
        Vídeo com referências
      </SectionAnchor>
      <p className="text-secondary">
        Use{" "}
        <code className="docs-inline-code">
          kind: &quot;references&quot;
        </code>{" "}
        para guiar o estilo, personagem ou produto através de 1 a 3 imagens de
        referência. Cada item do array{" "}
        <code className="docs-inline-code">
          referenceImages
        </code>{" "}
        aceita{" "}
        <code className="docs-inline-code">
          base64
        </code>
        ,{" "}
        <code className="docs-inline-code">
          mimeType
        </code>{" "}
        e{" "}
        <code className="docs-inline-code">
          referenceType
        </code>{" "}
        (atualmente apenas{" "}
        <code className="docs-inline-code">
          asset
        </code>
        ).
      </p>

      <CodeBlock language="bash">{CURL_REFERENCES}</CodeBlock>

      <SectionAnchor id="polling-de-status">Polling de status</SectionAnchor>
      <p className="text-secondary">
        <code className="docs-inline-code">
          GET /api/v1/status/&#123;taskId&#125;
        </code>{" "}
        retorna o estado atual da tarefa. Os possíveis valores de{" "}
        <code className="docs-inline-code">
          status
        </code>{" "}
        são:
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-6 text-secondary">
        <li>
          <code className="docs-inline-code">
            pending
          </code>{" "}
          — fila inicial, ainda não enviado ao provider.
        </li>
        <li>
          <code className="docs-inline-code">
            processing
          </code>{" "}
          — Veo está gerando.
        </li>
        <li>
          <code className="docs-inline-code">
            succeeded
          </code>{" "}
          — pronto. Use{" "}
          <code className="docs-inline-code">
            videoUrl
          </code>{" "}
          para baixar.
        </li>
        <li>
          <code className="docs-inline-code">
            failed
          </code>{" "}
          — falha definitiva sem reembolso (entrada inválida, content policy,
          etc).
        </li>
        <li>
          <code className="docs-inline-code">
            refunded
          </code>{" "}
          — falha de upstream; os créditos já voltaram para sua conta.
        </li>
      </ul>

      <p className="mt-4 text-secondary">
        <strong className="text-[var(--color-text)]">Recomendado:</strong>{" "}
        intervalo de 5 a 10 segundos entre chamadas. Não consulte com mais
        frequência: vai apenas consumir rate limit sem acelerar a geração.
        Tempos típicos:{" "}
        <code className="docs-inline-code">
          lite/fast
        </code>{" "}
        em 1–3 minutos,{" "}
        <code className="docs-inline-code">
          quality
        </code>{" "}
        em 2–5 minutos.
      </p>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">Resposta</h3>
      <CodeBlock language="json">
        {`{
  "taskId": "tsk_01HYABCDEF…",
  "status": "succeeded",
  "model": "veo3-fast",
  "creditsCost": 30,
  "videoUrl": "https://cdn.cheapervideo.com/v/tsk_01HYABCDEF.mp4",
  "createdAt": "2026-05-08T12:34:56.000Z",
  "completedAt": "2026-05-08T12:36:11.000Z"
}`}
      </CodeBlock>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">Node.js</h3>
      <CodeBlock language="typescript">{NODE_POLLING}</CodeBlock>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">Python</h3>
      <CodeBlock language="python">{PYTHON_POLLING}</CodeBlock>

      <SectionAnchor id="conta">Conta &amp; saldo</SectionAnchor>
      <p className="text-secondary">
        <code className="docs-inline-code">GET /api/v1/account</code> retorna
        o saldo atual em créditos e as últimas 10 gerações da conta dona da
        API key. Útil pra checar saldo antes de chamar{" "}
        <code className="docs-inline-code">/generate</code> e evitar{" "}
        <code className="docs-inline-code">402 INSUFFICIENT_CREDITS</code>.
      </p>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">
        Resposta
      </h3>
      <CodeBlock language="json">
        {`{
  "email": "voce@empresa.com",
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
      "videoUrl": "https://cdn.cheapervideo.com/v/tsk_01HYABCDEF.mp4",
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
        <code className="docs-inline-code">balance</code> está em créditos —
        divida por 100 pra ter o equivalente em USD (1 crédito = US$ 0,01).
      </p>

      <SectionAnchor id="modelos-e-precos">Modelos e preços</SectionAnchor>
      <p className="text-secondary">
        Tabela de custo para vídeos de 8 segundos com áudio. Para 6s aplique 75%
        e para 4s, 50% (sempre arredondado para cima). 1 crédito = US$ 0,01.
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
                <th className="px-5 py-3.5 font-medium">Modelo</th>
                <th className="px-5 py-3.5 font-medium">Velocidade</th>
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
        Valores acima incluem áudio. Sem áudio o custo é menor; consulte a
        página de preços do site para o detalhamento completo. O custo exato é
        sempre informado no campo{" "}
        <code className="docs-inline-code">
          creditsCost
        </code>{" "}
        da resposta de{" "}
        <code className="docs-inline-code">
          /generate
        </code>
        .
      </p>

      <SectionAnchor id="erros">Erros</SectionAnchor>
      <p className="text-secondary">
        Erros usam HTTP status codes padrão e um body JSON com{" "}
        <code className="docs-inline-code">
          error.code
        </code>{" "}
        e{" "}
        <code className="docs-inline-code">
          error.message
        </code>
        :
      </p>

      <CodeBlock language="json">
        {`{
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Saldo insuficiente: 12 créditos disponíveis, 30 necessários."
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
                <th className="px-5 py-3.5 font-medium">Quando ocorre</th>
              </tr>
            </thead>
            <tbody className="text-secondary">
              {[
                ["401", "UNAUTHORIZED", "Chave ausente, inválida ou revogada."],
                ["400", "VALIDATION_ERROR", "Body fora do schema (campo faltando, valor inválido, imagem muito grande)."],
                ["402", "INSUFFICIENT_CREDITS", "Saldo abaixo do custo da geração. Recarregue no painel."],
                ["429", "RATE_LIMITED", "Limite de requisições excedido para esta API key. Header Retry-After indica quando tentar de novo."],
                ["502", "UPSTREAM_ERROR", "Falha do provider Veo. Reembolso automático em créditos."],
                ["500", "INTERNAL_ERROR", "Erro inesperado do nosso lado. Tente novamente."],
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

      <SectionAnchor id="boas-praticas">Boas práticas</SectionAnchor>
      <ul className="list-disc space-y-3 pl-6 text-secondary">
        <li>
          <strong className="text-[var(--color-text)]">
            Use{" "}
            <code className="docs-inline-code">
              negativePrompt
            </code>
            :
          </strong>{" "}
          descreva o que você não quer (&quot;sem texto, sem marca d&apos;água,
          sem distorções&quot;) para reduzir descartes.
        </li>
        <li>
          <strong className="text-[var(--color-text)]">
            Retry com backoff exponencial:
          </strong>{" "}
          se receber{" "}
          <code className="docs-inline-code">
            500
          </code>{" "}
          ou{" "}
          <code className="docs-inline-code">
            502
          </code>
          , aguarde 1s, 2s, 4s e desista após 3 tentativas. Erros{" "}
          <code className="docs-inline-code">
            4xx
          </code>{" "}
          não devem ser repetidos sem corrigir o body.
        </li>
        <li>
          <strong className="text-[var(--color-text)]">Idempotência:</strong>{" "}
          guarde o{" "}
          <code className="docs-inline-code">
            taskId
          </code>{" "}
          no seu banco antes de prosseguir. Se a sua função morrer no meio do
          polling, recupere o taskId e continue de onde parou — não chame{" "}
          <code className="docs-inline-code">
            /generate
          </code>{" "}
          de novo.
        </li>
        <li>
          <strong className="text-[var(--color-text)]">Polling no backend:</strong>{" "}
          nunca faça polling do navegador com a chave embutida. Faça do seu
          servidor ou via webhook próprio que notifica seu front quando o vídeo
          está pronto.
        </li>
        <li>
          <strong className="text-[var(--color-text)]">
            Cache de{" "}
            <code className="docs-inline-code">
              videoUrl
            </code>
            :
          </strong>{" "}
          o link de saída tem validade longa, mas baixe e reupload para o seu
          storage se for servir publicamente.
        </li>
      </ul>

      <SectionAnchor id="limites">Limites</SectionAnchor>

      <h3 className="mt-10 mb-3 text-[1.0625rem] font-semibold tracking-tight">
        Rate limits
      </h3>
      <p className="text-secondary">
        Cada API key tem dois buckets independentes, ambos resetando a cada
        hora cheia (UTC):
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
                <th className="px-5 py-3.5 text-right font-medium">Limite</th>
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
                  100 / hora
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
                  1.000 / hora
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-5 text-secondary">
        Toda resposta autenticada — mesmo em caso de erro — carrega headers
        com o estado atual:
      </p>

      <CodeBlock language="http">
        {`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1762531200`}
      </CodeBlock>

      <p className="text-secondary">
        Quando o limite é atingido, a API retorna{" "}
        <code className="docs-inline-code">429 RATE_LIMITED</code> com o header{" "}
        <code className="docs-inline-code">Retry-After</code> em segundos:
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
        Os limites são <strong className="text-[var(--color-text)]">por API
        key</strong>, não por conta — você pode emitir múltiplas chaves para
        paralelizar workloads. Janelas são alinhadas à hora UTC (ex.: 14:00
        →&nbsp;15:00); não é uma janela deslizante.
      </p>

      <h3 className="mt-12 mb-3 text-[1.0625rem] font-semibold tracking-tight">
        Outros limites
      </h3>
      <ul className="list-disc space-y-3 pl-6 text-secondary">
        <li>
          <strong className="text-[var(--color-text)]">
            Tamanho de imagem:
          </strong>{" "}
          até ~10 MB por imagem em base64. PNG e JPEG são aceitos.
        </li>
        <li>
          <strong className="text-[var(--color-text)]">Duração:</strong> 4, 6
          ou 8 segundos. Resoluções a partir de{" "}
          <code className="docs-inline-code">
            1080p
          </code>{" "}
          exigem{" "}
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
          (paisagem) e{" "}
          <code className="docs-inline-code">
            9:16
          </code>{" "}
          (retrato).
        </li>
        <li>
          <strong className="text-[var(--color-text)]">Referências:</strong>{" "}
          de 1 a 3 imagens por geração no modo{" "}
          <code className="docs-inline-code">
            references
          </code>
          .
        </li>
        <li>
          <strong className="text-[var(--color-text)]">
            <code className="docs-inline-code">
              lastFrame
            </code>
            :
          </strong>{" "}
          suportado apenas em{" "}
          <code className="docs-inline-code">
            veo3-quality
          </code>
          .
        </li>
        <li>
          <strong className="text-[var(--color-text)]">Resolução 4K:</strong>{" "}
          disponível em{" "}
          <code className="docs-inline-code">
            veo3-fast
          </code>{" "}
          e{" "}
          <code className="docs-inline-code">
            veo3-quality
          </code>
          .{" "}
          <code className="docs-inline-code">
            veo3-lite
          </code>{" "}
          vai até 1080p.
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
          Pronto para testar?
        </p>
        <p className="mt-2 text-[14px] text-secondary">
          Crie sua conta, gere uma chave e dispare o primeiro vídeo em menos de
          dois minutos.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <a href="/login" className="btn-primary">
            Criar conta
          </a>
          <a href="/dashboard/keys" className="btn-ghost">
            Gerar API key
          </a>
        </div>
      </div>
    </article>
  );
}
