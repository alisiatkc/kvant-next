'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, LogOut, Eye, Users } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

type SubmittedProject = {
  id: string
  projectName: string
  teamName: string
  captain: string
  track: string
  status: 'review' | 'approved' | 'rejected'
}

export default function CuratorPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<SubmittedProject[]>([])

  useEffect(() => {
    try {
      const loggedIn = localStorage.getItem('curatorLoggedIn') === 'true'
      if (!loggedIn) {
        router.push('/cabinet')
        return
      }
      setAuthorized(true)

      // Load demo submitted project
      const published = localStorage.getItem('projectPublished') === 'true'
      if (published) {
        setProjects([
          {
            id: localStorage.getItem('currentProjectId') || '1',
            projectName: 'Проект команды',
            teamName: 'Команда',
            captain: 'Студент',
            track: 'А1',
            status: (localStorage.getItem('projectStatus') as 'review' | 'approved' | 'rejected') || 'review',
          },
        ])
      }
    } catch {
      router.push('/cabinet')
    } finally {
      setLoading(false)
    }
  }, [router])

  const logout = () => {
    try { localStorage.removeItem('curatorLoggedIn') } catch {}
    router.push('/cabinet')
  }

  const updateStatus = (id: string, status: 'approved' | 'rejected') => {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, status } : p))
    try { localStorage.setItem('projectStatus', status) } catch {}
  }

  const statusConfig = {
    review: { label: 'На рассмотрении', icon: Clock, cls: 'bg-[#fff3e0] text-[#ef6c00]' },
    approved: { label: 'Одобрено', icon: CheckCircle, cls: 'bg-[#c8e6c9] text-[#2e7d32]' },
    rejected: { label: 'Отклонено', icon: XCircle, cls: 'bg-[#ffebee] text-[#c62828]' },
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="container-kv py-24 text-center text-kv-muted">Загрузка…</main>
        <Footer />
      </>
    )
  }

  if (!authorized) return null

  return (
    <>
      <Header />
      <main>
        <div className="container-kv py-10">
          {/* Header block */}
          <div className="bg-white rounded-[3rem] p-10 mb-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-[2.4rem] font-medium mb-2">Панель куратора</h1>
              <p className="text-kv-text">Управление проектами студентов</p>
            </div>
            <button
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-[#e2e8f0] text-kv-text cursor-pointer hover:bg-kv-light transition-colors bg-white text-base"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" /> Выйти
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-10 max-[700px]:grid-cols-1">
            {[
              { label: 'На рассмотрении', count: projects.filter((p) => p.status === 'review').length, color: 'text-[#ef6c00]', bg: 'bg-[#fff3e0]' },
              { label: 'Одобрено', count: projects.filter((p) => p.status === 'approved').length, color: 'text-[#2e7d32]', bg: 'bg-[#c8e6c9]' },
              { label: 'Отклонено', count: projects.filter((p) => p.status === 'rejected').length, color: 'text-[#c62828]', bg: 'bg-[#ffebee]' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-[2rem] p-8 text-center`}>
                <div className={`text-[2.5rem] font-semibold ${s.color} mb-2`}>{s.count}</div>
                <div className="font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Projects list */}
          <div className="bg-white rounded-[3rem] p-10">
            <h2 className="text-[2rem] font-medium mb-8 flex items-center gap-3">
              <Users className="w-6 h-6 text-kv-blue" /> Поданные проекты
            </h2>

            {projects.length === 0 ? (
              <div className="text-center py-16 text-kv-muted">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Нет проектов на рассмотрении</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => {
                  const { label, icon: Icon, cls } = statusConfig[project.status]
                  return (
                    <div key={project.id} className="border border-kv-border rounded-[2rem] p-7 flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="text-xl font-medium mb-1">{project.projectName}</h3>
                        <p className="text-kv-muted text-sm">
                          Команда: {project.teamName} · Капитан: {project.captain} · Трек: {project.track}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`status-badge ${cls} flex items-center gap-1.5`}>
                          <Icon className="w-4 h-4" /> {label}
                        </span>
                        {project.status === 'review' && (
                          <>
                            <button
                              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#c8e6c9] text-[#2e7d32] border-none cursor-pointer font-medium hover:bg-[#a5d6a7] transition-colors text-sm"
                              onClick={() => updateStatus(project.id, 'approved')}
                            >
                              <CheckCircle className="w-4 h-4" /> Одобрить
                            </button>
                            <button
                              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#ffebee] text-[#c62828] border-none cursor-pointer font-medium hover:bg-[#ffcdd2] transition-colors text-sm"
                              onClick={() => updateStatus(project.id, 'rejected')}
                            >
                              <XCircle className="w-4 h-4" /> Отклонить
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
