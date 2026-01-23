/**
 * rd_questionizer.ts
 *
 * Purpose:
 * - Take deterministic feasibility claims.
 * - Ask an LLM to convert them into minimal user questions (only when user input is needed).
 * - Return a clean, parseable list of questions for Haley to ask.
 *
 * No external deps. Works in Node or browser.
 */

export type ClaimPriority = "must" | "should" | "could";
export type ClaimType =
  | "capability"
  | "integration"
  | "ux"
  | "security"
  | "cost"
  | "latency"
  | "legal"
  | "data"
  | "other";

export type Claim = {
  id: string;              // e.g. "C1"
  statement: string;       // one testable feasibility statement
  type?: ClaimType;
  priority?: ClaimPriority;
};

export type Question = {
  id: string;              // e.g. "Q1"
  claimId: string;         // e.g. "C1"
  priority: ClaimPriority; // must/should/could
  question: string;        // the question to ask the user
  kind: "choice" | "text" | "number" | "boolean";
  options?: string[];      // for choice
  why?: string;            // short reason (1 line)
};

export type LLMCall = (args: {
  system: string;
  user: string;
  temperature?: number;
}) => Promise<string>;

export type QuestionizeResult = {
  questions: Question[];
  skippedClaimIds: string[];   // claims that require no user question
  raw: string;                 // raw LLM output for debugging
};

const DEFAULT_PRIORITY: ClaimPriority = "should";

/**
 * Output format we force the LLM to produce (line-based, easy parsing):
 *
 * - For "no user question needed":
 *   SKIP|claim=C1|why=Can be validated via docs.
 *
 * - For a question:
 *   Q|claim=C1|priority=must|kind=choice|text=...|options=a;b;c|why=...
 *
 * Notes:
 * - options only required for kind=choice
 * - keep everything on one line
 */

export async function questionizeClaims(args: {
  claims: Claim[];
  llmCall: LLMCall;
  temperature?: number;
}): Promise<QuestionizeResult> {
  const { claims, llmCall, temperature } = args;

  if (!claims || claims.length === 0) {
    return { questions: [], skippedClaimIds: [], raw: "" };
  }

  // sanitize and cap (safety)
  const cleanClaims = claims
    .filter(c => c && c.id && c.statement)
    .map(c => ({
      id: String(c.id).trim(),
      statement: String(c.statement).trim(),
      type: (c.type ?? "other") as ClaimType,
      priority: (c.priority ?? DEFAULT_PRIORITY) as ClaimPriority
    }));

  const system = [
    "You convert feasibility claims into the MINIMUM questions needed from the user.",
    "Rules:",
    "1) If a claim can be validated by browsing/docs/prototyping without user-specific info, output SKIP for that claim.",
    "2) If user info is needed, ask at most 2 questions per claim.",
    "3) Prefer multiple-choice. Keep choices short.",
    "4) Output ONLY the required line format. No prose, no markdown, no JSON.",
    "5) Use priorities from the claim when present. If missing, use should."
  ].join("\n");

  const user = buildUserPrompt(cleanClaims);

  const raw = await llmCall({ system, user, temperature: temperature ?? 0.2 });

  const { questions, skippedClaimIds } = parseLLMOutput(raw, cleanClaims);

  // assign stable question IDs
  const questionsWithIds = questions.map((q, i) => ({
    ...q,
    id: `Q${i + 1}`
  }));

  return { questions: questionsWithIds, skippedClaimIds, raw };
}

function buildUserPrompt(claims: Array<Required<Pick<Claim, "id" | "statement">> & { type: ClaimType; priority: ClaimPriority }>) {
  const lines: string[] = [];
  lines.push("CLAIMS:");
  for (const c of claims) {
    lines.push(
      `- ${c.id} | priority=${c.priority} | type=${c.type} | statement=${escapePipes(c.statement)}`
    );
  }
  lines.push("");
  lines.push("OUTPUT FORMAT (one line each):");
  lines.push("SKIP|claim=C1|why=...");
  lines.push("Q|claim=C1|priority=must|kind=choice|text=...|options=a;b;c|why=...");
  lines.push("");
  lines.push("HARD CONSTRAINTS:");
  lines.push("- Ask 0–2 questions per claim.");
  lines.push("- If you ask a question, keep it short.");
  lines.push("- For kind=choice, include 2–5 options.");
  return lines.join("\n");
}

function parseLLMOutput(
  raw: string,
  claims: Array<{ id: string; priority: ClaimPriority }>
): { questions: Omit<Question, "id">[]; skippedClaimIds: string[] } {
  const claimSet = new Set(claims.map(c => c.id));
  const priorityMap = new Map(claims.map(c => [c.id, c.priority] as const));

  const questions: Omit<Question, "id">[] = [];
  const skippedClaimIds: string[] = [];

  const lines = (raw || "")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  for (const line of lines) {
    // SKIP line
    if (line.startsWith("SKIP|")) {
      const fields = parseFields(line);
      const claimId = fields["claim"];
      if (claimId && claimSet.has(claimId)) {
        skippedClaimIds.push(claimId);
      }
      continue;
    }

    // Q line
    if (line.startsWith("Q|")) {
      const fields = parseFields(line);
      const claimId = fields["claim"];
      if (!claimId || !claimSet.has(claimId)) continue;

      const priority = (fields["priority"] as ClaimPriority) || priorityMap.get(claimId) || DEFAULT_PRIORITY;
      const kind = (fields["kind"] as Question["kind"]) || "text";
      const text = fields["text"];
      if (!text) continue;

      const q: Omit<Question, "id"> = {
        claimId,
        priority,
        kind,
        question: text,
        why: fields["why"] || undefined
      };

      if (kind === "choice") {
        const optsRaw = fields["options"] || "";
        const options = optsRaw
          .split(";")
          .map(s => s.trim())
          .filter(Boolean);
        if (options.length >= 2) q.options = options;
        else q.kind = "text"; // fallback
      }

      questions.push(q);
    }
  }

  // Enforce 0–2 questions per claim
  const byClaim = new Map<string, Omit<Question, "id">[]>();
  for (const q of questions) {
    const arr = byClaim.get(q.claimId) || [];
    arr.push(q);
    byClaim.set(q.claimId, arr);
  }

  const bounded: Omit<Question, "id">[] = [];
  for (const [claimId, qs] of byClaim.entries()) {
    bounded.push(...qs.slice(0, 2));
  }

  // Stable sort: must -> should -> could, then by claimId
  const rank: Record<ClaimPriority, number> = { must: 0, should: 1, could: 2 };
  bounded.sort((a, b) => {
    const ra = rank[a.priority] ?? 9;
    const rb = rank[b.priority] ?? 9;
    if (ra !== rb) return ra - rb;
    return a.claimId.localeCompare(b.claimId);
  });

  return { questions: bounded, skippedClaimIds: uniq(skippedClaimIds) };
}

function parseFields(line: string): Record<string, string> {
  // Example: Q|claim=C1|priority=must|kind=choice|text=...|options=a;b;c|why=...
  const parts = line.split("|").map(p => p.trim());
  const fields: Record<string, string> = {};
  for (const part of parts.slice(1)) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    fields[key] = unescapePipes(val);
  }
  return fields;
}

function escapePipes(s: string) {
  return s.replaceAll("|", "\\|");
}

function unescapePipes(s: string) {
  return s.replaceAll("\\|", "|");
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr));
}
