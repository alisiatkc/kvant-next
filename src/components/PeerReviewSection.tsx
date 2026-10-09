'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  MessageCircle,
  RefreshCw,
  Send,
  Star,
  UsersRound,
} from 'lucide-react'
import {
  type CommunityProject,
  type PeerReview,
  type PeerReviewScores,
  getCommunityProjects,
  getPeerReviews,
  savePeerReview,
} from '@/lib/storage'

type Props = {
  mode: 'student' | 'curator'
  currentTeamCode?: string
  currentTeamName?: string
}

const CRITERIA: Array<{ key: keyof PeerReviewScores; label: string; hint: string }> = [
  { key: 'problemClarity', label: 'Ясность проблемы', hint: 'Понятно, какую задачу решает проект' },
  { key: 'resultQuality', label: 'Качество результата', hint: 'Результат соответствует заявленному замыслу' },
  { key: 'applicability', label: 'Применимость', hint: 'Решение можно использовать или воспроизвести' },
  { key: 'presentation', label: 'Представление проекта', hint: 'Материалы и логика проекта понятны другой команде' },
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
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [scores, setScores] = useState<PeerReviewScores>(EMPTY_SCORES)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [projectData, reviewData] = await Promise.all([
        getCommunityProjects(),
        getPeerReviews(),
      ])
      setProjects(projectData)
      setReviews(reviewData)
      setSelectedProjectId((current) =>
        current && projectData.some((project) => project.id === current)
          ? current
          : projectData.find((project) => project.teamCode !== currentTeamCode)?.id || projectData[0]?.id || '',
      )
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить проекты сообщества')
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

  useEffect(() => {
    if (mode !== 'student' || !selectedProjectId) return
    const existing = reviews.find(
      (review) => review.projectId === selectedProjectId && review.reviewerTeamCode === currentTeamCode,
    )
    setScores(existing?.scores || EMPTY_SCORES)
    setComment(existing?.comment || '')
    setNotice('')
    setError('')
  }, [currentTeamCode, mode, reviews, selectedProjectId])

  const submit = async () => {
    if (!selectedProject) return
    setSaving(true)
    setNotice('')
    setError('')
    try {
      const saved = await savePeerReview({ projectId: selectedProject.id, scores, comment })
      setReviews((items) => [...items.filter((item) => item.id !== saved.id), saved])
      setNotice('Взаимооценивание сохранено. Команда проекта и куратор увидят обратную связь.')
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Не удалось сохранить взаимооценивание')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-[2.5rem] p-8 flex items-center gap-3 text-kv-muted">
        <RefreshCw className="w-5 h-5 animate-spin" /> Загружаем проекты сообщества…
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
              {mode === 'student' ? 'Взаимная экспертиза проектов' : 'Взаимооценивание команд'}
            </h3>
            <p className="text-kv-muted text-sm leading-relaxed max-w-[760px]">
              {mode === 'student'
                ? 'Изучите решение другой команды, оцените его по единым критериям и оставьте конкретную рекомендацию. Оценивается проектное решение, а не личные качества участников.'
                : 'Здесь собрана горизонтальная обратная связь между командами. Она дополняет экспертную оценку куратора, но не заменяет её.'}
            </p>
          </div>
          <button className="btn-secondary flex items-center gap-2" onClick={load}>
            <RefreshCw className="w-4 h-4" /> Обновить
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl bg-[#ffebee] px-5 py-4 text-sm text-[#c62828]">
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="rounded-[1.75rem] bg-kv-light py-14 text-center text-kv-muted">
            <UsersRound className="w-10 h-10 mx-auto mb-3 opacity-30" />
            Пока нет проектов, открытых для взаимной экспертизы.
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[760px]:grid-cols-2 gap-4">
            {projects.map((project) => {
              const count = reviews.filter((review) => review.projectId === project.id).length
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
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-xs font-semibold text-kv-blue">{project.projectBlock || 'Проект'}</span>
                    {own && <span className="text-[10px] uppercase tracking-wide text-kv-muted">Ваш проект</span>}
                  </div>
                  <h4 className="font-semibold text-kv-dark mb-1">{project.projectName}</h4>
                  <p className="text-xs text-kv-muted mb-3">{project.teamName} · трек {project.track}</p>
                  <p className="text-sm text-kv-text leading-relaxed line-clamp-3">{project.projectDesc}</p>
                  <div className="flex items-center gap-4 mt-4 text-xs text-kv-muted">
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> {count}</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" />
                      {rating === null ? 'Нет оценки' : rating.toFixed(1)}
                    </span>
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
            <span className="text-kv-blue text-xs font-semibold uppercase tracking-widest">Выбранный проект</span>
            <h3 className="text-[1.3rem] font-semibold mt-1 mb-2">{selectedProject.projectName}</h3>
            <p className="text-kv-muted text-sm mb-5">{selectedProject.teamName}</p>
            <p className="text-kv-text text-sm leading-relaxed mb-7">{selectedProject.projectDesc}</p>

            {mode === 'student' && selectedProject.teamCode === currentTeamCode ? (
              <div className="rounded-2xl bg-kv-light px-5 py-4 text-sm text-kv-muted">
                Свою работу оценивать нельзя. Выберите проект другой команды.
              </div>
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
                  <label className="block text-sm font-semibold text-kv-dark mb-2">
                    Содержательный комментарий
                  </label>
                  <textarea
                    className="textarea-kv w-full min-h-[130px]"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    maxLength={1200}
                    placeholder="Что особенно удалось? Что стоит уточнить или доработать? Предложите конкретный следующий шаг."
                  />
                  <p className="text-xs text-kv-muted mt-1">{comment.length}/1200 · минимум 20 символов</p>
                </div>

                {notice && (
                  <div className="rounded-2xl bg-[#e8f5e9] px-5 py-4 text-sm text-[#2e7d32] flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> {notice}
                  </div>
                )}

                <button className="btn-blue flex items-center gap-2" onClick={submit} disabled={saving}>
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Сохранить взаимооценивание
                </button>
                {currentTeamName && (
                  <p className="text-xs text-kv-muted">Отзыв будет опубликован от имени команды «{currentTeamName}».</p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-kv-light px-5 py-4 text-sm text-kv-muted">
                Средняя оценка: {projectAverage(selectedProject.id, reviews)?.toFixed(1) || '—'} из 5.
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] p-8">
            <div className="flex items-center gap-2 mb-6">
              <MessageCircle className="w-5 h-5 text-kv-blue" />
              <h3 className="text-[1.15rem] font-semibold">Комментарии команд ({selectedReviews.length})</h3>
            </div>
            {selectedReviews.length === 0 ? (
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
