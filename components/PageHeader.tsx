import type { ReactNode } from "react"

type PageHeaderProps = {
  title: ReactNode
  description: string
  actions?: ReactNode
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <section className="mb-5 flex flex-col gap-4 px-1 py-2 sm:mb-6 sm:px-3 lg:flex-row lg:items-center lg:justify-between lg:gap-5">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-[-0.045em] text-slate-900 sm:text-[28px]">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500">{description}</p>
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3 lg:shrink-0">{actions}</div>}
    </section>
  )
}
