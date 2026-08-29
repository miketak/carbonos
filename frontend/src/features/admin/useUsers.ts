import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createUser, deleteUser, listUsers, updateUser } from './api'
import type { CreateUserInput, UpdateUserInput, User } from './api'

export const usersQueryKey = ['users'] as const

export function useUsersQuery() {
  return useQuery({ queryKey: usersQueryKey, queryFn: listUsers })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersQueryKey }),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => updateUser(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersQueryKey }),
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
    onSettled: () => queryClient.invalidateQueries({ queryKey: usersQueryKey }),
  })
}
