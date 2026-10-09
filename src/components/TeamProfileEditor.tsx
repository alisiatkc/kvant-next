'use client'

import { CheckCircle2, Eye, HandHeart, ShieldCheck, UsersRound } from 'lucide-react'
import type { TeamProfile } from '@/lib/storage'

type Props = {
  teamName: string
  authors: string[]
  value: TeamProfile
  onChange: (profile: TeamProfile) => void
}

const COLORS = ['#2563eb', '#7c3aed', '#0f766e', '#c2410c', '#be185d', '#334155']
const EMBLEMS = ['◎', '◇', '△', '✦', '⬡', '○']
const COMPETENCIES = [
  'Проектирование',
  'Проведение исследования',
  'Разработка анкеты',
  'Анализ данных',
  'Прототипирование',
  '3D-моделирование',
  'Программирование',
  'Методическая разработка',
  'Апробация методики',
  'Фасилитация обсуждения',
]

function updateRole(profile: TeamProfile, member: string, role: string): TeamProfile {
  const roles = profile.memberRoles.filter((item) => item.member !== member)
  return { ...profile, memberRoles: [...roles, { member, role }] }
}

export default function TeamProfileEditor({ teamName, authors, value, onChange }: Props) {
  const toggleCompetency = (competency: string) => {
    const selected = value.competencies.includes(competency)
    onChange({
      ...value,
      competencies: selected
        ? value.competencies.filter((item) => item !== competency)
        : [...value.competencies, competency].slice(0, 4),
    })
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-[2.5rem] p-8">
        <span className="text-kv-blue text-xs font-semibold uppercase tracking-widest">Цифровая идентичность команды</span>
        <h3 className="text-[1.3rem] font-semibold mt-1 mb-2">Профиль команды</h3>
        <p className="text-kv-muted text-sm leading-relaxed max-w-[760px] mb-7">
          Оформите визитную карточку команды для проектного сообщества. Публикуются только выбранные сведения — рабочие файлы, чертежи и подробности разработки остаются внутри команды.
        </p>

        <div className="grid grid-cols-1 min-[900px]:grid-cols-[1fr_0.85fr] gap-6">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-kv-dark mb-2">Цвет команды</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Выбрать цвет ${color}`}
                    className={`w-10 h-10 rounded-full border-4 cursor-pointer transition-transform ${value.themeColor === color ? 'border-kv-dark scale-110' : 'border-white shadow-sm'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => onChange({ ...value, themeColor: color })}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-kv-dark mb-2">Эмблема</label>
              <div className="flex gap-2 flex-wrap">
                {EMBLEMS.map((emblem) => (
                  <button
                    key={emblem}
                    type="button"
                    className={`w-11 h-11 rounded-xl text-xl cursor-pointer transition-all ${value.emblem === emblem ? 'text-white shadow-sm' : 'bg-kv-light text-kv-dark border border-kv-border'}`}
                    style={value.emblem === emblem ? { backgroundColor: value.themeColor } : undefined}
                    onClick={() => onChange({ ...value, emblem })}
                  >
                    {emblem}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-kv-dark mb-2">Миссия команды</label>
              <textarea
                className="textarea-kv w-full min-h-[110px]"
                maxLength={240}
                value={value.mission}
                onChange={(event) => onChange({ ...value, mission: event.target.value })}
                placeholder="Какую полезную для образования задачу решает команда?"
              />
              <p className="text-xs text-kv-muted mt-1">{value.mission.length}/240</p>
            </div>
          </div>

          <div className="rounded-[2rem] overflow-hidden border border-kv-border bg-white self-start">
            <div className="h-3" style={{ backgroundColor: value.themeColor }} />
            <div className="p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl text-white text-2xl flex items-center justify-center" style={{ backgroundColor: value.themeColor }}>
                  {value.emblem}
                </div>
                <div>
                  <p className="text-xs text-kv-muted uppercase tracking-wide">Публичная карточка</p>
                  <h4 className="font-semibold text-lg">{teamName || 'Название команды'}</h4>
                </div>
              </div>
              <p className="text-sm text-kv-muted leading-relaxed">{value.mission || 'Кратко сформулируйте миссию команды.'}</p>
              <div className="mt-5 pt-5 border-t border-kv-border flex items-start gap-2 text-xs text-kv-muted">
                <Eye className="w-4 h-4 flex-shrink-0" /> Так профиль увидят другие команды.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-5">
        <div className="bg-white rounded-[2.5rem] p-8">
          <div className="flex items-center gap-2 mb-2">
            <UsersRound className="w-5 h-5 text-kv-blue" />
            <h3 className="text-[1.15rem] font-semibold">Роли участников</h3>
          </div>
          <p className="text-sm text-kv-muted mb-6">В сообществе отображаются названия ролей без ФИО участников.</p>
          <div className="space-y-3">
            {authors.map((member) => {
              const role = value.memberRoles.find((item) => item.member === member)?.role || ''
              return (
                <div key={member} className="rounded-2xl bg-kv-light p-4">
                  <p className="text-sm font-medium mb-2">{member}</p>
                  <input
                    className="input-kv bg-white"
                    maxLength={60}
                    value={role}
                    onChange={(event) => onChange(updateRole(value, member, event.target.value))}
                    placeholder="Например: исследователь, дизайнер, аналитик"
                  />
                </div>
              )
            })}
            {authors.length === 0 && <p className="text-sm text-kv-muted">Добавьте участников команды в паспорте.</p>}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-[2.5rem] p-8">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-kv-blue" />
              <h3 className="text-[1.15rem] font-semibold">Чем можем помочь</h3>
            </div>
            <p className="text-sm text-kv-muted mb-5">Выберите до четырёх компетенций, доступных другим командам.</p>
            <div className="flex flex-wrap gap-2">
              {COMPETENCIES.map((competency) => {
                const selected = value.competencies.includes(competency)
                return (
                  <button
                    key={competency}
                    type="button"
                    className={`px-3 py-2 rounded-full text-xs border cursor-pointer ${selected ? 'text-white border-transparent' : 'bg-white text-kv-muted border-kv-border'}`}
                    style={selected ? { backgroundColor: value.themeColor } : undefined}
                    onClick={() => toggleCompetency(competency)}
                  >
                    {competency}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8">
            <div className="flex items-center gap-2 mb-2">
              <HandHeart className="w-5 h-5 text-kv-blue" />
              <h3 className="text-[1.15rem] font-semibold">Запрос о помощи</h3>
            </div>
            <p className="text-sm text-kv-muted mb-4">Один конкретный запрос помогает другим командам понять, где они могут подключиться.</p>
            <textarea
              className="textarea-kv w-full min-h-[110px]"
              maxLength={180}
              value={value.helpRequest}
              onChange={(event) => onChange({ ...value, helpRequest: event.target.value })}
              placeholder="Например: ищем команду для проверки анкеты перед апробацией"
            />
            <p className="text-xs text-kv-muted mt-1">{value.helpRequest.length}/180</p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] bg-[#eef3ff] border border-[#2b3b6b20] px-6 py-5 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-kv-blue mt-0.5 flex-shrink-0" />
        <p className="text-sm text-kv-text leading-relaxed">
          Профиль сохраняется автоматически. Для публичной карточки используются только миссия, девиз, роли без ФИО, компетенции и запрос о помощи.
        </p>
      </div>
    </div>
  )
}
