"use client"

export default function DebugEnv() {
  const env = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🔍 Debug Variables de Entorno</h1>
      
      <div className="bg-gray-900 p-4 rounded mb-4">
        <p className="mb-2">
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>{' '}
          <span className={env.url && !env.url.includes('placeholder') ? 'text-green-400' : 'text-red-400'}>
            {env.url || '❌ NO DEFINIDA'}
          </span>
        </p>
        <p>
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>{' '}
          <span className={env.key && !env.key.includes('placeholder') ? 'text-green-400' : 'text-red-400'}>
            {env.key ? `✅ ${env.key.substring(0, 20)}...` : '❌ NO DEFINIDA'}
          </span>
        </p>
      </div>

      <div className="bg-yellow-900 border border-yellow-600 p-4 rounded">
        <h2 className="font-bold mb-2">⚠️ Si ves valores &quot;placeholder&quot;:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Ve a tu proyecto en Vercel → Settings → Environment Variables</li>
          <li>Asegúrate que las variables estén marcadas en Production, Preview Y Development</li>
          <li>Si no están, edítalas y marca los 3 checkboxes</li>
          <li>Luego ve a Deployments → Redeploy</li>
        </ol>
      </div>
    </div>
  )
}
