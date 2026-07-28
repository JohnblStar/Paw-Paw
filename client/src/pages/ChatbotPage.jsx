import { useEffect, useRef, useState } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/common/Card'
import EmptyPetState from '@/components/mainpage/EmptyPetState'
import { usePet } from '@/context/usePet'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'

const INTRO_MESSAGE = {
  role: 'assistant',
  text: '안녕하세요! 반려동물의 건강이 궁금하신가요? 자유롭게 물어봐 주세요.',
}

export default function ChatbotPage() {
  const { activePet, isLoading: isPetLoading } = usePet()
  const [messages, setMessages] = useState([INTRO_MESSAGE])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollBoxRef = useRef(null)

  useEffect(() => {
    const el = scrollBoxRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isSending])

  if (isPetLoading) {
    return (
      <PageLayout>
        <p className="text-sm text-ink-secondary">불러오는 중...</p>
      </PageLayout>
    )
  }

  if (!activePet) {
    return (
      <PageLayout>
        <EmptyPetState />
      </PageLayout>
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const message = input.trim()
    if (!message || isSending) return

    setMessages((prev) => [...prev, { role: 'user', text: message }])
    setInput('')
    setIsSending(true)

    try {
      const data = await api.post(ENDPOINTS.CHAT.QUERY, { message })
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply,
          detectedSymptom: data.isSymptomDetected ? data.detectedSymptom : null,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'AI 상담이 일시적으로 제한됩니다. 잠시 후 다시 시도해 주세요.' },
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <PageLayout>
      <Card className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col p-0">
        <div ref={scrollBoxRef} className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  message.role === 'user'
                    ? 'bg-primary-mint text-ink'
                    : 'border border-border bg-white text-ink'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.detectedSymptom && (
                  <p className="mt-2 text-xs text-primary-purple">
                    {activePet.name}의 건강 기록에 저장됐어요: {message.detectedSymptom.description}
                  </p>
                )}
              </div>
            </div>
          ))}
          {isSending && <p className="text-xs text-ink-secondary">답변을 준비하고 있어요...</p>}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-4">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`${activePet.name}의 건강에 대해 물어보세요`}
            disabled={isSending}
            className="min-w-0 flex-1 rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-ink focus:border-primary-mint-dark focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="shrink-0 rounded-xl bg-primary-mint px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-primary-mint-dark hover:text-white disabled:opacity-50"
          >
            보내기
          </button>
        </form>
      </Card>
    </PageLayout>
  )
}
