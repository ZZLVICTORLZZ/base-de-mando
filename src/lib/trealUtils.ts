export interface TrealChecada {
  treal_id: string;
  fecha: string;
  base_nombre: string;
  checador: string;
  row_id: string;
  no?: number | string;
  frec?: string;
  horario: string;
  eco: string;
  ruta?: string;
  pax: string;
  observaciones?: string;
  photoUrl?: string;
  es_manual?: boolean;
  tipo_registro: string;
  recaudado: boolean;
  fecha_recaudacion?: string;
  estado_aforo?: 'pendiente' | 'aforada';
  fecha_aforo?: string;
  timestamp: number;
  isMissing?: boolean;
}

export interface TrealVuelta {
  id: string;
  fecha: string;
  checadas: TrealChecada[]; // Siempre [Nuevos Paseos, Indios Verdes]
  lagos: TrealChecada[];    // Checadas informativas de paso (Lagos 2 / Puente)
  completa: boolean;
  yaPonchada: boolean;
}

export const TrealChecada = {};
export const TrealVuelta = {};

/**
 * Extrae el nombre de la Base desde un registro de tablas_treal.
 * Soporta tanto el formato "[TREAL] Checador | Base" en creado_por como plantillas_predeterminadas.name.
 */
export function getTrealBase(tabla: any): string {
  if (tabla?.creado_por && String(tabla.creado_por).includes('|')) {
    const parts = String(tabla.creado_por).split('|');
    if (parts[1] && parts[1].trim()) {
      return parts[1].trim();
    }
  }
  const plantillas = tabla?.plantillas_predeterminadas;
  const fromRel = Array.isArray(plantillas) ? plantillas[0]?.name : plantillas?.name;
  if (fromRel && String(fromRel).trim()) {
    return String(fromRel).trim();
  }
  return 'Base Desconocida';
}

/**
 * Extrae el nombre del Checador desde un registro de tablas_treal.
 */
export function getTrealChecador(tabla: any): string {
  if (!tabla?.creado_por) return 'Desconocido';
  const raw = String(tabla.creado_por).split('|')[0].replace('[TREAL]', '').trim();
  return raw || 'Desconocido';
}

/**
 * Determina el tipo de base para la Regla de Oro de Vueltas:
 * - 'nuevos': Base de inicio de vuelta (Nuevos Paseos)
 * - 'indios': Base de cierre de vuelta (Indios Verdes)
 * - 'paso': Base informativa / intermedia (Lagos 2, Puente, etc.)
 * - 'otra': Cualquier otra base
 */
export function classifyBase(baseName: string): 'nuevos' | 'indios' | 'paso' | 'otra' {
  const lower = (baseName || '').toLowerCase();
  if (lower.includes('lago') || lower.includes('puente')) return 'paso';
  if (lower.includes('nuevos')) return 'nuevos';
  if (lower.includes('indios')) return 'indios';
  return 'otra';
}

/**
 * Extrae todas las checadas reales (no fantasmas y con horario válido) de un conjunto de tablas_treal para un ECO.
 */
export function extractChecadasForEco(tablas: any[], rawEco: string): TrealChecada[] {
  const targetEco = String(rawEco || '').trim();
  if (!targetEco) return [];

  const allChecadas: TrealChecada[] = [];

  (tablas || []).forEach((treal) => {
    const baseName = getTrealBase(treal);
    const checador = getTrealChecador(treal);
    const rows = Array.isArray(treal.rows) ? treal.rows : [];

    rows.forEach((row: any) => {
      if (!row || row.isGhost) return;
      const rowEco = String(row.eco || '').trim();
      const horario = String(row.horario || '').trim();
      if (rowEco !== targetEco || !horario || horario === '--:--') return;

      const [hh, mm] = horario.split(':').map(Number);
      const fechaStr = treal.fecha || new Date(treal.created_at || Date.now()).toISOString().split('T')[0];
      const dateObj = new Date(`${fechaStr}T12:00:00`);
      let timestamp = dateObj.getTime();
      if (!isNaN(hh) && !isNaN(mm)) {
        dateObj.setHours(hh, mm, 0, 0);
        timestamp = dateObj.getTime();
      }

      const hasQRPhoto = !!row.photoUrl && !row.es_manual;
      const tipoRegistro = row.tipo_registro || (hasQRPhoto ? 'QR / Foto' : row.es_manual ? 'Manual' : 'TREAL');

      allChecadas.push({
        treal_id: treal.id,
        fecha: fechaStr,
        base_nombre: baseName,
        checador,
        row_id: String(row.id || `${treal.id}-${row.no}`),
        no: row.no,
        frec: row.frec,
        horario,
        eco: rowEco,
        ruta: row.ruta,
        pax: row.pax !== undefined && row.pax !== null && String(row.pax).trim() !== '' ? String(row.pax) : '0',
        observaciones: row.observaciones || '',
        photoUrl: row.photoUrl || undefined,
        es_manual: !!row.es_manual,
        tipo_registro: tipoRegistro,
        recaudado: !!row.recaudado,
        fecha_recaudacion: row.fecha_recaudacion,
        estado_aforo: row.estado_aforo || 'pendiente',
        fecha_aforo: row.fecha_aforo,
        timestamp,
      });
    });
  });

  // Orden cronológico ascendente para emparejar vueltas correctamente
  allChecadas.sort((a, b) => a.timestamp - b.timestamp);
  return allChecadas;
}

