'use client'
import { useState } from 'react'
import { Zap, Box, PenLine, Hexagon, Code, Wrench, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { workshops } from '@/data'

type Workshop = (typeof workshops)[0]

const iconMap: Record<string, LucideIcon> = {
  Zap, Box, PenLine, Hexagon, Code, Wrench,
}

export default function WorkshopsSection() {
  const [selected, setSelected] = useState<Workshop | null>(null)

  return (
    <section className="section-kv">
      <div className="container-kv">
        <h2 className="text-[clamp(1.6rem,5vw,2.8rem)] font-semibold tracking-tight mb-4">Мастер-классы</h2>
        <p className="text-base min-[640px]:text-lg text-kv-text max-w-[700px] mb-8 min-[640px]:mb-12">Видеоинструкции по оборудованию и технологиям, которые можно использовать в проекте</p>

        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 min-[900px]:grid-cols-3 gap-5 min-[640px]:gap-8">
          {workshops.map((w) => {
            const Icon = iconMap[w.icon] ?? Box
            return (
              <button
                type="button"
                key={w.title}
                className="bg-white rounded-[1.25rem] p-6 min-[640px]:p-8 border border-kv-border cursor-pointer transition-[border-color,box-shadow] duration-200 hover:border-[#dce4f0] hover:shadow-card flex flex-col text-left"
                onClick={() => setSelected(w)}
              >
                <Icon className="w-9 h-9 min-[640px]:w-11 min-[640px]:h-11 text-kv-blue mb-4 stroke-[1.5]" />
                <h3 className="text-[1.1rem] min-[640px]:text-[1.4rem] font-medium mb-2 leading-snug hyphens-auto">{w.title}</h3>
                <p className="text-[#4b5672] font-light text-sm min-[640px]:text-[0.95rem] leading-relaxed flex-grow">{w.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelected(null)} aria-label="Закрыть">
              <X size={24} />
            </button>
            <h3 className="text-2xl font-medium mb-6">{selected.title}</h3>
            <div className="w-full h-[200px] bg-kv-light rounded-[1rem] mb-6 overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={selected.video}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-[1rem]"
              />
            </div>
            <p className="text-kv-text leading-relaxed">{selected.desc}</p>
          </div>
        </div>
      )}
    </section>
  )
}
