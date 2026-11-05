import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage } from '../lib/api'

interface State<T> {
  data: T | undefined
  error: string | null
  loading: boolean
}

/**
 * Loads `path` from the API. `reload()` refetches in the background while the
 * current data stays on screen (no flashing spinners after every click).
 */
export function useApiData<T>(path: string) {
  const [state, setState] = useState<State<T>>({ data: undefined, error: null, loading: true })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    api<T>(path).then(
      (data) => {
        if (!cancelled) setState({ data, error: null, loading: false })
      },
      (error: unknown) => {
        if (!cancelled) setState((previous) => ({ ...previous, error: errorMessage(error), loading: false }))
      },
    )
    return () => {
      cancelled = true
    }
  }, [path, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const retry = useCallback(() => {
    setState((previous) => ({ ...previous, error: null, loading: true }))
    setVersion((v) => v + 1)
  }, [])
  const mutate = useCallback((update: (data: T) => T) => {
    setState((previous) => (previous.data === undefined ? previous : { ...previous, data: update(previous.data) }))
  }, [])

  return { ...state, reload, retry, mutate }
}
