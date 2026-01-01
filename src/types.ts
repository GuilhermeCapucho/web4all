export type Profile = {
  id: string
  full_name: string | null
  font_scale: number
  high_contrast: boolean
  reduce_motion: boolean
  screen_reader_enabled: boolean
  color_blindness: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia' | null
  role: 'teacher' | 'student' | 'caregiver'
}

export type Activity = {
  id: string
  user_id: string
  created_by: string | null
  assigned_to: string | null
  title: string
  description: string | null
  status: 'todo' | 'doing' | 'paused' | 'done'
  category: string | null
  due_date: string | null
  due_time: string | null
  duration_minutes: number | null
  recurrence: 'daily' | 'weekly' | null
  completed_at: string | null
  reopened_at: string | null
  created_at: string
  updated_at: string
}

export type ChecklistItem = {
  id: string
  activity_id: string
  title: string
  is_done: boolean
  created_at: string
  completed_at: string | null
}
