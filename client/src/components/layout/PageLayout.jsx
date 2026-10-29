import Navbar from '@/components/layout/Navbar'

export default function PageLayout({ children }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-bg">
      <div className="pointer-events-none absolute -right-40 -top-24 h-96 w-96 rounded-full bg-primary-mint/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-primary-purple/15 blur-3xl" />

      <Navbar />
      <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-28 pt-6 sm:px-6 sm:pt-8 md:pb-12">{children}</main>
    </div>
  )
}
