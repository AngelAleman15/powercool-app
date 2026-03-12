"use client"

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Tramite = {
  id: number
  tipo: string
  estado: string
  created_at: string
  fecha_programada?: string
  equipos?: { marca?: string; modelo?: string }
  clientes?: { nombre?: string }
  [key: string]: any
}

type DashboardChartsProps = {
  tramites: Tramite[]
}

export default function DashboardCharts({ tramites = [] }: DashboardChartsProps) {
  // Datos para gráfico de trámites por mes (últimos 6 meses)
  const getTramitesPorMes = () => {
    const meses = []
    const now = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mesNombre = fecha.toLocaleDateString('es-UY', { month: 'short' })
      const mesAno = `${mesNombre} ${fecha.getFullYear()}`
      
      const tramitesMes = tramites.filter(t => {
        const tramiteFecha = new Date(t.created_at)
        return tramiteFecha.getMonth() === fecha.getMonth() && 
               tramiteFecha.getFullYear() === fecha.getFullYear()
      })
      
      meses.push({
        mes: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
        mantenimientos: tramitesMes.filter(t => t.tipo === 'mantenimiento').length,
        abonos: tramitesMes.filter(t => t.tipo === 'abono').length,
        total: tramitesMes.length
      })
    }
    
    return meses
  }

  // Datos para gráfico de estados
  const getEstadosData = () => {
    const estados = {
      pendiente: tramites.filter(t => t.estado === 'pendiente').length,
      en_proceso: tramites.filter(t => t.estado === 'en_proceso').length,
      completado: tramites.filter(t => t.estado === 'completado').length,
      cancelado: tramites.filter(t => t.estado === 'cancelado').length
    }
    
    return [
      { name: 'Pendiente', value: estados.pendiente, color: '#eab308' },
      { name: 'En Proceso', value: estados.en_proceso, color: '#3b82f6' },
      { name: 'Completado', value: estados.completado, color: '#10b981' },
      { name: 'Cancelado', value: estados.cancelado, color: '#ef4444' }
    ].filter(e => e.value > 0)
  }

  // Datos para gráfico de tipos
  const getTiposData = () => {
    return [
      { 
        name: 'Mantenimientos', 
        cantidad: tramites.filter(t => t.tipo === 'mantenimiento').length,
        color: '#8b5cf6'
      },
      { 
        name: 'Abonos', 
        cantidad: tramites.filter(t => t.tipo === 'abono').length,
        color: '#14b8a6'
      }
    ].filter(t => t.cantidad > 0)
  }

  const tramitesPorMes = getTramitesPorMes()
  const estadosData = getEstadosData()
  const tiposData = getTiposData()

  if (tramites.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No hay datos suficientes para mostrar gráficos</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gráfico de Línea - Trámites por Mes */}
      <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-5 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Trámites Últimos 6 Meses
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={tramitesPorMes}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="mes" stroke="#888" style={{ fontSize: '12px' }} />
            <YAxis stroke="#888" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #333', 
                borderRadius: '8px',
                color: '#fff'
              }} 
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="mantenimientos" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              name="Mantenimientos"
              dot={{ fill: '#8b5cf6', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="abonos" 
              stroke="#14b8a6" 
              strokeWidth={2}
              name="Abonos"
              dot={{ fill: '#14b8a6', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Pie - Estados */}
        <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-5 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
            Distribución por Estado
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={estadosData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {estadosData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #333', 
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Barras - Tipos */}
        <div className="bg-gradient-to-br from-[#111] to-[#1a1a1a] rounded-xl p-5 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Tipos de Trámite
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tiposData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" style={{ fontSize: '12px' }} />
              <YAxis stroke="#888" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a1a', 
                  border: '1px solid #333', 
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Bar dataKey="cantidad" radius={[8, 8, 0, 0]}>
                {tiposData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
