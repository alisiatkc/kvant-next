"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { validate } from "../../../cloud-function/methodology-survey";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  schema,
  visible,
  cleanAnswers,
  submitSurvey,
  surveyMode,
  type Stage,
  type Answers,
  type Question,
} from "@/lib/methodology-survey";
const draftKey = (stage: Stage) => `kvant_methodology_v4_draft_${stage}`;
function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(
    bytes,
    (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32],
  ).join("");
}
export default function SurveyPage() {
  const [stage, setStage] = useState<Stage>("T0"),
    [answers, setAnswers] = useState<Answers>({}),
    [code, setCode] = useState(""),
    [consent, setConsent] = useState(false),
    [step, setStep] = useState(0),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [receipt, setReceipt] = useState(""),
    [submissionId, setSubmissionId] = useState("");
  const form = schema.stages[stage];
  useEffect(() => {
    if (ready && step > 0)
      document.getElementById("survey-step-title")?.focus();
  }, [step, stage, ready]);
  function load(s: Stage) {
    setReady(false);
    setStage(s);
    setStep(0);
    setError("");
    setReceipt("");
    setConsent(false);
    try {
      const d = JSON.parse(localStorage.getItem(draftKey(s)) || "{}");
      setAnswers(
        d.answers && typeof d.answers === "object" && !Array.isArray(d.answers)
          ? d.answers
          : {},
      );
      setCode(typeof d.code === "string" ? d.code : "");
      setSubmissionId(d.submissionId || crypto.randomUUID());
    } catch {
      setAnswers({});
      setCode("");
      setSubmissionId(crypto.randomUUID());
      setError("Не удалось прочитать черновик. Можно заполнить форму заново.");
    }
    setReady(true);
  }
  useEffect(() => {
    load(
      new URLSearchParams(window.location.search).get("stage") === "T1"
        ? "T1"
        : "T0",
    );
  }, []);
  useEffect(() => {
    if (ready && !receipt)
      try {
        localStorage.setItem(
          draftKey(stage),
          JSON.stringify({ answers, code, submissionId }),
        );
      } catch {
        setError(
          "Браузер не сохраняет черновик. Не закрывайте страницу до отправки.",
        );
      }
  }, [answers, code, submissionId, stage, ready, receipt]);
  function change(id: string, v: string | number | string[]) {
    setAnswers((a) => ({ ...a, [id]: v }));
    setError("");
  }
  function clear(id: string) {
    setAnswers((a) => {
      const n = { ...a };
      delete n[id];
      return n;
    });
  }
  function question(q: Question) {
    const value = answers[q.id];
    return (
      <fieldset key={q.id} className="border-b border-kv-border pb-7 mb-7">
        <legend className="font-semibold mb-3 leading-relaxed">
          {q.id.replace(/^V/, "В").replace(/^I/, "И")}. {q.label}
        </legend>
        {q.hint && <p className="text-sm text-kv-muted mb-3">{q.hint}</p>}
        {q.maxChoices && (
          <p className="text-sm text-kv-muted mb-3">
            Не более {q.maxChoices} вариантов.
          </p>
        )}
        {q.options ? (
          <div className="space-y-2">
            {q.options.map((o) => (
              <label
                key={o.value}
                className="flex items-start gap-3 rounded-xl border border-kv-border p-3 cursor-pointer hover:bg-blue-50"
              >
                <input
                  className="mt-1 shrink-0"
                  type={q.kind === "multiple" ? "checkbox" : "radio"}
                  name={q.id}
                  checked={
                    q.kind === "multiple"
                      ? Array.isArray(value) && value.includes(o.value)
                      : value === o.value
                  }
                  onChange={() => {
                    if (q.kind !== "multiple") {
                      change(q.id, o.value);
                      return;
                    }
                    const current = Array.isArray(value) ? value : [];
                    let next = current.includes(o.value)
                      ? current.filter((v) => v !== o.value)
                      : q.exclusive?.includes(o.value)
                        ? [o.value]
                        : [
                            ...current.filter((v) => !q.exclusive?.includes(v)),
                            o.value,
                          ];
                    if (q.maxChoices && next.length > q.maxChoices) {
                      setError(
                        `В вопросе ${q.id} можно выбрать не более ${q.maxChoices} вариантов.`,
                      );
                      return;
                    }
                    change(q.id, next);
                  }}
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        ) : q.kind === "text" ? (
          <textarea
            aria-label={q.label}
            className="w-full rounded-xl border border-kv-border p-3 min-h-24"
            maxLength={q.maxLength || 1000}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => change(q.id, e.target.value)}
          />
        ) : (
          <input
            aria-label={q.label}
            className="rounded-xl border border-kv-border p-3 max-w-full"
            type={q.kind === "date" ? "date" : "number"}
            min={q.min}
            max={q.max}
            step={1}
            value={
              typeof value === "number" || typeof value === "string"
                ? value
                : ""
            }
            onChange={(e) =>
              change(
                q.id,
                e.target.value === ""
                  ? ""
                  : q.kind === "number"
                    ? Number(e.target.value)
                    : e.target.value,
              )
            }
          />
        )}
        {value !== undefined && value !== "" && (
          <button
            type="button"
            className="text-kv-blue text-sm underline mt-3"
            onClick={() => clear(q.id)}
          >
            Очистить ответ / пропустить
          </button>
        )}
      </fieldset>
    );
  }
  async function send() {
    setError("");
    if (!consent) {
      setError("Подтвердите добровольное участие.");
      setStep(0);
      return;
    }
    if ((code || stage === "T0") && !/^[A-Z0-9]{6}$/.test(code)) {
      setError("Введите код из 6 латинских букв или цифр.");
      setStep(0);
      return;
    }
    const a = cleanAnswers(stage, answers);
    if (typeof a.I3 === "number" && a.I3 > Number(a["I3.periodDays"] ?? 7)) {
      setError("Число активных дней не может превышать период наблюдения.");
      return;
    }
    if (
      a["I3.from"] &&
      a["I3.to"] &&
      (Date.parse(String(a["I3.to"])) - Date.parse(String(a["I3.from"]))) /
        86400000 +
        1 !==
        Number(a["I3.periodDays"] ?? 7)
    ) {
      setError("Уточните даты: они должны соответствовать числу дней периода.");
      return;
    }
    try {
      validate({
        instrumentVersion: "4.0",
        stage,
        participantCode: code,
        consentConfirmed: consent,
        submissionId,
        answers: a,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Проверьте ответы");
      return;
    }
    setBusy(true);
    try {
      const r = await submitSurvey({
        instrumentVersion: "4.0",
        stage,
        participantCode: code,
        consentConfirmed: consent,
        submissionId,
        answers: a,
      });
      setReceipt(r.id);
      try {
        localStorage.removeItem(draftKey(stage));
      } catch {}
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Не удалось сохранить. Попробуйте ещё раз.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <Link href="/cabinet" className="text-kv-blue underline">
          В кабинет
        </Link>
        <div className="mt-6 mb-7">
          <p className="text-kv-blue text-sm">Исследование · версия 4.0</p>
          <h1 className="text-3xl font-semibold mt-2">{schema.title}</h1>
          <p className="text-kv-muted mt-3">
            Индивидуальная анкета студентов педагогического технопарка
          </p>
        </div>
        <div
          role="status"
          className="rounded-2xl bg-amber-50 border border-amber-200 p-4 mb-6"
        >
          {surveyMode === "demo"
            ? "Демонстрационный режим. Ответы останутся только в этом браузере и не попадут исследователю. Для участия в исследовании потребуется подключённый сбор ответов."
            : surveyMode === "server"
              ? "Ответы будут переданы в хранилище исследования. Имя и учётная запись команды к анкете не прикрепляются."
              : "Сбор ответов ещё не настроен. Можно посмотреть форму, отправка недоступна."}
        </div>
        <div className="flex flex-wrap gap-3 mb-6">
          {(["T0", "T1"] as Stage[]).map((s) => (
            <button
              type="button"
              key={s}
              disabled={busy}
              aria-pressed={stage === s}
              onClick={() => load(s)}
              className={`rounded-full px-5 py-3 border ${stage === s ? "bg-kv-blue text-white" : "bg-white"}`}
            >
              {s} · {schema.stages[s].title}
            </button>
          ))}
        </div>
        {!ready ? (
          <p>Загрузка черновика…</p>
        ) : receipt ? (
          <section className="bg-white rounded-3xl p-7">
            <h2 className="text-2xl font-semibold">
              {surveyMode === "demo"
                ? "Сохранено в этом браузере"
                : "Ответы приняты"}
            </h2>
            <p className="mt-4">
              Этап: {stage}. Номер отправки:{" "}
              <span className="break-all">{receipt}</span>
            </p>
            {code && (
              <p className="mt-3">
                Ваш код: <strong>{code}</strong>. Сохраните его для
                сопоставления T0 и T1.
              </p>
            )}
            <p className="mt-3">Спасибо за участие!</p>
          </section>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step < form.sections.length) setStep(step + 1);
              else void send();
            }}
            className="bg-white rounded-3xl p-5 sm:p-9"
          >
            <p className="text-sm text-kv-muted mb-3">
              Шаг {step + 1} из {form.sections.length + 1} · вопросы можно
              пропускать
            </p>
            {step === 0 ? (
              <section>
                <h2 className="text-2xl font-semibold mb-4">{form.title}</h2>
                <p className="font-medium mb-3">{form.description}</p>
                <p className="leading-relaxed mb-6">{form.intro}</p>
                <label
                  className="block font-semibold"
                  htmlFor="participantCode"
                >
                  Личный код участника
                </label>
                <p className="text-sm text-kv-muted my-3">
                  6 латинских букв или цифр. Придумайте случайный код и
                  сохраните его до T1. Не используйте инициалы, дату рождения
                  или пароль.{" "}
                  {stage === "T1"
                    ? "Если код утрачен, оставьте поле пустым: ответ будет учтён без парного сопоставления."
                    : "Один код для входной и итоговой анкет."}
                </p>
                <div className="flex gap-3 flex-wrap">
                  <input
                    id="participantCode"
                    value={code}
                    maxLength={6}
                    autoComplete="off"
                    spellCheck={false}
                    onChange={(e) =>
                      setCode(
                        e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                      )
                    }
                    className="border rounded-xl p-3 tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setCode(makeCode())}
                    className="text-kv-blue underline"
                  >
                    Создать код
                  </button>
                </div>
                <p className="text-sm text-kv-muted mt-4">
                  Черновик сохраняется на этом устройстве. На общем компьютере
                  после завершения очистите данные сайта. Отправку до её
                  подтверждения можно отменить, закрыв страницу.
                </p>
                <label className="flex gap-3 mt-6">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    Я ознакомлен(а) с условиями и добровольно согласен(на)
                    участвовать в исследовании.
                  </span>
                </label>
              </section>
            ) : (
              <section>
                <h2
                  id="survey-step-title"
                  tabIndex={-1}
                  className="text-2xl font-semibold mb-4"
                >
                  {form.sections[step - 1].title}
                </h2>
                <p className="text-kv-muted mb-6">
                  {form.sections[step - 1].description}
                </p>
                {form.sections[step - 1].questions
                  .filter((q) => visible(q, answers))
                  .map(question)}
              </section>
            )}
            {error && (
              <p
                role="alert"
                className="bg-red-50 text-red-800 p-4 rounded-xl mt-5"
              >
                {error}
              </p>
            )}
            <button
              type="button"
              disabled={busy}
              className="mt-6 text-sm text-kv-muted underline"
              onClick={() => {
                localStorage.removeItem(draftKey(stage));
                load(stage);
              }}
            >
              Удалить черновик и начать заново
            </button>
            <div className="flex justify-between gap-4 mt-8">
              <button
                type="button"
                disabled={step === 0 || busy}
                className="disabled:opacity-30 text-kv-blue"
                onClick={() => {
                  setStep(step - 1);
                  setError("");
                }}
              >
                Назад
              </button>
              <button
                type="submit"
                disabled={
                  busy ||
                  (step === form.sections.length &&
                    surveyMode === "unconfigured")
                }
                className="btn-blue disabled:opacity-40"
              >
                {busy
                  ? "Сохраняем…"
                  : step === form.sections.length
                    ? surveyMode === "demo"
                      ? "Сохранить в браузере"
                      : "Отправить ответы"
                    : "Далее"}
              </button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
