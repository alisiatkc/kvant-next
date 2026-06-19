'use client'
import { useState } from 'react'
import { Shield, CheckCircle, Layers, FileText, X, Columns2 } from 'lucide-react'
import { docs } from '@/data'

type Doc = (typeof docs)[0]

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield, CheckCircle, Layers, FileText, Columns2,
}

export default function DocsSection() {
  const [selected, setSelected] = useState<Doc | null>(null)

  return (
    <section className="section-kv">
      <div className="container-kv">
        <h2 className="text-[clamp(1.6rem,5vw,2.8rem)] font-medium tracking-tight mb-4">Правила и документы</h2>
        <p className="text-base min-[640px]:text-xl font-light text-kv-text max-w-[700px] mb-8 min-[640px]:mb-12">Нажмите на карточку, чтобы открыть файл</p>

        <div className="grid grid-cols-2 min-[640px]:grid-cols-3 min-[900px]:grid-cols-5 gap-3 min-[640px]:gap-5">
          {docs.map((doc) => {
            const Icon = iconMap[doc.icon] ?? FileText
            return (
              <div
                key={doc.title}
                className="bg-white rounded-[1.875rem] py-8 px-5 text-center border border-[#f0f4fa] cursor-pointer transition-all hover:-translate-y-1 hover:shadow-card-hover hover:bg-[#f9fbfe]"
                onClick={() => setSelected(doc)}
              >
                <Icon className="w-9 h-9 text-kv-blue mx-auto mb-4 stroke-[1.5]" />
                <h4 className="text-[1.1rem] font-medium mb-2">{doc.title}</h4>
                <p className="text-[#505e7e] font-light text-sm">{doc.desc}</p>
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
            <div className="w-full h-[200px] bg-kv-light rounded-[1.875rem] mb-6 flex items-center justify-center text-[5rem]">
              {selected.image}
            </div>
            <p className="text-kv-text leading-relaxed">{selected.desc}</p>
          </div>
        </div>
      )}
    </section>
  )
}
