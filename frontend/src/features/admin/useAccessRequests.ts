import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { approveAccessRequest, denyAccessRequest, listAccessRequests } from './api'

export const accessRequestsKey = ['access-requests'] as const

export function useAccessRequestsQuery() {
  return useQuery({ queryKey: accessRequestsKey, queryFn: listAccessRequests })
}

export function useApproveAccessRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => approveAccessRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accessRequestsKey }),
  })
}

export function useDenyAccessRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => denyAccessRequest(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accessRequestsKey }),
  })
}
