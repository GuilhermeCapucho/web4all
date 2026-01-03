type LinkHighlightToggleProps = {
  enabled: boolean
  onToggle: () => void
}

export const LinkHighlightToggle = ({ enabled, onToggle }: LinkHighlightToggleProps) => (
  <label className="checkbox">
    <input type="checkbox" checked={enabled} onChange={onToggle} />
    Destaque de links
  </label>
)
