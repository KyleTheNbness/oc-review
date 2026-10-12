// 加载占位骨架：数据还没回来时先把页面轮廓画出来，体感上更快

export function ListSkeleton({ rows = 5, withHeader = true }: { rows?: number; withHeader?: boolean }) {
  return (
    <div aria-busy="true" aria-label="加载中">
      {withHeader && (
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="skeleton h-4 w-12" />
            <div className="skeleton h-7 w-32 mt-2" />
          </div>
          <div className="skeleton h-9 w-24 rounded-xl" />
        </div>
      )}
      <div className="skeleton h-11 w-full rounded-xl mb-4" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="card px-5 py-4 flex items-center justify-between">
            <div className="flex-1">
              <div className="skeleton h-4 w-2/5" />
              <div className="skeleton h-3 w-3/5 mt-2" />
            </div>
            <div className="skeleton h-8 w-14 ml-4" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="加载中">
      <div className="skeleton h-4 w-12" />
      <div className="skeleton h-8 w-1/2 mt-5" />
      <div className="skeleton h-4 w-2/3 mt-3" />
      <div className="flex items-center gap-3 mt-5">
        <div className="skeleton h-12 w-16" />
        <div className="skeleton h-5 w-28" />
      </div>
      <div className="card p-5 mt-6">
        <div className="skeleton h-5 w-20" />
        <div className="skeleton h-20 w-full mt-4 rounded-xl" />
      </div>
      <div className="flex flex-col gap-3 mt-6">
        {[0, 1, 2].map(i => (
          <div key={i} className="card px-5 py-4">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-3 w-full mt-3" />
            <div className="skeleton h-3 w-4/5 mt-2" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function HomeSkeleton() {
  return (
    <div aria-busy="true" aria-label="加载中">
      <div className="skeleton h-7 w-3/4 mt-2" />
      <div className="skeleton h-4 w-40 mt-2.5 mb-6" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="card p-5">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="skeleton h-4 w-20 mt-3" />
            <div className="skeleton h-3 w-14 mt-2" />
          </div>
        ))}
      </div>
      <div className="skeleton h-[82px] w-full mt-3 rounded-2xl" />
    </div>
  )
}
