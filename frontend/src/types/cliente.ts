export interface Cliente {
    id: string
    nombre: string
    rfc: string
    razonSocial?: string | null
    direccion?: Record<string, unknown> | null
    contactoPrincipal?: Record<string, unknown> | null
    metadata: Record<string, unknown>
    createdBy?: string | null
    createdAt: string
    updatedAt: string
}

export interface CreateClientePayload {
    nombre: string
    rfc: string
    razonSocial?: string
    direccion?: Record<string, unknown>
    contactoPrincipal?: Record<string, unknown>
    metadata?: Record<string, unknown>
}

export type UpdateClientePayload = Partial<CreateClientePayload>

export interface ClientesPaginatedResult {
    data: Cliente[]
    total: number
    page: number
    limit: number
}
