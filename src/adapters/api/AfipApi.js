/**
 * @file AfipApi.js
 * @description Adaptador API cliente para consultar comprobantes de ARCA / AFIP SDK y el pipeline de atribución contable.
 * @module adapters/api/AfipApi
 */

/**
 * Consulta la lista de comprobantes recibidos ('R') desde el backend.
 * @param {string} desde - Fecha inicial (YYYY-MM-DD)
 * @param {string} hasta - Fecha final (YYYY-MM-DD)
 * @returns {Promise<Array<Object>>}
 */
export async function fetchReceivedInvoices(desde, hasta) {
  const res = await fetch(`/api/gastos?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Error al obtener comprobantes recibidos de ARCA');
  }
  return data.data || [];
}

/**
 * Ejecuta el pipeline de atribución contable inteligente para comprobantes recibidos.
 * @param {string} desde - Fecha inicial (YYYY-MM-DD)
 * @param {string} hasta - Fecha final (YYYY-MM-DD)
 * @returns {Promise<Array<Object>>}
 */
export async function fetchAccountingPipeline(desde, hasta) {
  const res = await fetch(`/api/pipeline-atribucion?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Error al ejecutar pipeline de atribución contable ARCA');
  }
  return data.data || [];
}

/**
 * Consulta la lista de comprobantes emitidos ('E' / Ventas) desde el backend.
 * @param {string} desde - Fecha inicial (YYYY-MM-DD)
 * @param {string} hasta - Fecha final (YYYY-MM-DD)
 * @returns {Promise<Array<Object>>}
 */
export async function fetchIssuedInvoices(desde, hasta) {
  const res = await fetch(`/api/ventas-emitidas?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Error al obtener comprobantes emitidos de ARCA');
  }
  return data.data || [];
}

/**
 * Ejecuta el pipeline de ventas / comprobantes emitidos enriquecidos con datos de receptor y padrón.
 * @param {string} desde - Fecha inicial (YYYY-MM-DD)
 * @param {string} hasta - Fecha final (YYYY-MM-DD)
 * @returns {Promise<Array<Object>>}
 */
export async function fetchIssuedPipeline(desde, hasta) {
  const res = await fetch(`/api/pipeline-emitidos?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Error al ejecutar pipeline de comprobantes emitidos ARCA');
  }
  return data.data || [];
}

