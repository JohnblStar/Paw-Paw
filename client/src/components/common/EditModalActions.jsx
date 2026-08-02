import { DANGER_BUTTON_CLASS, PRIMARY_BUTTON_CLASS } from '@/constants/formStyles'

export default function EditModalActions({ onDelete, isSaving }) {
  return (
    <div className="flex justify-between gap-2">
      <button type="button" onClick={onDelete} disabled={isSaving} className={DANGER_BUTTON_CLASS}>
        삭제
      </button>
      <button type="submit" disabled={isSaving} className={`flex-1 ${PRIMARY_BUTTON_CLASS}`}>
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </div>
  )
}
