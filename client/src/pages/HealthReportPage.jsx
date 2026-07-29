import { useEffect, useState } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/common/Card'
import EmptyPetState from '@/components/mainpage/EmptyPetState'
import { usePet } from '@/context/usePet'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'

function splitReportSections(reportText) {
  return reportText
    .split(/^##\s*/m)
    .filter(Boolean)
    .map((block) => {
      const [title, ...rest] = block.split('\n')
      return { title: title.trim(), body: rest.join('\n').trim() }
    })
}

async function loadReport(petId, year, month) {
  return api.get(ENDPOINTS.PETS.REPORT_MONTHLY(petId), { params: { year, month } })
}

// pet.id로 키를 주어, 활성 반려동물이 바뀌면 이전 레포트 state를 이어받지 않고 다시 마운트되도록 한다.
function HealthReportContent({ pet, year, month }) {
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let ignore = false
    loadReport(pet.id, year, month)
      .then((data) => {
        if (!ignore) setReport(data)
      })
      .catch(() => {
        if (!ignore) setError('건강 레포트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
      })
    return () => {
      ignore = true
    }
  }, [pet.id, year, month])

  const handleRefresh = async () => {
    setReport(null)
    setError(null)
    try {
      setReport(await loadReport(pet.id, year, month))
    } catch {
      setError('건강 레포트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  const isLoading = !report && !error

  return (
    <PageLayout>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink">
              {pet.name}의 {year}년 {month}월 건강 레포트
            </h1>
            <p className="text-sm text-ink-secondary">AI가 체중·복약·증상 기록을 종합해 정리했어요</p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink-secondary transition-colors hover:border-primary-mint-dark hover:text-ink disabled:opacity-50"
          >
            새로고침
          </button>
        </div>

        {isLoading && <p className="text-sm text-ink-secondary">레포트를 생성하고 있어요...</p>}
        {error && <p className="text-sm text-coral">{error}</p>}

        {report && (
          <div className="flex flex-col gap-5">
            <Card title="체중 변화">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-ink-secondary">이번 달 시작</p>
                  <p className="text-sm font-semibold text-ink">
                    {report.weightChange.thisMonthStart ?? '-'}kg
                  </p>
                </div>
                <div>
                  <p className="text-xs text-ink-secondary">현재</p>
                  <p className="text-sm font-semibold text-ink">{report.weightChange.current ?? '-'}kg</p>
                </div>
                <div>
                  <p className="text-xs text-ink-secondary">한 달 전</p>
                  <p className="text-sm font-semibold text-ink">
                    {report.weightChange.oneMonthAgo ?? '-'}kg
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-secondary">{report.weightChange.analysisMessage}</p>
            </Card>

            {report.monthlySymptomFrequency.length > 0 && (
              <Card title="이번 달 증상 타임라인">
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
                      {opinion.text}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {splitReportSections(report.reportText).map(({ title, body }) => (
              <Card key={title} title={title}>
                <p className="whitespace-pre-wrap text-sm text-ink">{body}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}

export default function HealthReportPage() {
  const { activePet, isLoading } = usePet()

  if (isLoading) {
    return (
      <PageLayout>
        <p className="text-sm text-ink-secondary">불러오는 중...</p>
      </PageLayout>
    )
  }

  if (!activePet) {
    return (
      <PageLayout>
        <EmptyPetState />
      </PageLayout>
    )
  }

  const now = new Date()
  return (
    <HealthReportContent key={activePet.id} pet={activePet} year={now.getFullYear()} month={now.getMonth() + 1} />
  )
}
