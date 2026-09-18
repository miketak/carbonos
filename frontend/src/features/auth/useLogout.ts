import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { logout } from './api'
import { sessionQueryKey } from './useSession'

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryKey, null)
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' })
      // RequireAuth has already bounced to /login with a `from` deep link by
      // the time this runs; replace that entry so the next account does not
      // inherit the page this one was on (spec 01.6)
      void navigate('/login', { replace: true, state: { signedOut: true } })
    },
  })
}
