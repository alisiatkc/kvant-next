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
    try {
      const savedLikes = localStorage.getItem('projectLikes')
      const savedLikedIds = localStorage.getItem('likedProjectIds')
      if (savedLikes) {
        const likesData: Record<number, number> = JSON.parse(savedLikes)
        setProjects((prev) =>
          prev.map((p) => ({ ...p, likes: likesData[p.id] ?? p.likes }))
        )
      }
      if (savedLikedIds) {
        setLikedIds(new Set(JSON.parse(savedLikedIds)))
      }
    } catch {}
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
          <div className="pt-20 pb-5">
            <div className="flex items-center gap-2 mb-6">
              <Link href="/" className="flex items-center gap-2 text-kv-blue font-medium no-underline">
                <ArrowLeft className="w-4 h-4" />
                <span>На главную</span>
              </Link>
            </div>
            <h1 className="text-[3.5rem] font-semibold tracking-tight mb-5">Коробочные образовательные комплекты</h1>
            <p className="text-xl text-kv-text max-w-[700px]">Проекты, реализованные студентами на базе технопарка</p>
          </div>

          {/* Filters */}
          <div className="my-10">
            <div className="flex flex-wrap items-center justify-between gap-5 mb-5">
              <div className="flex gap-3.5 flex-wrap">
                {subjects.map((s) => (
                  <button
                    key={s.key}
                    className={`px-7 py-3 rounded-full border font-medium text-[0.95rem] transition-all cursor-pointer ${
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
                className={`px-7 py-3 rounded-full border-2 font-semibold text-[0.95rem] flex items-center gap-2 transition-all cursor-pointer ${
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
            <div className="bg-top-gradient rounded-[3.75rem] p-10 mb-10 border-2 border-[#ffd966]">
              <h3 className="text-[2rem] text-[#b15c00] mb-2 flex items-center gap-2.5">
                <Award className="w-8 h-8" /> Топ-5 проектов семестра
              </h3>
              <p className="text-[#b15c00]">По результатам голосования студентов и преподавателей</p>
            </div>
          )}

          {/* Projects grid */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-8 my-10">
            {displayed.map((project) => {
              const Icon = subjectIconMap[project.subject] ?? Box
              const isLiked = likedIds.has(project.id)
              const isTop = topIds.has(project.id)

              return (
                <div
                  key={project.id}
                  className={`bg-white rounded-[2.25rem] p-9 border cursor-pointer transition-all hover:-translate-y-2 hover:shadow-card-hover relative ${
                    topFilter && isTop ? 'border-2 border-[#ffb347] bg-gradient-to-br from-[#fffcf5] to-white' : 'border-kv-border'
                  }`}
                  onClick={() => setSelected(project)}
                >
                  {/* Top badge */}
                  {topFilter && isTop && (
                    <div className="absolute top-8 left-8 bg-[#ffb347] text-white px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-[0_4px_10px_rgba(255,180,70,0.3)] z-10">
                      <Award className="w-4 h-4" /> Топ-5
                    </div>
                  )}

                  {/* Like button */}
                  <button
                    className={`absolute top-8 right-8 flex items-center gap-2 px-4 py-2 rounded-full border transition-all hover:scale-105 z-10 cursor-pointer ${
                      isLiked ? 'bg-[#ffe0e0] border-[#ff6b6b]' : 'bg-white border-[#ffe0e0] shadow-likes'
                    }`}
                    onClick={(e) => toggleLike(e, project.id)}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'text-[#ff6b6b] fill-[#ff6b6b]' : 'text-[#ff6b6b]'}`} />
                    <span className="font-semibold text-[#ff4d4d]">{project.likes}</span>
                  </button>

                  <Icon className="w-12 h-12 text-kv-blue mb-7 stroke-[1.5]" />
                  <h3 className="text-[1.8rem] font-medium mb-4 tracking-tight pr-10">{project.title}</h3>
                  <p className="text-kv-text font-light leading-relaxed mb-6">{project.excerpt}</p>
                  <div className="flex gap-5 text-kv-muted text-[0.95rem] mb-6">
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{project.authors.length}</span>
                    <span className="flex items-center gap-1.5"><File className="w-4 h-4" />{project.files.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.slice(0, 2).map((t) => (
                      <span key={t} className="tag-kv">{t}</span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA */}
          <div className="bg-white rounded-[3.75rem] p-[60px] my-[60px] mb-20 text-center">
            <h3 className="text-[2.2rem] font-medium mb-5">Хотите пройти практику на базе технопарка?</h3>
            <p className="text-kv-text text-xl mb-10 max-w-[600px] mx-auto">Напишите нам, и мы договоримся о сотрудничестве</p>
            <a
              href="https://technopark.herzen.spb.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-kv-blue text-white px-[50px] py-4 rounded-full text-[1.1rem] font-medium no-underline hover:bg-kv-dark transition-colors"
            >
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
            className="bg-white max-w-[800px] w-[90%] max-h-[90vh] overflow-y-auto rounded-[3rem] p-[50px] relative shadow-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-btn" onClick={() => setSelected(null)}>
              <X size={24} />
            </button>
            <h2 className="text-[2.4rem] font-medium mb-6 pr-10">{selected.title}</h2>
            <div className="w-full h-[240px] bg-kv-light rounded-[2.25rem] mb-6 flex items-center justify-center text-[4rem]">
              {selected.image}
            </div>
            <p className="text-lg leading-[1.7] my-6">{selected.fullDesc}</p>

            {/* Authors */}
            <div className="flex flex-wrap gap-3 my-6">
              {selected.authors.map((a) => (
                <span key={a} className="bg-kv-light px-5 py-2.5 rounded-full flex items-center gap-2">
                  <User className="w-4 h-4" /> {a}
                </span>
              ))}
            </div>

            {/* Files */}
            <div className="bg-[#f9fbfe] rounded-[2.25rem] p-8 my-8">
              <h4 className="text-[1.3rem] font-medium mb-5">Файлы комплекта</h4>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
                {selected.files.map((f) => {
                  const FIcon = fileIconMap[f.icon] ?? File
                  return (
                    <div
                      key={f.name}
                      className="bg-white rounded-[1.75rem] p-5 text-center border border-kv-border cursor-pointer hover:bg-kv-light hover:-translate-y-0.5 transition-all"
                      onClick={() => alert(`Скачивание ${f.name} (демо-режим)`)}
                    >
                      <FIcon className="w-8 h-8 text-kv-blue mx-auto mb-3" />
                      <span className="text-sm block">{f.name}</span>
                      <small className="text-[#8b9bb5] text-xs mt-1.5 block">{f.size}</small>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Tech stack */}
            <div className="my-6">
              <h4 className="text-[1.1rem] font-medium mb-4">Технологии</h4>
              <div className="flex flex-wrap gap-2.5">
                {selected.tech.map((t) => (
                  <span key={t} className="tag-kv">{t}</span>
                ))}
              </div>
            </div>

            <a
              href={selected.contact}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-kv-blue text-white px-9 py-4 rounded-full no-underline font-medium mt-6 hover:bg-kv-dark transition-colors"
            >
              <MessageCircle className="w-5 h-5" /> Написать автору
            </a>
          </div>
        </div>
      )}
    </>
  )
}
