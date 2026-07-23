import IntroHero from '../components/IntroHero'
import LoginCard from '../components/LoginCard'

function IntroPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary-mint/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-primary-purple/25 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:gap-20">
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
