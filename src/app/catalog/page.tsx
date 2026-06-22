'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Hash, Activity, Zap, Code, TrendingUp, BookOpen, Box,
  Heart, Award, Users, File, FileText, User, MessageCircle, X, ArrowLeft,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { projects as initialProjects, type Project } from '@/data'
import { getApprovedCatalog } from '@/lib/storage'

const subjectIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  math: Hash, bio: Activity, physics: Zap, it: Code, economics: TrendingUp, pedagogy: BookOpen,
}

const fileIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  File, FileText,
}

const subjects = [
  { key: 'all',       label: 'Все' },
  { key: 'math',      label: 'Математика' },
  { key: 'bio',       label: 'Биология' },
  { key: 'physics',   label: 'Физика' },
  { key: 'it',        label: 'Информатика' },
  { key: 'economics', label: 'Экономика' },
  { key: 'pedagogy',  label: 'Педагогика' },
]

export default function CatalogPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState('all')
  const [topFilter, setTopFilter] = useState(false)
  const [selected, setSelected] = useState<Project | null>(null)
  const [photoIdx, setPhotoIdx] = useState(0)

  useEffect(() => {
    (async () => {
      try {
        // Merge static projects with curator-approved dynamic projects
        const approved = await getApprovedCatalog()
        // Dynamic entries override static ones with the same id (curator edits)
        const dynamicProjects = approved as unknown as Project[]
        const dynamicIds = new Set(dynamicProjects.map((p) => p.id))
        const freshStatic = initialProjects.filter((p) => !dynamicIds.has(p.id))

        const savedLikes = localStorage.getItem('projectLikes')
        const savedLikedIds = localStorage.getItem('likedProjectIds')
        const likesData: Record<number, number> = savedLikes ? JSON.parse(savedLikes) : {}

        const merged = [...freshStatic, ...dynamicProjects].map((p) => ({
          ...p,
          likes: likesData[p.id] ?? p.likes,
        }))

        setProjects(merged)
        if (savedLikedIds) {
          setLikedIds(new Set(JSON.parse(savedLikedIds)))
        }
      } catch {}
    })()
  }, [])

  const toggleLike = (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation()
    const isLiked = likedIds.has(projectId)
    const newLikedIds = new Set(likedIds)

    if (isLiked) {
      newLikedIds.delete(projectId)
    } else {
      newLikedIds.add(projectId)
    }

    const newProjects = projects.map((p) =>
      p.id === projectId ? { ...p, likes: p.likes + (isLiked ? -1 : 1) } : p
    )

    setLikedIds(newLikedIds)
    setProjects(newProjects)

    try {
      const likesData: Record<number, number> = {}
      newProjects.forEach((p) => (likesData[p.id] = p.likes))
      localStorage.setItem('projectLikes', JSON.stringify(likesData))
      localStorage.setItem('likedProjectIds', JSON.stringify(Array.from(newLikedIds)))
    } catch {}
  }

  const topProjects = [...projects].sort((a, b) => b.likes - a.likes).slice(0, 5)
  const topIds = new Set(topProjects.map((p) => p.id))

  let displayed = filter === 'all' ? projects : projects.filter((p) => p.subject === filter)
  if (topFilter) displayed = displayed.filter((p) => topIds.has(p.id))

  return (
    <>
      <Header active="catalog" />
      <main>
        <div className="container-kv">

          {/* ── HERO BANNER ── */}
          <div className="mt-8 min-[640px]:mt-12 mb-8 rounded-[2rem] min-[640px]:rounded-[2.5rem] overflow-hidden relative"
            style={{ background: 'linear-gradient(135deg, #EEF3FF 0%, #e8e0ff 55%, #F3EEFF 100%)' }}>
            {/* decorative blobs */}
            <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-30 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #4C1D95 0%, transparent 70%)' }} />
            <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full opacity-20 pointer-events-none"
              style={{ background: 'radial-gradient(circle, #2B3B6B 0%, transparent 70%)' }} />
            <div className="relative px-8 min-[640px]:px-12 py-10 min-[640px]:py-14 flex flex-col min-[700px]:flex-row items-start min-[700px]:items-center justify-between gap-6">
              <div>
                <Link href="/" className="inline-flex items-center gap-1.5 text-kv-blue/70 hover:text-kv-blue no-underline text-xs font-medium mb-4 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> На главную
                </Link>
                <h1 className="text-[clamp(1.6rem,5vw,2.8rem)] font-semibold tracking-tight text-kv-dark leading-tight mb-3">
                  Коробочные образовательные<br/>комплекты
                </h1>
                <p className="text-kv-text text-sm min-[640px]:text-base max-w-[500px]">
                  Готовые разработки студентов педагогического технопарка — скачивайте, используйте, оставляйте обратную связь
                </p>
              </div>
              <div className="flex gap-4 flex-shrink-0">
                {[
                  { n: displayed.length, label: 'КОП в каталоге' },
                  { n: projects.reduce((s, p) => s + p.likes, 0), label: 'голосов' },
                ].map(({ n, label }) => (
                  <div key={label} className="text-center rounded-2xl px-5 py-4 bg-white/70 backdrop-blur-sm"
                    style={{ border: '1px solid rgba(43,59,107,0.12)' }}>
                    <div className="text-[1.8rem] font-bold text-kv-dark leading-none">{n}</div>
                    <div className="text-kv-muted text-xs mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8">
            <div className="flex flex-col min-[640px]:flex-row flex-wrap items-start min-[640px]:items-center justify-between gap-4">
              <div className="flex gap-2 flex-wrap">
                {subjects.map((s) => (
                  <button key={s.key}
                    className={`px-4 py-2 rounded-full font-medium text-sm transition-all cursor-pointer border ${
                      filter === s.key && !topFilter
                        ? 'bg-kv-blue text-white border-transparent'
                        : 'bg-white border-[#e2e8f0] hover:border-[#c7d2e7]'
                    }`}
                    onClick={() => { setFilter(s.key); setTopFilter(false) }}>
                    {s.label}
                  </button>
                ))}
              </div>
              <button
                className={`px-5 py-2.5 rounded-full border-2 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer ${
                  topFilter ? 'bg-[#f59e0b] text-white border-[#f59e0b]' : 'bg-[#fffbeb] text-[#92400e] border-[#fcd34d] hover:bg-[#fef3c7]'
                }`}
                onClick={() => { setTopFilter((v) => !v); if (!topFilter) setFilter('all') }}>
                <Award className="w-4 h-4" />
                Топ-5 семестра
              </button>
            </div>
          </div>

          {/* Top-5 banner */}
          {topFilter && (
            <div className="rounded-[2rem] p-7 min-[640px]:p-10 mb-8 flex items-center gap-5"
              style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '2px solid #fcd34d' }}>
              <div className="w-14 h-14 rounded-2xl bg-[#f59e0b] flex items-center justify-center flex-shrink-0">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-[1.2rem] min-[640px]:text-[1.6rem] font-semibold text-[#78350f]">Топ-5 проектов семестра</h3>
                <p className="text-[#92400e] text-sm mt-1">По результатам голосования студентов и преподавателей</p>
              </div>
            </div>
          )}

          {/* Projects grid */}
          <div className="grid grid-cols-1 min-[540px]:grid-cols-2 min-[900px]:grid-cols-3 gap-5 min-[640px]:gap-6 mb-10">
            {displayed.map((project) => {
              const Icon    = subjectIconMap[project.subject] ?? Box
              const isLiked = likedIds.has(project.id)
              const isTop   = topIds.has(project.id)

              return (
                <div key={project.id}
                  className={`bg-white rounded-[1.75rem] border cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover relative overflow-hidden flex flex-col ${
                    topFilter && isTop ? 'border-[#fcd34d] ring-2 ring-[#fcd34d]/30' : 'border-kv-border'
                  }`}
                  onClick={() => { setSelected(project); setPhotoIdx(0) }}>

                  {/* Cover */}
                  <div className="h-[88px] flex items-center justify-between px-6 relative"
                    style={{ background: 'linear-gradient(135deg, #f5f7ff, #EEF3FF)' }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-kv-blue">
                      <Icon className="text-white stroke-[1.5] w-[22px] h-[22px]" />
                    </div>
                    {topFilter && isTop && (
                      <span className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full"
                        style={{ background: '#f59e0b', color: 'white' }}>
                        <Award className="w-[11px] h-[11px]" /> Топ-5
                      </span>
                    )}
                    <button
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all hover:scale-105 cursor-pointer ${
                        isLiked ? 'bg-[#ffe0e0] border-[#fca5a5]' : 'bg-white border-[#fca5a5]/40'
                      }`}
                      onClick={(e) => toggleLike(e, project.id)}>
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'text-[#ef4444] fill-[#ef4444]' : 'text-[#ef4444]'}`} />
                      <span className="font-semibold text-[#ef4444] text-xs">{project.likes}</span>
                    </button>
                  </div>

                  {/* Card body */}
                  <div className="p-5 min-[640px]:p-6 flex-1 flex flex-col">
                    <h3 className="text-[1.05rem] min-[640px]:text-[1.15rem] font-semibold mb-2 leading-snug tracking-tight">{project.title}</h3>
                    <p className="text-kv-text text-sm leading-relaxed mb-4 flex-1">{project.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-3 text-kv-muted text-xs">
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{project.authors.length}</span>
                        <span className="flex items-center gap-1"><File className="w-3.5 h-3.5" />{project.files.length} файла</span>
                      </div>
                      <div className="flex gap-1.5">
                        {project.tech.slice(0, 1).map((t) => (
                          <span key={t} className="text-[10px] px-2.5 py-1 rounded-full font-medium bg-[#EEF3FF] text-kv-blue">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA */}
          <div className="bg-white rounded-[2rem] min-[640px]:rounded-[3.75rem] p-8 min-[640px]:p-[60px] my-10 mb-16 text-center">
            <h3 className="text-[1.4rem] min-[640px]:text-[2.2rem] font-medium mb-4">Хотите пройти практику на базе технопарка?</h3>
            <p className="text-kv-text text-base min-[640px]:text-xl mb-8 max-w-[600px] mx-auto">Напишите нам, и мы договоримся о сотрудничестве</p>
            <a href="https://technopark.herzen.spb.ru" target="_blank" rel="noopener noreferrer"
              className="inline-block bg-kv-blue text-white px-10 py-3.5 rounded-full text-base font-medium no-underline hover:bg-kv-dark transition-colors">
              Связаться
            </a>
          </div>
        </div>
      </main>

      <Footer />

      {/* Project modal */}
      {selected && (() => {
        const ModalIcon = subjectIconMap[selected.image] ?? subjectIconMap[selected.subject] ?? Box
        return (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="bg-white max-w-[820px] w-full min-[640px]:w-[92%] max-h-[94vh] overflow-y-auto rounded-t-[2rem] min-[640px]:rounded-[2.5rem] relative shadow-modal"
              onClick={(e) => e.stopPropagation()}>

              {/* Header */}
              <div className="h-[140px] min-[640px]:h-[180px] flex items-end px-8 min-[640px]:px-12 pb-6 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #f5f7ff, #EEF3FF)' }}>
                <button className="absolute top-5 right-5 bg-white/80 backdrop-blur-sm border-none w-9 h-9 rounded-full flex items-center justify-center text-kv-muted cursor-pointer hover:bg-white transition-colors"
                  onClick={() => setSelected(null)}><X size={18} /></button>
                <div className="flex items-end gap-5">
                  <div className="w-16 h-16 min-[640px]:w-20 min-[640px]:h-20 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 bg-kv-blue">
                    <ModalIcon className="text-white stroke-[1.25] w-9 h-9" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-2 inline-block bg-kv-blue text-white">
                      {subjects.find(s => s.key === selected.subject)?.label ?? 'КОП'}
                    </span>
                    <h2 className="text-[1.3rem] min-[640px]:text-[1.8rem] font-semibold leading-tight text-kv-dark">
                      {selected.title}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Photo gallery */}
              {selected.photos && selected.photos.length > 0 && (() => {
                const photos = selected.photos!
                const total = photos.length
                return (
                  <div className="relative bg-[#f0f2f8] overflow-hidden" style={{ height: '240px' }}>
                    <img
                      key={photoIdx}
                      src={photos[photoIdx]}
                      alt={`Фото работы ${photoIdx + 1}`}
                      className="w-full h-full object-cover"
                      style={{ transition: 'opacity 0.3s' }}
                    />
                    {total > 1 && (
                      <>
                        <button
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center cursor-pointer border-none hover:bg-white transition-colors shadow-sm"
                          onClick={() => setPhotoIdx((i) => (i - 1 + total) % total)}>
                          <ChevronLeft className="w-5 h-5 text-kv-dark" />
                        </button>
                        <button
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center cursor-pointer border-none hover:bg-white transition-colors shadow-sm"
                          onClick={() => setPhotoIdx((i) => (i + 1) % total)}>
                          <ChevronRight className="w-5 h-5 text-kv-dark" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {photos.map((_, i) => (
                            <button key={i}
                              className={`w-2 h-2 rounded-full border-none cursor-pointer transition-all ${i === photoIdx ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
                              onClick={() => setPhotoIdx(i)} />
                          ))}
                        </div>
                      </>
                    )}
                    <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
                      {photoIdx + 1} / {total}
                    </div>
                  </div>
                )
              })()}

              {/* Body */}
              <div className="px-8 min-[640px]:px-12 py-7 min-[640px]:py-9 space-y-7">
                <p className="text-base min-[640px]:text-lg leading-[1.75] text-kv-text">{selected.fullDesc}</p>

                {/* Authors */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-kv-muted mb-3">Авторы</h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.authors.map((a, i) => (
                      <span key={a} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm ${i === 0 ? 'bg-[#EEF3FF] text-kv-blue' : 'bg-[#f1f5f9] text-[#64748b]'}`}>
                        <User className="w-3.5 h-3.5" /> {a}{i === 0 ? ' (капитан)' : ''}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Files */}
                <div className="rounded-[1.5rem] p-5 min-[640px]:p-7 bg-[#f5f7ff] border border-[#EEF3FF]">
                  <h4 className="text-sm font-semibold text-kv-dark mb-4 flex items-center gap-2">
                    <span className="text-kv-blue"><File className="w-4 h-4" /></span> Файлы комплекта
                  </h4>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
                    {selected.files.map((f) => {
                      const FIcon = fileIconMap[f.icon] ?? File
                      return (
                        <div key={f.name}
                          className="bg-white rounded-2xl p-4 text-center border border-[#EEF3FF] cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all"
                          onClick={() => alert(`Скачивание ${f.name} (демо-режим)`)}>
                          <span className="flex justify-center mb-2 text-kv-blue"><FIcon className="w-7 h-7" /></span>
                          <span className="text-xs block font-medium text-kv-dark">{f.name}</span>
                          <small className="text-kv-muted text-[0.6rem] mt-0.5 block">{f.size}</small>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Tech tags + CTA */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex flex-wrap gap-2">
                    {selected.tech.map((t) => (
                      <span key={t} className="text-xs px-3 py-1.5 rounded-full font-medium bg-[#EEF3FF] text-kv-blue">{t}</span>
                    ))}
                  </div>
                  <a href={selected.contact} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-full no-underline font-medium hover:opacity-90 transition-opacity text-sm bg-kv-blue">
                    <MessageCircle className="w-4 h-4" /> Связаться с авторами
                  </a>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}
