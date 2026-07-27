import { useCallback, useMemo, useState } from 'react'
import { PetContext } from '@/context/PetContext'
import { mockPets, mockWeightEntries } from '@/mocks/petMock'

export function PetProvider({ children }) {
  const [pets, setPets] = useState(mockPets)
  const [activePetId, setActivePetId] = useState(mockPets[0]?.id ?? null)
  const [weightEntriesByPetId, setWeightEntriesByPetId] = useState(mockWeightEntries)

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

  const deletePet = useCallback(async (id) => {
    setPets((prev) => {
      const next = prev.filter((pet) => pet.id !== id)
      setActivePetId((current) => (current === id ? (next[0]?.id ?? null) : current))
      return next
    })
  }, [])

  // 특정 날짜에 이미 기록이 있으면 덮어쓰고, 없으면 새로 추가한다 (하루 1개 기록).
  const addWeightEntry = useCallback(async (petId, { date, weight }) => {
    setWeightEntriesByPetId((prev) => {
      const entries = prev[petId] ?? []
      const existing = entries.find((entry) => entry.date === date)
      const nextEntries = existing
        ? entries.map((entry) => (entry.date === date ? { ...entry, weight } : entry))
        : [...entries, { id: `weight-${crypto.randomUUID()}`, date, weight }]
      return { ...prev, [petId]: nextEntries }
    })
  }, [])

  const updateWeightEntry = useCallback(async (petId, entryId, { date, weight }) => {
    setWeightEntriesByPetId((prev) => ({
      ...prev,
      [petId]: (prev[petId] ?? []).map((entry) =>
        entry.id === entryId ? { ...entry, date, weight } : entry,
      ),
    }))
  }, [])

  const deleteWeightEntry = useCallback(async (petId, entryId) => {
    setWeightEntriesByPetId((prev) => ({
      ...prev,
      [petId]: (prev[petId] ?? []).filter((entry) => entry.id !== entryId),
    }))
  }, [])

  const value = useMemo(() => {
    const activePet = pets.find((pet) => pet.id === activePetId) ?? null
    return {
      pets,
      activePet,
      activePetId,
      setActivePetId,
      addPet,
      updatePet,
      deletePet,
      weightEntriesByPetId,
      addWeightEntry,
      updateWeightEntry,
      deleteWeightEntry,
    }
  }, [
    pets,
    activePetId,
    addPet,
    updatePet,
    deletePet,
    weightEntriesByPetId,
    addWeightEntry,
    updateWeightEntry,
    deleteWeightEntry,
  ])

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>
}
