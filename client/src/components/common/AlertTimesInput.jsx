import { INPUT_CLASS } from '@/constants/formStyles'

export default function AlertTimesInput({ value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      {value.map((time, index) => (
        <input
          key={index}
          type="time"
          value={time}
          onChange={(event) => {
            const next = event.target.value
            onChange(value.map((t, i) => (i === index ? next : t)))
          }}
          className={INPUT_CLASS}
        />
      ))}
    </div>
  )
}
