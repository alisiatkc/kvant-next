export const workshops = [
  {
    icon: 'Zap',
    title: 'Лазерные технологии',
    desc: 'Резка, гравировка и работа с разными материалами. Познакомитесь с оборудованием и создадите макет.',
    video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    icon: 'Box',
    title: 'Аддитивные технологии',
    desc: '3D-печать, постобработка, настройка оборудования. Узнаете о современных технологиях прототипирования.',
    video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    icon: 'PenLine',
    title: 'Векторная графика',
    desc: 'Inkscape, CorelDRAW — подготовка макетов для лазера и плоттера. Научитесь создавать векторные изображения.',
    video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    icon: 'Hexagon',
    title: 'Промышленный дизайн',
    desc: 'Эскизирование, 3D-моделирование, эргономика. Разработаете концепцию продукта.',
    video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    icon: 'Code',
    title: 'Программирование',
    desc: 'Arduino, Python для устройств, автоматизация. Напишете код для первого устройства.',
    video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
  {
    icon: 'Wrench',
    title: 'Прототипирование',
    desc: 'Быстрая сборка макетов, электроника, отладка. Соберёте рабочий прототип за час.',
    video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
]

export const docs = [
  { icon: 'Shield', title: 'Техника безопасности', desc: 'Инструктаж, работа с оборудованием', image: '🔒' },
  { icon: 'CheckCircle', title: 'Правила работы', desc: 'Кодекс участника, расписание', image: '📋' },
  { icon: 'Layers', title: 'AGILE', desc: 'Гибкие методологии, итерации', image: '🔄' },
  { icon: 'Columns2', title: 'KANBAN', desc: 'Визуализация задач, WIP', image: '📊' },
  { icon: 'FileText', title: 'Подготовка файлов', desc: 'Именование, форматы, облака', image: '📁' },
]

export const contacts = [
  { icon: 'MapPin', text: 'наб. Реки Мойки 48-52, корпус 1', link: 'https://yandex.ru/maps/?text=%D0%BD%D0%B0%D0%B1.+%D0%A0%D0%B5%D0%BA%D0%B8+%D0%9C%D0%BE%D0%B9%D0%BA%D0%B8+48-52' },
  { icon: 'Globe', text: 'technopark.herzen.spb.ru', link: 'https://technopark.herzen.spb.ru' },
  { icon: 'Mail', text: 'technopark.herzen@yandex.ru', link: 'mailto:technopark.herzen@yandex.ru' },
  { icon: 'MessageCircle', text: 'Общий чат ВК', link: 'https://vk.com/technoparkrgpu' },
  { icon: 'Hash', text: 'Чат Кванториума', link: '#' },
  { icon: 'MessageSquare', text: 'Связь с куратором', link: '#' },
]

export type FileItem = {
  name: string
  size: string
  icon: string
}

export type Project = {
  id: number
  title: string
  excerpt: string
  fullDesc: string
  subject: string
  authors: string[]
  files: FileItem[]
  image: string
  tech: string[]
  contact: string
  likes: number
}

export const projects: Project[] = [
  {
    id: 1,
    title: 'Геометрический конструктор',
    excerpt: 'Набор для изучения стереометрии',
    fullDesc: 'Деревянные детали для сборки многогранников. Помогает визуализировать пространственные фигуры. В комплекте: 20 деталей, инструкция, методические материалы.',
    subject: 'math',
    authors: ['Иванов Иван', 'Петрова Анна', 'Сидоров Петр'],
    files: [
      { name: 'Куб.dxf', size: '0.3 МБ', icon: 'File' },
      { name: 'Пирамида.dxf', size: '0.4 МБ', icon: 'File' },
      { name: 'Инструкция.pdf', size: '2.1 МБ', icon: 'FileText' },
    ],
    image: '📐',
    tech: ['Лазерная резка', 'Фанера 3мм', 'AutoCAD'],
    contact: 'https://vk.com/technoparkrgpu',
    likes: 0,
  },
  {
    id: 2,
    title: 'Модель ДНК',
    excerpt: 'Сборная модель молекулы ДНК',
    fullDesc: 'Образовательный набор для изучения генетики. Содержит все элементы двойной спирали. Подходит для уроков биологии в 9–11 классах.',
    subject: 'bio',
    authors: ['Сидорова Мария', 'Козлова Елена'],
    files: [
      { name: 'ДНК.stl', size: '5.2 МБ', icon: 'File' },
      { name: 'Основания.stl', size: '3.1 МБ', icon: 'File' },
      { name: 'Методичка.pdf', size: '1.8 МБ', icon: 'FileText' },
    ],
    image: '🧬',
    tech: ['3D-печать', 'PLA пластик', 'Blender'],
    contact: 'https://vk.com/technoparkrgpu',
    likes: 0,
  },
  {
    id: 3,
    title: 'Электрическая цепь',
    excerpt: 'Набор для сборки простых схем',
    fullDesc: 'Комплект для изучения электричества: провода, лампочки, выключатели на деревянной основе. Все элементы крепятся на магнитах.',
    subject: 'physics',
    authors: ['Козлов Петр', 'Морозов Илья', 'Волкова Анна'],
    files: [
      { name: 'Плата.dxf', size: '0.8 МБ', icon: 'File' },
      { name: 'Схема.pdf', size: '0.5 МБ', icon: 'FileText' },
      { name: 'Инструкция.pdf', size: '1.2 МБ', icon: 'FileText' },
    ],
    image: '⚡',
    tech: ['Лазерная гравировка', 'Электроника', 'Пайка'],
    contact: 'https://vk.com/technoparkrgpu',
    likes: 0,
  },
  {
    id: 4,
    title: 'Алгоритмическая игра',
    excerpt: 'Настольная игра для изучения алгоритмов',
    fullDesc: 'Игра, объясняющая принципы сортировки и поиска данных. Можно играть как в классе, так и дома.',
    subject: 'it',
    authors: ['Волков Дмитрий', 'Павлова Светлана'],
    files: [
      { name: 'Карточки.svg', size: '2.3 МБ', icon: 'File' },
      { name: 'Поле.dxf', size: '0.9 МБ', icon: 'File' },
      { name: 'Правила.pdf', size: '0.7 МБ', icon: 'FileText' },
    ],
    image: '💻',
    tech: ['Векторная графика', 'Печать', 'Дизайн'],
    contact: 'https://vk.com/technoparkrgpu',
    likes: 0,
  },
  {
    id: 5,
    title: 'Бизнес-игра «Рынок»',
    excerpt: 'Экономическая стратегия для школьников',
    fullDesc: 'Игра, моделирующая рыночные отношения, спрос и предложение. Развивает предпринимательское мышление.',
    subject: 'economics',
    authors: ['Соколова Елена', 'Новиков Павел', 'Григорьева Анна'],
    files: [
      { name: 'Деньги.svg', size: '1.1 МБ', icon: 'File' },
      { name: 'Карточки.dxf', size: '0.8 МБ', icon: 'File' },
      { name: 'Бизнес-план.pdf', size: '2.4 МБ', icon: 'FileText' },
    ],
    image: '💰',
    tech: ['Полиграфия', 'Дизайн', 'Экономика'],
    contact: 'https://vk.com/technoparkrgpu',
    likes: 0,
  },
  {
    id: 6,
    title: 'Развивающие карточки',
    excerpt: 'Методическое пособие для дошкольников',
    fullDesc: 'Набор карточек для развития речи и логики. Апробировано в детском саду. Рекомендовано воспитателями.',
    subject: 'pedagogy',
    authors: ['Михайлова Ольга', 'Федорова Ирина'],
    files: [
      { name: 'Карточки.pdf', size: '3.2 МБ', icon: 'FileText' },
      { name: 'Методика.pdf', size: '1.5 МБ', icon: 'FileText' },
    ],
    image: '📚',
    tech: ['Печать', 'Ламинация', 'Педагогика'],
    contact: 'https://vk.com/technoparkrgpu',
    likes: 0,
  },
  {
    id: 7,
    title: 'Тригонометрия на практике',
    excerpt: 'Набор для изучения тригонометрических функций',
    fullDesc: 'Деревянный макет единичной окружности с подвижными элементами. Позволяет наглядно изучать синус, косинус и тангенс.',
    subject: 'math',
    authors: ['Сергеев Дмитрий', 'Алексеева Наталья'],
    files: [
      { name: 'Окружность.dxf', size: '0.6 МБ', icon: 'File' },
      { name: 'Стрелки.dxf', size: '0.3 МБ', icon: 'File' },
    ],
    image: '📐',
    tech: ['Лазерная резка', 'Фанера 4мм'],
    contact: 'https://vk.com/technoparkrgpu',
    likes: 0,
  },
  {
    id: 8,
    title: 'Фотосинтез',
    excerpt: 'Модель процесса фотосинтеза',
    fullDesc: 'Интерактивная модель, показывающая процесс фотосинтеза. Подсветка показывает движение веществ.',
    subject: 'bio',
    authors: ['Тимофеева Екатерина'],
    files: [
      { name: 'Лист.dxf', size: '0.7 МБ', icon: 'File' },
      { name: 'Схема.pdf', size: '0.9 МБ', icon: 'FileText' },
    ],
    image: '🌿',
    tech: ['Лазерная резка', 'Акрил', 'Светодиоды'],
    contact: 'https://vk.com/technoparkrgpu',
    likes: 0,
  },
]

export function getBotAnswer(question: string): string {
  const q = question.toLowerCase().trim()
  if (q.includes('формат') || q.includes('практик') || q.includes('а1') || q.includes('а2')) {
    return 'У нас два формата практики:\n• А1 – семестр (гибкое расписание)\n• А2 – интенсив (1 неделя).\nВыберите формат в личном кабинете.'
  }
  if (q.includes('коробочн') || q.includes('комплект') || q.includes('коп')) {
    return 'Коробочные образовательные комплекты (КОП) – готовые наборы. Студенты разрабатывают в технопарке и апробируют в школах. Примеры – в разделе «Проекты».'
  }
  if (q.includes('мастер-класс') || q.includes('мк') || q.includes('мастер класс')) {
    return 'Мастер-классы: лазерные технологии, 3D-печать, векторная графика, дизайн, программирование, прототипирование. Запись – в личном кабинете.'
  }
  if (q.includes('правила') || q.includes('безопасност') || q.includes('agile') || q.includes('kanban') || q.includes('канбан')) {
    return 'Документы: техника безопасности, правила работы, Agile, Kanban, подготовка файлов – на главной странице.'
  }
  if (q.includes('контакт') || q.includes('чат') || q.includes('куратор')) {
    return 'Контакты: наб. Реки Мойки 48-52, корпус 1;\ntechnopark.herzen.spb.ru;\ntechnopark.herzen@yandex.ru;\nчат ВК – vk.com/technoparkrgpu.'
  }
  if (q.includes('кабинет') || q.includes('войти') || q.includes('вход') || q.includes('регистр')) {
    return 'Личный кабинет – в шапке сайта. Там регистрация команды, трекер задач и публикация проектов.'
  }
  if (q.includes('лайк') || q.includes('топ') || q.includes('голос')) {
    return 'На странице «Проекты» можно ставить лайки и фильтровать Топ-5 семестра.'
  }
  if (q.includes('спасибо') || q.includes('благодар')) {
    return 'Всегда рад помочь! 😊'
  }
  return 'Я ещё учусь. Попробуй спросить о практике, комплектах, мастер‑классах, правилах или контактах.'
}
