"use strict";
const schema = require("./methodology-survey.json");
function questions(stage) {
  return schema.stages[stage].sections.flatMap((s) => s.questions);
}
function visible(q, answers) {
  if (q.hideWhen && answers[q.hideWhen.question] === q.hideWhen.equals)
    return false;
  if (q.showWhen) {
    const value = answers[q.showWhen.question];
    return q.showWhen.includes.some((v) =>
      Array.isArray(value) ? value.includes(v) : value === v,
    );
  }
  return true;
}
function validate(input) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw Error("Неверный формат анкеты");
  if (
    Object.keys(input).some(
      (k) =>
        ![
          "instrumentVersion",
          "stage",
          "participantCode",
          "consentConfirmed",
          "submissionId",
          "answers",
        ].includes(k),
    )
  )
    throw Error("Неизвестные поля анкеты");
  if (input.instrumentVersion !== "4.0" || !["T0", "T1"].includes(input.stage))
    throw Error("Неверная версия или этап");
  if (input.consentConfirmed !== true)
    throw Error("Необходимо согласие на участие");
  if (typeof input.participantCode !== "string")
    throw Error("Неверный код участника");
  const code = input.participantCode.trim().toUpperCase();
  if ((code || input.stage === "T0") && !/^[A-Z0-9]{6}$/.test(code))
    throw Error("Код: 6 латинских букв или цифр");
  if (
    typeof input.submissionId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      input.submissionId,
    )
  )
    throw Error("Неверный номер отправки");
  const source = input.answers;
  if (!source || typeof source !== "object" || Array.isArray(source))
    throw Error("Неверный формат ответов");
  const list = questions(input.stage);
  if (Object.keys(source).some((k) => !list.some((q) => q.id === k)))
    throw Error("Неизвестный вопрос");
  const answers = {};
  for (const q of list) {
    const v = source[q.id];
    if (
      !visible(q, source) ||
      v === undefined ||
      v === "" ||
      (Array.isArray(v) && !v.length)
    )
      continue;
    if (q.kind === "single") {
      if (typeof v !== "string" || !q.options.some((o) => o.value === v))
        throw Error(`Неверный ответ: ${q.id}`);
    } else if (q.kind === "multiple") {
      if (
        !Array.isArray(v) ||
        v.some(
          (x) => typeof x !== "string" || !q.options.some((o) => o.value === x),
        ) ||
        new Set(v).size !== v.length ||
        v.length > (q.maxChoices || q.options.length) ||
        (v.length > 1 && (q.exclusive || []).some((x) => v.includes(x)))
      )
        throw Error(`Проверьте выбор: ${q.id}`);
    } else if (q.kind === "number") {
      if (
        typeof v !== "number" ||
        !Number.isInteger(v) ||
        v < q.min ||
        v > q.max
      )
        throw Error(`Число вне диапазона: ${q.id}`);
    } else if (q.kind === "date") {
      if (
        typeof v !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
        !Number.isFinite(Date.parse(v)) ||
        new Date(v).toISOString().slice(0, 10) !== v
      )
        throw Error(`Неверная дата: ${q.id}`);
    } else if (typeof v !== "string" || v.length > (q.maxLength || 1000))
      throw Error(`Слишком длинный ответ: ${q.id}`);
    answers[q.id] = typeof v === "string" ? v.trim() : v;
  }
  const period = answers["I3.periodDays"] ?? 7;
  if (answers.I3 > period)
    throw Error("Число активных дней превышает период наблюдения");
  if (answers["I3.from"] && answers["I3.to"]) {
    const days =
      (Date.parse(answers["I3.to"]) - Date.parse(answers["I3.from"])) /
        86400000 +
      1;
    if (days !== period)
      throw Error("Даты должны соответствовать числу дней периода");
  }
  return { ...input, participantCode: code, answers };
}
module.exports = { schema, questions, visible, validate };
