export const DEMO_STATS = {
  equipos: 32,
  mantenimientos: 18,
  clientes: 21,
  pendientes: 6,
}

export const DEMO_CLIENTES = [
  { id: "demo-c-1", nombre: "Hotel Central", email: "mantenimiento@hotelcentral.com", telefono: "099 123 456", direccion: "Av. Libertad 1234", ciudad: "Montevideo", created_at: "2026-01-04T09:00:00.000Z" },
  { id: "demo-c-2", nombre: "Clinica Norte", email: "compras@clinicanorte.com", telefono: "091 778 112", direccion: "Bv. Artigas 552", ciudad: "Montevideo", created_at: "2026-01-10T11:20:00.000Z" },
  { id: "demo-c-3", nombre: "Edificio Arena", email: "admin@edificioarena.com", telefono: "094 210 998", direccion: "Rambla 920", ciudad: "Punta del Este", created_at: "2026-01-18T16:30:00.000Z" },
  { id: "demo-c-4", nombre: "Oficina Delta", email: "soporte@delta.uy", telefono: "098 450 321", direccion: "Colonia 1420", ciudad: "Montevideo", created_at: "2026-02-05T10:40:00.000Z" },
  { id: "demo-c-5", nombre: "Residencial Atlantida", email: "atencion@resatl.com", telefono: "092 400 777", direccion: "Calle 22", ciudad: "Atlantida", created_at: "2026-02-11T12:15:00.000Z" },
]

export const DEMO_EQUIPOS = [
  { id: "DEMO-EQ-1001", marca: "Daikin", modelo: "Inverter 12000", ubicacion: "Lobby", cliente_id: "demo-c-1", created_at: "2026-01-06T09:00:00.000Z" },
  { id: "DEMO-EQ-1002", marca: "Samsung", modelo: "WindFree 18000", ubicacion: "Consultorio 2", cliente_id: "demo-c-2", created_at: "2026-01-12T10:20:00.000Z" },
  { id: "DEMO-EQ-1003", marca: "Midea", modelo: "Xtreme Save", ubicacion: "Sala de reuniones", cliente_id: "demo-c-4", created_at: "2026-01-28T13:40:00.000Z" },
  { id: "DEMO-EQ-1004", marca: "LG", modelo: "DualCool 24000", ubicacion: "Apto 403", cliente_id: "demo-c-3", created_at: "2026-02-02T11:10:00.000Z" },
  { id: "DEMO-EQ-1005", marca: "Hisense", modelo: "Eco Smart", ubicacion: "Recepcion", cliente_id: "demo-c-5", created_at: "2026-02-14T15:25:00.000Z" },
]

