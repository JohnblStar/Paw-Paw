import { useCallback, useMemo, useState } from 'react'
import { WeightContext } from '@/context/WeightContext'
import { mockWeightEntries } from '@/mocks/petMock'

export function WeightProvider({ children }) {
  const [weightEntriesByPetId, setWeightEntriesByPetId] = useState(mockWeightEntries)

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

  const value = useMemo(
    () => ({ weightEntriesByPetId, addWeightEntry, updateWeightEntry, deleteWeightEntry }),
    [weightEntriesByPetId, addWeightEntry, updateWeightEntry, deleteWeightEntry],
  )

  return <WeightContext.Provider value={value}>{children}</WeightContext.Provider>
}
