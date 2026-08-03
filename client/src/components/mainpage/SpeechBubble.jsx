export default function SpeechBubble({ message }) {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2 self-start">
      <div className="relative rounded-2xl border border-border bg-white px-5 py-4 shadow-sm">
        <p className="text-sm font-medium text-ink">{message.text}</p>
        <div className="absolute -left-2 top-6 h-4 w-4 rotate-45 border-b border-l border-border bg-white" />
      </div>
    </div>
  )
}
