import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import PageLayout from '@/components/layout/PageLayout'
import Card from '@/components/common/Card'
import Modal from '@/components/common/Modal'
import PetForm from '@/components/mypetsy/PetForm'
import { usePet } from '@/context/usePet'
import { getAvatarPresetsForSpecies } from '@/constants/petAvatarPresets'

const DEFAULT_PET_FORM_VALUES = {
  name: '',
  species: 'dog',
  breed: '',
  birthDate: '',
  sex: 'female',
  neutered: false,
  weight: '',
  photoKey: getAvatarPresetsForSpecies('dog')[0]?.key ?? '',
}

export default function PetFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { pets, addPet, updatePet, deletePet } = usePet()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const isEdit = Boolean(id)
  const existingPet = isEdit ? pets.find((pet) => pet.id === id) : null

  if (isEdit && !existingPet) {
    return <Navigate to="/mypetsy" replace />
  }

  const handleSubmit = async (values) => {
    if (isEdit) {
      await updatePet(id, values)
    } else {
      await addPet(values)
    }
    navigate('/mypetsy')
  }

  const handleDelete = async () => {
    await deletePet(id)
    navigate('/mypetsy')
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-xl font-bold text-ink">
          {isEdit ? '반려동물 정보 수정' : '반려동물 등록'}
        </h1>

        <Card>
          <PetForm
            initialValues={existingPet ?? DEFAULT_PET_FORM_VALUES}
            submitLabel={isEdit ? '수정 완료' : '등록하기'}
            onSubmit={handleSubmit}
            petId={isEdit ? id : undefined}
          />
        </Card>

        {isEdit && (
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="mt-4 w-full rounded-full border border-coral px-6 py-3 text-sm font-semibold text-coral transition-colors hover:bg-coral/10"
          >
            반려동물 삭제하기
          </button>
        )}
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="반려동물 삭제"
      >
        <p className="text-sm text-ink-secondary">
          &quot;{existingPet?.name}&quot;을(를) 정말 삭제할까요? 삭제한 정보는 되돌릴 수 없어요.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(false)}
            className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-bg"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 rounded-full bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:bg-coral/90"
          >
            삭제
          </button>
        </div>
      </Modal>
    </PageLayout>
  )
}
