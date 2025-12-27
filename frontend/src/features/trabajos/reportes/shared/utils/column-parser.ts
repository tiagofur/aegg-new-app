/**
 * FASE 8 - Utilidades Compartidas para Parsing Flexible de Columnas de Excel
 *
 * Sistema robusto y flexible para detectar columnas en reportes de Excel
 * con múltiples variaciones de nombres, espacios, mayúsculas y acentos.
 *
 * @module column-parser
 */

/**
 * Encuentra dinámicamente la fila que contiene los headers reales
 * Útil cuando el Excel tiene filas de título o metadatos antes del header
 *
 * @param excelData - Array bidimensional del Excel
 * @param minColumns - Número mínimo de columnas para considerar una fila como header (default: 8)
 * @returns Índice de la fila del header, o -1 si no se encuentra
 *
 * @example
 * // Excel con título en fila 0, header en fila 1
 * const data = [
 *   ["Reporte de Ingresos - Enero 2024"], // Fila 0: título
 *   ["UUID", "Fecha", "RFC", "Subtotal", "Moneda", ...], // Fila 1: header real (10+ columnas)
 *   ["abc-123", "2024-01-15", "RFC001", 1000, "MXN", ...], // Fila 2: datos
 * ];
 * findHeaderRow(data) // 1 (encuentra el header en fila 1)
 */
export const findHeaderRow = (excelData: any[][], minColumns: number = 8): number => {
    if (!excelData || excelData.length === 0) {
        return -1
    }

    for (let i = 0; i < excelData.length; i++) {
        const row = excelData[i]

        // Contar columnas no vacías
        const nonEmptyColumns = row.filter((cell: any) => {
            const cellStr = cell?.toString().trim()
            return cellStr && cellStr.length > 0
        }).length

        // Si tiene suficientes columnas, es probablemente el header
        if (nonEmptyColumns >= minColumns) {
            console.log(`📍 Header encontrado en fila ${i + 1} (${nonEmptyColumns} columnas)`)
            return i
        }
    }

    console.warn(`⚠️ No se encontró fila de header con al menos ${minColumns} columnas`)
    return -1
}

/**
 * Normaliza un header removiendo espacios, guiones y caracteres especiales
 *
 * @param header - Header original del Excel
 * @returns Header normalizado en minúsculas sin espacios ni acentos
 *
 * @example
 * normalizeHeader("Tipo Cambio") // "tipocambio"
 * normalizeHeader("TipoCambio") // "tipocambio"
 * normalizeHeader("Tipo de Cambio") // "tipodecambio"
 * normalizeHeader("Estatus Sat") // "estatussat"
 * normalizeHeader("Estado SAT") // "estadosat"
 */
export const normalizeHeader = (header: any): string => {
    if (!header) return ''
    return header
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '') // Remover espacios
        .replace(/[_-]/g, '') // Remover guiones bajos y medios
        .normalize('NFD') // Normalizar caracteres unicode
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
}

/**
 * Busca el índice de una columna usando múltiples keywords flexibles
 *
 * @param headers - Array de headers normalizados
 * @param keywords - Array de posibles nombres de columna
 * @returns Índice de la columna o -1 si no se encuentra
 *
 * @example
 * const headers = ["uuid", "fechatimbradoxml", "tipocambio"];
 * findColumnIndex(headers, ["tipocambio", "tipo cambio", "tc"]) // 2
 */
export const findColumnIndex = (
    headers: readonly string[],
    keywords: readonly string[]
): number => {
    return headers.findIndex((h: string) =>
        keywords.some((keyword) => {
            const normalizedKeyword = normalizeHeader(keyword)
            // Buscar coincidencia exacta o que contenga el keyword
            return h === normalizedKeyword || h.includes(normalizedKeyword)
        })
    )
}

/**
 * Keywords predefinidos para columnas comunes en reportes de ingresos
 *
 * Cada propiedad contiene un array de posibles variaciones del nombre de la columna.
 * Las búsquedas son flexibles y detectarán variaciones con/sin espacios, mayúsculas, etc.
 */
