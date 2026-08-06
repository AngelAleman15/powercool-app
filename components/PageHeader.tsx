import type { ReactNode } from "react"

type PageHeaderProps = {
  title: ReactNode
  description: string
  actions?: ReactNode
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <section className="mb-6 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-slate-200/90 bg-white px-5 py-5 shadow-[0_10px_28px_rgba(15,23,42,.035)] sm:px-7">
      <div className="min-w-0">
        <h1 className="text-[25px] font-bold tracking-[-0.045em] text-slate-900 sm:text-[28px]">{title}</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </section>
  )
}
