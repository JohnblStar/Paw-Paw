import { useCallback, useMemo, useState } from 'react'
import { WeightContext } from '@/context/WeightContext'
import api from '@/api/instance'
import { ENDPOINTS } from '@/api/endpoints'

export function WeightProvider({ children }) {
  const [weightEntriesByPetId, setWeightEntriesByPetId] = useState({})

  const ensureWeightEntries = useCallback(async (petId) => {
    if (!petId) return
    const entries = await api.get(ENDPOINTS.PETS.WEIGHTS(petId))
    setWeightEntriesByPetId((prev) => ({ ...prev, [petId]: entries }))
  }, [])

  const addWeightEntry = useCallback(async (petId, { date, weight }) => {
    const entry = await api.post(ENDPOINTS.PETS.WEIGHTS(petId), { date, weight })
    setWeightEntriesByPetId((prev) => {
      const entries = prev[petId] ?? []
      const existing = entries.find((e) => e.date === entry.date)
      const nextEntries = existing
        ? entries.map((e) => (e.date === entry.date ? entry : e))
        : [entry, ...entries]
      return { ...prev, [petId]: nextEntries }
    })
  }, [])

  const updateWeightEntry = useCallback(async (petId, entryId, { date, weight }) => {
    const entry = await api.patch(ENDPOINTS.PETS.WEIGHT_DETAIL(petId, entryId), { date, weight })
    setWeightEntriesByPetId((prev) => ({
      ...prev,
      [petId]: (prev[petId] ?? []).map((e) => (e.id === entryId ? entry : e)),
    }))
  }, [])

  const deleteWeightEntry = useCallback(async (petId, entryId) => {
    await api.delete(ENDPOINTS.PETS.WEIGHT_DETAIL(petId, entryId))
    setWeightEntriesByPetId((prev) => ({
      ...prev,
      [petId]: (prev[petId] ?? []).filter((e) => e.id !== entryId),
    }))
  }, [])

  const value = useMemo(
    () => ({
      weightEntriesByPetId,
      ensureWeightEntries,
      addWeightEntry,
      updateWeightEntry,
      deleteWeightEntry,
    }),
    [weightEntriesByPetId, ensureWeightEntries, addWeightEntry, updateWeightEntry, deleteWeightEntry],
  )

  return <WeightContext.Provider value={value}>{children}</WeightContext.Provider>
}
