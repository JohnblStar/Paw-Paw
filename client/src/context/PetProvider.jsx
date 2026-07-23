import { useMemo, useState } from 'react'
import { PetContext } from '@/context/PetContext'
import { mockPets } from '@/mocks/petMock'

export function PetProvider({ children }) {
  const [pets] = useState(mockPets)
  const [activePetId, setActivePetId] = useState(mockPets[0]?.id ?? null)

  const value = useMemo(() => {
    const activePet = pets.find((pet) => pet.id === activePetId) ?? null
    return { pets, activePet, activePetId, setActivePetId }
  }, [pets, activePetId])

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>
}
