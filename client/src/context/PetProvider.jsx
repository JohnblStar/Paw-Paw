import { useCallback, useEffect, useMemo, useState } from 'react'
import { PetContext } from '@/context/PetContext'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'

export function PetProvider({ children }) {
  const [pets, setPets] = useState([])
  const [activePetId, setActivePetId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.get(ENDPOINTS.USERS.PETS).then((data) => {
      if (cancelled) return
      setPets(data)
      setActivePetId(data.find((pet) => pet.isActive)?.id ?? data[0]?.id ?? null)
      setIsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const addPet = useCallback(async (petData) => {
    const newPet = await api.post(ENDPOINTS.PETS.CREATE, petData)
    setPets((prev) => [...prev, newPet])
    setActivePetId((prev) => prev ?? newPet.id)
    return newPet
  }, [])

  const updatePet = useCallback(async (id, petData) => {
    const updated = await api.patch(ENDPOINTS.PETS.UPDATE(id), petData)
    setPets((prev) => prev.map((pet) => (pet.id === id ? updated : pet)))
  }, [])

  // health-notes 수정/삭제처럼 서버가 이미 최신 PetOut을 응답으로 돌려주는 엔드포인트가
  // 로컬 pets 캐시를 다시 API 호출 없이 즉시 반영할 때 쓴다.
  const applyPetUpdate = useCallback((updatedPet) => {
    setPets((prev) => prev.map((pet) => (pet.id === updatedPet.id ? updatedPet : pet)))
  }, [])

  const deletePet = useCallback(
    async (id) => {
      await api.delete(ENDPOINTS.PETS.DELETE(id))
      setPets((prev) => {
        const next = prev.filter((pet) => pet.id !== id)
        setActivePetId((current) => (current === id ? (next[0]?.id ?? null) : current))
        return next
      })
    },
    [],
  )

  const callPet = useCallback(async (id) => {
    await api.patch(ENDPOINTS.USERS.CALL_PET(id))
    setActivePetId(id)
  }, [])

  const value = useMemo(() => {
    const activePet = pets.find((pet) => pet.id === activePetId) ?? null
    return {
      pets,
      activePet,
      activePetId,
      isLoading,
      callPet,
      addPet,
      updatePet,
      applyPetUpdate,
      deletePet,
    }
  }, [pets, activePetId, isLoading, callPet, addPet, updatePet, applyPetUpdate, deletePet])

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>
}
