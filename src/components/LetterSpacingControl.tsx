type LetterSpacingControlProps = {
  value: number
  onChange: (value: number) => void
}

const letterSpacingSteps = [0, 0.02, 0.04]

export const LetterSpacingControl = ({ value, onChange }: LetterSpacingControlProps) => {
  return (
    <div className="accessibility-section">
      <span className="accessibility-label" id="letter-spacing-label">Espaço entre letras</span>
      <div className="segmented-control" role="group" aria-labelledby="letter-spacing-label">
        {letterSpacingSteps.map((step) => (
          <button
            key={step}
            type="button"
            className={`segmented-control__button${value === step ? ' is-active' : ''}`}
            onClick={() => onChange(step)}
            aria-pressed={value === step}
          >
            {step === 0 ? 'Normal' : step === 0.02 ? 'Médio' : 'Amplo'}
          </button>
        ))}
      </div>
    </div>
  )
}
