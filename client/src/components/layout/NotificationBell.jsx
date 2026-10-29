import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePet } from '@/context/usePet'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'

const POLL_INTERVAL_MS = 60000
const TOAST_EXIT_MS = 300

function BellIcon({ className = '' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MedicationIcon({ className = '' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  )
}

function ScheduleIcon({ className = '' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon({ className = '' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon({ className = '' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const DEFAULT_TYPE_META = { accent: 'bg-coral', badge: 'bg-coral/15 text-coral', Icon: MedicationIcon }
const TYPE_META = {
  medication: { accent: 'bg-primary-mint-dark', badge: 'bg-primary-mint/20 text-primary-mint-dark', Icon: MedicationIcon },
  schedule: { accent: 'bg-amber-dark', badge: 'bg-amber/30 text-amber-dark', Icon: ScheduleIcon },
}

export default function NotificationBell() {
  const { activePet } = usePet()
  // activePet 객체는 대시보드 갱신 때마다 새로 만들어지므로 id에만 의존한다 —
  // 객체 자체에 의존하면 갱신될 때마다 안 읽은 알림이 토스트로 중복 표시된다.
  const activePetId = activePet?.id
  const [notifications, setNotifications] = useState([])
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isRinging, setIsRinging] = useState(false)
  const [toasts, setToasts] = useState([])
  const [panelPosition, setPanelPosition] = useState(null)
  const containerRef = useRef(null)
  const panelRef = useRef(null)
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
    if (!activePetId) return
    let ignore = false
    seenIdsRef.current = null

    const fetchNotifications = () => {
      api
        .get(ENDPOINTS.PETS.NOTIFICATIONS(activePetId))
        .then((data) => {
          if (ignore) return
          const nextIds = new Set(data.notifications.map((n) => n.id))
          if (seenIdsRef.current) {
            // 이후 폴링: 진짜 새로 생긴 알림이 있을 때만 종을 흔들고 토스트를 띄운다.
            const newOnes = data.notifications.filter((n) => !seenIdsRef.current.has(n.id))
            if (newOnes.length > 0) {
              setIsRinging(true)
              newOnes.forEach(addToast)
            }
          } else {
            // 최초 로드(또는 새로고침): 아직 안 읽은 알림은 다시 토스트로 보여준다.
            data.notifications.forEach(addToast)
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
  }, [activePetId, addToast])

  useEffect(() => {
    if (!isRinging) return
    const timeout = setTimeout(() => setIsRinging(false), 600)
    return () => clearTimeout(timeout)
  }, [isRinging])

  useEffect(() => {
    if (!isPanelOpen) return
    const updatePosition = () => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setPanelPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [isPanelOpen])

  useEffect(() => {
    if (!isPanelOpen) return
    const handleClickOutside = (event) => {
      // 패널은 document.body에 포탈되어 containerRef의 DOM 하위가 아니므로 별도로 체크한다.
      const insideBell = containerRef.current?.contains(event.target)
      const insidePanel = panelRef.current?.contains(event.target)
      if (!insideBell && !insidePanel) {
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
        className="relative rounded-full p-2 text-ink-secondary transition-colors hover:bg-border/50 hover:text-ink"
        aria-label="알림"
      >
        <BellIcon className={`origin-top ${isRinging ? 'animate-bell-ring' : ''}`} />
        {notifications.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-coral opacity-75" />
            <span className="relative flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
              {notifications.length}
            </span>
          </span>
        )}
      </button>

      {isPanelOpen &&
        panelPosition &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: panelPosition.top, right: panelPosition.right }}
            className="fixed z-50 max-h-[70vh] w-80 overflow-y-auto rounded-2xl border border-border bg-white p-4 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink">알림</h2>
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                aria-label="닫기"
                className="rounded-full p-1 text-ink-secondary/70 transition-colors hover:bg-border/60 hover:text-ink"
              >
                <CloseIcon />
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <BellIcon className="text-muted" />
                <p className="text-sm text-ink-secondary">새 알림이 없어요</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {notifications.map((notification) => {
                  const { accent, badge, Icon } = TYPE_META[notification.type] ?? DEFAULT_TYPE_META
                  return (
                    <li
                      key={notification.id}
                      className="relative flex items-start gap-3 overflow-hidden rounded-xl border border-border bg-bg/60 py-2.5 pl-4 pr-3 transition-colors hover:bg-bg"
                    >
                      <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${badge}`}>
                        <Icon />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">{notification.title}</p>
                        <p className="text-xs text-ink-secondary">{notification.message}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRead(notification.id)}
                        aria-label="읽음으로 표시"
                        className="shrink-0 rounded-full p-1.5 text-ink-secondary/70 transition-colors hover:bg-primary-mint/25 hover:text-primary-mint-dark"
                      >
                        <CheckIcon />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>,
          document.body,
        )}

      {toasts.length > 0 &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-[100] flex w-72 flex-col gap-2">
            {toasts.map((toast) => {
              const { accent, badge, Icon } = TYPE_META[toast.type] ?? DEFAULT_TYPE_META
              return (
                <div
                  key={toast.toastId}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleToastClick(toast.toastId)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') handleToastClick(toast.toastId)
                  }}
                  className={`relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-2xl border border-border bg-white py-3.5 pl-5 pr-3 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
                    toast.leaving ? 'translate-y-1 opacity-0' : 'animate-toast-in opacity-100'
                  }`}
                >
                  <span className={`absolute inset-y-0 left-0 w-1.5 ${accent}`} />
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${badge}`}>
                    <Icon />
                  </span>
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
                    className="shrink-0 rounded-full p-1 text-ink-secondary/70 transition-colors hover:bg-border/60 hover:text-ink"
                  >
                    <CloseIcon />
                  </button>
                </div>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}
