import { useEffect, useState } from 'react'
import Modal from '@/components/common/Modal'
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
      {isLoading && <p className="text-sm text-ink-secondary">불러오는 중...</p>}
      {error && <p className="text-sm text-coral">{error}</p>}
      {summary && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">기록된 증상</p>
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
          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink">AI 의심 증상</p>
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
          <p className="text-xs text-ink-secondary">{summary.notice}</p>
        </div>
      )}
    </Modal>
  )
}
