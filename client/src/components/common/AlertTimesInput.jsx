import TimeWheelPicker from '@/components/common/TimeWheelPicker'

export default function AlertTimesInput({ value, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      {value.map((time, index) => (
        <TimeWheelPicker
          key={index}
          value={time}
          onChange={(next) => onChange(value.map((t, i) => (i === index ? next : t)))}
        />
      ))}
    </div>
  )
}
