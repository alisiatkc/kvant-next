import source from "../../cloud-function/methodology-survey.json";
export type Stage = "T0" | "T1";
export type Answers = Record<string, string | string[] | number>;
export type Question = {
  id: string;
  label: string;
  kind: string;
  options?: { value: string; label: string }[];
  maxChoices?: number;
  exclusive?: string[];
  min?: number;
  max?: number;
  maxLength?: number;
  hint?: string;
  indicator?: string;
  pairedWith?: string;
  hideWhen?: { question: string; equals: string };
  showWhen?: { question: string; includes: string[] };
};
export const schema = source as {
  instrumentVersion: string;
  title: string;
  hypothesis: string;
  stages: Record<
    Stage,
    {
      title: string;
      prefix: string;
      description: string;
      intro: string;
      sections: { title: string; description: string; questions: Question[] }[];
    }
  >;
};
export type SurveyInput = {
  instrumentVersion: "4.0";
  stage: Stage;
  participantCode: string;
  consentConfirmed: boolean;
  submissionId: string;
  answers: Answers;
};
export type SurveyRecord = Omit<SurveyInput, "participantCode"> & {
  id: string;
  participantId: string;
  createdAt: string;
  paired: boolean;
};
const API = process.env.NEXT_PUBLIC_API_URL || "";
export const surveyMode = API
  ? "server"
  : process.env.NEXT_PUBLIC_DEMO_MODE === "true"
    ? "demo"
    : "unconfigured";
const KEY = "kvant_methodology_v4_responses";
export function visible(q: Question, a: Answers) {
  if (q.hideWhen && a[q.hideWhen.question] === q.hideWhen.equals) return false;
  if (q.showWhen) {
    const v = a[q.showWhen.question];
    return q.showWhen.includes.some((x) =>
      Array.isArray(v) ? v.includes(x) : v === x,
    );
  }
  return true;
}
export function cleanAnswers(stage: Stage, a: Answers) {
  return Object.fromEntries(
    schema.stages[stage].sections
      .flatMap((s) => s.questions)
      .filter(
        (q) =>
          visible(q, a) &&
          a[q.id] !== undefined &&
          a[q.id] !== "" &&
          (!Array.isArray(a[q.id]) || (a[q.id] as string[]).length),
      )
      .map((q) => [q.id, a[q.id]]),
  );
}
async function request(action: string, init: RequestInit) {
  const r = await fetch(
    `${API}${API.includes("?") ? "&" : "?"}action=${action}`,
    init,
  );
  const data = await r.json();
  if (!r.ok) throw Error(data.error || "Сервис временно недоступен");
  return data;
}
export async function submitSurvey(
  input: SurveyInput,
): Promise<{ id: string }> {
  if (API)
    return request("submitHypothesisSurvey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ survey: input }),
    });
  if (surveyMode !== "demo")
    throw Error("Сбор ответов пока не настроен. Ответы не отправлены.");
  const records: SurveyRecord[] = JSON.parse(localStorage.getItem(KEY) || "[]");
  const { participantCode, ...rest } = input;
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`demo-v4:${participantCode}`),
  );
  const participantId = participantCode
    ? Array.from(new Uint8Array(bytes))
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("")
    : `unpaired:${input.submissionId}`;
  if (!records.some((r) => r.id === input.submissionId))
    records.push({
      ...rest,
      id: input.submissionId,
      participantId,
      createdAt: new Date().toISOString(),
      paired: !!participantCode,
    });
  localStorage.setItem(KEY, JSON.stringify(records));
  return { id: input.submissionId };
}
export async function getSurveys(): Promise<SurveyRecord[]> {
  if (API) {
    const data = await request("getHypothesisSurveys", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("kvant_session_token") || ""}`,
      },
    });
    return data.surveys;
  }
  if (surveyMode !== "demo") throw Error("Сбор ответов не настроен");
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}
export function downloadCSV(name: string, rows: unknown[][]) {
  const cell = (v: unknown) => {
    let s =
      v === undefined ? "" : Array.isArray(v) ? JSON.stringify(v) : String(v);
    if (/^[\s]*[=+\-@]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const url = URL.createObjectURL(
    new Blob(
      ["\uFEFF" + rows.map((row) => row.map(cell).join(";")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
