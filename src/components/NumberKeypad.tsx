import { Button } from './Button'

type NumberKeypadProps = {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  decimal?: boolean
  className?: string
}

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', '⌫'],
]

export function NumberKeypad({
  value,
  onChange,
  maxLength = 12,
  decimal = true,
  className = '',
}: NumberKeypadProps) {
  const handleKey = (key: string) => {
    if (key === '⌫') {
      onChange(value.slice(0, -1))
      return
    }
    if (key === '.' && (value.includes('.') || !decimal)) return
    if (value.length >= maxLength) return
    if (key === '.' && value === '') onChange('0.')
    else onChange(value + key)
  }

  return (
    <div className={`grid grid-cols-3 gap-2 ${className}`}>
      {ROWS.flat().map((key) => (
        <Button
          key={key}
          variant="secondary"
          size="lg"
          onClick={() => handleKey(key)}
          className="font-mono text-lg"
        >
          {key}
        </Button>
      ))}
    </div>
  )
}
