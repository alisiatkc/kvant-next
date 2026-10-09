'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  Send,
  Star,
  UsersRound,
} from 'lucide-react'
import {
  type CommunityMessage,
  type CommunityProject,
  type PeerReview,
  type PeerReviewScores,
  getCommunityMessages,
  getCommunityProjects,
  getPeerReviews,
  saveCommunityMessage,
  savePeerReview,
} from '@/lib/storage'

type Props = {
  mode: 'student' | 'curator'
  currentTeamCode?: string
  currentTeamName?: string
}

const CRITERIA: Array<{ key: keyof PeerReviewScores; label: string; hint: string }> = [
  { key: 'problemClarity', label: 'Ясность проблемы', hint: 'Понятно, какую задачу решает проект' },
  { key: 'resultQuality', label: 'Качество промежуточного результата', hint: 'Результат соответствует текущему этапу работы' },
  { key: 'applicability', label: 'Потенциал применения', hint: 'Понятно, где решение может быть полезно' },
  { key: 'presentation', label: 'Понятность представления', hint: 'Карточка прогресса понятна другой команде' },
]

const EMPTY_SCORES: PeerReviewScores = {
  problemClarity: 0,
  resultQuality: 0,
  applicability: 0,
  presentation: 0,
}

function average(scores: PeerReviewScores): number {
  const values = Object.values(scores)
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function projectAverage(projectId: string, reviews: PeerReview[]): number | null {
  const projectReviews = reviews.filter((review) => review.projectId === projectId)
  if (projectReviews.length === 0) return null
  return projectReviews.reduce((sum, review) => sum + average(review.scores), 0) / projectReviews.length
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Дата не указана'
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function PeerReviewSection({ mode, currentTeamCode = '', currentTeamName = '' }: Props) {
  const [projects, setProjects] = useState<CommunityProject[]>([])
  const [reviews, setReviews] = useState<PeerReview[]>([])
  const [messages, setMessages] = useState<CommunityMessage[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [scores, setScores] = useState<PeerReviewScores>(EMPTY_SCORES)
  const [comment, setComment] = useState('')
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [projectData, reviewData, messageData] = await Promise.all([
        getCommunityProjects(),
        getPeerReviews(),
        getCommunityMessages(),
      ])
      setProjects(projectData)
      setReviews(reviewData)
      setMessages(messageData)
      setSelectedProjectId((current) =>
        current && projectData.some((project) => project.id === current)
          ? current
          : projectData.find((project) => project.teamCode !== currentTeamCode)?.id || projectData[0]?.id || '',
      )
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить проектное сообщество')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  )

  const selectedReviews = useMemo(
    () => reviews.filter((review) => review.projectId === selectedProjectId),
    [reviews, selectedProjectId],
  )

  const selectedMessages = useMemo(
    () => messages
      .filter((message) => message.projectId === selectedProjectId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages, selectedProjectId],
  )

  useEffect(() => {
    if (mode !== 'student' || !selectedProjectId) return
    const existing = reviews.find(
      (review) => review.projectId === selectedProjectId && review.reviewerTeamCode === currentTeamCode,
    )
    setScores(existing?.scores || EMPTY_SCORES)
    setComment(existing?.comment || '')
    setMessageText('')
    setNotice('')
    setError('')
  }, [currentTeamCode, mode, reviews, selectedProjectId])

  const submitReview = async () => {
    if (!selectedProject) return
    setSaving(true)
    setNotice('')
    setError('')
    try {
      const saved = await savePeerReview({ projectId: selectedProject.id, scores, comment })
      setReviews((items) => [...items.filter((item) => item.id !== saved.id), saved])
      setNotice('Взаимооценивание сохранено. Команда проекта и куратор увидят рекомендацию.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось сохранить взаимооценивание')
    } finally {
      setSaving(false)
    }
  }

  const submitMessage = async () => {
    if (!selectedProject) return
    setSaving(true)
    setNotice('')
    setError('')
    try {
      const saved = await saveCommunityMessage({ projectId: selectedProject.id, text: messageText })
      setMessages((items) => [...items, saved])
      setMessageText('')
      setNotice('Вопрос добавлен в межпоточное обсуждение.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось отправить вопрос')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-[2.5rem] p-8 flex items-center gap-3 text-kv-muted">
        <RefreshCw className="w-5 h-5 animate-spin" /> Загружаем проектное сообщество…
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-[2.5rem] p-8">
        <div className="flex items-start justify-between gap-5 flex-wrap mb-7">
          <div>
            <span className="text-kv-blue text-xs font-semibold uppercase tracking-widest">Горизонтальное взаимодействие</span>
            <h3 className="text-[1.3rem] font-semibold mt-1 mb-2">
              {mode === 'student' ? 'Проектное сообщество' : 'Взаимодействие команд'}
            </h3>
            <p className="text-kv-muted text-sm leading-relaxed max-w-[780px]">
              {mode === 'student'
                ? 'В текущих проектах виден только прогресс и безопасное описание. Рабочие файлы, чертежи и исходные материалы закрыты. Завершённым командам прошлых потоков можно задать вопрос об их опыте.'
                : 'Среда показывает движение проектов, взаимную экспертизу текущих команд и вопросы к командам прошлых потоков. Рейтинг относится к проектному решению, а не к личности студента.'}
            </p>
          </div>
          <button className="btn-secondary flex items-center gap-2" onClick={load}>
            <RefreshCw className="w-4 h-4" /> Обновить
          </button>
        </div>

        <div className="rounded-2xl bg-[#f8fafc] border border-[#cbd5e1] px-5 py-4 mb-6 flex items-start gap-3">
          <LockKeyhole className="w-5 h-5 text-kv-blue mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-kv-dark">Защита проектных материалов</p>
            <p className="text-xs text-kv-muted leading-relaxed mt-1">
              В сообществе не публикуются файлы, чертежи, состав комплектов и подробные технические решения. Доступ к ним возможен только после согласия команды или публикации итогового КОП.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl bg-[#ffebee] px-5 py-4 text-sm text-[#c62828]">{error}</div>
        )}

        {projects.length === 0 ? (
          <div className="rounded-[1.75rem] bg-kv-light py-14 text-center text-kv-muted">
            <UsersRound className="w-10 h-10 mx-auto mb-3 opacity-30" />
            Пока нет проектов, открытых для сообщества.
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[760px]:grid-cols-2 gap-4">
            {projects.map((project) => {
              const count = project.isArchive
                ? messages.filter((message) => message.projectId === project.id).length
                : reviews.filter((review) => review.projectId === project.id).length
              const rating = projectAverage(project.id, reviews)
              const own = project.teamCode === currentTeamCode
              const selected = project.id === selectedProjectId
              return (
                <button
                  key={project.id}
                  className={`text-left rounded-[1.75rem] border p-5 cursor-pointer transition-all ${
                    selected ? 'border-kv-blue bg-[#f6f8ff] shadow-sm' : 'border-kv-border bg-white hover:bg-kv-light'
                  }`}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  {project.teamProfile && (
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className="w-10 h-10 rounded-xl text-white text-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: project.teamProfile.themeColor }}
                      >
                        {project.teamProfile.emblem}
                      </span>
                      <span className="text-xs font-medium text-kv-dark line-clamp-2">{project.teamName}</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-xs font-semibold text-kv-blue">
                      {project.isArchive ? `Архив · поток ${project.cohort}` : project.projectBlock || 'Проект'}
                    </span>
                    {own && <span className="text-[10px] uppercase tracking-wide text-kv-muted">Ваш проект</span>}
                  </div>
                  <h4 className="font-semibold text-kv-dark mb-1">{project.projectName}</h4>
                  <p className="text-xs text-kv-muted mb-3">{project.teamName} · трек {project.track}</p>
                  <p className="text-sm text-kv-text leading-relaxed line-clamp-3">{project.publicSummary}</p>
                  {project.teamProfile?.helpRequest && (
                    <div className="mt-3 rounded-xl bg-[#fff7ed] px-3 py-2 text-xs text-[#9a3412]">
                      <span className="font-semibold">Ищем помощь:</span> {project.teamProfile.helpRequest}
                    </div>
                  )}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-kv-muted">{project.progressStage}</span>
                      <span className="font-semibold text-kv-blue">{project.progressPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-kv-light overflow-hidden">
                      <div className="h-full rounded-full bg-kv-blue" style={{ width: `${project.progressPercent}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-xs text-kv-muted">
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {count}</span>
                    {!project.isArchive && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />
                        {rating === null ? 'Нет оценки' : rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selectedProject && (
        <div className="grid grid-cols-1 min-[920px]:grid-cols-[1.05fr_0.95fr] gap-5">
          <div className="bg-white rounded-[2.5rem] p-8">
            <span className="text-kv-blue text-xs font-semibold uppercase tracking-widest">
              {selectedProject.isArchive ? 'Команда прошлого потока' : 'Карточка прогресса'}
            </span>
            <h3 className="text-[1.3rem] font-semibold mt-1 mb-2">{selectedProject.projectName}</h3>
            <p className="text-kv-muted text-sm mb-5">
              {selectedProject.teamName} · поток {selectedProject.cohort}
            </p>
            <p className="text-kv-text text-sm leading-relaxed mb-5">{selectedProject.publicSummary}</p>
            {selectedProject.teamProfile && (
              <div className="rounded-2xl border border-kv-border overflow-hidden mb-5">
                <div className="h-2" style={{ backgroundColor: selectedProject.teamProfile.themeColor }} />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="w-11 h-11 rounded-xl text-white text-xl flex items-center justify-center"
                      style={{ backgroundColor: selectedProject.teamProfile.themeColor }}
                    >
                      {selectedProject.teamProfile.emblem}
                    </span>
                    <div>
                      <p className="font-semibold text-kv-dark">{selectedProject.teamName}</p>
                      <p className="text-xs text-kv-muted">Визитная карточка команды</p>
                    </div>
                  </div>
                  {selectedProject.teamProfile.mission && (
                    <p className="text-sm text-kv-text leading-relaxed mb-4">{selectedProject.teamProfile.mission}</p>
                  )}
                  {selectedProject.teamProfile.memberRoles.some((item) => item.role.trim()) && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-kv-muted uppercase tracking-wide mb-2">Роли в команде</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.teamProfile.memberRoles.filter((item) => item.role.trim()).map((item, index) => (
                          <span key={`${item.role}-${index}`} className="px-3 py-1.5 rounded-full bg-kv-light text-xs text-kv-dark">{item.role}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedProject.teamProfile.competencies.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-kv-muted uppercase tracking-wide mb-2">Можем помочь</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.teamProfile.competencies.map((competency) => (
                          <span key={competency} className="px-3 py-1.5 rounded-full text-xs text-white" style={{ backgroundColor: selectedProject.teamProfile?.themeColor }}>
                            {competency}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedProject.teamProfile.helpRequest && (
                    <div className="rounded-xl bg-[#fff7ed] px-4 py-3 text-sm text-[#9a3412]">
                      <span className="font-semibold">Запрос о помощи:</span> {selectedProject.teamProfile.helpRequest}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="rounded-2xl bg-kv-light px-5 py-4 text-sm mb-7">
              <span className="font-semibold text-kv-dark">{selectedProject.progressStage}</span>
              <span className="text-kv-muted"> · {selectedProject.progressPercent}% выполнения</span>
            </div>

            {mode === 'student' && selectedProject.teamCode === currentTeamCode ? (
              <div className="rounded-2xl bg-kv-light px-5 py-4 text-sm text-kv-muted">
                Для своей команды здесь отображается только публичная карточка. Оценивать собственный проект нельзя.
              </div>
            ) : selectedProject.isArchive ? (
              mode === 'student' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-kv-dark mb-2">Вопрос команде прошлого потока</label>
                    <textarea
                      className="textarea-kv w-full min-h-[130px]"
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      maxLength={800}
                      placeholder="Спросите о принятом решении, организации работы, апробации или трудности, с которой столкнулась команда."
                    />
                    <p className="text-xs text-kv-muted mt-1">{messageText.length}/800 · минимум 10 символов</p>
                  </div>
                  {notice && (
                    <div className="rounded-2xl bg-[#e8f5e9] px-5 py-4 text-sm text-[#2e7d32] flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> {notice}
                    </div>
                  )}
                  <button className="btn-blue flex items-center gap-2" onClick={submitMessage} disabled={saving}>
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Отправить вопрос
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl bg-kv-light px-5 py-4 text-sm text-kv-muted">
                  Команда прошлого потока добровольно оставила проект в архиве и открыла обсуждение для новых участников.
                </div>
              )
            ) : mode === 'student' ? (
              <div className="space-y-5">
                {CRITERIA.map((criterion) => (
                  <div key={criterion.key}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-kv-dark">{criterion.label}</p>
                        <p className="text-xs text-kv-muted">{criterion.hint}</p>
                      </div>
                      <span className="text-sm font-semibold text-kv-blue">{scores[criterion.key] || '—'}/5</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          className={`w-9 h-9 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                            scores[criterion.key] === value
                              ? 'bg-kv-blue text-white border-kv-blue'
                              : 'bg-white text-kv-dark border-kv-border hover:border-kv-blue'
                          }`}
                          onClick={() => setScores((current) => ({ ...current, [criterion.key]: value }))}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-semibold text-kv-dark mb-2">Рекомендация другой команде</label>
                  <textarea
                    className="textarea-kv w-full min-h-[130px]"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    maxLength={1200}
                    placeholder="Что понятно уже сейчас? Что стоит уточнить? Предложите один конкретный следующий шаг."
                  />
                  <p className="text-xs text-kv-muted mt-1">{comment.length}/1200 · минимум 20 символов</p>
                </div>

                {notice && (
                  <div className="rounded-2xl bg-[#e8f5e9] px-5 py-4 text-sm text-[#2e7d32] flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> {notice}
                  </div>
                )}

                <button className="btn-blue flex items-center gap-2" onClick={submitReview} disabled={saving}>
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Сохранить взаимооценивание
                </button>
                {currentTeamName && (
                  <p className="text-xs text-kv-muted">Отзыв будет опубликован от имени команды «{currentTeamName}».</p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-kv-light px-5 py-4 text-sm text-kv-muted">
                Средняя оценка текущего проектного решения: {projectAverage(selectedProject.id, reviews)?.toFixed(1) || '—'} из 5.
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] p-8">
            <div className="flex items-center gap-2 mb-6">
              <MessageCircle className="w-5 h-5 text-kv-blue" />
              <h3 className="text-[1.15rem] font-semibold">
                {selectedProject.isArchive
                  ? `Межпоточное обсуждение (${selectedMessages.length})`
                  : `Рекомендации команд (${selectedReviews.length})`}
              </h3>
            </div>

            {selectedProject.isArchive ? (
              selectedMessages.length === 0 ? (
                <div className="py-12 text-center text-kv-muted text-sm">Пока нет вопросов к этой команде.</div>
              ) : (
                <div className="space-y-4">
                  {selectedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-[1.5rem] border p-5 ${
                        message.authorTeamCode === selectedProject.teamCode
                          ? 'border-[#c7d2fe] bg-[#f6f8ff]'
                          : 'border-kv-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="font-semibold text-sm text-kv-dark">
                          {message.authorTeamName}
                          {message.authorTeamCode === selectedProject.teamCode && (
                            <span className="ml-2 text-[10px] uppercase tracking-wide text-kv-blue">авторы проекта</span>
                          )}
                        </p>
                        <p className="text-xs text-kv-muted">{formatDate(message.createdAt)}</p>
                      </div>
                      <p className="text-sm text-kv-text leading-relaxed">{message.text}</p>
                    </div>
                  ))}
                </div>
              )
            ) : selectedReviews.length === 0 ? (
              <div className="py-12 text-center text-kv-muted text-sm">Пока нет взаимных оценок.</div>
            ) : (
              <div className="space-y-4">
                {selectedReviews
                  .slice()
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((review) => (
                    <div key={review.id} className="rounded-[1.5rem] border border-kv-border p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-semibold text-sm text-kv-dark">{review.reviewerTeamName}</p>
                          <p className="text-xs text-kv-muted">{formatDate(review.createdAt)}</p>
                        </div>
                        <span className="flex items-center gap-1 rounded-full bg-kv-light px-3 py-1 text-xs font-semibold text-kv-blue">
                          <Star className="w-3.5 h-3.5" /> {average(review.scores).toFixed(1)}
                        </span>
                      </div>
                      <p className="text-sm text-kv-text leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
