import Navbar from '@/components/layout/Navbar'

export default function PageLayout({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <div className="pointer-events-none absolute -right-40 -top-24 h-96 w-96 rounded-full bg-primary-mint/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-primary-purple/15 blur-3xl" />

      <Navbar />
      <main className="relative mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  )
}
