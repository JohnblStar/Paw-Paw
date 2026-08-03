import { lazy, Suspense, useEffect, useState } from 'react'

// react-lottie-player와 Lottie JSON은 마스코트가 실제로 보이는 이 컴포넌트가 마운트될 때만
// 불러온다 (docs/DESIGN.md 성능 가이드라인 — 다른 페이지에서는 로드하지 않기).
const Lottie = lazy(() => import('react-lottie-player'))

const MASCOT_SOURCES = {
  dog: () => import('@/assets/lottie/mascot-dog.json'),
  cat: () => import('@/assets/lottie/mascot-cat.json'),
}

export default function Mascot({ species }) {
  const [animationData, setAnimationData] = useState(null)

  useEffect(() => {
    let ignore = false
    const load = MASCOT_SOURCES[species] ?? MASCOT_SOURCES.dog
    load().then((mod) => {
      if (!ignore) setAnimationData(mod.default)
    })
    return () => {
      ignore = true
    }
  }, [species])

  return (
    <div className="flex min-h-[clamp(320px,48vh,560px)] items-center justify-center">
      {animationData && (
        <Suspense fallback={null}>
          <Lottie loop play animationData={animationData} style={{ width: '100%', maxWidth: 480, height: '100%' }} />
        </Suspense>
      )}
    </div>
  )
}
