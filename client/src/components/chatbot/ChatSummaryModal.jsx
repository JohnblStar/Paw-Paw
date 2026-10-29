import { useEffect, useState } from 'react'
import { HeartPulse, Info, Sparkles } from 'lucide-react'
import Modal from '@/components/common/Modal'
import LoadingPaws from '@/components/common/LoadingPaws'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'

export default function ChatSummaryModal({ isOpen, onClose }) {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    let ignore = false
    api
      .post(ENDPOINTS.CHAT.SUMMARY)
      .then((data) => {
        if (!ignore) setSummary(data)
      })
      .catch(() => {
        if (!ignore) setError('요약을 불러오지 못했어요. 잠시 후 다시 시도해주세요.')
      })
    return () => {
      ignore = true
    }
  }, [isOpen])

  if (!isOpen) return null

  const isLoading = !summary && !error

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={summary?.summaryTitle ?? '답변 요약'}>
      {isLoading && <LoadingPaws size={40} />}
      {error && <p className="text-sm text-coral-deep">{error}</p>}
      {summary && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border p-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <HeartPulse size={15} className="text-primary-mint-deep" />
              기록된 증상
            </p>
            {summary.uploadedSymptoms.length === 0 ? (
              <p className="text-sm text-ink-secondary">오늘 기록된 증상이 없어요</p>
            ) : (
              <ul className="space-y-1 text-sm text-ink">
                {summary.uploadedSymptoms.map((symptom, index) => (
                  <li key={index}>· {symptom}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-primary-purple/30 bg-primary-purple-soft/60 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-primary-purple-deep">
              <Sparkles size={15} />
              AI 의심 증상
            </p>
            {summary.suspectedSymptoms.length === 0 ? (
              <p className="text-sm text-ink-secondary">의심 증상이 없어요</p>
            ) : (
              <ul className="space-y-1 text-sm text-ink">
                {summary.suspectedSymptoms.map((symptom, index) => (
                  <li key={index}>· {symptom}</li>
                ))}
              </ul>
            )}
          </div>
          <p className="flex items-start gap-1.5 text-xs text-ink-secondary">
            <Info size={13} className="mt-px shrink-0" />
            {summary.notice}
          </p>
        </div>
      )}
    </Modal>
  )
}
