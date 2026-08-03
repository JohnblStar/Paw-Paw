import { useState } from 'react'
import Card from '@/components/common/Card'
import { INPUT_CLASS } from '@/constants/formStyles'
import { useUser } from '@/context/useUser'

// 카카오는 연령을 항상 제공하지 않아(선택 동의 항목), 마이펫이지에서 직접 입력/수정하게 한다.
export default function OwnerProfileCard({ user }) {
  const { updateAge } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [age, setAge] = useState(user?.age ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const startEdit = () => {
    setAge(user?.age ?? '')
    setIsEditing(true)
  }

  const handleSave = async () => {
    const value = Number(age)
    if (!Number.isFinite(value) || value < 0 || value > 120) return
    setIsSaving(true)
    try {
      await updateAge(value)
      setIsEditing(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="mb-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-mint text-xl font-bold text-ink">
          {user?.profileImage ? (
            <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
          ) : (
            (user?.name?.[0] ?? '?')
          )}
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-ink">{user?.name}</p>
          {isEditing ? (
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="120"
                value={age}
                onChange={(event) => setAge(event.target.value)}
                className={`${INPUT_CLASS} w-20 py-1.5`}
              />
              <span className="text-sm text-ink-secondary">세</span>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="text-xs font-semibold text-primary-mint-dark hover:underline disabled:opacity-50"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-ink-secondary hover:text-ink"
              >
                취소
              </button>
            </div>
          ) : (
            <p className="mt-0.5 text-sm text-ink-secondary">
              {user?.age != null ? `${user.age}세` : '연령 미입력'}
              <button
                type="button"
                onClick={startEdit}
                className="ml-2 text-xs font-semibold text-primary-mint-dark hover:underline"
              >
                {user?.age != null ? '수정' : '입력하기'}
              </button>
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
