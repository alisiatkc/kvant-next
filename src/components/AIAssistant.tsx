'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Cpu, Bot, X, Volume2, Send } from 'lucide-react'
import { getBotAnswer } from '@/data'

type Message = { id: number; type: 'user' | 'bot'; text: string }

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [greeted, setGreeted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const nextId = useRef(1)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages, isTyping])

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return
    const synth = window.speechSynthesis
    synth.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ru-RU'
    utterance.rate = 0.9
    utterance.pitch = 1.1
    const voices = synth.getVoices()
    const ruVoice = voices.find((v) => v.lang === 'ru-RU' && v.name.includes('Google')) ?? voices.find((v) => v.lang === 'ru-RU')
    if (ruVoice) utterance.voice = ruVoice
    synth.speak(utterance)
  }, [])

  const addBotMessage = useCallback(async (text: string, withSpeech = true) => {
    const id = nextId.current++
    setMessages((prev) => [...prev, { id, type: 'bot', text: '' }])

    let i = 0
    const interval = setInterval(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, text: text.slice(0, i + 1) } : m))
      )
      i++
      if (i >= text.length) {
        clearInterval(interval)
        if (withSpeech) speak(text)
      }
    }, 18)
  }, [speak])

  const openChat = useCallback(() => {
    setIsOpen(true)
    if (!greeted) {
      setGreeted(true)
      setTimeout(() => {
        addBotMessage('👋 Привет! Я Квант, твой ИИ-помощник. Спрашивай о практике, коробочных комплектах, мастер‑классах, правилах или контактах.', false)
      }, 300)
    }
  }, [greeted, addBotMessage])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isTyping) return
    setInput('')
    setMessages((prev) => [...prev, { id: nextId.current++, type: 'user', text }])
    setIsTyping(true)
    await new Promise((r) => setTimeout(r, 600))
    setIsTyping(false)
    const answer = getBotAnswer(text)
    await addBotMessage(answer, true)
  }, [input, isTyping, addBotMessage])

  return (
    <>
      {/* Floating button */}
      <button
        className="fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3 rounded-full bg-ai-primary text-white font-medium shadow-ai-btn hover:bg-ai-dark hover:scale-105 transition-all z-[1001] border-none cursor-pointer text-base"
        onClick={openChat}
        aria-label="Открыть ИИ-ассистента"
      >
        <Cpu className="w-6 h-6" />
        <span>ИИ ассистент</span>
      </button>

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-8 w-[380px] max-w-[calc(100vw-4rem)] h-[560px] max-h-[calc(100vh-7.5rem)] bg-white rounded-[2rem] shadow-ai-window flex flex-col overflow-hidden z-[1002] border border-ai-light"
          style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}
        >
          {/* Header */}
          <div className="bg-ai-primary text-white px-5 py-4 flex justify-between items-center flex-shrink-0">
            <h3 className="text-[1.2rem] font-medium flex items-center gap-2 m-0">
              <Bot className="w-5 h-5" />
              Квант · AI ассистент
            </h3>
            <button
              className="bg-transparent border-none text-white cursor-pointer p-1.5 rounded-full hover:bg-white/20 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-3.5 bg-[#faf9ff] min-h-0">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] px-4 py-3 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.type === 'user'
                    ? 'bg-ai-primary text-white self-end rounded-br-lg'
                    : 'bg-white border border-[#e9e4ff] self-start rounded-bl-lg relative group'
                }`}
              >
                {msg.text}
                {msg.type === 'bot' && msg.text.length > 0 && (
                  <button
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity bg-transparent border-none cursor-pointer p-1"
                    onClick={() => speak(msg.text)}
                    title="Озвучить"
                  >
                    <Volume2 className="w-4 h-4 text-ai-primary" />
                  </button>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="bg-white border border-[#e9e4ff] self-start px-4 py-3 rounded-3xl rounded-bl-lg text-sm italic text-ai-primary">
                Квант печатает…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex gap-3 p-4 border-t border-ai-light bg-white flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Напиши вопрос…"
              className="flex-1 px-4 py-3 border border-[#e2e8f0] rounded-full text-sm outline-none transition-all focus:border-ai-primary focus:ring-2 focus:ring-ai-primary/20"
            />
            <button
              onClick={sendMessage}
              className="bg-ai-primary border-none rounded-full px-5 text-white cursor-pointer font-medium hover:bg-ai-dark transition-colors flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
