import { useCallback, useState } from 'react'

export interface EditMode {
  editMode: boolean
  toggle: () => void
  setEditMode: (v: boolean) => void
}

/** Edit-mode gating (D-2.01): chrome/drag/resize only visible in edit mode. */
export function useEditMode(): EditMode {
  const [editMode, setEditMode] = useState(false)
  const toggle = useCallback(() => setEditMode((v) => !v), [])
  return { editMode, toggle, setEditMode }
}
