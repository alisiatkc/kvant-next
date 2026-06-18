'use client'
import { useState } from 'react'
import { Zap, Box, PenLine, Hexagon, Code, Wrench, X } from 'lucide-react'
import { workshops } from '@/data'

type Workshop = (typeof workshops)[0]

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Box, PenLine, Hexagon, Code, Wrench,
}

export default function WorkshopsSection() {
  const [selected, setSelected] = useState<Workshop | null>(null)

  return (
    <section className="section-kv">
      <div className="container-kv">
        <h2 className="text-[2.8rem] font-medium tracking-tight mb-8">Мастер-классы</h2>
        <p className="text-xl font-light text-kv-text max-w-[700px] mb-12">Краткие видео и описание</p>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-8">
          {workshops.map((w) => {
            const Icon = iconMap[w.icon] ?? Box
            return (
              <div
                key={w.title}
                className="bg-white rounded-[2.25rem] p-9 border border-[#eef2f7] cursor-pointer transition-all hover:-translate-y-1.5 hover:shadow-card-hover flex flex-col min-h-[340px]"
                onClick={() => setSelected(w)}
              >
                <Icon className="w-11 h-11 text-kv-blue mb-5 stroke-[1.5]" />
                <h3 className="text-[1.4rem] font-medium mb-3 leading-snug hyphens-auto">{w.title}</h3>
                <p className="text-[#4b5672] font-light text-[0.95rem] leading-relaxed line-clamp-4 flex-grow">{w.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelected(null)}>
              <X size={24} />
            </button>
            <h3 className="text-2xl font-medium mb-6">{selected.title}</h3>
            <div className="w-full h-[200px] bg-kv-light rounded-[1.5rem] mb-6 overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={selected.video}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-[1.5rem]"
              />
            </div>
            <p className="text-kv-text leading-relaxed">{selected.desc}</p>
          </div>
        </div>
      )}
    </section>
  )
}
