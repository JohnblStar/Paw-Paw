import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePet } from '@/context/usePet'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'
import { Bell as BellIcon, BellOff, Check as CheckIcon, Tablets as MedicationIcon, Syringe as ScheduleIcon, X as CloseIcon } from 'lucide-react'

const POLL_INTERVAL_MS = 60000
const TOAST_EXIT_MS = 300

const DEFAULT_TYPE_META = { accent: 'bg-coral', badge: 'bg-coral-soft text-coral-deep', Icon: MedicationIcon }
const TYPE_META = {
  medication: { accent: 'bg-primary-mint-dark', badge: 'bg-primary-mint-soft text-primary-mint-deep', Icon: MedicationIcon },
  schedule: { accent: 'bg-amber-dark', badge: 'bg-amber-soft text-amber-deep', Icon: ScheduleIcon },
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
        // 활성 펫만이 아니라 모든 반려동물의 알림을 한 번에 받는다 — 활성 펫을 바꾸지 않아도 다른 아이의 복약을 놓치지 않게.
        .get(ENDPOINTS.NOTIFICATIONS.ALL)
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

  const handleRead = async (notification) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
    try {
      await api.patch(ENDPOINTS.PETS.NOTIFICATION_READ(notification.petId ?? activePet.id, notification.id))
    } catch {
      // 실패해도 다음 폴링에서 다시 나타날 뿐이라 조용히 무시
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsPanelOpen((prev) => !prev)}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-surface-muted hover:text-ink ${
          isPanelOpen ? 'bg-surface-muted text-ink' : 'text-ink-secondary'
        }`}
        aria-label="알림"
      >
        <BellIcon size={19} className={`origin-top ${isRinging ? 'animate-bell-ring' : ''}`} />
        {notifications.length > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-coral opacity-60" />
            <span className="relative flex h-4 min-w-4 items-center justify-center rounded-full bg-coral-deep px-1 text-[10px] font-bold tabular-nums text-white ring-2 ring-bg">
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
            className="fixed z-50 max-h-[70vh] w-[calc(100vw-2rem)] max-w-80 animate-modal-in overflow-y-auto rounded-3xl border border-border bg-surface p-4 shadow-pop"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                알림
                {notifications.length > 0 && (
                  <span className="rounded-full bg-coral-soft px-2 py-0.5 text-[11px] font-bold tabular-nums text-coral-deep">
                    {notifications.length}
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={() => setIsPanelOpen(false)}
                aria-label="닫기"
                className="rounded-full p-1.5 text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink"
              >
                <CloseIcon size={16} />
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-muted text-muted">
                  <BellOff size={20} />
                </span>
                <p className="text-sm text-ink-secondary">새 알림이 없어요</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {notifications.map((notification) => {
                  const { accent, badge, Icon } = TYPE_META[notification.type] ?? DEFAULT_TYPE_META
                  return (
                    <li
                      key={notification.id}
                      className="relative flex items-start gap-3 overflow-hidden rounded-2xl border border-border bg-surface py-3 pl-4 pr-3 transition-colors hover:bg-surface-muted/60"
                    >
                      <span className={`absolute inset-y-0 left-0 w-1 ${accent}`} />
                      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${badge}`}>
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-ink">
                          {notification.petName && <span className="text-ink-secondary">[{notification.petName}] </span>}
                          {notification.title}
                        </p>
                        <p className="text-xs text-ink-secondary">{notification.message}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRead(notification)}
                        aria-label="읽음으로 표시"
                        className="shrink-0 rounded-full p-1.5 text-ink-secondary transition-colors hover:bg-primary-mint-soft hover:text-primary-mint-deep"
                      >
                        <CheckIcon size={16} />
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
          <div className="fixed bottom-24 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-72 flex-col gap-2 md:bottom-4 print:hidden">
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
                  className={`relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-2xl border border-border bg-surface py-3.5 pl-5 pr-3 shadow-pop transition-all duration-300 hover:-translate-y-0.5 ${
                    toast.leaving ? 'translate-y-1 opacity-0' : 'animate-toast-in opacity-100'
                  }`}
                >
                  <span className={`absolute inset-y-0 left-0 w-1.5 ${accent}`} />
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${badge}`}>
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {toast.petName && <span className="text-ink-secondary">[{toast.petName}] </span>}
                      {toast.title}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-secondary">{toast.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      dismissToast(toast.toastId)
                    }}
                    aria-label="닫기"
                    className="shrink-0 rounded-full p-1 text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink"
                  >
                    <CloseIcon size={14} />
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
