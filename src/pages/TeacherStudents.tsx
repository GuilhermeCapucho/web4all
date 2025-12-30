import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { TopNav } from '../components/TopNav'
import { buildCommonVoiceCommands } from '../voice/commonVoiceCommands'
import { normalizeVoiceText, runVoiceCommands, type VoiceCommand } from '../voice/voiceCommands'
import { useVoiceCommandListener } from '../voice/useVoiceCommandListener'

type StudentOption = {
  id: string
  full_name: string | null
  email: string | null
}

export const TeacherStudents = () => {
  const navigate = useNavigate()
  const { user, profile, signOut, updateProfile } = useAuth()
  const isTeacher = profile?.role === 'teacher'
  const [students, setStudents] = useState<StudentOption[]>([])
  const [linkedIds, setLinkedIds] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const linkedStudents = useMemo(
    () => students.filter((student) => linkedIds.includes(student.id)),
    [linkedIds, students],
  )

  const availableStudents = useMemo(
    () => students.filter((student) => !linkedIds.includes(student.id)),
    [linkedIds, students],
  )

  const fetchStudents = useCallback(async () => {
    if (!user || !isTeacher) {
      setStudents([])
      setLinkedIds([])
      setSelectedId('')
      return
    }
    setLoading(true)
    setStatus(null)

    const { data: links, error: linksError } = await supabase
      .from('teacher_students')
      .select('student_id')
      .eq('teacher_id', user.id)

    if (linksError) {
      setStatus(linksError.message)
      setLoading(false)
      return
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'student')

    if (profilesError) {
      setStatus(profilesError.message)
      setLoading(false)
      return
    }

    const ids = (links ?? []).map((link) => link.student_id)
    setLinkedIds(ids)
    setStudents(profilesData ?? [])
    setLoading(false)
  }, [isTeacher, user])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  useEffect(() => {
    if (selectedId || availableStudents.length === 0) return
    setSelectedId(availableStudents[0].id)
  }, [availableStudents, selectedId])

  const handleLinkStudent = async () => {
    if (!user || !selectedId) return
    setStatus(null)
    const { error } = await supabase
      .from('teacher_students')
      .insert({ teacher_id: user.id, student_id: selectedId })

    if (error) {
      setStatus(error.message)
      return
    }

    await fetchStudents()
  }

  const handleUnlinkStudent = async (studentId: string) => {
    if (!user) return
    setStatus(null)
    const { error } = await supabase
      .from('teacher_students')
      .delete()
      .eq('teacher_id', user.id)
      .eq('student_id', studentId)

    if (error) {
      setStatus(error.message)
      return
    }

    await fetchStudents()
  }

  const voiceCommands = useMemo<VoiceCommand[]>(() => {
    const notify = (message: string, tone: 'info' | 'success' | 'warning' = 'info') => {
      if (tone !== 'warning') return
      setStatus(message)
    }

    return buildCommonVoiceCommands({
      navigate,
      signOut,
      updateProfile,
      profile,
      notify,
    })
  }, [navigate, profile, signOut, updateProfile])

  const handleVoiceCommand = useCallback(async (transcript: string) => {
    const normalized = normalizeVoiceText(transcript)
    if (!normalized) return
    await runVoiceCommands(voiceCommands, { transcript, normalized })
  }, [voiceCommands])

  useVoiceCommandListener(handleVoiceCommand)

  return (
    <div className="app-shell">
      <TopNav />
      <main className="dashboard" id="main-content">
        <section className="panel">
          <header className="panel-header">
            <div>
              <h2>Vincular alunos</h2>
              <p className="muted">Conecte os alunos para poder atribuir atividades.</p>
            </div>
          </header>

          {!isTeacher ? (
            <p className="status error" role="alert">
              Esta area esta disponivel apenas para professores.
            </p>
          ) : null}

          {status ? (
            <p className="status error" role="alert">
              {status}
            </p>
          ) : null}

          {isTeacher ? (
            <form
              className="form-grid"
              onSubmit={(event) => {
                event.preventDefault()
                handleLinkStudent()
              }}
            >
              <label>
                Aluno
                <select
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  disabled={loading || availableStudents.length === 0}
                >
                  {availableStudents.length === 0 ? (
                    <option value="">Nenhum aluno disponivel</option>
                  ) : (
                    availableStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.full_name?.trim() || 'Aluno sem nome'}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <button type="submit" disabled={loading || !selectedId || availableStudents.length === 0}>
                Vincular aluno
              </button>
            </form>
          ) : null}
        </section>

        {isTeacher ? (
          <section className="panel">
            <header className="panel-header">
              <div>
                <h2>Alunos vinculados</h2>
                <p className="muted">Gerencie quem esta associado a sua conta.</p>
              </div>
            </header>

            {linkedStudents.length === 0 ? (
              <p className="muted">Nenhum aluno vinculado ainda.</p>
            ) : (
              <div className="activity-list">
                {linkedStudents.map((student) => (
                  <article key={student.id} className="activity-card">
                    <div className="card-header student-card-header">
                      <div>
                        <div className="student-title">
                          <h3>{student.full_name?.trim() || 'Aluno sem nome'}</h3>
                          {student.email ? <span className="muted student-email">{student.email}</span> : null}
                        </div>
                      </div>
                      <div className="card-actions">
                        <button
                          type="button"
                          className="ghost danger"
                          onClick={() => handleUnlinkStudent(student.id)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </main>
    </div>
  )
}
