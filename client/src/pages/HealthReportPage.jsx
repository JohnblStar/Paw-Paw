import { useEffect, useState } from 'react'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  HeartPulse,
  Tablets,
  Printer,
  RefreshCw,
  Scale,
  Sparkles,
} from 'lucide-react'
import Card from '@/components/common/Card'
import EmptyPetState from '@/components/mainpage/EmptyPetState'
import LoadingPaws from '@/components/common/LoadingPaws'
import MarkdownText from '@/components/common/MarkdownText'
import ToggleButtonGroup from '@/components/mypetsy/ToggleButtonGroup'
import { CHIP_BUTTON_CLASS } from '@/constants/formStyles'
import { usePet } from '@/context/usePet'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'

const PERIOD_OPTIONS = [
  { value: 'month', label: '이번 달' },
  { value: 'week', label: '이번 주' },
]

function splitReportSections(reportText) {
  return reportText
    .split(/^##\s*/m)
    .filter(Boolean)
    .map((block) => {
      const [title, ...rest] = block.split('\n')
      return { title: title.trim(), body: rest.join('\n').trim() }
    })
}

// LLM이 만든 레포트 본문 섹션 제목별 아이콘 — AI가 작성한 영역은 purple(AI 전용 색)로 구분한다
const SECTION_META = {
  종합소견: { icon: Sparkles, tone: 'purple' },
  '앞으로의 케어가이드': { icon: ClipboardList, tone: 'purple' },
  '면책 문구': { icon: CircleAlert, tone: 'neutral' },
}

const MONTH_NAV_BUTTON_CLASS =
  'flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-surface hover:text-ink hover:shadow-chip disabled:pointer-events-none disabled:opacity-30 print:hidden'

function formatKg(value) {
  return value == null ? '-' : `${value}kg`
}

function shiftYearMonth({ year, month }, delta) {
  const d = new Date(year, month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

function compareYearMonth(a, b) {
  return a.year * 12 + a.month - (b.year * 12 + b.month)
}

async function loadReport(petId, year, month, period) {
  return api.get(ENDPOINTS.PETS.REPORT_MONTHLY(petId), { params: { year, month, period } })
}

// pet.id로 키를 주어, 활성 반려동물이 바뀌면 이전 레포트 state를 이어받지 않고 다시 마운트되도록 한다.
function HealthReportContent({ pet }) {
  const now = new Date()
  const currentYearMonth = { year: now.getFullYear(), month: now.getMonth() + 1 }
  // 등록 이전 달은 데이터가 없어 LLM 호출만 낭비되므로 서버와 같은 하한을 둔다.
  const createdYearMonth = pet.createdAt
    ? { year: Number(pet.createdAt.slice(0, 4)), month: Number(pet.createdAt.slice(5, 7)) }
    : currentYearMonth
  const [viewYearMonth, setViewYearMonth] = useState(currentYearMonth)
  const { year, month } = viewYearMonth
  const isCurrentMonth = compareYearMonth(viewYearMonth, currentYearMonth) === 0
  const canGoPrev = compareYearMonth(viewYearMonth, createdYearMonth) > 0
  const [period, setPeriod] = useState('month')
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false
    loadReport(pet.id, year, month, period)
      .then((data) => {
        if (!ignore) setReport(data)
      })
      .catch(() => {
        if (!ignore) setError('건강 레포트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
      })
    return () => {
      ignore = true
    }
  }, [pet.id, year, month, period])

  const handleRefresh = async () => {
    setReport(null)
    setError(null)
    try {
      setReport(await loadReport(pet.id, year, month, period))
    } catch {
      setError('건강 레포트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  const isLoading = !report && !error

  const moveMonth = (delta) => {
    setReport(null)
    setError(null)
    // 주간 보기는 이번 달에만 의미가 있으므로 다른 달로 이동하면 월간으로 되돌린다.
    if (delta !== 0) setPeriod('month')
    setViewYearMonth((prev) => shiftYearMonth(prev, delta))
  }

  const handlePeriodChange = (next) => {
    setReport(null)
    setError(null)
    setPeriod(next)
  }

  return (
    <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex items-center gap-1 self-start rounded-full border border-border bg-surface/80 p-1 print:border-0 print:p-0">
            <button
              type="button"
              onClick={() => moveMonth(-1)}
              disabled={!canGoPrev || isLoading}
              aria-label="이전 달"
              className={MONTH_NAV_BUTTON_CLASS}
            >
              <ChevronLeft size={17} />
            </button>
            <span className="px-1 text-sm font-bold tabular-nums text-ink">
              {year}년 {month}월
            </span>
            <button
              type="button"
              onClick={() => moveMonth(1)}
              disabled={isCurrentMonth || isLoading}
              aria-label="다음 달"
              className={MONTH_NAV_BUTTON_CLASS}
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[1.75rem]">
              {pet.name}의 {year}년 {month}월 건강 레포트
            </h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-secondary">
              <Sparkles size={14} className="text-primary-purple-deep" />
              AI가 체중·복약·증상 기록을 종합해 정리했어요
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {isCurrentMonth && (
              <div className="w-48">
                <ToggleButtonGroup options={PERIOD_OPTIONS} value={period} onChange={handlePeriodChange} />
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={handleRefresh} disabled={isLoading} className={CHIP_BUTTON_CLASS}>
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                새로고침
              </button>
              <button type="button" onClick={() => window.print()} disabled={!report} className={CHIP_BUTTON_CLASS}>
                <Printer size={13} />
                인쇄·PDF
              </button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border-strong bg-surface/60 py-14 text-center">
            <Sparkles size={22} className="animate-pulse text-primary-purple-deep" />
            <p className="text-sm text-ink-secondary">레포트를 생성하고 있어요...</p>
          </div>
        )}
        {error && (
          <p className="flex items-center gap-2 rounded-2xl bg-coral-soft px-4 py-3 text-sm text-coral-deep">
            <CircleAlert size={16} className="shrink-0" />
            {error}
          </p>
        )}

        {report && (
          <div className="flex flex-col gap-5">
            {report.breedGuide && (
              <Card title={`${report.petProfile.breed} 품종 가이드`} icon={BookOpen}>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold text-ink-secondary">훈련 팁</dt>
                    <dd className="mt-0.5 leading-relaxed text-ink">{report.breedGuide.trainingTip}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-ink-secondary">주의할 만성질환</dt>
                    <dd className="mt-0.5 leading-relaxed text-ink">{report.breedGuide.chronicDiseases}</dd>
                  </div>
                  {report.breedGuide.specialCare && (
                    <div>
                      <dt className="text-xs font-semibold text-ink-secondary">특별 케어</dt>
                      <dd className="mt-0.5 leading-relaxed text-ink">{report.breedGuide.specialCare}</dd>
                    </div>
                  )}
                </dl>
              </Card>
            )}

            <Card title="체중 변화" icon={Scale}>
              <div className="grid grid-cols-3 divide-x divide-border rounded-2xl bg-surface-muted/70 py-4 text-center">
                <div>
                  <p className="text-xs text-ink-secondary">
                    {report.period === 'week' ? '이번 주 시작' : isCurrentMonth ? '이번 달 시작' : `${month}월 초`}
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-ink">
                    {formatKg(report.weightChange.thisMonthStart)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-secondary">{isCurrentMonth ? '현재' : `${month}월 말`}</p>
                  <p className="mt-1 text-lg font-extrabold tabular-nums text-primary-mint-deep">{formatKg(report.weightChange.current)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-secondary">
                    {report.period === 'week' ? '1주 전' : '한 달 전'}
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-ink">
                    {formatKg(report.weightChange.oneMonthAgo)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-secondary">{report.weightChange.analysisMessage}</p>
            </Card>

            {report.medicationAdherence?.length > 0 && (
              <Card title={report.period === 'week' ? '이번 주 복용률' : `${month}월 복용률`} icon={Tablets} tone="mint">
                <p className="mb-4 text-sm text-ink-secondary">
                  전체{' '}
                  <span className="text-2xl font-extrabold tabular-nums tracking-tight text-ink">
                    {report.overallAdherenceRate}%
                  </span>{' '}
                  챙겨 먹었어요
                </p>
                <ul className="flex flex-col gap-3.5">
                  {report.medicationAdherence.map((item) => (
                    <li key={item.title} className="text-sm">
                      <div className="mb-1.5 flex justify-between">
                        <span className="font-medium text-ink">{item.title}</span>
                        <span className={`tabular-nums ${item.taken < item.expected ? 'text-coral-deep' : 'text-ink'}`}>
                          {item.taken}/{item.expected}회 · {item.rate}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                        <div className="h-full rounded-full bg-primary-mint-dark transition-[width] duration-700" style={{ width: `${item.rate}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {report.monthlySymptomFrequency.length > 0 && (
              <Card title={report.period === 'week' ? '이번 주 증상 타임라인' : `${month}월 증상 타임라인`} icon={HeartPulse} tone="purple">
                <ul className="flex flex-col divide-y divide-border">
                  {report.monthlySymptomFrequency.map((item, index) => (
                    <li key={index} className="flex gap-4 py-2.5 text-sm first:pt-0 last:pb-0">
                      <span className="shrink-0 text-muted">{item.date}</span>
                      <span className="text-ink">{item.issue}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {report.diagnosisOpinions.length > 0 && (
              <Card title="핵심 소견" icon={Sparkles} tone="purple" className="border-primary-purple/40">
                <ul className="flex flex-col gap-3">
                  {report.diagnosisOpinions.map((opinion) => (
                    <li key={opinion.id} className="flex items-start gap-3 text-sm leading-relaxed text-ink">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-purple-soft text-[10px] font-bold tabular-nums text-primary-purple-deep">
                        {opinion.id}
                      </span>
                      <div className="min-w-0 flex-1">
                        <MarkdownText>{opinion.text}</MarkdownText>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {splitReportSections(report.reportText).map(({ title, body }) => (
              <Card key={title} title={title} icon={SECTION_META[title]?.icon} tone={SECTION_META[title]?.tone}>
                <div className="text-sm leading-relaxed text-ink">
                  <MarkdownText>{body}</MarkdownText>
                </div>
              </Card>
            ))}
          </div>
        )}
    </div>
  )
}

export default function HealthReportPage() {
  const { activePet, isLoading } = usePet()

  if (isLoading) {
    return <LoadingPaws />
  }

  if (!activePet) {
    return <EmptyPetState />
  }

  return <HealthReportContent key={activePet.id} pet={activePet} />
}
