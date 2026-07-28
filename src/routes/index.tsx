import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  Send,
  Wand2,
  BookOpen,
  Code2,
  Image as ImageIcon,
  Lightbulb,
  Feather,
  Compass,
  Loader2,
  Square,
  Plus,
  ChevronDown,
  Paperclip,
  Mic,
  X,
  FileText,
} from "lucide-react";
import logo from "@/assets/mythos-logo.png";
import { CosmicBackground } from "@/components/CosmicBackground";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mythos — The Oracle of All AI Minds" },
      {
        name: "description",
        content:
          "Mythos is a mystical multi-model AI chat oracle powered by GPT-5, Gemini and more. Ask anything — code, art, wisdom, ideas.",
      },
      { property: "og:title", content: "Mythos — The Oracle of All AI Minds" },
      { property: "og:description", content: "A mystical multi-model AI chat oracle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MythosPage,
});

type ModelOption = {
  id: string;
  label: string;
  family: "GPT" | "Gemini";
  hint: string;
};

const MODELS: ModelOption[] = [
  { id: "openai/gpt-5.6-sol", label: "GPT-5.6 Sol", family: "GPT", hint: "Flagship reasoning" },
  { id: "openai/gpt-5.6-terra", label: "GPT-5.6 Terra", family: "GPT", hint: "Balanced everyday" },
  { id: "openai/gpt-5.6-luna", label: "GPT-5.6 Luna", family: "GPT", hint: "Fast & lightweight" },
  { id: "openai/gpt-5.5", label: "GPT-5.5", family: "GPT", hint: "Frontier complex tasks" },
  { id: "openai/gpt-5.4", label: "GPT-5.4", family: "GPT", hint: "Deep analysis" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 Mini", family: "GPT", hint: "Quick reasoning" },
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", family: "Gemini", hint: "Multimodal power" },
  { id: "google/gemini-3.6-flash", label: "Gemini 3.6 Flash", family: "Gemini", hint: "Fast multimodal" },
  { id: "google/gemini-3.1-flash-lite", label: "Gemini Flash Lite", family: "Gemini", hint: "Highest throughput" },
];

type Persona = {
  id: string;
  label: string;
  icon: typeof Sparkles;
  system: string;
  tagline: string;
};

const PERSONAS: Persona[] = [
  {
    id: "oracle",
    label: "The Oracle",
    icon: Sparkles,
    tagline: "Wise, poetic, all-knowing",
    system:
      "You are Mythos, an ancient oracle reborn in silicon. Answer with clarity, warmth and a hint of poetic craft. Use markdown when useful.",
  },
  {
    id: "coder",
    label: "Code Sage",
    icon: Code2,
    tagline: "Precise, senior engineer",
    system:
      "You are Mythos in Code Sage mode. Act as a senior software engineer. Give precise, minimal, correct code with brief rationale. Use markdown code blocks.",
  },
  {
    id: "muse",
    label: "The Muse",
    icon: Feather,
    tagline: "Creative writing & storytelling",
    system:
      "You are Mythos, a creative muse. Craft vivid stories, verse, and imagery. Rich sensory language, tight prose.",
  },
  {
    id: "tutor",
    label: "The Tutor",
    icon: BookOpen,
    tagline: "Patient, step-by-step teacher",
    system:
      "You are Mythos, a patient tutor. Explain step-by-step, check understanding, use analogies. Adapt to the learner's level.",
  },
  {
    id: "strategist",
    label: "The Strategist",
    icon: Compass,
    tagline: "Analytical, decisive",
    system:
      "You are Mythos, a strategic advisor. Structure answers with clear frameworks, trade-offs, and a recommended path.",
  },
  {
    id: "dreamer",
    label: "The Dreamer",
    icon: Wand2,
    tagline: "Wild ideas, brainstorms",
    system:
      "You are Mythos, an unbounded ideator. Generate many bold, unusual ideas, then flag the top three worth pursuing.",
  },
];

const PROMPT_STARTERS = [
  { icon: Lightbulb, text: "Explain quantum entanglement like I'm 12" },
  { icon: Code2, text: "Write a Python script to rename files by date" },
  { icon: Feather, text: "Write a short myth about a fox who learned to code" },
  { icon: ImageIcon, text: "Describe a scene: a temple hidden inside a nebula" },
];

const ACCEPT_TYPES = "image/*,application/pdf,.pdf,.txt,.md";

function MythosPage() {
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [modelOpen, setModelOpen] = useState(false);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages, model: modelId, system: persona.system },
        }),
      }),
    [modelId, persona],
  );

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport,
    onError: (e) => console.error(e),
  });

  const isLoading = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const handleSend = (text?: string) => {
    const value = (text ?? input).trim();
    if ((!value && files.length === 0) || isLoading) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    sendMessage({ text: value || " ", files: dt.files.length ? dt.files : undefined });
    setInput("");
    setFiles([]);
  };

  const handleAttach = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).slice(0, 6 - files.length);
    setFiles((f) => [...f, ...next]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        if (blob.size < 1024) return;
        setTranscribing(true);
        try {
          const fd = new FormData();
          const ext = (blob.type.split(";")[0] || "audio/webm").includes("mp4") ? "mp4" : "webm";
          fd.append("file", blob, `voice.${ext}`);
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          if (res.ok) {
            const { text } = (await res.json()) as { text: string };
            setInput((cur) => (cur ? cur + " " + text : text));
          } else {
            console.error("transcribe failed", await res.text());
          }
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (e) {
      console.error(e);
      alert("Microphone permission denied.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  return (
    <div className="relative min-h-screen text-foreground">
      <CosmicBackground />

      <header className="sticky top-0 z-30 border-b border-border/40 glass-panel">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Mythos logo"
              width={40}
              height={40}
              className="h-10 w-10 drop-shadow-[0_0_16px_oklch(0.78_0.17_75_/_0.5)]"
            />
            <div>
              <h1 className="font-display text-xl font-semibold tracking-wide text-gradient-gold">
                MYTHOS
              </h1>
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Oracle of AI Minds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMessages([])}
              className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
              aria-label="New conversation"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
            <ModelPicker
              modelId={modelId}
              setModelId={setModelId}
              open={modelOpen}
              setOpen={setModelOpen}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col px-4 pb-48 pt-6">
        {!hasMessages ? (
          <Landing persona={persona} setPersona={setPersona} onPick={(t) => handleSend(t)} />
        ) : (
          <div ref={scrollRef} className="flex flex-col gap-6 pt-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {status === "submitted" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Mythos is consulting the stars…
              </div>
            )}
          </div>
        )}
      </main>

      {/* Composer */}
      <div className="fixed inset-x-0 bottom-0 z-20 pointer-events-none">
        <div className="mx-auto max-w-4xl px-4 pb-6 pointer-events-auto">
          <div className="glass-panel rounded-2xl p-2 shadow-[var(--shadow-oracle)]">
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 px-2 pb-2 pt-1">
                {files.map((f, i) => (
                  <AttachmentChip
                    key={i}
                    file={f}
                    onRemove={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  />
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_TYPES}
                multiple
                hidden
                onChange={(e) => {
                  handleAttach(e.target.files);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach files"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card/50 text-muted-foreground transition hover:border-primary/60 hover:text-gold"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={transcribing}
                aria-label={recording ? "Stop recording" : "Record voice"}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
                  recording
                    ? "border-destructive/60 bg-destructive/20 text-destructive-foreground animate-pulse"
                    : "border-border/60 bg-card/50 text-muted-foreground hover:border-primary/60 hover:text-gold"
                } disabled:opacity-50`}
              >
                {transcribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder={
                  recording
                    ? "Listening…"
                    : transcribing
                      ? "Transcribing…"
                      : "Ask the oracle anything…"
                }
                className="min-h-[44px] max-h-40 flex-1 resize-none bg-transparent px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {isLoading ? (
                <button
                  onClick={stop}
                  aria-label="Stop"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/80 text-destructive-foreground transition hover:bg-destructive"
                >
                  <Square className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() && files.length === 0}
                  aria-label="Send"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cosmic text-primary-foreground shadow-[var(--shadow-gold)] transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 animate-gradient"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between px-3 pb-1 pt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>
                Speaking as <span className="text-gold">{persona.label}</span> ·{" "}
                <span className="text-gold">{MODELS.find((m) => m.id === modelId)?.label}</span>
              </span>
              <span className="hidden sm:inline">Enter to send · Shift+Enter for newline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttachmentChip({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith("image/");
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!isImage) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file, isImage]);
  return (
    <div className="group relative flex items-center gap-2 rounded-lg border border-border/60 bg-card/70 py-1 pl-1 pr-2 text-xs">
      {isImage && url ? (
        <img src={url} alt={file.name} className="h-8 w-8 rounded object-cover" />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded bg-primary/15 text-gold">
          <FileText className="h-4 w-4" />
        </span>
      )}
      <span className="max-w-[140px] truncate text-foreground/90">{file.name}</span>
      <button
        onClick={onRemove}
        aria-label="Remove attachment"
        className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/60 text-muted-foreground hover:text-destructive"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function ModelPicker({
  modelId,
  setModelId,
  open,
  setOpen,
}: {
  modelId: string;
  setModelId: (id: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const current = MODELS.find((m) => m.id === modelId) ?? MODELS[0];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-primary/40 bg-card/60 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary"
      >
        <Sparkles className="h-3.5 w-3.5 text-gold" />
        {current.label}
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-xl border border-border/60 glass-panel shadow-[var(--shadow-oracle)]">
            <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              Choose your mind
            </div>
            <div className="max-h-80 overflow-y-auto">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setModelId(m.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-primary/10 ${
                    m.id === modelId ? "bg-primary/15" : ""
                  }`}
                >
                  <div>
                    <div className="font-medium text-foreground">{m.label}</div>
                    <div className="text-xs text-muted-foreground">{m.hint}</div>
                  </div>
                  <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {m.family}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Landing({
  persona,
  setPersona,
  onPick,
}: {
  persona: Persona;
  setPersona: (p: Persona) => void;
  onPick: (t: string) => void;
}) {
  return (
    <section className="flex flex-col items-center gap-10 py-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <img
          src={logo}
          alt="Mythos"
          width={112}
          height={112}
          className="h-28 w-28 animate-float-slow drop-shadow-[0_0_40px_oklch(0.78_0.17_75_/_0.55)]"
        />
        <h2 className="font-display text-5xl font-semibold leading-tight tracking-wide sm:text-6xl">
          <span className="text-gradient-gold">Mythos</span>
        </h2>
        <p className="max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          One oracle. Many minds. Chat with the finest AI models — GPT‑5, Gemini and more —
          through a single mystical portal. Attach images, files or speak with your voice.
        </p>
      </div>

      <div className="w-full">
        <div className="mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Choose a voice
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            const active = p.id === persona.id;
            return (
              <button
                key={p.id}
                onClick={() => setPersona(p)}
                className={`group relative overflow-hidden rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-primary/70 bg-primary/10 shadow-[var(--shadow-gold)]"
                    : "border-border/60 glass-panel hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={`h-4 w-4 ${active ? "text-gold" : "text-muted-foreground group-hover:text-gold"}`}
                  />
                  <div className="font-display text-sm font-medium tracking-wide">{p.label}</div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.tagline}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full">
        <div className="mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Whisper a question
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PROMPT_STARTERS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.text}
                onClick={() => onPick(s.text)}
                className="group flex items-start gap-3 rounded-xl border border-border/60 glass-panel p-4 text-left transition hover:border-primary/60 hover:bg-primary/5"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cosmic text-primary-foreground shadow-[var(--shadow-gold)]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-foreground/90 group-hover:text-foreground">
                  {s.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");

  const fileParts = message.parts.filter(
    (p): p is Extract<UIMessage["parts"][number], { type: "file" }> => p.type === "file",
  );

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-cosmic px-4 py-3 text-sm text-primary-foreground shadow-[var(--shadow-oracle)]">
          {fileParts.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {fileParts.map((p, i) =>
                p.mediaType?.startsWith("image/") ? (
                  <img
                    key={i}
                    src={p.url}
                    alt={p.filename ?? "attachment"}
                    className="max-h-40 rounded-lg border border-white/20"
                  />
                ) : (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg bg-black/20 px-2 py-1 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {p.filename ?? "file"}
                  </div>
                ),
              )}
            </div>
          )}
          {text && <div className="whitespace-pre-wrap">{text}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-card/70 animate-pulse-glow">
        <Sparkles className="h-4 w-4 text-gold" />
      </div>
      <div className="max-w-[85%] flex-1">
        <div className="mb-1 font-display text-xs uppercase tracking-[0.25em] text-gold">
          Mythos
        </div>
        <div className="mythos-prose text-sm leading-relaxed text-foreground/95">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
