'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Hash, Activity, Zap, Code, TrendingUp, BookOpen, Box,
  Heart, Award, Users, File, FileText, User, MessageCircle, X, ArrowLeft,
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
  { key: 'all', label: 'Все' },
  { key: 'math', label: 'Математика' },
  { key: 'bio', label: 'Биология' },
  { key: 'physics', label: 'Физика' },
  { key: 'it', label: 'Информатика' },
  { key: 'economics', label: 'Экономика' },
  { key: 'pedagogy', label: 'Педагогика' },
]

export default function CatalogPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState('all')
  const [topFilter, setTopFilter] = useState(false)
  const [selected, setSelected] = useState<Project | null>(null)

  useEffect(() => {
    (async () => {
      try {
        // Merge static projects with curator-approved dynamic projects
        const approved = await getApprovedCatalog()
        const staticIds = new Set(initialProjects.map((p) => p.id))
        const freshDynamic = (approved as unknown as Project[]).filter((p) => !staticIds.has(p.id))

        const savedLikes = localStorage.getItem('projectLikes')
        const savedLikedIds = localStorage.getItem('likedProjectIds')
        const likesData: Record<number, number> = savedLikes ? JSON.parse(savedLikes) : {}

        const merged = [...initialProjects, ...freshDynamic].map((p) => ({
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
          {/* Page header */}
          <div className="pt-10 min-[640px]:pt-20 pb-5">
            <div className="flex items-center gap-2 mb-5">
              <Link href="/" className="flex items-center gap-2 text-kv-blue font-medium no-underline text-sm">
                <ArrowLeft className="w-4 h-4" />
                <span>На главную</span>
              </Link>
            </div>
            <h1 className="text-[clamp(1.8rem,6vw,3.5rem)] font-semibold tracking-tight mb-4 leading-tight">Коробочные образовательные комплекты</h1>
            <p className="text-base min-[640px]:text-xl text-kv-text max-w-[700px]">Проекты, реализованные студентами на базе технопарка</p>
          </div>

          {/* Filters */}
          <div className="my-6 min-[640px]:my-10">
            <div className="flex flex-col min-[640px]:flex-row flex-wrap items-start min-[640px]:items-center justify-between gap-4 mb-5">
              <div className="flex gap-2 min-[640px]:gap-3.5 flex-wrap">
                {subjects.map((s) => (
                  <button
                    key={s.key}
                    className={`px-4 min-[640px]:px-7 py-2 min-[640px]:py-3 rounded-full border font-medium text-sm min-[640px]:text-[0.95rem] transition-all cursor-pointer ${
                      filter === s.key && !topFilter
                        ? 'bg-kv-blue text-white border-kv-blue'
                        : 'bg-white border-[#e2e8f0] hover:bg-kv-light'
                    }`}
                    onClick={() => { setFilter(s.key); setTopFilter(false) }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <button
                className={`w-full min-[640px]:w-auto px-5 min-[640px]:px-7 py-2.5 min-[640px]:py-3 rounded-full border-2 font-semibold text-sm min-[640px]:text-[0.95rem] flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  topFilter
                    ? 'bg-[#ffb347] text-white border-[#ff9f1c]'
                    : 'bg-[#fff0d9] text-[#b15c00] border-[#ffb347]'
                }`}
                onClick={() => {
                  setTopFilter((v) => !v)
                  if (!topFilter) setFilter('all')
                }}
              >
                <Award className={`w-4 h-4 ${topFilter ? 'text-white' : 'text-[#ff9f1c]'}`} />
                <span>Топ-5 проектов семестра</span>
              </button>
            </div>
          </div>

          {/* Top-5 banner */}
          {topFilter && (
            <div className="bg-top-gradient rounded-[2rem] min-[640px]:rounded-[3.75rem] p-6 min-[640px]:p-10 mb-8 border-2 border-[#ffd966]">
              <h3 className="text-[1.4rem] min-[640px]:text-[2rem] text-[#b15c00] mb-2 flex items-center gap-2.5">
                <Award className="w-6 h-6 min-[640px]:w-8 min-[640px]:h-8" /> Топ-5 проектов семестра
              </h3>
              <p className="text-[#b15c00] text-sm min-[640px]:text-base">По результатам голосования студентов и преподавателей</p>
            </div>
          )}

          {/* Projects grid */}
          <div className="grid grid-cols-1 min-[540px]:grid-cols-2 min-[900px]:grid-cols-3 gap-5 min-[640px]:gap-8 my-6 min-[640px]:my-10">
            {displayed.map((project) => {
              const Icon = subjectIconMap[project.subject] ?? Box
              const isLiked = likedIds.has(project.id)
              const isTop = topIds.has(project.id)

              return (
                <div
                  key={project.id}
                  className={`bg-white rounded-[1.75rem] min-[640px]:rounded-[2.25rem] p-6 min-[640px]:p-9 border cursor-pointer transition-all hover:-translate-y-1 hover:shadow-card-hover relative ${
                    topFilter && isTop ? 'border-2 border-[#ffb347] bg-gradient-to-br from-[#fffcf5] to-white' : 'border-kv-border'
                  }`}
                  onClick={() => setSelected(project)}
                >
                  {topFilter && isTop && (
                    <div className="absolute top-5 left-5 min-[640px]:top-8 min-[640px]:left-8 bg-[#ffb347] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-10">
                      <Award className="w-3 h-3" /> Топ-5
                    </div>
                  )}
                  <button
                    className={`absolute top-5 right-5 min-[640px]:top-8 min-[640px]:right-8 flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all hover:scale-105 z-10 cursor-pointer ${
                      isLiked ? 'bg-[#ffe0e0] border-[#ff6b6b]' : 'bg-white border-[#ffe0e0] shadow-likes'
                    }`}
                    onClick={(e) => toggleLike(e, project.id)}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'text-[#ff6b6b] fill-[#ff6b6b]' : 'text-[#ff6b6b]'}`} />
                    <span className="font-semibold text-[#ff4d4d] text-sm">{project.likes}</span>
                  </button>

                  <Icon className="w-10 h-10 min-[640px]:w-12 min-[640px]:h-12 text-kv-blue mb-5 min-[640px]:mb-7 stroke-[1.5]" />
                  <h3 className="text-[1.2rem] min-[640px]:text-[1.6rem] font-medium mb-3 tracking-tight pr-10 leading-snug">{project.title}</h3>
                  <p className="text-kv-text font-light leading-relaxed mb-4 text-sm min-[640px]:text-base">{project.excerpt}</p>
                  <div className="flex gap-4 text-kv-muted text-sm mb-4">
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{project.authors.length}</span>
                    <span className="flex items-center gap-1.5"><File className="w-4 h-4" />{project.files.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.slice(0, 2).map((t) => (
                      <span key={t} className="tag-kv text-xs">{t}</span>
                    ))}
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
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div
            className="bg-white max-w-[800px] w-full min-[640px]:w-[90%] max-h-[92vh] overflow-y-auto rounded-t-[2rem] min-[640px]:rounded-[3rem] p-6 min-[640px]:p-[50px] relative shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-btn" onClick={() => setSelected(null)}>
              <X size={20} />
            </button>
            <h2 className="text-[1.5rem] min-[640px]:text-[2.4rem] font-medium mb-5 pr-10 leading-tight">{selected.title}</h2>
            <div className="w-full h-[160px] min-[640px]:h-[240px] bg-kv-light rounded-[1.5rem] min-[640px]:rounded-[2.25rem] mb-5 flex items-center justify-center">
              {(() => {
                const ModalIcon = subjectIconMap[selected.image] ?? subjectIconMap[selected.subject] ?? Box
                return <ModalIcon className="w-14 h-14 min-[640px]:w-20 min-[640px]:h-20 text-kv-blue stroke-[1.25]" />
              })()}
            </div>
            <p className="text-base min-[640px]:text-lg leading-[1.7] my-5">{selected.fullDesc}</p>

            <div className="flex flex-wrap gap-2 my-5">
              {selected.authors.map((a) => (
                <span key={a} className="bg-kv-light px-4 py-2 rounded-full flex items-center gap-2 text-sm">
                  <User className="w-3.5 h-3.5" /> {a}
                </span>
              ))}
            </div>

            <div className="bg-[#f9fbfe] rounded-[1.5rem] min-[640px]:rounded-[2.25rem] p-5 min-[640px]:p-8 my-5">
              <h4 className="text-base min-[640px]:text-[1.3rem] font-medium mb-4">Файлы комплекта</h4>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] min-[640px]:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
                {selected.files.map((f) => {
                  const FIcon = fileIconMap[f.icon] ?? File
                  return (
                    <div key={f.name}
                      className="bg-white rounded-2xl p-4 text-center border border-kv-border cursor-pointer hover:bg-kv-light transition-all"
                      onClick={() => alert(`Скачивание ${f.name} (демо-режим)`)}>
                      <FIcon className="w-7 h-7 text-kv-blue mx-auto mb-2" />
                      <span className="text-xs block">{f.name}</span>
                      <small className="text-[#8b9bb5] text-[0.65rem] mt-1 block">{f.size}</small>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="my-5">
              <h4 className="text-base font-medium mb-3">Технологии</h4>
              <div className="flex flex-wrap gap-2">
                {selected.tech.map((t) => (
                  <span key={t} className="tag-kv text-xs">{t}</span>
                ))}
              </div>
            </div>

            <a href={selected.contact} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-kv-blue text-white px-7 py-3.5 rounded-full no-underline font-medium mt-4 hover:bg-kv-dark transition-colors text-sm">
              <MessageCircle className="w-4 h-4" /> Написать автору
            </a>
          </div>
        </div>
      )}
    </>
  )
}
