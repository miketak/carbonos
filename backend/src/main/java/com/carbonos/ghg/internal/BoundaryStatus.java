package com.carbonos.ghg.internal;

/**
 * Lifecycle of an inventory's organizational boundary (spec 007). A DRAFT
 * boundary is editable and blocks calculation runs; freezing cuts an immutable
 * {@link BoundaryVersion} and makes the treatments read-only.
 */
public enum BoundaryStatus {

	DRAFT, FROZEN

}
