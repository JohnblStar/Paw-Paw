import { Link } from 'react-router-dom'
import { PawPrint, Plus } from 'lucide-react'
import Card from '@/components/common/Card'
import EmptyPetState from '@/components/mainpage/EmptyPetState'
import LoadingPaws from '@/components/common/LoadingPaws'
import PetCard from '@/components/mypetsy/PetCard'
import OwnerProfileCard from '@/components/mypetsy/OwnerProfileCard'
import { usePet } from '@/context/usePet'
import { useUser } from '@/context/useUser'
import { PRIMARY_BUTTON_CLASS } from '@/constants/formStyles'

export default function MyPetsyPage() {
  const { pets, activePetId, callPet, isLoading } = usePet()
  const { user } = useUser()

  if (isLoading) {
    return <LoadingPaws />
  }

  return (
    <>
      <OwnerProfileCard user={user} />

      <h1 className="mb-1 mt-4 text-2xl font-extrabold tracking-tight text-ink">{user?.name}님의 반려동물</h1>
      <p className="mb-6 text-sm text-ink-secondary">등록된 반려동물을 관리하고 전환할 수 있어요</p>

      {pets.length === 0 ? (
        <EmptyPetState to="/mypetsy/new" />
      ) : (
        <Card
          title="등록된 반려동물"
          icon={PawPrint}
          tone="mint"
          action={
            <Link to="/mypetsy/new" className={`${PRIMARY_BUTTON_CLASS} px-4 py-2`}>
              <Plus size={15} strokeWidth={2.5} />
              추가하기
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
    </>
  )
}
