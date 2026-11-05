import { useState } from 'react'
import { api, errorMessage } from '../lib/api'
import { NoteIcon } from './icons'
import { useToast } from './toast-context'
import { Button, inputClass } from './ui'

/**
 * Your own one-line takeaway per problem ("two pointers from both ends",
 * "dp[i] = best ending at i"). It's shown again every time the problem comes
 * back for revision. This is where most of the remembering happens.
 */
export function NotesEditor({
  problemId,
  initial,
  onSaved,
  defaultOpen = false,
}: {
  problemId: string
  initial: string | null | undefined
  onSaved?: (notes: string | null) => void
  defaultOpen?: boolean
}) {
  const toast = useToast()
  const [saved, setSaved] = useState(initial ?? '')
  const [draft, setDraft] = useState(initial ?? '')
  const [editing, setEditing] = useState(defaultOpen && !initial)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const result = await api<{ notes: string | null }>(`/problems/${problemId}/notes`, {
        method: 'PUT',
        body: { notes: draft },
      })
      setSaved(result.notes ?? '')
      setDraft(result.notes ?? '')
      setEditing(false)
      onSaved?.(result.notes)
      toast.show('Notes saved')
    } catch (error) {
      toast.show(errorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return saved ? (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-left"
      >
        <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-amber-300/90 uppercase">
          <NoteIcon size={13} /> Your notes
          <span className="ml-auto font-normal tracking-normal text-zinc-500 normal-case opacity-0 transition group-hover:opacity-100">
            Edit
          </span>
        </span>
        <span className="block text-sm whitespace-pre-wrap text-zinc-200">{saved}</span>
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 transition hover:text-zinc-200"
      >
        <NoteIcon size={15} /> Add a note for future you
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        autoFocus
        value={draft}
        maxLength={2000}
        rows={3}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) save()
          if (event.key === 'Escape') {
            setDraft(saved)
            setEditing(false)
          }
        }}
        placeholder="Key insight, e.g. “sort + two pointers; skip duplicates after moving left”"
        className={`${inputClass} resize-y text-sm`}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={save} loading={saving}>
          Save note
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setDraft(saved)
            setEditing(false)
          }}
        >
          Cancel
        </Button>
        <span className="ml-auto hidden text-xs text-zinc-500 sm:block">Ctrl/⌘ + Enter to save</span>
      </div>
    </div>
  )
}