export const COLUMN_KEYWORDS = {
    // ==================== Identificadores ====================
    UUID: [
        'uuid',
        'foliofiscal',
        'folio fiscal',
        'folio_fiscal',
        'foliotimbrado',
        'folio timbrado',
    ],
    FOLIO: [
        'folio',
        'serie/folio',
        'serie folio',
        'seriefolio',
        'folio factura',
        'foliofactura',
        'numero factura',
        'numero de factura',
        'numerofactura',
        'factura',
    ],
    SERIE: ['serie'],

    // ==================== Fechas ====================
    FECHA: [
        'fecha',
        'fechatimbrado',
        'fecha timbrado',
        'fechatimbradoxml',
        'fechaexpedicion',
        'fecha expedicion',
        'fechaemision',
        'fechaemisionxml',
        'fecha emision',
    ],

    // ==================== Partes (Emisor/Receptor) ====================
    RFC: ['rfc', 'receptor', 'rfcreceptor', 'rfc receptor'],
    RFC_EMISOR: ['rfcemisor', 'rfc emisor', 'emisor'],
    RAZON_SOCIAL: [
        'razonsocial',
        'razon social',
        'razón social',
        'receptor',
        'nombre',
        'nombrereceptor',
        'nombre receptor',
    ],
    NOMBRE_EMISOR: ['nombreemisor', 'nombre emisor', 'emisor'],

    // ==================== Montos ====================
    SUBTOTAL: [
        'subtotal',
        'subtotalaux',
        'subtotal aux',
        'subtotalsin',
        'subtotal sin',
        'importe',
        'base',
    ],
    DESCUENTO: ['descuento', 'desc'],
    TOTAL: ['total', 'importe total', 'importetotal', 'amount'],

    // ==================== Impuestos ====================
    IVA: ['iva', 'impuesto', 'tax', 'iva16', 'iva 16', 'ivaimporte', 'iva importe'],
    IVA_16: ['iva16', 'iva 16', 'iva16importe', 'iva 16 importe', 'iva16%', 'iva 16%'],
    IVA_8: ['iva8', 'iva 8', 'iva8importe', 'iva 8 importe', 'iva8%', 'iva 8%'],
    IVA_RETENIDO: ['ivaretenido', 'iva retenido', 'retencioniva', 'retencion iva'],
    ISR_RETENIDO: ['isrretenido', 'isr retenido', 'retencionisr', 'retencion isr'],
    TOTAL_TRASLADADOS: ['totaltrasladados', 'total trasladados', 'trasladados'],
    TOTAL_RETENIDOS: ['totalretenidos', 'total retenidos', 'retenidos'],

    // ==================== Moneda y Tipo de Cambio ====================
    MONEDA: ['moneda', 'currency', 'divisa'],
    TIPO_CAMBIO: [
        'tipocambio',
        'tipo cambio',
        'tipodecambio',
        'tipo de cambio',
        'tipo_cambio',
        'tc',
        'exchange rate',
        'exchangerate',
    ],

    // ==================== Estado/Estatus ====================
    ESTADO_SAT: [
        'estado',
        'estadosat',
        'estado sat',
        'estatussat',
        'estatus sat',
        'estatus_sat',
        'status',
        'status sat',
        'statussat',
    ],

    // ==================== Otros campos del SAT ====================
    USO_CFDI: ['usocfdi', 'uso cfdi', 'uso de cfdi', 'usodecfdi'],
    FORMA_PAGO: ['formapago', 'forma pago', 'formadepago', 'forma de pago'],
    METODO_PAGO: ['metodopago', 'metodo pago', 'metododepago', 'metodo de pago'],
    REGIMEN_FISCAL: ['regimenfiscal', 'regimen fiscal', 'regimen'],
    LUGAR_EXPEDICION: [
        'lugarexpedicion',
        'lugar expedicion',
        'lugardeexpedicion',
        'lugar de expedicion',
    ],
} as const

/**
 * Resultado de la validación de columnas obligatorias
 */
export interface ColumnValidationResult {
    /** Array de nombres de columnas faltantes */
    missing: string[]
    /** Mapa de columnas encontradas con sus índices */
    found: Record<string, number>
    /** Headers normalizados del Excel */
    normalized: string[]
}

/**
 * Valida que todas las columnas obligatorias existan
 *
 * @param headers - Headers originales del Excel
 * @param requiredColumns - Objeto con columnas requeridas y sus keywords
 * @returns Objeto con columnas faltantes, encontradas y headers normalizados
 *
 * @example
 * const result = validateRequiredColumns(
 *   ["UUID", "Subtotal", "Moneda"],
 *   {
 *     "UUID": COLUMN_KEYWORDS.UUID,
 *     "Subtotal": COLUMN_KEYWORDS.SUBTOTAL
 *   }
 * );
 * // result.missing = []
 * // result.found = { "UUID": 0, "Subtotal": 1 }
 */
export const validateRequiredColumns = (
    headers: any[],
    requiredColumns: Record<string, readonly string[]>
): ColumnValidationResult => {
    const normalizedHeaders = headers.map(normalizeHeader)
    const missing: string[] = []
    const found: Record<string, number> = {}

    Object.entries(requiredColumns).forEach(([columnName, keywords]) => {
        const index = findColumnIndex(normalizedHeaders, keywords)
        if (index === -1) {
            missing.push(columnName)
        } else {
            found[columnName] = index
        }
    })

    return { missing, found, normalized: normalizedHeaders }
}

