'use client'
import { useState } from 'react'
import { Shield, CheckCircle, Layers, FileText, X, Columns2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { docs } from '@/data'

type Doc = (typeof docs)[0]

const iconMap: Record<string, LucideIcon> = {
  Shield, CheckCircle, Layers, FileText, Columns2,
}

export default function DocsSection() {
  const [selected, setSelected] = useState<Doc | null>(null)

  return (
    <section className="section-kv">
      <div className="container-kv">
        <h2 className="text-[clamp(1.6rem,5vw,2.8rem)] font-semibold tracking-tight mb-4">Правила и документы</h2>
        <p className="text-base min-[640px]:text-lg text-kv-text max-w-[700px] mb-8 min-[640px]:mb-12">Шаблоны, критерии и материалы для работы над проектом</p>

        <div className="grid grid-cols-2 min-[640px]:grid-cols-3 min-[900px]:grid-cols-5 gap-3 min-[640px]:gap-5">
          {docs.map((doc) => {
            const Icon = iconMap[doc.icon] ?? FileText
            return (
              <button
                type="button"
                key={doc.title}
                className="bg-white rounded-[1.25rem] py-7 px-5 text-center border border-kv-border cursor-pointer transition-[background-color,border-color,box-shadow] duration-200 hover:border-[#dce4f0] hover:bg-[#f9fbfe] hover:shadow-card"
                onClick={() => setSelected(doc)}
              >
                <Icon className="w-9 h-9 text-kv-blue mx-auto mb-4 stroke-[1.5]" />
                <h4 className="text-[1.1rem] font-medium mb-2">{doc.title}</h4>
                <p className="text-[#505e7e] font-light text-sm">{doc.desc}</p>
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
            <div className="w-full h-[200px] bg-kv-light rounded-[1rem] mb-6 flex items-center justify-center">
              <FileText className="h-16 w-16 text-kv-blue" strokeWidth={1.25} />
            </div>
            <p className="text-kv-text leading-relaxed">{selected.desc}</p>
          </div>
        </div>
      )}
    </section>
  )
}
