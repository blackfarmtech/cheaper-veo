"use client";

import {
  useCallback,
  useMemo,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import {
  Type,
  Image as ImageIcon,
  Layers,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";

import {
  type ModelOption,
  type Resolution,
  type AspectRatio,
  type Duration,
  type Tier,
  calculateCredits,
  PricingError,
} from "@/lib/pricing";
import { cn, formatCredits, formatUsd } from "@/lib/utils";
import {
  submitGenerationAction,
  type PlaygroundInput,
} from "@/app/(app)/dashboard/playground/_actions";
import { GenerationProgress } from "@/components/dashboard/GenerationProgress";

interface PlaygroundFormProps {
  balance: number;
  models: ModelOption[];
}

type Kind = "text_to_video" | "image_to_video" | "references";

interface UploadedImage {
  base64: string;
  mimeType: string;
  previewUrl: string;
  fileName: string;
}

interface ActiveTask {
  taskId: string;
  initialStatus: "pending" | "processing";
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ASPECT_RATIOS: AspectRatio[] = ["16:9", "9:16"];
const DURATIONS: Duration[] = [4, 6, 8];

const TIER_LABELS: Record<Tier, string> = {
  lite: "Lite",
  fast: "Fast",
  quality: "Quality",
};

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const slice = bytes.subarray(i, i + CHUNK);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function isHiResolution(res: Resolution): boolean {
  return res === "1080p" || res === "4k";
}

function KindTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Type;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all",
        active
          ? "text-[var(--color-text)]"
          : "text-secondary hover:text-[var(--color-text)]",
      )}
      style={
        active
          ? {
              background:
                "linear-gradient(135deg, rgba(162, 221, 0, 0.18), rgba(162, 221, 0, 0.06))",
              boxShadow: "0 0 0 1px var(--color-border-accent) inset",
            }
          : undefined
      }
      aria-pressed={active}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}

function PillRadio<T extends string | number>({
  options,
  value,
  onChange,
  disabledOptions,
  ariaLabel,
  formatLabel,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  disabledOptions?: readonly T[];
  ariaLabel: string;
  formatLabel?: (option: T) => string;
}) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const isDisabled = disabledOptions?.includes(opt) ?? false;
        const isActive = opt === value;
        return (
          <button
            type="button"
            key={String(opt)}
            disabled={isDisabled}
            onClick={() => onChange(opt)}
            role="radio"
            aria-checked={isActive}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all",
              isActive
                ? "text-[var(--color-text)]"
                : "text-secondary hover:text-[var(--color-text)]",
              isDisabled && "cursor-not-allowed opacity-40",
            )}
            style={{
              border: isActive
                ? "1px solid var(--color-border-accent)"
                : "1px solid var(--color-border-strong)",
              background: isActive
                ? "rgba(162, 221, 0, 0.1)"
                : "rgba(255, 255, 255, 0.03)",
            }}
          >
            {formatLabel ? formatLabel(opt) : String(opt)}
          </button>
        );
      })}
    </div>
  );
}

