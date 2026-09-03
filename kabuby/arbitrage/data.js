/* ── KABUBY v2.0 — Data & Constants ── */

const PAISES = [
  { id:'BR', flag:'🇧🇷', nombre:'Brasil',    ml:'https://www.mercadolivre.com.br/jm/search?as_word=', comision:.17, importacion:.25, envio:8 },
  { id:'MX', flag:'🇲🇽', nombre:'México',    ml:'https://www.mercadolibre.com.mx/jm/search?as_word=', comision:.17, importacion:.20, envio:7 },
  { id:'CO', flag:'🇨🇴', nombre:'Colombia',  ml:'https://www.mercadolibre.com.co/jm/search?as_word=', comision:.15, importacion:.22, envio:8 },
  { id:'AR', flag:'🇦🇷', nombre:'Argentina', ml:'https://www.mercadolibre.com.ar/jm/search?as_word=', comision:.17, importacion:.30, envio:9 },
  { id:'CL', flag:'🇨🇱', nombre:'Chile',     ml:'https://www.mercadolibre.cl/jm/search?as_word=',    comision:.15, importacion:.18, envio:8 },
  { id:'PE', flag:'🇵🇪', nombre:'Perú',      ml:'https://www.mercadolibre.com.pe/jm/search?as_word=', comision:.15, importacion:.20, envio:8 },
  { id:'UY', flag:'🇺🇾', nombre:'Uruguay',   ml:'https://www.mercadolibre.com.uy/jm/search?as_word=', comision:.15, importacion:.20, envio:9 },
  { id:'EC', flag:'🇪🇨', nombre:'Ecuador',   ml:'https://www.mercadolibre.com.ec/jm/search?as_word=', comision:.15, importacion:.18, envio:8 },
];

const CATEGORIAS = [
  '💄 Skincare & Belleza','💊 Suplementos & Salud','🏋️ Fitness & Deporte',
  '🐾 Mascotas','🏠 Hogar & Cocina','📱 Gadgets & Tech','👶 Bebés & Niños',
  '🌿 Natural & Orgánico','🎮 Entretenimiento','✈️ Viajes & Outdoor','Otro'
];

const FUENTES = [
  { id:'tiktok', nombre:'TikTok Creative Center', icon:'🎵', url:'https://ads.tiktok.com/business/creativecenter/inspiration/topproducts/pc/en' },
  { id:'amazon', nombre:'Amazon Movers & Shakers', icon:'📦', url:'https://www.amazon.com/gp/movers-and-shakers/' },
  { id:'manual', nombre:'Investigación propia', icon:'🔍', url:'' },
  { id:'reddit', nombre:'Reddit / Foros', icon:'💬', url:'https://www.reddit.com/r/Entrepreneur/' },
  { id:'google', nombre:'Google Trends', icon:'📈', url:'https://trends.google.com/trends/' },
];

// ── Calcular margen por fase ──
function calcularMargen(precioAmazon, gananciaBuscada, pais) {
  const p = PAISES.find(x => x.id === pais) || PAISES[0];

  // Fase 1 — Amazon como proveedor (precio retail)
  const costoF1 = precioAmazon;
  const precioML_F1 = gananciaBuscada + (gananciaBuscada * p.comision) + p.envio;
  const precioCliente_F1 = precioML_F1 + (precioML_F1 * p.importacion);
  const margenF1 = precioML_F1 - costoF1 - p.envio;

  // Fase 2 — Mayorista USA (estimado 25% menos que Amazon)
  const costoF2 = precioAmazon * 0.75;
  const margenF2 = precioML_F1 - costoF2 - p.envio;

  // Fase 3 — Import directo (estimado 40% menos que Amazon)
  const costoF3 = precioAmazon * 0.45;
  const margenF3 = precioML_F1 - costoF3 - p.envio;

  return {
    precioCliente: Math.round(precioCliente_F1 * 100) / 100,
    precioML: Math.round(precioML_F1 * 100) / 100,
    f1: { costo: costoF1, margen: Math.round(margenF1 * 100) / 100, pct: Math.round((margenF1/precioML_F1)*100) },
    f2: { costo: Math.round(costoF2*100)/100, margen: Math.round(margenF2*100)/100, pct: Math.round((margenF2/precioML_F1)*100) },
    f3: { costo: Math.round(costoF3*100)/100, margen: Math.round(margenF3*100)/100, pct: Math.round((margenF3/precioML_F1)*100) },
  };
}

