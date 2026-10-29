import { useEffect, useRef, useState } from 'react'
import { ArrowUp, HeartPulse, Plus, Sparkles } from 'lucide-react'
import Card from '@/components/common/Card'
import EmptyPetState from '@/components/mainpage/EmptyPetState'
import LoadingPaws from '@/components/common/LoadingPaws'
import RegistrationWizardModal from '@/components/chatbot/RegistrationWizardModal'
import ChatSummaryModal from '@/components/chatbot/ChatSummaryModal'
import MarkdownText from '@/components/common/MarkdownText'
import { usePet } from '@/context/usePet'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'
import IconChip from '@/components/common/IconChip'

const INTRO_MESSAGE = {
  role: 'assistant',
  text: '안녕하세요! 반려동물의 건강이 궁금하신가요? 자유롭게 물어봐 주세요.\n약 등록은 "등록", 예방접종/검진 등록은 "예방접종" 또는 "검진"이라고 입력해주세요.',
}

const REGISTRATION_SUGGESTION_LABEL = {
  medication: '복약을 등록해드릴까요?',
  single_date: '예방접종/검진을 등록해드릴까요?',
}

// 다른 탭에 다녀와도 대화가 사라지지 않도록 반려동물별로 세션 동안만 보관한다 (브라우저를 닫으면 초기화).
const STORAGE_KEY_PREFIX = 'pawpaw-chat:'
const MAX_STORED_MESSAGES = 50

function loadStoredMessages(petId) {
  try {
    const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY_PREFIX + petId))
    return Array.isArray(stored) && stored.length > 0 ? stored : [INTRO_MESSAGE]
  } catch {
    return [INTRO_MESSAGE]
  }
}

function storeMessages(petId, messages) {
  try {
    sessionStorage.setItem(STORAGE_KEY_PREFIX + petId, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)))
  } catch {
    // 저장 공간 부족/차단 시에는 이번 세션 화면에서만 유지된다
  }
}

// 후속 질문 문맥용 직전 1턴 (사용자 질문 + 그에 대한 AI 답변). 서버가 길이를 잘라서 쓴다.
function findPreviousTurn(messages) {
  for (let i = messages.length - 1; i > 0; i -= 1) {
    if (messages[i].role === 'assistant' && messages[i - 1].role === 'user') {
      return { question: messages[i - 1].text, answer: messages[i].text }
    }
  }
  return null
}

export default function ChatbotPage() {
  const { activePet, isLoading: isPetLoading } = usePet()

  if (isPetLoading) {
    return <LoadingPaws />
  }

  if (!activePet) {
    return <EmptyPetState />
  }

  // pet.id로 키를 주어, 활성 반려동물이 바뀌면 그 아이의 대화로 다시 마운트되도록 한다.
  return <ChatbotContent key={activePet.id} activePet={activePet} />
}

function ChatbotContent({ activePet }) {
  const { applyPetUpdate } = usePet()
  const [messages, setMessages] = useState(() => loadStoredMessages(activePet.id))
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [wizardType, setWizardType] = useState(null)
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const scrollBoxRef = useRef(null)

  useEffect(() => {
    const el = scrollBoxRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isSending])

  useEffect(() => {
    storeMessages(activePet.id, messages)
  }, [activePet.id, messages])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const message = input.trim()
    if (!message || isSending) return

    setMessages((prev) => [...prev, { role: 'user', text: message }])
    setInput('')
    setIsSending(true)

    try {
      const previousTurn = findPreviousTurn(messages)
      const data = await api.post(ENDPOINTS.CHAT.QUERY, previousTurn ? { message, previousTurn } : { message })
      // 새 건강 기록이 저장된 응답이면 대시보드/메인페이지가 새로고침 없이도 바로
      // 최신 상태를 보여주도록 PetProvider 캐시를 즉시 동기화한다.
      if (data.pet) applyPetUpdate(data.pet)
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
    <>
      <Card className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <IconChip icon={Sparkles} tone="purple" size="md" />
          <div className="min-w-0">
            <p className="text-[15px] font-bold tracking-tight text-ink">AI 건강 상담</p>
            <p className="truncate text-xs text-ink-secondary">{activePet.name}의 기록을 참고해서 답해요</p>
          </div>
        </div>

        <div ref={scrollBoxRef} className="flex-1 space-y-5 overflow-y-auto bg-surface-muted/40 px-4 py-6 sm:px-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex items-end gap-2.5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && <IconChip icon={Sparkles} tone="purple" size="sm" className="mb-0.5" />}
              <div
                className={`max-w-[82%] px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'rounded-[1.25rem] rounded-br-md bg-ink text-white'
                    : 'rounded-[1.25rem] rounded-bl-md border border-border bg-surface text-ink shadow-chip'
                }`}
              >
                {message.role === 'assistant' ? (
                  <MarkdownText>{message.text}</MarkdownText>
                ) : (
                  <p className="whitespace-pre-wrap">{message.text}</p>
                )}
                {message.detectedSymptom && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-primary-purple-soft px-3 py-2 text-xs text-primary-purple-deep">
                    <HeartPulse size={14} className="mt-px shrink-0" />
                    <p>
                      {activePet.name}의 건강 기록에 저장됐어요: {message.detectedSymptom.description}{' '}
                      <button
                        type="button"
                        onClick={() => setIsSummaryOpen(true)}
                        className="font-semibold underline underline-offset-2 hover:no-underline"
                      >
                        요약 완료
                      </button>
                    </p>
                  </div>
                )}
                {message.registrationSuggestion && (
                  <button
                    type="button"
                    onClick={() => setWizardType(message.registrationSuggestion.type)}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary-mint-soft px-3 py-1.5 text-xs font-semibold text-primary-mint-deep transition-colors hover:bg-primary-mint"
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    {REGISTRATION_SUGGESTION_LABEL[message.registrationSuggestion.type]}
                  </button>
                )}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex items-end gap-2.5">
              <IconChip icon={Sparkles} tone="purple" size="sm" className="mb-0.5" />
              <div className="flex items-center gap-2 rounded-[1.25rem] rounded-bl-md border border-border bg-surface px-4 py-3 shadow-chip">
                <span className="flex gap-1" aria-hidden="true">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-purple [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-purple [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-purple" />
                </span>
                <p className="text-xs text-ink-secondary">답변을 준비하고 있어요...</p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-border bg-surface p-3 sm:p-4">
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface-muted/60 py-1.5 pl-5 pr-1.5 transition-colors focus-within:border-primary-mint-dark focus-within:bg-surface focus-within:ring-4 focus-within:ring-primary-mint-soft">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`${activePet.name}의 건강에 대해 물어보세요`}
              disabled={isSending}
              className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-ink placeholder:text-muted focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              aria-label="보내기"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-all hover:bg-ink/85 active:scale-95 disabled:bg-border-strong"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </div>
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
    </>
  )
}
