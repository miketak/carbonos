import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createUser, deleteUser, listUsers, updateUser } from './api'
import { adminSummaryKey } from './useSummary'
import type { CreateUserInput, UpdateUserInput, User } from './api'

/* every admin key starts with 'admin' so one invalidation covers the panel, the badge included */
export const usersQueryKey = ['admin', 'users'] as const

export function useUsersQuery() {
  return useQuery({ queryKey: usersQueryKey, queryFn: listUsers })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: usersQueryKey }),
        queryClient.invalidateQueries({ queryKey: adminSummaryKey }),
      ]),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => updateUser(id, input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: usersQueryKey }),
        queryClient.invalidateQueries({ queryKey: adminSummaryKey }),
      ]),
  })
}

/** Optimistic removal: the row disappears immediately and returns on failure. */
export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: usersQueryKey })
      const previous = queryClient.getQueryData<User[]>(usersQueryKey)
      queryClient.setQueryData<User[]>(usersQueryKey, (users) =>
        users?.filter((user) => user.id !== id),
      )
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(usersQueryKey, context.previous)
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: usersQueryKey }),
        queryClient.invalidateQueries({ queryKey: adminSummaryKey }),
      ]),
  })
}
