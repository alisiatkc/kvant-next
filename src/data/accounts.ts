export type StudentAccount = {
  name: string
  teamName: string
  track: 'А1' | 'А2'
  curatorLogin: string
}

export type CuratorAccount = {
  login: string
  password: string
  name: string
  id: string
}

export const STUDENT_ACCOUNTS: StudentAccount[] = [
  { name: 'Ткаченко Алиса',    teamName: 'Команда «Конструктор»',   track: 'А1', curatorLogin: 'curator'  },
  { name: 'Петрова Мария',     teamName: 'Команда «Конструктор»',   track: 'А1', curatorLogin: 'curator'  },
  { name: 'Иванов Сергей',     teamName: 'Команда «Исследователи»', track: 'А2', curatorLogin: 'curator'  },
  { name: 'Сидорова Анна',     teamName: 'Команда «Исследователи»', track: 'А2', curatorLogin: 'curator'  },
  { name: 'Козлов Дмитрий',    teamName: 'Команда «Педагоги»',      track: 'А1', curatorLogin: 'curator2' },
  { name: 'Новикова Елена',    teamName: 'Команда «Педагоги»',      track: 'А1', curatorLogin: 'curator2' },
]

export const CURATOR_ACCOUNTS: CuratorAccount[] = [
  { login: 'curator',  password: 'curator123', name: 'Кузнецова Ирина Сергеевна', id: 'c1' },
  { login: 'curator2', password: 'curator456', name: 'Смирнов Андрей Николаевич', id: 'c2' },
]
