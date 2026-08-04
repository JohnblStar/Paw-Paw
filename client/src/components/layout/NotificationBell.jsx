import { useCallback, useEffect, useRef, useState } from 'react'
import { usePet } from '@/context/usePet'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'

const POLL_INTERVAL_MS = 60000
const TOAST_EXIT_MS = 300

export default function NotificationBell() {
  const { activePet } = usePet()
  const [notifications, setNotifications] = useState([])
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isRinging, setIsRinging] = useState(false)
  const [toasts, setToasts] = useState([])
  const containerRef = useRef(null)
  const seenIdsRef = useRef(null)

  // Windows 알림처럼, 사용자가 직접 확인(클릭)하거나 닫기 전까지는 사라지지 않는다 —
  // 자동 타임아웃 없음. leaving만 먼저 표시해 부드럽게 페이드아웃한 뒤 실제로 제거한다.
  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.map((t) => (t.toastId === toastId ? { ...t, leaving: true } : t)))
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.toastId !== toastId))
    }, TOAST_EXIT_MS)
  }, [])

  const addToast = useCallback((notification) => {
    const toastId = `${notification.id}-${Date.now()}`
    setToasts((prev) => [...prev, { ...notification, toastId, leaving: false }])
  }, [])

  useEffect(() => {
    if (!activePet) return
    let ignore = false
    seenIdsRef.current = null

    const fetchNotifications = () => {
      api
        .get(ENDPOINTS.PETS.NOTIFICATIONS(activePet.id))
        .then((data) => {
          if (ignore) return
          const nextIds = new Set(data.notifications.map((n) => n.id))
          // 최초 로드 때는 흔들거나 토스트를 띄우지 않고, 그 이후 폴링에서 진짜 새로 생긴
          // 알림이 있을 때만 종을 흔들고 카톡 알림처럼 우측 하단에 토스트를 띄운다.
          if (seenIdsRef.current) {
            const newOnes = data.notifications.filter((n) => !seenIdsRef.current.has(n.id))
            if (newOnes.length > 0) {
              setIsRinging(true)
              newOnes.forEach(addToast)
            }
          }
          seenIdsRef.current = nextIds
          setNotifications(data.notifications)
        })
        .catch(() => {})
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => {
      ignore = true
      clearInterval(interval)
    }
  }, [activePet, addToast])

  useEffect(() => {
    if (!isRinging) return
    const timeout = setTimeout(() => setIsRinging(false), 600)
    return () => clearTimeout(timeout)
  }, [isRinging])

  useEffect(() => {
    if (!isPanelOpen) return
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isPanelOpen])

  if (!activePet) return null

  const handleToastClick = (toastId) => {
    dismissToast(toastId)
    setIsPanelOpen(true)
  }

  const handleRead = async (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    try {
      await api.patch(ENDPOINTS.PETS.NOTIFICATION_READ(activePet.id, notificationId))
    } catch {
      // 실패해도 다음 폴링에서 다시 나타날 뿐이라 조용히 무시
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsPanelOpen((prev) => !prev)}
        className="relative rounded-full p-2 text-ink-secondary transition-colors hover:text-ink"
        aria-label="알림"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`origin-top ${isRinging ? 'animate-bell-ring' : ''}`}
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-coral opacity-75" />
            <span className="relative flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
              {notifications.length}
            </span>
          </span>
        )}
      </button>

      {isPanelOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 max-h-[70vh] w-80 overflow-y-auto rounded-2xl border border-border bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">알림</h2>
            <button
              type="button"
              onClick={() => setIsPanelOpen(false)}
              aria-label="닫기"
              className="text-ink-secondary transition-colors hover:text-ink"
            >
              ×
            </button>
          </div>
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
        </div>
      )}

      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[100] flex w-72 flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.toastId}
              role="button"
              tabIndex={0}
              onClick={() => handleToastClick(toast.toastId)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') handleToastClick(toast.toastId)
              }}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-white p-4 shadow-lg transition-all duration-300 ${
                toast.leaving ? 'translate-y-1 opacity-0' : 'animate-toast-in opacity-100'
              }`}
            >
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{toast.title}</p>
                <p className="mt-0.5 text-xs text-ink-secondary">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  dismissToast(toast.toastId)
                }}
                aria-label="닫기"
                className="shrink-0 text-ink-secondary hover:text-ink"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
