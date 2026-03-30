import Link from "next/link"

export default function SinAccesoPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-[#d8e4f4] bg-white shadow-[0_8px_28px_rgba(36,84,145,.12)] p-6 sm:p-8 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-[#f5f8ff] border border-[#d8e4f4] flex items-center justify-center">
          <span className="text-[#2a5e97] text-xl font-bold">!</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-[#214a79]">Sin acceso</h1>
        <p className="mt-2 text-sm text-[#5a7698]">
          Tu rol no tiene permisos para ver esta pantalla.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-[#1f67bf] text-white text-sm font-semibold hover:bg-[#1756a4] transition-colors"
          >
            Ir al inicio
          </Link>
          <Link
            href="/auth"
            className="px-4 py-2 rounded-lg border border-[#cddcf0] text-[#285887] text-sm font-semibold hover:bg-[#f6f9ff] transition-colors"
          >
            Cambiar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}
