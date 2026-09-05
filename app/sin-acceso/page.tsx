import Link from "next/link"

export default function SinAccesoPage() {
  return (
    <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-[0_18px_45px_rgba(15,23,42,.08)] sm:p-9">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <span className="text-xl font-semibold">!</span>
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-.03em] text-slate-950">Sin acceso</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Tu rol no tiene permisos para ver esta pantalla.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            Ir al inicio
          </Link>
          <Link
            href="/auth"
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
          >
            Cambiar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
