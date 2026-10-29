import { FileText, LayoutDashboard, Sparkles } from 'lucide-react'
import FeatureCard from './FeatureCard'

const FEATURES = [
  {
    number: '01',
    title: '대시보드',
    description: '체중·복약·예방접종을 한눈에',
    icon: LayoutDashboard,
  },
  {
    number: '02',
    title: 'AI 챗봇',
    description: '증상 상담과 자동 기록',
    icon: Sparkles,
    isAi: true,
  },
  {
    number: '03',
    title: '건강 레포트',
    description: '월간 변화와 AI 소견 요약',
    icon: FileText,
  },
]

function IntroHero() {
  return (
    <div className="flex flex-col justify-center gap-10">
      <div>
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          <span className="text-ink">Paw</span>
          <span className="text-primary-purple">:Paw</span>
        </h1>
        <p className="mt-6 text-[28px] font-bold leading-snug tracking-tight text-ink sm:text-4xl">
          우리 아이의 하루를,
          <br />
          <span className="bg-gradient-to-r from-primary-mint-deep to-primary-purple-deep bg-clip-text text-transparent">
            AI가 함께 돌봐요
          </span>
        </p>
        <p className="mt-4 text-base leading-relaxed text-ink-secondary sm:text-lg">
          반려동물의 건강 기록과 AI 상담을 한 곳에서 관리하세요.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.number} {...feature} />
        ))}
      </div>
    </div>
  )
}

export default IntroHero
