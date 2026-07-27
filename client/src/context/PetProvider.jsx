import { useCallback, useMemo, useState } from 'react'
import { PetContext } from '@/context/PetContext'
import { mockPets } from '@/mocks/petMock'

export function PetProvider({ children }) {
  const [pets, setPets] = useState(mockPets)
  const [activePetId, setActivePetId] = useState(mockPets[0]?.id ?? null)

  // 백엔드에 pet 라우트가 생기면 이 자리에서 axios 호출로 교체 예정.
  // 지금은 로컬 state만 즉시 갱신한다.
  const addPet = useCallback(async (petData) => {
    const newPet = { id: `pet-${crypto.randomUUID()}`, managedConditions: [], ...petData }
    setPets((prev) => [...prev, newPet])
    setActivePetId((prev) => prev ?? newPet.id)
    return newPet
  }, [])

  const updatePet = useCallback(async (id, petData) => {
    setPets((prev) => prev.map((pet) => (pet.id === id ? { ...pet, ...petData } : pet)))
  }, [])

  const deletePet = useCallback(
    async (id) => {
      const next = pets.filter((pet) => pet.id !== id)
      setPets(next)
      setActivePetId((current) => (current === id ? (next[0]?.id ?? null) : current))
    },
    [pets],
  )

  const value = useMemo(() => {
    const activePet = pets.find((pet) => pet.id === activePetId) ?? null
    return { pets, activePet, activePetId, setActivePetId, addPet, updatePet, deletePet }
  }, [pets, activePetId, addPet, updatePet, deletePet])

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>
}
