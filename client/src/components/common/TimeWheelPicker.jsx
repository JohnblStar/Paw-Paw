import { useEffect, useLayoutEffect, useRef } from 'react'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

const ROW_HEIGHT = 36
const VISIBLE_ROWS = 5
const PADDING_BLOCK = (ROW_HEIGHT * (VISIBLE_ROWS - 1)) / 2
const DRAG_THRESHOLD = 3

function pad(n) {
  return String(n).padStart(2, '0')
}

function clampIndex(raw, length) {
  return Math.min(Math.max(raw, 0), length - 1)
}

// 네이티브 <input type="time">은 휠 한 번에 값이 건너뛰거나 페이지 스크롤과 충돌하는 문제가 있어,
// 손가락/마우스로 잡고 위아래로 끄는 모바일 피커 방식(포인터 드래그 → scrollTop 직접 갱신 → 스냅)으로 대체한다.
// 옵션 배열이 0부터 시작하는 연속값이라 인덱스 == 값이므로 scrollTop만으로 바로 선택값을 계산할 수 있다.
function WheelColumn({ options, value, onSelect }) {
  const listRef = useRef(null)
  const skipNextScroll = useRef(true)
  const settleTimer = useRef(null)
  const drag = useRef(null)
  const justDragged = useRef(false)

  useLayoutEffect(() => {
    listRef.current?.scrollTo({ top: value * ROW_HEIGHT })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => clearTimeout(settleTimer.current), [])

  const commitFromScrollTop = () => {
    const el = listRef.current
    if (!el) return
    const index = clampIndex(Math.round(el.scrollTop / ROW_HEIGHT), options.length)
    if (options[index] !== value) onSelect(options[index])
  }

  const handleScroll = () => {
    if (skipNextScroll.current) {
      skipNextScroll.current = false
      return
    }
    if (drag.current) return // 드래그 중에는 pointer 핸들러가 값 반영을 맡는다
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(commitFromScrollTop, 120)
  }

  const handlePick = (option) => {
    onSelect(option)
    listRef.current?.scrollTo({ top: option * ROW_HEIGHT, behavior: 'smooth' })
  }

  const handlePointerDown = (event) => {
    const el = listRef.current
    if (!el) return
    drag.current = { startY: event.clientY, startTop: el.scrollTop, moved: false }
    el.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    const el = listRef.current
    if (!drag.current || !el) return
    const delta = event.clientY - drag.current.startY
    if (!drag.current.moved && Math.abs(delta) > DRAG_THRESHOLD) drag.current.moved = true
    if (drag.current.moved) el.scrollTop = drag.current.startTop - delta
  }

  const handlePointerUp = (event) => {
    const el = listRef.current
    if (drag.current?.moved && el) {
      justDragged.current = true
      const index = clampIndex(Math.round(el.scrollTop / ROW_HEIGHT), options.length)
      el.scrollTo({ top: index * ROW_HEIGHT, behavior: 'smooth' })
      if (options[index] !== value) onSelect(options[index])
    }
    el?.releasePointerCapture?.(event.pointerId)
    drag.current = null
  }

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ height: ROW_HEIGHT * VISIBLE_ROWS, paddingBlock: PADDING_BLOCK, touchAction: 'none' }}
      className="w-14 cursor-grab select-none snap-y snap-mandatory overflow-y-scroll overscroll-contain scroll-smooth active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => {
            if (justDragged.current) {
              justDragged.current = false
              return
            }
            handlePick(option)
          }}
          style={{ height: ROW_HEIGHT }}
          className={`flex w-full snap-center items-center justify-center text-base transition-colors ${
            option === value ? 'font-semibold text-ink' : 'text-ink-secondary/60 hover:text-ink-secondary'
          }`}
        >
          {pad(option)}
        </button>
      ))}
    </div>
  )
}

export default function TimeWheelPicker({ value, onChange }) {
  const [hh, mm] = value.split(':').map(Number)

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-bg">
      <div className="relative mx-auto flex w-fit items-center gap-1.5 px-3">
        <WheelColumn options={HOURS} value={hh} onSelect={(h) => onChange(`${pad(h)}:${pad(mm)}`)} />
        <span className="text-base font-semibold text-ink-secondary">:</span>
        <WheelColumn options={MINUTES} value={mm} onSelect={(m) => onChange(`${pad(hh)}:${pad(m)}`)} />

        <div
          style={{ height: ROW_HEIGHT }}
          className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 rounded-xl bg-primary-mint/30"
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-bg to-transparent" />
    </div>
  )
}
