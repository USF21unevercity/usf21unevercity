// Parse free-text into multiple-choice questions.
// Supported formats per question (separated by blank lines or numbered):
//
// 1) ما عاصمة فرنسا؟
//    أ) برلين
//    ب) باريس
//    ج) لندن
//    د) روما
//    الإجابة: ب
//
// Also accepts A/B/C/D, 1/2/3/4, ١/٢/٣/٤
// "الجواب" / "الحل" / "Answer" / "Correct" all mean answer.

export type MCQ = {
  question: string;
  options: string[];
  correctIndex: number; // 0-based
};

const ARABIC_LETTER_MAP: Record<string, number> = {
  أ: 0, ا: 0, ب: 1, ج: 2, د: 3, هـ: 4, ه: 4,
};
const LATIN_LETTER_MAP: Record<string, number> = {
  a: 0, b: 1, c: 2, d: 3, e: 4,
};
const ARABIC_DIGIT_MAP: Record<string, number> = {
  "١": 0, "٢": 1, "٣": 2, "٤": 3, "٥": 4,
  "1": 0, "2": 1, "3": 2, "4": 3, "5": 4,
};

function normalizeAnswerToken(tok: string): number {
  const t = tok.trim().replace(/[).:،,-]/g, "").toLowerCase();
  if (t in ARABIC_LETTER_MAP) return ARABIC_LETTER_MAP[t];
  if (t in LATIN_LETTER_MAP) return LATIN_LETTER_MAP[t];
  if (t in ARABIC_DIGIT_MAP) return ARABIC_DIGIT_MAP[t] ?? -1;
  // single-char fallback
  const c = t[0];
  if (c && c in ARABIC_LETTER_MAP) return ARABIC_LETTER_MAP[c];
  if (c && c in LATIN_LETTER_MAP) return LATIN_LETTER_MAP[c];
  if (c && c in ARABIC_DIGIT_MAP) return ARABIC_DIGIT_MAP[c];
  return -1;
}

const OPTION_RE = /^\s*(?:[\(\[]?\s*([أابجدهـa-eA-E1-5١-٥])\s*[\)\].\-:،])\s*(.+)$/;
const ANSWER_RE = /^\s*(?:الإجابة|الاجابة|الجواب|الحل|الصحيح|answer|correct|ans)\s*[:：\-]\s*(.+)$/i;
const QNUM_RE = /^\s*(?:[سQ]?\s*)?(\d+|[١-٩]+)\s*[\).\-:،]\s*(.+)$/;

export function parseQuestionsText(raw: string): MCQ[] {
  if (!raw || !raw.trim()) return [];
  // Split on blank lines OR on numbered question markers at line start
  const text = raw.replace(/\r/g, "");
  // Insert blank-line separators before lines starting with "1)" / "1." / "س1" patterns when preceded by an answer line
  const lines = text.split("\n");
  const blocks: string[][] = [];
  let cur: string[] = [];
  for (const line of lines) {
    if (line.trim() === "") {
      if (cur.length) { blocks.push(cur); cur = []; }
    } else {
      cur.push(line);
    }
  }
  if (cur.length) blocks.push(cur);

  // If no blank-line splitting produced multiple blocks, try numbered split
  let candidates = blocks;
  if (candidates.length <= 1) {
    const acc: string[][] = [];
    let buf: string[] = [];
    for (const line of lines) {
      if (QNUM_RE.test(line) && buf.length) { acc.push(buf); buf = [line]; }
      else buf.push(line);
    }
    if (buf.length) acc.push(buf);
    candidates = acc;
  }

  const result: MCQ[] = [];
  for (const block of candidates) {
    const mcq = parseBlock(block);
    if (mcq) result.push(mcq);
  }
  return result;
}

function parseBlock(lines: string[]): MCQ | null {
  let question = "";
  const options: string[] = [];
  let correctIndex = -1;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const ans = line.match(ANSWER_RE);
    if (ans) {
      correctIndex = normalizeAnswerToken(ans[1]);
      continue;
    }
    const opt = line.match(OPTION_RE);
    if (opt && question) {
      options.push(opt[2].trim());
      continue;
    }
    if (!question) {
      // strip leading numbering
      const qn = line.match(QNUM_RE);
      question = qn ? qn[2].trim() : line;
    } else {
      // Continuation of question text if no options yet
      if (options.length === 0) question += " " + line;
    }
  }

  if (!question || options.length < 2) return null;
  if (correctIndex < 0 || correctIndex >= options.length) correctIndex = 0;
  return { question, options, correctIndex };
}

// Extract text from a PDF File using pdfjs
export async function extractPdfText(file: File): Promise<string> {
  const pdfjs: any = await import("pdfjs-dist/build/pdf.mjs");
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({
    data: buf,
    disableWorker: true,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  let out = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const items = content.items
      .map((it: any) => ({
        str: String(it.str || "").trim(),
        x: Number(it.transform?.[4] || 0),
        y: Number(it.transform?.[5] || 0),
      }))
      .filter((it: any) => it.str);

    const lines = new Map<string, { y: number; parts: { x: number; str: string }[] }>();
    for (const item of items) {
      const key = String(Math.round(item.y));
      const line = lines.get(key) || { y: item.y, parts: [] };
      line.parts.push({ x: item.x, str: item.str });
      lines.set(key, line);
    }

    const pageText = Array.from(lines.values())
      .sort((a, b) => b.y - a.y)
      .map((line) =>
        line.parts
          .sort((a, b) => a.x - b.x)
          .map((part) => part.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean)
      .join("\n");

    out += pageText + "\n\n";
  }

  const cleaned = out.replace(/\u0000/g, "").trim();
  if (!cleaned) throw new Error("لم يتم استخراج نص من الملف");
  return cleaned;
}
