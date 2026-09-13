import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createFactorPackEdition,
  createFactorPackFamily,
  createFactorPackRow,
  deleteFactorPackEdition,
  deleteFactorPackRow,
  getFactorPackEdition,
  getFactorPackValidation,
  listFactorPackRows,
  listFactorPacks,
  updateFactorPackEdition,
  updateFactorPackRow,
} from './api'
import type { CreateFamilyInput, EditionInput, FactorPackRowFilter, RowInput } from './api'

export const adminFactorPacksKey = ['admin', 'factor-packs'] as const

/** Every family with its editions, their row counts and how many organizations hold each. */
export function useFactorPacksQuery() {
  return useQuery({ queryKey: adminFactorPacksKey, queryFn: listFactorPacks })
}

export function useFactorPackEditionQuery(editionId: string) {
  return useQuery({
    queryKey: [...adminFactorPacksKey, editionId],
    queryFn: () => getFactorPackEdition(editionId),
  })
}

export function useFactorPackRowsQuery(editionId: string, filter: FactorPackRowFilter) {
  return useQuery({
    queryKey: [...adminFactorPacksKey, editionId, 'rows', filter],
    queryFn: () => listFactorPackRows(editionId, filter),
  })
}

/** The live validation report: every rule the draft breaks, read while it is built. */
export function useFactorPackValidationQuery(editionId: string) {
  return useQuery({
    queryKey: [...adminFactorPacksKey, editionId, 'validation'],
    queryFn: () => getFactorPackValidation(editionId),
  })
}

function useInvalidateFactorPacks() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: adminFactorPacksKey })
}

export function useCreateFactorPackFamily() {
  const invalidate = useInvalidateFactorPacks()
  return useMutation({
    mutationFn: (input: CreateFamilyInput) => createFactorPackFamily(input),
    onSuccess: () => void invalidate(),
  })
}

export function useCreateFactorPackEdition() {
  const invalidate = useInvalidateFactorPacks()
  return useMutation({
    mutationFn: ({ packKey, input }: { packKey: string; input: EditionInput }) =>
      createFactorPackEdition(packKey, input),
    onSuccess: () => void invalidate(),
  })
}

export function useUpdateFactorPackEdition() {
  const invalidate = useInvalidateFactorPacks()
  return useMutation({
    mutationFn: ({ editionId, input }: { editionId: string; input: EditionInput }) =>
      updateFactorPackEdition(editionId, input),
    onSuccess: () => void invalidate(),
  })
}

export function useDeleteFactorPackEdition() {
  const invalidate = useInvalidateFactorPacks()
  return useMutation({
    mutationFn: (editionId: string) => deleteFactorPackEdition(editionId),
    onSuccess: () => void invalidate(),
  })
}

export function useCreateFactorPackRow() {
  const invalidate = useInvalidateFactorPacks()
  return useMutation({
    mutationFn: ({ editionId, input }: { editionId: string; input: RowInput }) =>
      createFactorPackRow(editionId, input),
    onSuccess: () => void invalidate(),
  })
}

export function useUpdateFactorPackRow() {
  const invalidate = useInvalidateFactorPacks()
  return useMutation({
    mutationFn: ({
      editionId,
      rowId,
      input,
    }: {
      editionId: string
      rowId: string
      input: RowInput
    }) => updateFactorPackRow(editionId, rowId, input),
    onSuccess: () => void invalidate(),
  })
}

export function useDeleteFactorPackRow() {
  const invalidate = useInvalidateFactorPacks()
  return useMutation({
    mutationFn: ({ editionId, rowId }: { editionId: string; rowId: string }) =>
      deleteFactorPackRow(editionId, rowId),
    onSuccess: () => void invalidate(),
  })
}
