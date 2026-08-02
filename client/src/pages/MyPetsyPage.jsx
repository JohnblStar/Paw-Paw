import { Link } from 'react-router-dom'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/common/Card'
import EmptyPetState from '@/components/mainpage/EmptyPetState'
import PetCard from '@/components/mypetsy/PetCard'
import OwnerProfileCard from '@/components/mypetsy/OwnerProfileCard'
import { usePet } from '@/context/usePet'
import { useUser } from '@/context/useUser'

export default function MyPetsyPage() {
  const { pets, activePetId, callPet, isLoading } = usePet()
  const { user } = useUser()

  if (isLoading) {
    return (
      <PageLayout>
        <p className="text-sm text-ink-secondary">불러오는 중...</p>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <OwnerProfileCard user={user} />

      <h1 className="mb-1 text-xl font-bold text-ink">{user?.name}님의 반려동물</h1>
      <p className="mb-6 text-sm text-ink-secondary">등록된 반려동물을 관리하고 전환할 수 있어요</p>

      {pets.length === 0 ? (
        <EmptyPetState to="/mypetsy/new" />
      ) : (
        <Card
          title="등록된 반려동물"
          action={
            <Link
              to="/mypetsy/new"
              className="rounded-full bg-primary-mint px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-primary-mint-dark hover:text-white"
            >
              + 추가하기
            </Link>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                isActive={pet.id === activePetId}
                onCall={() => callPet(pet.id)}
              />
            ))}
          </div>
        </Card>
      )}
    </PageLayout>
  )
}