/**
 * Parsea un valor de tipo de cambio de manera flexible
 *
 * NOTA: Si el TC es 1 o 0 y la moneda NO es MXN, puede ser un error.
 * Esta función detecta estos casos y retorna 1 para que el sistema
 * pueda corregirlo usando datos del Auxiliar si están disponibles.
 *
 * @param value - Valor del Excel (puede ser string, number, null, undefined)
 * @param moneda - Moneda del registro (para validación)
 * @returns Tipo de cambio parseado o 1 por defecto
 *
 * @example
 * parseTipoCambio("20.50", "USD") // 20.50
 * parseTipoCambio(1, "USD") // 1 (sospechoso pero lo retorna)
 * parseTipoCambio(null, "MXN") // 1
 * parseTipoCambio("1.0", "MXN") // 1
 */
export const parseTipoCambio = (value: any, moneda?: string): number => {
    // Si no hay valor, retornar 1
    if (value === null || value === undefined || value === '') {
        return 1
    }

    // Convertir a número
    const tc = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''))

    // Si no es un número válido, retornar 1
    if (isNaN(tc)) {
        return 1
    }

    // Si es exactamente 1 o 0, y la moneda NO es MXN/PESOS, puede ser un error
    // En ese caso, loguear warning pero retornar el valor (será corregido después si hay Auxiliar)
    if (
        (tc === 1 || tc === 0) &&
        moneda &&
        moneda.toUpperCase() !== 'MXN' &&
        moneda.toUpperCase() !== 'PESOS'
    ) {
        console.warn(
            `⚠️ Tipo de Cambio sospechoso: ${tc} para moneda ${moneda}. Se usará 1 por defecto (puede ser corregido con datos del Auxiliar).`
        )
        return 1
    }

    return tc
}

/**
 * Parsea una fecha de manera flexible
 *
 * Soporta:
 * - Objetos Date de JavaScript
 * - Números seriales de Excel
 * - Strings de fecha en varios formatos
 *
 * @param value - Valor del Excel (puede ser Date, string, number)
 * @returns Fecha como string YYYY-MM-DD o string vacío si inválido
 *
 * @example
 * parseFecha(new Date("2024-01-15")) // "2024-01-15"
 * parseFecha("2024-01-15") // "2024-01-15"
 * parseFecha(44946) // "2024-01-15" (serial de Excel)
 * parseFecha(null) // ""
 */
export const parseFecha = (value: any): string => {
    if (!value) return ''

    try {
        let date: Date

        // Si es un objeto Date de Excel
        if (value instanceof Date) {
            date = value
        }
        // Si es un número de Excel (serial date)
        else if (typeof value === 'number') {
            // Excel guarda fechas como número de días desde 1900-01-01
            const excelEpoch = new Date(1900, 0, 1)
            date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000)
        }
        // Si es un string
        else if (typeof value === 'string') {
            date = new Date(value)
        } else {
            return ''
        }

        // Validar que sea una fecha válida
        if (isNaN(date.getTime())) {
            return ''
        }

        // Formatear como YYYY-MM-DD
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')

        return `${year}-${month}-${day}`
    } catch (error) {
        console.error('Error parseando fecha:', value, error)
        return ''
    }
}

/**
 * Parsea un monto/número de manera flexible
 *
 * Limpia el valor removiendo símbolos de moneda, comas y espacios.
 *
 * @param value - Valor del Excel
 * @returns Número parseado o 0 si inválido
 *
 * @example
 * parseAmount(1000) // 1000
 * parseAmount("1,000.50") // 1000.50
 * parseAmount("$1,000.50") // 1000.50
 * parseAmount("") // 0
 * parseAmount(null) // 0
 */
export const parseAmount = (value: any): number => {
    if (value === null || value === undefined || value === '') {
        return 0
    }

    if (typeof value === 'number') {
        return value
    }

    // Limpiar string: remover espacios, comas, símbolos de moneda
    const cleaned = String(value)
        .trim()
        .replace(/[$,\s]/g, '')
        .replace(/[^\d.-]/g, '')

    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
}

/**
 * Normaliza una moneda a su código estándar
 *
 * @param value - Valor de moneda del Excel
 * @returns Código de moneda normalizado (MXN, USD, EUR, etc.)
 *
 * @example
 * parseMoneda("PESOS") // "MXN"
 * parseMoneda("USD") // "USD"
 * parseMoneda("Dolares") // "USD"
 * parseMoneda("EUR") // "EUR"
 * parseMoneda(null) // "MXN"
 */
export const parseMoneda = (value: any): string => {
    if (!value) return 'MXN'

    const moneda = String(value).toUpperCase().trim()

    // Mapeo de variaciones comunes
    const monedaMap: Record<string, string> = {
        PESOS: 'MXN',
        PESO: 'MXN',
        MXN: 'MXN',
        MEX: 'MXN',
        'MEXICAN PESO': 'MXN',
        USD: 'USD',
        DOLAR: 'USD',
        DOLARES: 'USD',
        DOLLAR: 'USD',
        DOLLARS: 'USD',
        US: 'USD',
        EUR: 'EUR',
        EURO: 'EUR',
        EUROS: 'EUR',
        CAD: 'CAD',
        GBP: 'GBP',
    }

    return monedaMap[moneda] || moneda
}
