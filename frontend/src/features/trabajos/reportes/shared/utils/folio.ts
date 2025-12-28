/**
 * Utilidades relacionadas con folios de facturas.
 * Normalizamos los folios para compararlos sin importar guiones,
 * espacios o diferencias de mayúsculas/minúsculas.
 */

/**
 * Normaliza un folio eliminando espacios, guiones y convirtiendo a mayúsculas.
 * Nos aseguramos de comparar siempre contra la misma representación interna.
 */
export const normalizeFolio = (folio?: string | null): string => {
    if (!folio) {
        return ''
    }

    return folio
        .toString()
        .trim()
        .replace(/[^0-9A-Za-z]/g, '')
        .toUpperCase()
}

/**
 * Compara dos folios usando la normalización.
 */
export const foliosAreEqual = (a?: string | null, b?: string | null): boolean =>
    normalizeFolio(a) === normalizeFolio(b)
