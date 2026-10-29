import { useEffect, useState } from 'react'
import Card from '@/components/common/Card'
import EmptyPetState from '@/components/mainpage/EmptyPetState'
import LoadingPaws from '@/components/common/LoadingPaws'
import MarkdownText from '@/components/common/MarkdownText'
import ToggleButtonGroup from '@/components/mypetsy/ToggleButtonGroup'
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                disabled={!canGoPrev || isLoading}
                aria-label="이전 달"
                className="rounded-full px-2 py-1 text-ink-secondary transition-colors hover:bg-border/50 hover:text-ink disabled:opacity-30 print:hidden"
              >
                ‹
              </button>
              <h1 className="text-xl font-bold text-ink">
                {pet.name}의 {year}년 {month}월 건강 레포트
              </h1>
              <button
                type="button"
                onClick={() => moveMonth(1)}
                disabled={isCurrentMonth || isLoading}
                aria-label="다음 달"
                className="rounded-full px-2 py-1 text-ink-secondary transition-colors hover:bg-border/50 hover:text-ink disabled:opacity-30 print:hidden"
              >
                ›
              </button>
            </div>
            <p className="text-sm text-ink-secondary">AI가 체중·복약·증상 기록을 종합해 정리했어요</p>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            {isCurrentMonth && (
              <ToggleButtonGroup options={PERIOD_OPTIONS} value={period} onChange={handlePeriodChange} />
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isLoading}
              className="shrink-0 rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink-secondary transition-colors hover:border-primary-mint-dark hover:text-ink disabled:opacity-50"
            >
              새로고침
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!report}
              className="shrink-0 rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink-secondary transition-colors hover:border-primary-mint-dark hover:text-ink disabled:opacity-50"
            >
              인쇄·PDF
            </button>
          </div>
        </div>

        {isLoading && <p className="text-sm text-ink-secondary">레포트를 생성하고 있어요...</p>}
        {error && <p className="text-sm text-coral">{error}</p>}

        {report && (
          <div className="flex flex-col gap-5">
            {report.breedGuide && (
              <Card title={`${report.petProfile.breed} 품종 가이드`}>
                <div className="space-y-1.5 text-sm text-ink">
                  <p><span className="font-semibold">훈련 팁</span> · {report.breedGuide.trainingTip}</p>
                  <p><span className="font-semibold">주의할 만성질환</span> · {report.breedGuide.chronicDiseases}</p>
                  {report.breedGuide.specialCare && (
                    <p><span className="font-semibold">특별 케어</span> · {report.breedGuide.specialCare}</p>
                  )}
                </div>
              </Card>
            )}

            <Card title="체중 변화">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-ink-secondary">
                    {report.period === 'week' ? '이번 주 시작' : isCurrentMonth ? '이번 달 시작' : `${month}월 초`}
                  </p>
                  <p className="text-sm font-semibold text-ink">
                    {formatKg(report.weightChange.thisMonthStart)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-secondary">{isCurrentMonth ? '현재' : `${month}월 말`}</p>
                  <p className="text-sm font-semibold text-ink">{formatKg(report.weightChange.current)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-secondary">
                    {report.period === 'week' ? '1주 전' : '한 달 전'}
                  </p>
                  <p className="text-sm font-semibold text-ink">
                    {formatKg(report.weightChange.oneMonthAgo)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-secondary">{report.weightChange.analysisMessage}</p>
            </Card>

            {report.medicationAdherence?.length > 0 && (
              <Card title={report.period === 'week' ? '이번 주 복용률' : `${month}월 복용률`}>
                <p className="mb-3 text-sm text-ink">
                  전체 <span className="font-bold">{report.overallAdherenceRate}%</span> 챙겨 먹었어요
                </p>
                <ul className="flex flex-col gap-2.5">
                  {report.medicationAdherence.map((item) => (
                    <li key={item.title} className="text-sm">
                      <div className="mb-1 flex justify-between">
                        <span className="text-ink">{item.title}</span>
                        <span className={item.taken < item.expected ? 'text-coral' : 'text-ink'}>
                          {item.taken}/{item.expected}회 · {item.rate}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-border">
                        <div className="h-full rounded-full bg-primary-mint-dark" style={{ width: `${item.rate}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {report.monthlySymptomFrequency.length > 0 && (
              <Card title={report.period === 'week' ? '이번 주 증상 타임라인' : `${month}월 증상 타임라인`}>
                <ul className="flex flex-col gap-2">
                  {report.monthlySymptomFrequency.map((item, index) => (
                    <li key={index} className="flex gap-3 text-sm">
                      <span className="text-ink-secondary">{item.date}</span>
                      <span className="text-ink">{item.issue}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {report.diagnosisOpinions.length > 0 && (
              <Card title="핵심 소견">
                <ul className="flex flex-col gap-2">
                  {report.diagnosisOpinions.map((opinion) => (
                    <li key={opinion.id} className="flex items-start gap-2 text-sm text-ink">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-purple" />
                      <div className="min-w-0 flex-1">
                        <MarkdownText>{opinion.text}</MarkdownText>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {splitReportSections(report.reportText).map(({ title, body }) => (
              <Card key={title} title={title}>
                <div className="text-sm text-ink">
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
