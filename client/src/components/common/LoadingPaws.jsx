import { lazy, Suspense, useEffect, useState } from 'react'

// 다른 페이지의 react-lottie-player 사용처(Mascot)와 같은 청크를 공유하므로,
// 세션 중 처음 로딩 화면을 만난 시점에만 한 번 내려받는다.
const Lottie = lazy(() => import('react-lottie-player'))

export default function LoadingPaws({ size = 56 }) {
  const [animationData, setAnimationData] = useState(null)

  useEffect(() => {
    let ignore = false
    import('@/assets/lottie/loading-paws.json').then((mod) => {
      if (!ignore) setAnimationData(mod.default)
    })
    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="flex flex-col items-center gap-2 py-6">
      <div style={{ width: size, height: size }}>
        {animationData && (
          <Suspense fallback={null}>
            <Lottie loop play animationData={animationData} style={{ width: size, height: size }} />
          </Suspense>
        )}
      </div>
      <p className="text-sm text-ink-secondary">불러오는 중...</p>
    </div>
  )
}
