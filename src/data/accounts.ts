export type TeamAccount = {
  code: string
  password: string
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

export const TEAM_ACCOUNTS: TeamAccount[] = [
  { code: 'kvant-01', password: 'konstr24', teamName: 'Команда «Конструктор»',   track: 'А1', curatorLogin: 'curator'  },
  { code: 'kvant-02', password: 'issled24', teamName: 'Команда «Исследователи»', track: 'А2', curatorLogin: 'curator'  },
  { code: 'kvant-03', password: 'pedag24',  teamName: 'Команда «Педагоги»',      track: 'А1', curatorLogin: 'curator2' },
]

export const CURATOR_ACCOUNTS: CuratorAccount[] = [
  { login: 'curator',  password: 'curator123', name: 'Кузнецова Ирина Сергеевна', id: 'c1' },
  { login: 'curator2', password: 'curator456', name: 'Смирнов Андрей Николаевич', id: 'c2' },
]
