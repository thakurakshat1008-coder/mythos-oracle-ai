import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  MessageSquare,
  Pencil,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  Copy,
  Download,
  Printer,
  ImagePlus,
  Check,
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
      { property: "og:description", content: "Mythos is a mystical multi-model AI chat oracle powered by GPT-5, Gemini and more. Ask anything — code, art, wisdom, ideas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MythosPage,
});

type ModelOption = {
  id: string;
  label: string;
  family: "GPT" | "Gemini" | "Claude" | "Manus" | "Grok" | "Llama" | "DeepSeek" | "Mistral";
  hint: string;
  available: boolean;
};

const MODELS: ModelOption[] = [
  { id: "openai/gpt-5.6-sol", label: "GPT-5.6 Sol", family: "GPT", hint: "Flagship reasoning", available: true },
  { id: "openai/gpt-5.6-terra", label: "GPT-5.6 Terra", family: "GPT", hint: "Balanced everyday", available: true },
  { id: "openai/gpt-5.6-luna", label: "GPT-5.6 Luna", family: "GPT", hint: "Fast & lightweight", available: true },
  { id: "openai/gpt-5.5", label: "GPT-5.5", family: "GPT", hint: "Frontier complex tasks", available: true },
  { id: "openai/gpt-5.4", label: "GPT-5.4", family: "GPT", hint: "Deep analysis", available: true },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 Mini", family: "GPT", hint: "Quick reasoning", available: true },
  { id: "google/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", family: "Gemini", hint: "Multimodal power", available: true },
  { id: "google/gemini-3.6-flash", label: "Gemini 3.6 Flash", family: "Gemini", hint: "Fast multimodal", available: true },
  { id: "google/gemini-3.1-flash-lite", label: "Gemini Flash Lite", family: "Gemini", hint: "Highest throughput", available: true },
  { id: "anthropic/claude-opus", label: "Claude Opus", family: "Claude", hint: "Coming soon — falls back to GPT-5.6 Sol", available: false },
  { id: "anthropic/claude-sonnet", label: "Claude Sonnet", family: "Claude", hint: "Coming soon — falls back to GPT-5.6 Sol", available: false },
  { id: "xai/grok-4", label: "Grok 4", family: "Grok", hint: "Coming soon — falls back to GPT-5.6 Sol", available: false },
  { id: "meta/llama-3.3-70b", label: "Llama 3.3 70B", family: "Llama", hint: "Coming soon — falls back to GPT-5.6 Sol", available: false },
  { id: "deepseek/deepseek-r1", label: "DeepSeek R1", family: "DeepSeek", hint: "Coming soon — falls back to GPT-5.6 Sol", available: false },
  { id: "mistral/mistral-large", label: "Mistral Large", family: "Mistral", hint: "Coming soon — falls back to GPT-5.6 Sol", available: false },
  { id: "manus/manus-agent", label: "Manus Agent", family: "Manus", hint: "Coming soon — falls back to GPT-5.6 Sol", available: false },
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

type Thread = {
  id: string;
  title: string;
  messages: UIMessage[];
  updatedAt: number;
};

const THREADS_KEY = "mythos.threads.v1";
const ACTIVE_KEY = "mythos.activeThread.v1";

function newThread(): Thread {
  return {
    id: (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)),
    title: "New conversation",
    messages: [],
    updatedAt: Date.now(),
  };
}

function loadThreads(): { threads: Thread[]; activeId: string } {
  if (typeof window === "undefined") {
    const t = newThread();
    return { threads: [t], activeId: t.id };
  }
  try {
    const raw = window.localStorage.getItem(THREADS_KEY);
    const parsed = raw ? (JSON.parse(raw) as Thread[]) : [];
    if (Array.isArray(parsed) && parsed.length > 0) {
      const activeId = window.localStorage.getItem(ACTIVE_KEY) || parsed[0].id;
      const active = parsed.find((t) => t.id === activeId)?.id ?? parsed[0].id;
      return { threads: parsed, activeId: active };
    }
  } catch {
    /* ignore */
  }
  const t = newThread();
  return { threads: [t], activeId: t.id };
}

