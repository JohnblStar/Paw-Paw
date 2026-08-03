import { useContext } from 'react'
import { PetContext } from '@/context/PetContext'

export function usePet() {
  const ctx = useContext(PetContext)
  if (!ctx) throw new Error('usePet은 PetProvider 내부에서만 사용할 수 있습니다.')
  return ctx
}
