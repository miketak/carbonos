import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { logout } from './api'
import { beginSignOut, endSignOut } from './signOut'
import { sessionQueryKey } from './useSession'

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: logout,
    // once the session goes, RequireAuth bounces to /login, and that bounce can
    // land after the navigation below; the flag keeps its `from` deep link out
    // so the next account does not inherit the page this one was on (spec 01.6)
    onMutate: beginSignOut,
    onError: endSignOut,
    onSuccess: () => {
      void navigate('/login', { replace: true, state: { signedOut: true } })
      queryClient.setQueryData(sessionQueryKey, null)
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' })
    },
  })
}
