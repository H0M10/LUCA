/**
 * Skeletons con estética de papel — líneas con animación shimmer suave.
 */
export function SkeletonLine({ className = '', width = '100%' }: { className?: string; width?: string }) {
  return (
    <span
      className={`block animate-shimmer rounded-sm bg-paper-300 ${className}`}
      style={{ width, height: '0.8em' }}
    />
  );
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-shimmer bg-paper-300 ${className}`} />;
}

export function TreeListSkeleton() {
  return (
    <ul className="divide-y divide-paper-300 border-t border-paper-300">
      {[1, 2, 3].map((i) => (
        <li key={i} className="grid grid-cols-12 items-baseline gap-x-6 py-8 md:py-10">
          <span className="col-span-2 md:col-span-1">
            <SkeletonLine width="2rem" />
          </span>
          <div className="col-span-10 md:col-span-5">
            <SkeletonLine width="60%" className="h-8" />
            <div className="mt-2"><SkeletonLine width="40%" /></div>
          </div>
          <div className="col-span-6 md:col-span-3 mt-3 md:mt-0">
            <SkeletonLine width="70%" />
          </div>
          <div className="col-span-6 md:col-span-3 mt-3 md:mt-0 flex justify-end">
            <SkeletonLine width="50%" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TreeCardSkeleton() {
  return (
    <div className="card-paper">
      <SkeletonBlock className="h-12 w-12 rounded-lg" />
      <div className="mt-4 space-y-2">
        <SkeletonLine width="80%" className="h-6" />
        <SkeletonLine width="60%" />
      </div>
    </div>
  );
}
