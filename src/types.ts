export type Profile = {
  id: string
  full_name: string | null
  font_scale: number
  high_contrast: boolean
}

export type Activity = {
  id: string
  user_id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
}
