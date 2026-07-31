import { marked } from "marked";

/**
 * High-quality client-side PDF export.
 * Renders the answer's markdown into a clean, print-styled A4 sheet (plain hex colors so
 * html2canvas never chokes on modern CSS color functions), rasterises it and paginates
 * it into a real downloadable .pdf file.
 */
export async function exportAnswerToPdf(options: {
  text: string;
  imageUrl?: string;
  model?: string;
  persona?: string;
}) {
  const { text, imageUrl, model, persona } = options;

  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const html = await marked.parse(text || "", { gfm: true, breaks: true });

  const PAGE_W = 794; // A4 @ 96dpi
  const PADDING = 56;

  const host = document.createElement("div");
  host.setAttribute("style", "position:fixed;left:-10000px;top:0;z-index:-1;");
  host.innerHTML = `
    <div id="mythos-pdf-sheet" style="width:${PAGE_W}px;background:#ffffff;color:#16121f;padding:${PADDING}px;box-sizing:border-box;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.7;">
      <div style="border-bottom:2px solid #c9a227;padding-bottom:14px;margin-bottom:26px;display:flex;align-items:baseline;justify-content:space-between;">
        <div style="font-family:Georgia,serif;font-size:26px;letter-spacing:4px;color:#4b2e83;font-weight:700;">MYTHOS</div>
        <div style="font-size:11px;color:#6b6478;text-align:right;font-family:Helvetica,Arial,sans-serif;">
          ${escapeHtml(model ?? "")}${persona ? ` · ${escapeHtml(persona)}` : ""}<br/>
          ${new Date().toLocaleString()}
        </div>
      </div>
      ${imageUrl ? `<img src="${escapeAttr(imageUrl)}" style="max-width:100%;border-radius:10px;margin:0 0 22px;display:block;" crossorigin="anonymous" />` : ""}
      <div class="body">${html}</div>
      <div style="margin-top:34px;border-top:1px solid #e2ddd0;padding-top:10px;font-size:10px;color:#8a8395;font-family:Helvetica,Arial,sans-serif;">
        Generated with Mythos — the oracle of all AI minds
      </div>
    </div>`;
  document.body.appendChild(host);

  const sheet = host.querySelector<HTMLElement>("#mythos-pdf-sheet")!;
  styleBody(sheet);

  // Wait for images (generated art) so they land in the raster.
  await Promise.all(
    Array.from(sheet.querySelectorAll("img")).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );

  try {
    const canvas = await html2canvas(sheet, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const pxPerPt = canvas.width / pw;
    const slicePx = Math.floor(ph * pxPerPt);

    let offset = 0;
    let page = 0;
    while (offset < canvas.height) {
      const h = Math.min(slicePx, canvas.height - offset);
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = h;
      const ctx = slice.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, offset, canvas.width, h, 0, 0, canvas.width, h);
      if (page > 0) pdf.addPage();
      pdf.addImage(slice.toDataURL("image/jpeg", 0.94), "JPEG", 0, 0, pw, h / pxPerPt);
      offset += h;
      page += 1;
    }

    pdf.save(`mythos-${Date.now()}.pdf`);
  } finally {
    host.remove();
  }
}

function styleBody(root: HTMLElement) {
  const set = (sel: string, css: string) =>
    root.querySelectorAll<HTMLElement>(sel).forEach((el) => el.setAttribute("style", css));

  set("h1", "font-size:24px;color:#4b2e83;margin:26px 0 12px;font-weight:700;");
  set("h2", "font-size:20px;color:#4b2e83;margin:22px 0 10px;font-weight:700;");
  set("h3", "font-size:17px;color:#6b4bb3;margin:18px 0 8px;font-weight:700;");
  set("p", "margin:0 0 13px;");
  set("ul,ol", "margin:0 0 13px;padding-left:24px;");
  set("li", "margin:0 0 6px;");
  set("strong", "color:#2a2036;font-weight:700;");
  set("a", "color:#6b4bb3;text-decoration:underline;");
  set(
    "blockquote",
    "margin:0 0 14px;padding:8px 16px;border-left:3px solid #c9a227;background:#faf7ef;color:#3d3550;font-style:italic;",
  );
  set(
    "pre",
    "background:#1c1730;color:#f2ecff;padding:14px;border-radius:8px;overflow:hidden;white-space:pre-wrap;word-break:break-word;font-family:'Courier New',monospace;font-size:12.5px;line-height:1.55;margin:0 0 16px;",
  );
  root.querySelectorAll<HTMLElement>("pre code").forEach((el) =>
    el.setAttribute("style", "background:transparent;color:inherit;padding:0;font-size:12.5px;"),
  );
  root.querySelectorAll<HTMLElement>("code").forEach((el) => {
    if (el.parentElement?.tagName === "PRE") return;
    el.setAttribute(
      "style",
      "background:#f1ecff;color:#4b2e83;padding:1px 5px;border-radius:4px;font-family:'Courier New',monospace;font-size:13px;",
    );
  });
  set("table", "width:100%;border-collapse:collapse;margin:0 0 16px;font-size:13.5px;");
  set("th", "border:1px solid #ddd6c6;background:#f7f3e8;padding:7px 9px;text-align:left;font-weight:700;");
  set("td", "border:1px solid #ddd6c6;padding:7px 9px;vertical-align:top;");
  set("hr", "border:none;border-top:1px solid #e2ddd0;margin:20px 0;");
  set("img", "max-width:100%;border-radius:8px;margin:0 0 14px;display:block;");
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
function escapeAttr(s: string) {
  return s.replace(/"/g, "&quot;");
}
