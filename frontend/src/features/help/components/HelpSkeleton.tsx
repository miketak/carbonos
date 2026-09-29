import { Skeleton } from '../../../components/Skeleton'

export function HelpSkeleton() {
  return (
    <div className="help-skeleton" role="status">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  )
}
