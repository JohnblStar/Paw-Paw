import IntroHero from '../components/IntroHero'
import LoginCard from '../components/LoginCard'

function IntroPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:gap-16">
        <IntroHero />
        <div className="flex justify-center">
          <div className="w-full max-w-sm">
            <LoginCard />
          </div>
        </div>
      </div>
    </div>
  )
}

export default IntroPage
