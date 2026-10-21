import {
  BookOpenCheck,
  Code2,
  FlaskConical,
  Lightbulb,
  Shapes,
  UsersRound,
} from 'lucide-react'

export const TEAM_ICON_OPTIONS = [
  { id: 'idea', label: 'Идея', Icon: Lightbulb },
  { id: 'research', label: 'Исследование', Icon: FlaskConical },
  { id: 'digital', label: 'Цифровой проект', Icon: Code2 },
  { id: 'design', label: 'Конструирование', Icon: Shapes },
  { id: 'method', label: 'Методическая работа', Icon: BookOpenCheck },
  { id: 'team', label: 'Командная работа', Icon: UsersRound },
] as const

type Props = {
  icon: string
  className?: string
}

export default function TeamProfileIcon({ icon, className = 'w-6 h-6' }: Props) {
  const option = TEAM_ICON_OPTIONS.find((item) => item.id === icon) || TEAM_ICON_OPTIONS[0]
  return <option.Icon className={className} aria-hidden="true" />
}
