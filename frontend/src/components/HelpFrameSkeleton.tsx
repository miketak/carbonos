import { Skeleton } from './Skeleton'
import { Wordmark } from './Wordmark'

/** The help centre's frame while its chunk loads: the bar and the columns, so nothing pops in later. */
export function HelpFrameSkeleton() {
  return (
    <div className="help" role="status">
      <span className="sr-only">Loading the help</span>
      <header className="help-header">
        <div className="help-header-row">
          <Wordmark />
          <div className="help-header-search">
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        </div>
      </header>
      <div className="help-frame">
        <div className="help-tree-column flex flex-col gap-3 pt-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-5 w-4/5" />
          ))}
        </div>
        <div className="help-main help-skeleton">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  )
}
