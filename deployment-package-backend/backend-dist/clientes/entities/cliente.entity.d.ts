export declare class Cliente {
    id: string;
    nombre: string;
    rfc: string;
    razonSocial?: string | null;
    direccion?: Record<string, unknown> | null;
    contactoPrincipal?: Record<string, unknown> | null;
    metadata: Record<string, unknown>;
    createdBy?: string | null;
    createdAt: Date;
    updatedAt: Date;
    normalizeFields(): void;
}
