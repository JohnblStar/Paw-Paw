import { useEffect, useRef, useState } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/common/Card'
import EmptyPetState from '@/components/mainpage/EmptyPetState'
import LoadingPaws from '@/components/common/LoadingPaws'
import RegistrationWizardModal from '@/components/chatbot/RegistrationWizardModal'
import ChatSummaryModal from '@/components/chatbot/ChatSummaryModal'
import MarkdownText from '@/components/common/MarkdownText'
import { usePet } from '@/context/usePet'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'
import { PRIMARY_BUTTON_CLASS } from '@/constants/formStyles'

const INTRO_MESSAGE = {
  role: 'assistant',
  text: '안녕하세요! 반려동물의 건강이 궁금하신가요? 자유롭게 물어봐 주세요.\n약 등록은 "등록", 예방접종/검진 등록은 "예방접종" 또는 "검진"이라고 입력해주세요.',
}

const REGISTRATION_SUGGESTION_LABEL = {
  medication: '복약을 등록해드릴까요?',
  single_date: '예방접종/검진을 등록해드릴까요?',
}

export default function ChatbotPage() {
  const { activePet, isLoading: isPetLoading } = usePet()
  const [messages, setMessages] = useState([INTRO_MESSAGE])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [wizardType, setWizardType] = useState(null)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const scrollBoxRef = useRef(null)

  useEffect(() => {
    const el = scrollBoxRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isSending])

  if (isPetLoading) {
    return (
      <PageLayout>
        <LoadingPaws />
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
          registrationSuggestion: data.registrationSuggestion ?? null,
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
                {message.role === 'assistant' ? (
                  <MarkdownText>{message.text}</MarkdownText>
                ) : (
                  <p className="whitespace-pre-wrap">{message.text}</p>
                )}
                {message.detectedSymptom && (
                  <p className="mt-2 text-xs text-primary-purple">
                    {activePet.name}의 건강 기록에 저장됐어요: {message.detectedSymptom.description}{' '}
                    <button
                      type="button"
                      onClick={() => setIsSummaryOpen(true)}
                      className="underline-offset-2 hover:underline"
                    >
                      요약 완료
                    </button>
                  </p>
                )}
                {message.registrationSuggestion && (
                  <button
                    type="button"
                    onClick={() => setWizardType(message.registrationSuggestion.type)}
                    className="mt-2 rounded-full border border-primary-mint-dark px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-primary-mint"
                  >
                    {REGISTRATION_SUGGESTION_LABEL[message.registrationSuggestion.type]}
                  </button>
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
            className={`shrink-0 ${PRIMARY_BUTTON_CLASS}`}
          >
            보내기
          </button>
        </form>
      </Card>

      <RegistrationWizardModal
        key={wizardType}
        isOpen={Boolean(wizardType)}
        onClose={() => setWizardType(null)}
        initialType={wizardType}
        onSaved={() => {
          setMessages((prev) => [...prev, { role: 'assistant', text: '등록됐어요! 대시보드에서 확인해보세요.' }])
        }}
      />

      <ChatSummaryModal isOpen={isSummaryOpen} onClose={() => setIsSummaryOpen(false)} />
    </PageLayout>
  )
}
