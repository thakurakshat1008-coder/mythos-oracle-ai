import { marked, type Tokens } from "marked";

/**
 * High-quality client-side PDF export.
 * Renders the answer as a real vector PDF with selectable text, proper pagination,
 * styled headings, lists, code blocks, quotes and tables — plus any generated image.
 */
export async function exportAnswerToPdf(options: {
  text: string;
  imageUrl?: string;
  model?: string;
  persona?: string;
}) {
  const { text, imageUrl, model, persona } = options;
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const M = 56;
  const W = PW - M * 2;

  const GOLD: [number, number, number] = [201, 162, 39];
  const PURPLE: [number, number, number] = [75, 46, 131];
  const INK: [number, number, number] = [28, 24, 40];
  const MUTED: [number, number, number] = [122, 116, 138];

  let y = M;
  let page = 1;

  const footer = () => {
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...MUTED);
    doc.text("Mythos — the oracle of all AI minds", M, PH - 26);
    doc.text(String(page), PW - M, PH - 26, { align: "right" });
  };

  const newPage = () => {
    footer();
    doc.addPage();
    page += 1;
    y = M;
  };

  const need = (h: number) => {
    if (y + h > PH - M) newPage();
  };

  const para = (
    txt: string,
    opts: {
      size?: number;
      style?: "normal" | "bold" | "italic";
      font?: "times" | "helvetica" | "courier";
      color?: [number, number, number];
      indent?: number;
      lead?: number;
      gap?: number;
    } = {},
  ) => {
    const size = opts.size ?? 11.5;
    const lead = opts.lead ?? size * 1.5;
    const indent = opts.indent ?? 0;
    doc
      .setFont(opts.font ?? "times", opts.style ?? "normal")
      .setFontSize(size)
      .setTextColor(...(opts.color ?? INK));
    const lines = doc.splitTextToSize(txt, W - indent) as string[];
    for (const line of lines) {
      need(lead);
      doc.text(line, M + indent, y + size);
      y += lead;
    }
    y += opts.gap ?? 6;
  };

  // ---------- header ----------
  doc.setFont("times", "bold").setFontSize(24).setTextColor(...PURPLE);
  doc.text("MYTHOS", M, y + 18);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...MUTED);
  const meta = [model, persona].filter(Boolean).join("  ·  ");
  if (meta) doc.text(meta, PW - M, y + 8, { align: "right" });
  doc.text(new Date().toLocaleString(), PW - M, y + 20, { align: "right" });
  y += 30;
  doc.setDrawColor(...GOLD).setLineWidth(1.5);
  doc.line(M, y, PW - M, y);
  y += 22;

  // ---------- generated image ----------
  if (imageUrl) {
    try {
      const { dataUrl, w, h } = await loadImage(imageUrl);
      const drawW = Math.min(W, w);
      const drawH = (h / w) * drawW;
      need(drawH + 12);
      doc.addImage(dataUrl, "PNG", M, y, drawW, drawH, undefined, "FAST");
      y += drawH + 18;
    } catch {
      /* image unavailable — keep the text export */
    }
  }

  // ---------- body ----------
  const tokens = marked.lexer(text || "", { gfm: true });
  renderTokens(tokens);
  footer();
  doc.save(`mythos-${Date.now()}.pdf`);

  function inline(t: string) {
    return t
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/(^|\W)\*(?!\s)(.+?)\*/g, "$1$2")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)")
      .replace(/&nbsp;/g, " ");
  }

  function renderTokens(list: Tokens.Generic[], indent = 0) {
    for (const tk of list) {
      switch (tk.type) {
        case "heading": {
          const lvl = (tk as Tokens.Heading).depth;
          const size = lvl === 1 ? 18 : lvl === 2 ? 15 : 13;
          y += 6;
          para(inline((tk as Tokens.Heading).text), {
            size,
            style: "bold",
            color: lvl <= 2 ? PURPLE : INK,
            indent,
            gap: 4,
          });
          break;
        }
        case "paragraph":
          para(inline((tk as Tokens.Paragraph).text), { indent });
          break;
        case "text":
          para(inline((tk as Tokens.Text).text), { indent });
          break;
        case "blockquote": {
          const start = y;
          const inner = (tk as Tokens.Blockquote).tokens ?? [];
          renderTokens(inner as Tokens.Generic[], indent + 16);
          doc.setDrawColor(...GOLD).setLineWidth(2.5);
          doc.line(M + indent + 4, start, M + indent + 4, Math.min(y, PH - M));
          break;
        }
        case "list": {
          const l = tk as Tokens.List;
          let n = typeof l.start === "number" && l.start ? l.start : 1;
          for (const item of l.items) {
            const bullet = l.ordered ? `${n++}.` : "•";
            doc.setFont("times", "bold").setFontSize(11.5).setTextColor(...GOLD);
            need(17);
            doc.text(bullet, M + indent, y + 11.5);
            const before = y;
            renderTokens((item.tokens ?? []) as Tokens.Generic[], indent + 20);
            if (y === before) y += 17;
            y -= 2;
          }
          y += 6;
          break;
        }
        case "code": {
          const code = (tk as Tokens.Code).text;
          doc.setFont("courier", "normal").setFontSize(9.5);
          const lines = code
            .split("\n")
            .flatMap((l) => doc.splitTextToSize(l, W - indent - 20) as string[]);
          const lead = 13;
          let i = 0;
          while (i < lines.length) {
            const room = Math.max(1, Math.floor((PH - M - y - 16) / lead));
            const chunk = lines.slice(i, i + room);
            const boxH = chunk.length * lead + 16;
            need(Math.min(boxH, PH - M - y));
            doc.setFillColor(28, 23, 48);
            doc.roundedRect(M + indent, y, W - indent, boxH, 5, 5, "F");
            doc.setFont("courier", "normal").setFontSize(9.5).setTextColor(238, 234, 255);
            chunk.forEach((ln, k) => doc.text(ln, M + indent + 10, y + 16 + k * lead));
            y += boxH + 10;
            i += chunk.length;
            if (i < lines.length) newPage();
          }
          doc.setTextColor(...INK);
          break;
        }
        case "table": {
          const t = tk as Tokens.Table;
          const cols = t.header.length;
          const colW = (W - indent) / cols;
          const rowH = 20;
          const drawRow = (cells: string[], head: boolean) => {
            need(rowH);
            if (head) {
              doc.setFillColor(245, 241, 230);
              doc.rect(M + indent, y, W - indent, rowH, "F");
            }
            doc
              .setFont("times", head ? "bold" : "normal")
              .setFontSize(10)
              .setTextColor(...INK);
            doc.setDrawColor(220, 214, 200).setLineWidth(0.5);
            cells.forEach((c, i2) => {
              doc.rect(M + indent + i2 * colW, y, colW, rowH);
              const txt = (doc.splitTextToSize(inline(c), colW - 10) as string[])[0] ?? "";
              doc.text(txt, M + indent + i2 * colW + 5, y + 13.5);
            });
            y += rowH;
          };
          drawRow(t.header.map((h) => h.text), true);
          t.rows.forEach((r) => drawRow(r.map((c) => c.text), false));
          y += 12;
          break;
        }
        case "hr":
          need(16);
          doc.setDrawColor(226, 221, 208).setLineWidth(0.8);
          doc.line(M + indent, y + 6, PW - M, y + 6);
          y += 18;
          break;
        case "space":
          y += 4;
          break;
        default: {
          const raw = (tk as { text?: string }).text;
          if (raw) para(inline(raw), { indent });
        }
      }
    }
  }
}

async function loadImage(url: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
  const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
  return { dataUrl, ...dims };
}