// ── Clasificar tipo de demanda ──
function clasificarDemanda(trends7d, trendsEstable, bsrRank, vendedoresLatam) {
  // trends7d = % cambio últimos 7 días
  // trendsEstable = si lleva >3 meses subiendo
  // bsrRank = ranking actual Amazon
  // vendedoresLatam = total vendedores en todos los países ML

  if (trends7d > 200 && !trendsEstable) return {
    tipo: 'viral', label: '⚡ VIRAL', clase: 'tag-viral',
    duracion: '2-6 semanas',
    estrategia: 'Solo Fase 1. Vender rápido, sin comprar stock. Salir antes de semana 6.',
    color: 'var(--pink)'
  };
  if (trends7d > 50 || (trendsEstable && bsrRank < 1000)) return {
    tipo: 'tendencia', label: '📈 TENDENCIA', clase: 'tag-tendencia',
    duracion: '3-8 meses',
    estrategia: 'Fase 1 (2-3 semanas) → Fase 2 cuando confirmes 5+ ventas → evaluar Fase 3.',
    color: 'var(--yellow)'
  };
  return {
    tipo: 'evergreen', label: '🌳 EVERGREEN', clase: 'tag-evergreen',
    duracion: '12+ meses',
    estrategia: 'Ir directo a Fase 2-3 si el margen lo permite. Ingreso estable base.',
    color: 'var(--green)'
  };
}

// ── Score de oportunidad ──
function calcularScore(vendedoresPais, precioMLActual, precioTuyo, trends7d, bsrRank) {
  let score = 0;
  // Demanda
  if (trends7d > 200) score += 30;
  else if (trends7d > 100) score += 20;
  else if (trends7d > 50) score += 10;
  if (bsrRank < 100) score += 25;
  else if (bsrRank < 500) score += 15;
  else if (bsrRank < 2000) score += 8;
  // Competencia
  if (vendedoresPais === 0) score += 30;
  else if (vendedoresPais <= 3) score += 20;
  else if (vendedoresPais <= 8) score += 10;
  else if (vendedoresPais <= 15) score += 5;
  else score -= 10;
  // Precio competitivo
  if (precioMLActual === 0) score += 10; // Sin referencia = libre
  else if (precioTuyo < precioMLActual) score += 10;
  else if (precioTuyo > precioMLActual * 1.2) score -= 15;
  return Math.min(100, Math.max(0, score));
}

// ── Estimar ventana de oportunidad ──
function estimarVentana(vendedoresTotal, trends7d, tipo) {
  if (tipo === 'viral') {
    if (vendedoresTotal === 0) return { semanas: '3-5', estado: 'abierta', pct: 90 };
    if (vendedoresTotal <= 5) return { semanas: '1-3', estado: 'cerrando', pct: 50 };
    return { semanas: '<1', estado: 'cerrada', pct: 10 };
  }
  if (tipo === 'tendencia') {
    if (vendedoresTotal === 0) return { semanas: '8-12', estado: 'abierta', pct: 95 };
    if (vendedoresTotal <= 5) return { semanas: '4-8', estado: 'abierta', pct: 75 };
    if (vendedoresTotal <= 15) return { semanas: '2-4', estado: 'cerrando', pct: 40 };
    return { semanas: '<2', estado: 'cerrada', pct: 15 };
  }
  // evergreen
  if (vendedoresTotal === 0) return { semanas: '∞', estado: 'abierta', pct: 100 };
  if (vendedoresTotal <= 10) return { semanas: '∞', estado: 'abierta', pct: 80 };
  return { semanas: 'Competida', estado: 'cerrando', pct: 35 };
}

// ── Colores de vendedores ──
function colorVendedores(n) {
  if (n === 0) return 'v-cero';
  if (n <= 4) return 'v-poco';
  if (n <= 12) return 'v-medio';
  return 'v-saturado';
}

// ── Storage helpers ──
const DB_PORTFOLIO = 'kabuby_portfolio_v2';
const DB_OPORTUNIDADES = 'kabuby_oportunidades_v2';
const DB_ALERTAS = 'kabuby_alertas_v2';

function dbGet(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) { return []; }
}
function dbSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
}
function dbAdd(key, item) {
  const arr = dbGet(key);
  arr.unshift({ ...item, id: Date.now().toString(), fecha: new Date().toISOString() });
  dbSet(key, arr);
  return arr[0];
}
function dbUpdate(key, id, updates) {
  const arr = dbGet(key);
  const idx = arr.findIndex(x => x.id === id);
  if (idx >= 0) { arr[idx] = { ...arr[idx], ...updates, updatedAt: new Date().toISOString() }; dbSet(key, arr); }
}
function dbDelete(key, id) {
  const arr = dbGet(key).filter(x => x.id !== id);
  dbSet(key, arr);
}

// ── Buscar en ML (URL directa) ──
function mlSearchUrl(paisId, termino) {
  const p = PAISES.find(x => x.id === paisId);
  return p ? p.ml + encodeURIComponent(termino) : '#';
}

// ── Formatear moneda ──
function fmt(n) { return '$' + Number(n).toFixed(2); }
function fmtK(n) { return n >= 1000 ? (n/1000).toFixed(1)+'K' : n.toString(); }

// ── Fecha legible ──
function fmtFecha(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' });
}

// ── Días desde fecha ──
function diasDesde(iso) {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

// ── Restricciones por país conocidas ──
const RESTRICCIONES = {
  BR: ['suplementos→verificar ANVISA', 'electrónica→necesita homologación ANATEL'],
  AR: ['electrónica→restricciones de importación', 'suplementos→ANMAT'],
  MX: ['suplementos→verificar COFEPRIS'],
  CO: [], CL: [], PE: [], UY: [], EC: [],
};
