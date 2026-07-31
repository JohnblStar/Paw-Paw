import { useEffect, useState } from 'react'
import Modal from '@/components/common/Modal'
import { usePet } from '@/context/usePet'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'

const POLL_INTERVAL_MS = 60000

export default function NotificationBell() {
  const { activePet } = usePet()
  const [notifications, setNotifications] = useState([])
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  useEffect(() => {
    if (!activePet) return
    let ignore = false

    const fetchNotifications = () => {
      api
        .get(ENDPOINTS.PETS.NOTIFICATIONS(activePet.id))
        .then((data) => {
          if (!ignore) setNotifications(data.notifications)
        })
        .catch(() => {})
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => {
      ignore = true
      clearInterval(interval)
    }
  }, [activePet])

  if (!activePet) return null

  const handleRead = async (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    try {
      await api.patch(ENDPOINTS.PETS.NOTIFICATION_READ(activePet.id, notificationId))
    } catch {
      // 실패해도 다음 폴링에서 다시 나타날 뿐이라 조용히 무시
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsPanelOpen(true)}
        className="relative rounded-full p-2 text-ink-secondary transition-colors hover:text-ink"
        aria-label="알림"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
            {notifications.length}
          </span>
        )}
      </button>

      <Modal isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} title="알림">
        {notifications.length === 0 ? (
          <p className="text-sm text-ink-secondary">새 알림이 없어요</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{notification.title}</p>
                  <p className="text-xs text-ink-secondary">{notification.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRead(notification.id)}
                  className="shrink-0 text-xs text-ink-secondary underline-offset-2 hover:underline"
                >
                  읽음
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  )
}
