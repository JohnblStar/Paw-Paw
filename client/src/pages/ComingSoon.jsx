import PageLayout from '@/components/layout/PageLayout'

export default function ComingSoon({ label }) {
  return (
    <PageLayout>
      <p className="text-sm text-ink-secondary">{label} — 준비 중입니다</p>
    </PageLayout>
  )
}
