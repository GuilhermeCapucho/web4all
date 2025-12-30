export type VoiceCommandContext = {
  transcript: string
  normalized: string
}

export type VoiceCommand<T extends VoiceCommandContext = VoiceCommandContext> = {
  id: string
  match: (normalized: string) => boolean
  run: (context: T) => void | Promise<void>
}

export type VoiceNotifyTone = 'info' | 'success' | 'warning'

export const normalizeVoiceText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const runVoiceCommands = async <T extends VoiceCommandContext>(
  commands: VoiceCommand<T>[],
  context: T,
) => {
  for (const command of commands) {
    if (!command.match(context.normalized)) continue
    await command.run(context)
    return true
  }
  return false
}
