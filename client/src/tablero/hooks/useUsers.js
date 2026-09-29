import { useEffect, useState } from 'react'
import { getUsersRequest } from '../../api/auth.js'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    getUsersRequest()
      .then((res) => {
        if (!cancelled) setUsers(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar los usuarios.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { users, error }
}
