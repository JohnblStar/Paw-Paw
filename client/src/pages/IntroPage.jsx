import IntroHero from '../components/IntroHero'
import LoginCard from '../components/LoginCard'

function IntroPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-primary-mint/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[34rem] w-[34rem] rounded-full bg-primary-purple/25 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <IntroHero />
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <LoginCard />
          </div>
        </div>
      </div>
    </div>
  )
}

export default IntroPage
