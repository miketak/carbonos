import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { approveAccessRequest, denyAccessRequest, listAccessRequests } from './api'
import { usersQueryKey } from './useUsers'

export const accessRequestsKey = ['access-requests'] as const

export function useAccessRequestsQuery() {
  return useQuery({ queryKey: accessRequestsKey, queryFn: listAccessRequests })
}

export function useApproveAccessRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approveAccessRequest(id),
    // approval creates the pending account, so the users list changes too
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: accessRequestsKey }),
        queryClient.invalidateQueries({ queryKey: usersQueryKey }),
      ]),
  })
}

export function useDenyAccessRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => denyAccessRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accessRequestsKey }),
  })
}
