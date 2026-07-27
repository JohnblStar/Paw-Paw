import { useContext } from 'react'
import { WeightContext } from '@/context/WeightContext'

export function useWeight() {
  const ctx = useContext(WeightContext)
  if (!ctx) throw new Error('useWeight은 WeightProvider 내부에서만 사용할 수 있습니다.')
  return ctx
}