function ImageUploader({
  label,
  image,
  onChange,
  onRemove,
}: {
  label: string;
  image: UploadedImage | null;
  onChange: (img: UploadedImage) => void;
  onRemove: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Imagem excede o limite de 10 MB.");
      return;
    }
    try {
      const base64 = await fileToBase64(file);
      const previewUrl = URL.createObjectURL(file);
      onChange({
        base64,
        mimeType: file.type || "image/png",
        previewUrl,
        fileName: file.name,
      });
    } catch {
      setError("Não foi possível ler a imagem.");
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-secondary">{label}</label>
      {image ? (
        <div
          className="relative overflow-hidden"
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.previewUrl}
            alt={`Preview de ${image.fileName}`}
            className="h-40 w-full object-cover"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors hover:text-[var(--color-text)]"
            style={{
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--color-border-strong)",
            }}
            aria-label="Remover imagem"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
          <div
            className="px-3.5 py-2 text-[11px] text-muted"
            style={{
              background: "rgba(0, 0, 0, 0.5)",
              borderTop: "1px solid var(--color-border)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {image.fileName}
          </div>
        </div>
      ) : (
        <label
          className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 text-center text-xs text-secondary transition-colors hover:text-[var(--color-text)]"
          style={{
            border: "1px dashed var(--color-border-strong)",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <Upload className="h-4 w-4" aria-hidden />
          <span>Selecionar imagem (até 10 MB)</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFile}
          />
        </label>
      )}
      {error && (
        <p className="text-xs text-[var(--color-danger)]">{error}</p>
      )}
    </div>
  );
}

export function PlaygroundForm({ balance, models }: PlaygroundFormProps) {
  const [kind, setKind] = useState<Kind>("text_to_video");
  const [modelId, setModelId] = useState<string>(models[0]?.id ?? "veo3-fast");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [resolution, setResolution] = useState<Resolution>("720p");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [durationSeconds, setDurationSeconds] = useState<Duration>(8);
  const [audio, setAudio] = useState<boolean>(true);

  const [firstFrame, setFirstFrame] = useState<UploadedImage | null>(null);
  const [lastFrame, setLastFrame] = useState<UploadedImage | null>(null);
  const [referenceImages, setReferenceImages] = useState<(UploadedImage | null)[]>([
    null,
    null,
    null,
  ]);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [insufficientInfo, setInsufficientInfo] = useState<{
    balance: number;
    required: number;
  } | null>(null);
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedModel = useMemo(
    () => models.find((m) => m.id === modelId) ?? models[0],
    [models, modelId],
  );

  const availableResolutions = selectedModel?.resolutions ?? [];
  const effectiveResolution: Resolution = availableResolutions.includes(resolution)
    ? resolution
    : (availableResolutions[0] ?? "720p");

  const hiRes = isHiResolution(effectiveResolution);
  const effectiveDuration: Duration = hiRes ? 8 : durationSeconds;
  const disabledDurations: Duration[] = hiRes ? [4, 6] : [];

  const costEstimate = useMemo(() => {
    try {
      const credits = calculateCredits({
        modelId,
        resolution: effectiveResolution,
        audio,
        durationSeconds: effectiveDuration,
      });
      return { credits, error: null as string | null };
    } catch (err) {
      const message =
        err instanceof PricingError ? err.message : "Combinação inválida.";
      return { credits: 0, error: message };
    }
  }, [modelId, effectiveResolution, audio, effectiveDuration]);

  const enoughBalance = costEstimate.credits > 0 && balance >= costEstimate.credits;

  const formInvalid =
    prompt.trim().length === 0 ||
    costEstimate.error !== null ||
    (kind === "image_to_video" && !firstFrame) ||
    (kind === "references" && referenceImages.every((r) => r === null));

  const submitDisabled =
    formInvalid || !enoughBalance || isPending || activeTask !== null;

  const handleSelectReference = useCallback(
    (idx: number, img: UploadedImage | null) => {
      setReferenceImages((prev) => {
        const next = [...prev];
        next[idx] = img;
        return next;
      });
    },
    [],
  );

  const buildInput = useCallback((): PlaygroundInput | null => {
    const baseFields = {
      modelId,
      prompt: prompt.trim(),
      resolution: effectiveResolution,
      aspectRatio,
      durationSeconds: effectiveDuration,
      audio,
      ...(negativePrompt.trim()
        ? { negativePrompt: negativePrompt.trim() }
        : {}),
    } as const;

    if (kind === "text_to_video") {
      return { kind: "text_to_video", ...baseFields };
    }
    if (kind === "image_to_video") {
      if (!firstFrame) return null;
      return {
        kind: "image_to_video",
        ...baseFields,
        firstFrame: {
          bytesBase64Encoded: firstFrame.base64,
          mimeType: firstFrame.mimeType,
        },
        ...(lastFrame
          ? {
              lastFrame: {
                bytesBase64Encoded: lastFrame.base64,
                mimeType: lastFrame.mimeType,
              },
            }
          : {}),
      };
    }
    const refs = referenceImages
      .filter((r): r is UploadedImage => r !== null)
      .map((r) => ({
        bytesBase64Encoded: r.base64,
        mimeType: r.mimeType,
      }));
    if (refs.length === 0) return null;
    return {
      kind: "references",
      ...baseFields,
      referenceImages: refs,
    };
  }, [
    kind,
    modelId,
    prompt,
    effectiveResolution,
    aspectRatio,
    effectiveDuration,
    audio,
    negativePrompt,
    firstFrame,
    lastFrame,
    referenceImages,
  ]);

  function handleSubmit() {
    setSubmitError(null);
    setInsufficientInfo(null);
    const input = buildInput();
    if (!input) {
      setSubmitError("Confira os campos obrigatórios.");
      return;
    }
    startTransition(async () => {
      const result = await submitGenerationAction(input);
      if (result.ok) {
        const initialStatus =
          result.status === "pending" ? "pending" : "processing";
        setActiveTask({ taskId: result.taskId, initialStatus });
        return;
      }
      if (result.error === "INSUFFICIENT_CREDITS") {
        setInsufficientInfo({ balance: result.balance, required: result.required });
        return;
      }
      setSubmitError(result.message);
    });
  }

  function resetForm() {
    setActiveTask(null);
    setSubmitError(null);
    setInsufficientInfo(null);
  }

  if (activeTask) {
    return (
      <GenerationProgress
        taskId={activeTask.taskId}
        initialStatus={activeTask.initialStatus}
        onReset={resetForm}
      />
    );
  }

  const fieldLabel =
    "text-[11px] font-medium uppercase text-muted tracking-[0.08em]";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="card flex flex-col gap-7 p-7">
        {/* Kind tabs */}
        <div
          className="flex gap-1 p-1"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-pill)",
          }}
        >
          <KindTab
            active={kind === "text_to_video"}
            onClick={() => setKind("text_to_video")}
            icon={Type}
            label="Texto → Vídeo"
          />
          <KindTab
            active={kind === "image_to_video"}
            onClick={() => setKind("image_to_video")}
            icon={ImageIcon}
            label="Imagem → Vídeo"
          />
          <KindTab
            active={kind === "references"}
            onClick={() => setKind("references")}
            icon={Layers}
            label="Referências"
          />
        </div>

        {/* Model */}
        <div className="space-y-3">
          <label htmlFor="modelId" className={fieldLabel}>
            Modelo
          </label>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {models.map((m) => {
              const active = m.id === modelId;
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setModelId(m.id)}
                  aria-pressed={active}
                  className="p-4 text-left transition-all"
                  style={{
                    border: active
                      ? "1px solid var(--color-border-accent)"
                      : "1px solid var(--color-border)",
                    background: active
                      ? "rgba(162, 221, 0, 0.08)"
                      : "rgba(255, 255, 255, 0.02)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: active ? "var(--shadow-glow)" : "none",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-semibold tracking-tight">
                      {m.label}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                      )}
                      style={
                        active
                          ? {
                              background: "var(--color-accent)",
                              color: "#0a0a0c",
                              letterSpacing: "0.06em",
                            }
                          : {
                              border: "1px solid var(--color-border-strong)",
                              color: "var(--color-text-secondary)",
                              letterSpacing: "0.06em",
                            }
                      }
                    >
                      {TIER_LABELS[m.tier]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] text-secondary">
                    {m.description}
                  </p>
                  <p
                    className="mt-1.5 text-[10.5px] text-muted"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {m.speedHint}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Prompt */}
        <div className="space-y-3">
          <label htmlFor="prompt" className={fieldLabel}>
            Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="Ex.: Câmera lenta percorrendo um deserto ao pôr do sol, dunas alaranjadas, partículas de areia ao vento, atmosfera cinematográfica."
            className="input-apple resize-y"
          />
          <p className="text-[11px] text-muted">
            Descreva cena, câmera, iluminação e atmosfera. Quanto mais
            específico, melhor.
          </p>
        </div>

        {/* Negative prompt */}
        <details
          className="p-4"
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <summary className={cn("cursor-pointer", fieldLabel)}>
            Prompt negativo (opcional)
          </summary>
          <textarea
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            rows={3}
            placeholder="O que evitar — ex.: texto, marca d'água, distorções, baixa resolução."
            className="input-apple mt-3 resize-y"
          />
        </details>

        {/* Image inputs */}
        {kind === "image_to_video" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploader
              label="Primeiro frame (obrigatório)"
              image={firstFrame}
              onChange={setFirstFrame}
              onRemove={() => setFirstFrame(null)}
            />
            <ImageUploader
              label="Último frame (opcional)"
              image={lastFrame}
              onChange={setLastFrame}
              onRemove={() => setLastFrame(null)}
            />
          </div>
        )}

        {kind === "references" && (
          <div className="grid gap-4 sm:grid-cols-3">
            {referenceImages.map((img, i) => (
              <ImageUploader
                key={i}
                label={`Referência ${i + 1}`}
                image={img}
                onChange={(next) => handleSelectReference(i, next)}
                onRemove={() => handleSelectReference(i, null)}
              />
            ))}
          </div>
        )}

        {/* Settings grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2.5">
            <label className={fieldLabel}>Resolução</label>
            <PillRadio<Resolution>
              options={availableResolutions}
              value={effectiveResolution}
              onChange={setResolution}
              ariaLabel="Resolução"
            />
          </div>

          <div className="space-y-2.5">
            <label className={fieldLabel}>Proporção</label>
            <PillRadio<AspectRatio>
              options={ASPECT_RATIOS}
              value={aspectRatio}
              onChange={setAspectRatio}
              ariaLabel="Proporção"
            />
          </div>

          <div className="space-y-2.5">
            <label className={fieldLabel}>Duração</label>
            <PillRadio<Duration>
              options={DURATIONS}
              value={effectiveDuration}
              onChange={setDurationSeconds}
              disabledOptions={disabledDurations}
              ariaLabel="Duração"
              formatLabel={(d) => `${d}s`}
            />
            {hiRes && (
              <p className="text-[11px] text-[var(--color-warn)]">
                1080p e 4K exigem duração de 8s.
              </p>
            )}
          </div>

          <div className="space-y-2.5">
            <label className={fieldLabel}>Áudio</label>
            <button
              type="button"
              role="switch"
              aria-checked={audio}
              onClick={() => setAudio((a) => !a)}
              className="inline-flex w-full items-center justify-between rounded-full px-4 py-2 text-sm transition-all"
              style={{
                border: audio
                  ? "1px solid var(--color-border-accent)"
                  : "1px solid var(--color-border-strong)",
                background: audio
                  ? "rgba(162, 221, 0, 0.08)"
                  : "rgba(255, 255, 255, 0.03)",
                color: audio ? "var(--color-text)" : "var(--color-text-secondary)",
              }}
            >
              <span className="inline-flex items-center gap-2">
                {audio ? (
                  <Volume2 className="h-4 w-4" aria-hidden />
                ) : (
                  <VolumeX className="h-4 w-4" aria-hidden />
                )}
                {audio ? "Com áudio" : "Sem áudio"}
              </span>
              <span
                className={cn(
                  "inline-block h-5 w-9 rounded-full transition-colors",
                  audio
                    ? "bg-[var(--color-accent)]"
                    : "bg-[rgba(243,240,237,0.12)]",
                )}
              >
                <span
                  className={cn(
                    "block h-5 w-5 transform rounded-full bg-white transition-transform",
                    audio ? "translate-x-4" : "translate-x-0",
                  )}
                  style={{ boxShadow: "var(--shadow-xs)" }}
                />
              </span>
            </button>
          </div>
        </div>

        {/* Errors */}
        {submitError && (
          <div
            className="flex items-start gap-2 p-3.5 text-sm text-[var(--color-danger)]"
            style={{
              border: "1px solid rgba(248, 113, 113, 0.4)",
              background: "rgba(248, 113, 113, 0.08)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {submitError}
          </div>
        )}

        {insufficientInfo && (
          <div
            className="flex items-start gap-2 p-3.5 text-sm text-[var(--color-warn)]"
            style={{
              border: "1px solid rgba(251, 191, 36, 0.4)",
              background: "rgba(251, 191, 36, 0.08)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <div>
              Saldo insuficiente — você tem {formatCredits(insufficientInfo.balance)} cr,
              precisa de {formatCredits(insufficientInfo.required)} cr.{" "}
              <a href="/dashboard/billing" className="underline">
                Recarregar agora
              </a>
              .
            </div>
          </div>
        )}
      </div>

      {/* Cost sidebar */}
      <aside className="card flex flex-col gap-5 self-start p-6">
        <div className="flex items-center gap-2">
          <Sparkles
            className="h-4 w-4"
            style={{ color: "var(--color-accent)" }}
            aria-hidden
          />
          <h3 className="text-[15px] font-semibold tracking-tight">
            Custo estimado
          </h3>
        </div>

        <div
          className="p-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(162, 221, 0, 0.06), rgba(255, 255, 255, 0.02))",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          {costEstimate.error ? (
            <p className="text-sm text-[var(--color-danger)]">
              {costEstimate.error}
            </p>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <span
                  className="text-4xl font-semibold tracking-tight"
                  style={{
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "-0.022em",
                  }}
                >
                  {formatCredits(costEstimate.credits)}
                </span>
                <span className="text-xs text-muted">créditos</span>
              </div>
              <div
                className="mt-2 text-sm text-secondary"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                ≈ {formatUsd(costEstimate.credits)}
              </div>
            </>
          )}
        </div>

        <div
          className="space-y-2 pt-4 text-xs text-secondary"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <div className="flex justify-between">
            <span>Saldo atual</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>
              {formatCredits(balance)} cr
            </span>
          </div>
          {!costEstimate.error && (
            <div className="flex justify-between">
              <span>Após geração</span>
              <span
                className={cn(
                  enoughBalance
                    ? "text-secondary"
                    : "text-[var(--color-danger)]",
                )}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {formatCredits(Math.max(0, balance - costEstimate.credits))} cr
              </span>
            </div>
          )}
        </div>

        {!enoughBalance && !costEstimate.error && (
          <p
            className="p-2.5 text-xs text-[var(--color-danger)]"
            style={{
              border: "1px solid rgba(248, 113, 113, 0.4)",
              background: "rgba(248, 113, 113, 0.08)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            Saldo insuficiente para esta configuração.
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitDisabled}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Enviando…" : "Gerar vídeo"}
        </button>

        <p className="text-[11px] text-muted">
          Você só é cobrado quando a geração inicia. Falhas da plataforma são
          reembolsadas automaticamente.
        </p>
      </aside>
    </div>
  );
}