function MythosPage() {
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [modelOpen, setModelOpen] = useState(false);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState<"chat" | "image">("chat");
  const [generating, setGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const initial = useMemo(() => loadThreads(), []);
  const [threads, setThreads] = useState<Thread[]>(initial.threads);
  const [activeId, setActiveId] = useState<string>(initial.activeId);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const activeThread = threads.find((t) => t.id === activeId) ?? threads[0];

  // Persist
  useEffect(() => {
    try {
      window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
    } catch { /* ignore */ }
  }, [threads]);
  useEffect(() => {
    try { window.localStorage.setItem(ACTIVE_KEY, activeId); } catch { /* ignore */ }
  }, [activeId]);

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
    id: activeId,
    messages: activeThread?.messages ?? [],
    transport,
    onError: (e) => console.error(e),
  });

  const isLoading = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  // Sync messages back to the active thread
  useEffect(() => {
    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== activeId) return t;
        const firstUser = messages.find((m) => m.role === "user");
        const derivedTitle =
          t.title !== "New conversation"
            ? t.title
            : firstUser
              ? firstUser.parts
                  .map((p) => (p.type === "text" ? p.text : ""))
                  .join(" ")
                  .trim()
                  .slice(0, 48) || "New conversation"
              : "New conversation";
        return { ...t, messages, title: derivedTitle, updatedAt: Date.now() };
      }),
    );
  }, [messages, activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [activeId]);

  const handleGenerateImage = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || generating) return;
    setInput("");
    // Append user prompt as a message
    const userMsg: UIMessage = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      role: "user",
      parts: [{ type: "text", text: `🎨 ${value}` }],
    };
    setMessages((prev) => [...prev, userMsg]);
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: value }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = (await res.json()) as { url: string };
      const assistantMsg: UIMessage = {
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        role: "assistant",
        parts: [
          { type: "file", url, mediaType: "image/png", filename: "mythos-image.png" } as never,
          { type: "text", text: `*Generated image for:* "${value}"` },
        ],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
      const errMsg: UIMessage = {
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        role: "assistant",
        parts: [{ type: "text", text: "The vision faltered. Please try again." }],
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = (text?: string) => {
    if (mode === "image") return handleGenerateImage(text);
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

  const createThread = useCallback(() => {
    const t = newThread();
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
    setMessages([]);
    setInput("");
    setFiles([]);
  }, [setMessages]);

  const selectThread = (id: string) => {
    if (id === activeId) return;
    setActiveId(id);
    const t = threads.find((x) => x.id === id);
    setMessages(t?.messages ?? []);
  };

  const deleteThread = (id: string) => {
    setThreads((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        const fresh = newThread();
        setActiveId(fresh.id);
        setMessages([]);
        return [fresh];
      }
      if (id === activeId) {
        setActiveId(next[0].id);
        setMessages(next[0].messages);
      }
      return next;
    });
  };

  const commitRename = (id: string) => {
    const v = renameValue.trim();
    if (v) {
      setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, title: v } : t)));
    }
    setRenamingId(null);
    setRenameValue("");
  };

  return (
    <div className="relative min-h-screen text-foreground">
      <CosmicBackground />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border/50 glass-panel transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="" width={22} height={22} className="h-5 w-5" />
            <span className="font-display text-sm tracking-wide text-gradient-gold">MYTHOS</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
        <div className="p-3">
          <button
            onClick={createThread}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-cosmic px-3 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-gold)] transition hover:scale-[1.02] animate-gradient"
          >
            <Plus className="h-4 w-4" /> New conversation
          </button>
        </div>
        <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          History
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {threads.length === 0 && (
            <div className="px-2 py-4 text-xs text-muted-foreground">No conversations yet.</div>
          )}
          <ul className="flex flex-col gap-1">
            {[...threads]
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((t) => {
                const active = t.id === activeId;
                const isRenaming = renamingId === t.id;
                return (
                  <li key={t.id}>
                    <div
                      className={`group flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition ${
                        active
                          ? "bg-primary/15 text-foreground"
                          : "text-foreground/80 hover:bg-primary/10"
                      }`}
                    >
                      <MessageSquare
                        className={`h-4 w-4 shrink-0 ${active ? "text-gold" : "text-muted-foreground"}`}
                      />
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => commitRename(t.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(t.id);
                            if (e.key === "Escape") {
                              setRenamingId(null);
                              setRenameValue("");
                            }
                          }}
                          className="flex-1 rounded-md bg-background/70 px-2 py-1 text-xs text-foreground outline-none ring-1 ring-primary/50"
                        />
                      ) : (
                        <button
                          onClick={() => selectThread(t.id)}
                          className="flex-1 truncate text-left"
                          title={t.title}
                        >
                          {t.title}
                        </button>
                      )}
                      {!isRenaming && (
                        <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingId(t.id);
                              setRenameValue(t.title);
                            }}
                            className="rounded p-1 text-muted-foreground hover:bg-primary/15 hover:text-gold"
                            aria-label="Rename conversation"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete "${t.title}"?`)) deleteThread(t.id);
                            }}
                            className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                            aria-label="Delete conversation"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
        <div className="border-t border-border/40 px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          Stored in this browser
        </div>
      </aside>

      {/* Main column */}
      <div className={`transition-[padding] duration-300 ${sidebarOpen ? "lg:pl-72" : "pl-0"}`}>
        <header className="sticky top-0 z-30 border-b border-border/40 glass-panel">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                  aria-label="Open sidebar"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              )}
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
                onClick={createThread}
                className="hidden sm:flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-foreground"
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
        <div className={`fixed inset-x-0 bottom-0 z-20 pointer-events-none ${sidebarOpen ? "lg:pl-72" : ""}`}>
          <div className="mx-auto max-w-4xl px-4 pb-6 pointer-events-auto">
            <div className="composer-panel rounded-2xl p-2 shadow-[var(--shadow-oracle)]">
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
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card/70 text-muted-foreground transition hover:border-primary/60 hover:text-gold"
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
                      : "border-border/60 bg-card/70 text-muted-foreground hover:border-primary/60 hover:text-gold"
                  } disabled:opacity-50`}
                >
                  {transcribing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
                <textarea
                  ref={textareaRef}
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
                  className="composer-input min-h-[44px] max-h-40 flex-1 resize-none rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
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

      {/* Sidebar backdrop on small screens */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-background/40 backdrop-blur-sm lg:hidden"
          aria-hidden
        />
      )}
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
    <div className="group relative flex items-center gap-2 rounded-lg border border-border/60 bg-card/80 py-1 pl-1 pr-2 text-xs">
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
          <div className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-border/60 glass-panel shadow-[var(--shadow-oracle)]">
            <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              Choose your mind
            </div>
            <div className="max-h-96 overflow-y-auto">
              {MODELS.map((m) => {
                const disabled = !m.available;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (disabled) return;
                      setModelId(m.id);
                      setOpen(false);
                    }}
                    disabled={disabled}
                    title={disabled ? "Coming soon — will fall back to GPT-5.6 Sol" : m.hint}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition ${
                      disabled
                        ? "cursor-not-allowed opacity-55"
                        : "hover:bg-primary/10"
                    } ${m.id === modelId ? "bg-primary/15" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        {m.label}
                        {disabled && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{m.hint}</div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        disabled
                          ? "border-border/40 text-muted-foreground/70"
                          : "border-border/60 text-muted-foreground"
                      }`}
                    >
                      {m.family}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-border/40 px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">
              Claude & Manus are coming soon via the Lovable AI Gateway. Selecting them will
              gracefully fall back to GPT-5.6 Sol until they're live.
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
