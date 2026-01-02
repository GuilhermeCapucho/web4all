type LineSpacingControlProps = {
  value: number
  onChange: (value: number) => void
}

const lineSpacingSteps = [1.4, 1.6, 1.8]

export const LineSpacingControl = ({ value, onChange }: LineSpacingControlProps) => {
  return (
    <div className="accessibility-section">
      <span className="accessibility-label" id="line-spacing-label">Espaço entre linhas</span>
      <div className="segmented-control" role="group" aria-labelledby="line-spacing-label">
        {lineSpacingSteps.map((step) => (
          <button
            key={step}
            type="button"
            className={`segmented-control__button${value === step ? ' is-active' : ''}`}
            onClick={() => onChange(step)}
            aria-pressed={value === step}
          >
            {step === 1.4 ? 'Normal' : step === 1.6 ? 'Medio' : 'Amplo'}
          </button>
        ))}
      </div>
    </div>
  )
}
