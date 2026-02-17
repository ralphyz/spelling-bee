interface ProgressBarProps {
  current: number
  total: number
  label?: string
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm text-base-content/70 mb-1">
          <span>{label}</span>
          <span>
            {current}/{total}
          </span>
        </div>
      )}
      <progress
        className="progress progress-primary w-full"
        value={pct}
        max="100"
      />
    </div>
  )
}
