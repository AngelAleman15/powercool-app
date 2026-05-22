import { notFound } from "next/navigation"

export default function DebugEnv() {
  if (process.env.NODE_ENV !== "development") {
    notFound()
  }

  const env = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug de variables de entorno</h1>

      <div className="bg-gray-900 text-white p-4 rounded mb-4">
        <p className="mb-2">
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{" "}
          <span className={env.url && !env.url.includes("placeholder") ? "text-green-400" : "text-red-400"}>
            {env.url || "NO DEFINIDA"}
          </span>
        </p>
        <p>
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{" "}
          <span className={env.key && !env.key.includes("placeholder") ? "text-green-400" : "text-red-400"}>
            {env.key ? `${env.key.substring(0, 20)}...` : "NO DEFINIDA"}
          </span>
        </p>
      </div>

      <div className="bg-yellow-100 border border-yellow-300 p-4 rounded text-[#5a4a1f]">
        <h2 className="font-bold mb-2">Si ves valores placeholder:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Ve a tu proyecto en Vercel, Settings, Environment Variables.</li>
          <li>Asegura las variables en Production, Preview y Development.</li>
          <li>Si faltan, agrégalas y redeploy.</li>
        </ol>
      </div>
    </div>
  )
}