export const DEMO_TRAMITES = [
  { id: 9001, tipo: "mantenimiento", estado: "completado", created_at: "2026-01-08T10:00:00.000Z", equipo_id: "DEMO-EQ-1001", cliente_id: "demo-c-1", descripcion: "Limpieza general y test de rendimiento", monto: 3500, moneda: "UYU", fecha_programada: "2026-01-08", equipos: { marca: "Daikin", modelo: "Inverter 12000" }, clientes: { nombre: "Hotel Central" } },
  { id: 9002, tipo: "mantenimiento", estado: "pendiente", created_at: "2026-01-16T15:20:00.000Z", equipo_id: "DEMO-EQ-1002", cliente_id: "demo-c-2", descripcion: "Revision de evaporadora", monto: 120, moneda: "USD", fecha_programada: "2026-03-20", equipos: { marca: "Samsung", modelo: "WindFree 18000" }, clientes: { nombre: "Clinica Norte" } },
  { id: 9003, tipo: "abono", estado: "completado", created_at: "2026-01-22T12:40:00.000Z", equipo_id: "DEMO-EQ-1004", cliente_id: "demo-c-3", descripcion: "Abono mensual de mantenimiento", monto: 250, moneda: "USD", fecha_programada: "2026-01-22", equipos: { marca: "LG", modelo: "DualCool 24000" }, clientes: { nombre: "Edificio Arena" } },
  { id: 9004, tipo: "mantenimiento", estado: "en_proceso", created_at: "2026-02-03T09:10:00.000Z", equipo_id: "DEMO-EQ-1003", cliente_id: "demo-c-4", descripcion: "Cambio de capacitor", monto: 4200, moneda: "UYU", fecha_programada: "2026-03-15", equipos: { marca: "Midea", modelo: "Xtreme Save" }, clientes: { nombre: "Oficina Delta" } },
  { id: 9005, tipo: "abono", estado: "pendiente", created_at: "2026-02-10T18:05:00.000Z", equipo_id: "DEMO-EQ-1005", cliente_id: "demo-c-5", descripcion: "Cobro de cuota febrero", monto: 180, moneda: "USD", fecha_programada: "2026-03-18", equipos: { marca: "Hisense", modelo: "Eco Smart" }, clientes: { nombre: "Residencial Atlantida" } },
  { id: 9006, tipo: "mantenimiento", estado: "completado", created_at: "2026-02-19T14:30:00.000Z", equipo_id: "DEMO-EQ-1001", cliente_id: "demo-c-1", descripcion: "Recarga de gas", monto: 5400, moneda: "UYU", fecha_programada: "2026-02-19", equipos: { marca: "Daikin", modelo: "Inverter 12000" }, clientes: { nombre: "Hotel Central" } },
  { id: 9007, tipo: "abono", estado: "completado", created_at: "2026-02-26T11:00:00.000Z", equipo_id: "DEMO-EQ-1004", cliente_id: "demo-c-3", descripcion: "Abono mensual marzo", monto: 250, moneda: "USD", fecha_programada: "2026-02-26", equipos: { marca: "LG", modelo: "DualCool 24000" }, clientes: { nombre: "Edificio Arena" } },
  { id: 9008, tipo: "mantenimiento", estado: "pendiente", created_at: "2026-03-02T16:10:00.000Z", equipo_id: "DEMO-EQ-1003", cliente_id: "demo-c-4", descripcion: "Inspeccion preventiva", monto: 3100, moneda: "UYU", fecha_programada: "2026-03-21", equipos: { marca: "Midea", modelo: "Xtreme Save" }, clientes: { nombre: "Oficina Delta" } },
  { id: 9009, tipo: "abono", estado: "en_proceso", created_at: "2026-03-06T13:15:00.000Z", equipo_id: "DEMO-EQ-1002", cliente_id: "demo-c-2", descripcion: "Abono parcial acordado", monto: 90, moneda: "USD", fecha_programada: "2026-03-14", equipos: { marca: "Samsung", modelo: "WindFree 18000" }, clientes: { nombre: "Clinica Norte" } },
  { id: 9010, tipo: "mantenimiento", estado: "pendiente", created_at: "2026-03-09T10:25:00.000Z", equipo_id: "DEMO-EQ-1002", cliente_id: "demo-c-2", descripcion: "Limpieza de filtros", monto: 2800, moneda: "UYU", fecha_programada: "2026-03-23", equipos: { marca: "Samsung", modelo: "WindFree 18000" }, clientes: { nombre: "Clinica Norte" } },
  { id: 9011, tipo: "abono", estado: "cancelado", created_at: "2026-03-10T19:30:00.000Z", equipo_id: "DEMO-EQ-1005", cliente_id: "demo-c-5", descripcion: "Abono cancelado por ajuste", monto: 180, moneda: "USD", fecha_programada: "2026-03-10", equipos: { marca: "Hisense", modelo: "Eco Smart" }, clientes: { nombre: "Residencial Atlantida" } },
  { id: 9012, tipo: "mantenimiento", estado: "completado", created_at: "2026-03-12T08:45:00.000Z", equipo_id: "DEMO-EQ-1001", cliente_id: "demo-c-1", descripcion: "Revision final de temporada", monto: 3900, moneda: "UYU", fecha_programada: "2026-03-12", equipos: { marca: "Daikin", modelo: "Inverter 12000" }, clientes: { nombre: "Hotel Central" } },
]

export const DEMO_ACTIVITY = [
  { id: 9012, type: "mantenimiento", description: "🔧 Daikin Inverter 12000 - Hotel Central", date: "12/03/2026", status: "completado" },
  { id: 9010, type: "mantenimiento", description: "🔧 Samsung WindFree - Clinica Norte", date: "09/03/2026", status: "pendiente" },
  { id: 9009, type: "abono", description: "💰 Pago mensual - Residencial Atlantida", date: "06/03/2026", status: "en_proceso" },
  { id: 9008, type: "mantenimiento", description: "🔧 Midea Xtreme Save - Oficina Delta", date: "02/03/2026", status: "pendiente" },
  { id: 9007, type: "abono", description: "💰 Abono acordado - Edificio Arena", date: "26/02/2026", status: "completado" },
]
