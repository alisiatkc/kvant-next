"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  schema,
  getSurveys,
  surveyMode,
  downloadCSV,
  type SurveyRecord,
  type Stage,
} from "@/lib/methodology-survey";
export default function MethodologySurveyResults() {
  const [records, setRecords] = useState<SurveyRecord[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function refresh() {
    setBusy(true);
    setError("");
    try {
      setRecords(await getSurveys());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  const all = (["T0", "T1"] as Stage[]).flatMap((stage) =>
    schema.stages[stage].sections.flatMap((s) =>
      s.questions.map((q) => ({ stage, ...q })),
    ),
  );
  const ids = all.map((q) => q.id);
  const grouped = new Map<string, SurveyRecord[]>();
  records.forEach((r) =>
    grouped.set(r.participantId, [...(grouped.get(r.participantId) || []), r]),
  );
  const pairs = Array.from(grouped.values()).filter(
    (rs) =>
      rs.some((r) => r.paired && r.stage === "T0") &&
      rs.some((r) => r.paired && r.stage === "T1"),
  ).length;
  const duplicates = Array.from(grouped.values()).filter(
    (rs) =>
      rs.filter((r) => r.stage === "T0").length > 1 ||
      rs.filter((r) => r.stage === "T1").length > 1,
  ).length;
  return (
    <section className="bg-white rounded-[2rem] p-6 sm:p-10">
      <p className="text-kv-blue text-sm">Анкета по гипотезе · версия 4.0</p>
      <h2 className="text-2xl font-semibold mt-2">
        Взаимодействие в проектной работе: T0 / T1
      </h2>
      <p className="text-kv-muted mt-4">
        {surveyMode === "demo"
          ? "Показаны только записи этого браузера. Это демонстрация, а не общая база ответов."
          : "Доступ к ответам открыт только куратору."}{" "}
        Прежние анкеты T0–T3 и версия 3.0 хранятся отдельно.
      </p>
      <p className="my-4">
        T0: {records.filter((r) => r.stage === "T0").length} · T1:{" "}
        {records.filter((r) => r.stage === "T1").length} · Кодов с обоими
        этапами: {pairs} · Кодов с повторными отправками одного этапа:{" "}
        {duplicates}
      </p>
      <p className="text-sm text-kv-muted mb-4">
        Повторные отправки сохраняются отдельно. До сравнения выберите одну
        запись каждого этапа по заранее заданному правилу. Прямое сопоставление
        предусмотрено для В10.1–В10.6 и И11.1–И11.6. Итоговые действия не
        сравниваются с отсутствием действий до начала проекта.
      </p>
      <div className="flex gap-4 flex-wrap">
        <Link href="/survey" className="btn-blue">
          Открыть анкету
        </Link>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={busy}
          className="text-kv-blue underline"
        >
          {busy ? "Загрузка…" : "Обновить"}
        </button>
        <button
          disabled={!records.length}
          className="text-kv-blue underline disabled:opacity-30"
          onClick={() =>
            downloadCSV("survey-v4-responses.csv", [
              [
                "id",
                "instrumentVersion",
                "stage",
                "participantId",
                "paired",
                "createdAt",
                ...ids,
              ],
              ...records.map((r) => [
                r.id,
                r.instrumentVersion,
                r.stage,
                r.participantId,
                r.paired,
                r.createdAt,
                ...ids.map((id) => r.answers[id]),
              ]),
            ])
          }
        >
          Ответы CSV
        </button>
        <button
          className="text-kv-blue underline"
          onClick={() =>
            downloadCSV("survey-v4-codebook.csv", [
              [
                "stage",
                "question",
                "text",
                "kind",
                "values",
                "pairedWith",
                "indicator",
              ],
              ...all.map((q) => [
                q.stage,
                q.id,
                q.label,
                q.kind,
                q.options?.map((o) => `${o.value}: ${o.label}`).join(" | "),
                q.pairedWith,
                q.indicator,
              ]),
            ])
          }
        >
          Кодировочная книга CSV
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-red-700">
          {error}
        </p>
      )}
      <p className="text-sm text-kv-muted mt-5">
        В выгрузке пустая ячейка означает пропуск; 0 — отсутствие действия; NP —
        пока неприменимо; ZO — затруднение с ответом; NI — функция не
        использовалась. Выбор нескольких вариантов передаётся массивом.
        Суммарный балл «активности» автоматически не рассчитывается.
      </p>
    </section>
  );
}