/**
 * Construye las Vueltas aplicando la Regla de Oro:
 * 1. Normalmente el inicio de toda vuelta es Nuevos Paseos y el cierre es Indios Verdes.
 * 2. EXCEPCIÓN OPERATIVA: Cuando la tarjeta inicia en blanco después de haber cerrado todas sus vueltas
 *    previas en Recaudación y su primera firma nueva es en Indios Verdes, no se agrega vuelta/firma
 *    faltante de Nuevos atrás; ese ciclo se empareja como Indios Verdes -> Nuevos Paseos.
 * 3. Regla de Oro inquebrantable: No pueden haber dos firmas de Nuevos Paseos juntas ni dos firmas
 *    de Indios Verdes juntas; si ocurre, falta una firma intermedia de la otra base.
 * 4. Las checadas de Lagos 2 / Puente se adjuntan como informativas de esa fecha/vuelta.
 */
export function pairVueltasForEco(allChecadas: TrealChecada[], includeAlreadyPonchadas = false): TrealVuelta[] {
  const principales: TrealChecada[] = [];
  const pasos: TrealChecada[] = [];

  allChecadas.forEach((c) => {
    const kind = classifyBase(c.base_nombre);
    if (kind === 'paso') {
      pasos.push(c);
    } else {
      principales.push(c);
    }
  });

  // Agrupar checadas principales por bloques según corte de recaudación.
  // Un bloque nuevo "inicia con tarjeta en blanco" ÚNICAMENTE cuando TODAS las firmas
  // anteriores de la unidad fueron cerradas completamente en Recaudación (ninguna firma previa pendiente).
  interface ChecadaBlock {
    fecha: string;
    iniciaConTarjetaEnBlanco: boolean;
    items: TrealChecada[];
  }

  const blocks: ChecadaBlock[] = [];

  principales.forEach((c, idx) => {
    const batchKey = c.recaudado ? `paid:${c.fecha_recaudacion || 'legacy'}` : 'unpaid';
    const lastBlock = blocks[blocks.length - 1];
    const lastBatchKey =
      lastBlock && lastBlock.items.length > 0
        ? lastBlock.items[0].recaudado
          ? `paid:${lastBlock.items[0].fecha_recaudacion || 'legacy'}`
          : 'unpaid'
        : null;

    if (!lastBlock || lastBlock.fecha !== c.fecha || lastBatchKey !== batchKey) {
      const prevChecadas = principales.slice(0, idx);
      // La tarjeta inicia en blanco únicamente si existen firmas previas y el 100% de ellas
      // ya fueron cerradas/cobradas en recaudación (no dejó ninguna firma abierta atrás).
      const todasPreviasCerradas =
        prevChecadas.length > 0 && prevChecadas.every((prev) => prev.recaudado === true);

      blocks.push({
        fecha: c.fecha,
        iniciaConTarjetaEnBlanco: todasPreviasCerradas,
        items: [c],
      });
    } else {
      lastBlock.items.push(c);
    }
  });

  const vueltas: TrealVuelta[] = [];

  blocks.forEach((block) => {
    const items = block.items;
    if (items.length === 0) return;

    // Determinar sentido del bloque:
    // - Por defecto SIEMPRE inicia en 'nuevos' y cierra en 'indios'.
    // - ÚNICAMENTE cuando cerró completamente su día/cuenta en recaudación (inicia con tarjeta en blanco)
    //   y la primera firma de esa tarjeta en blanco es en Indios Verdes, inicia desde 'indios' -> 'nuevos'
    //   sin agregar vuelta de Nuevos atrás.
    const firstKind = classifyBase(items[0].base_nombre);
    const invertedCycle = block.iniciaConTarjetaEnBlanco && firstKind === 'indios';
    const startKind: 'nuevos' | 'indios' = invertedCycle ? 'indios' : 'nuevos';
    const endKind: 'nuevos' | 'indios' = invertedCycle ? 'nuevos' : 'indios';
    const startLabel = startKind === 'nuevos' ? 'Nuevos Paseos (FALTANTE)' : 'Indios Verdes (FALTANTE)';
    const endLabel = endKind === 'indios' ? 'Indios Verdes (FALTANTE)' : 'Nuevos Paseos (FALTANTE)';

    let i = 0;
    while (i < items.length) {
      const c1 = items[i];
      const kind1 = classifyBase(c1.base_nombre);
      const c2 = i + 1 < items.length ? items[i + 1] : null;
      const kind2 = c2 ? classifyBase(c2.base_nombre) : null;

      if (kind1 === startKind) {
        if (c2 && kind2 === endKind && c1.fecha === c2.fecha) {
          // Vuelta completa (ej. Nuevos -> Indios, o Indios -> Nuevos tras corte en recaudación)
          const yaPonchada = c1.recaudado && c2.recaudado;
          if (includeAlreadyPonchadas || !yaPonchada) {
            vueltas.push({
              id: `vuelta-${c1.treal_id}-${c1.row_id}`,
              fecha: c1.fecha,
              checadas: [c1, c2],
              lagos: [],
              completa: true,
              yaPonchada,
            });
          }
          i += 2;
        } else {
          // Dos firmas iguales juntas (ej. Nuevos -> Nuevos o Indios -> Indios) o vuelta aún abierta
          const missingEnd: TrealChecada = {
            ...c1,
            row_id: `missing-${endKind}-${c1.row_id}`,
            base_nombre: endLabel,
            horario: '--:--',
            pax: '0',
            isMissing: true,
            recaudado: true,
          };
          const yaPonchada = c1.recaudado;
          if (includeAlreadyPonchadas || !yaPonchada) {
            vueltas.push({
              id: `vuelta-${c1.treal_id}-${c1.row_id}`,
              fecha: c1.fecha,
              checadas: [c1, missingEnd],
              lagos: [],
              completa: false,
              yaPonchada,
            });
          }
          i += 1;
        }
      } else if (kind1 === endKind) {
        // Dos firmas de cierre juntas (ej. Indios -> Indios, o Nuevos -> Nuevos en ciclo invertido)
        // o inicio en Indios sin haber cerrado tarjeta antes en recaudación: falta firma de la otra base atrás
        const missingStart: TrealChecada = {
          ...c1,
          row_id: `missing-${startKind}-${c1.row_id}`,
          base_nombre: startLabel,
          horario: '--:--',
          pax: '0',
          isMissing: true,
          recaudado: true,
        };
        const yaPonchada = c1.recaudado;
        if (includeAlreadyPonchadas || !yaPonchada) {
          vueltas.push({
            id: `vuelta-${c1.treal_id}-${c1.row_id}`,
            fecha: c1.fecha,
            checadas: [missingStart, c1],
            lagos: [],
            completa: false,
            yaPonchada,
          });
        }
        i += 1;
      } else {
        // Fallback para cualquier otra base no clasificada
        if (c2 && c1.base_nombre !== c2.base_nombre && c1.fecha === c2.fecha) {
          const yaPonchada = c1.recaudado && c2.recaudado;
          if (includeAlreadyPonchadas || !yaPonchada) {
            vueltas.push({
              id: `vuelta-${c1.treal_id}-${c1.row_id}`,
              fecha: c1.fecha,
              checadas: [c1, c2],
              lagos: [],
              completa: true,
              yaPonchada,
            });
          }
          i += 2;
        } else {
          const missingOther: TrealChecada = {
            ...c1,
            row_id: `missing-other-${c1.row_id}`,
            base_nombre: 'FALTANTE',
            horario: '--:--',
            pax: '0',
            isMissing: true,
            recaudado: true,
          };
          const yaPonchada = c1.recaudado;
          if (includeAlreadyPonchadas || !yaPonchada) {
            vueltas.push({
              id: `vuelta-${c1.treal_id}-${c1.row_id}`,
              fecha: c1.fecha,
              checadas: [c1, missingOther],
              lagos: [],
              completa: false,
              yaPonchada,
            });
          }
          i += 1;
        }
      }
    }
  });

  // Asociar checadas de paso (Lagos 2) a la vuelta más cercana de la misma fecha
  pasos.forEach((paso) => {
    const vueltasMismaFecha = vueltas.filter((v) => v.fecha === paso.fecha);
    if (vueltasMismaFecha.length > 0) {
      // Buscar la vuelta cuyo rango de tiempo sea más cercano
      let bestVuelta = vueltasMismaFecha[0];
      let minDiff = Infinity;
      vueltasMismaFecha.forEach((v) => {
        const realTimes = v.checadas.filter((c) => !c.isMissing).map((c) => c.timestamp);
        realTimes.forEach((t) => {
          const diff = Math.abs(paso.timestamp - t);
          if (diff < minDiff) {
            minDiff = diff;
            bestVuelta = v;
          }
        });
      });
      bestVuelta.lagos.push(paso);
    }
  });

  // Ordenar vueltas de la más reciente a la más antigua
  vueltas.sort((a, b) => {
    const tA = Math.max(...a.checadas.filter((c) => !c.isMissing).map((c) => c.timestamp), 0);
    const tB = Math.max(...b.checadas.filter((c) => !c.isMissing).map((c) => c.timestamp), 0);
    return tB - tA;
  });

  return vueltas;
}
