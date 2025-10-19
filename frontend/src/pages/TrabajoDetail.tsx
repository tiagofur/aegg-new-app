import React from "react";
import { TrabajosPage } from "./TrabajosPage";

/**
 * Mantiene compatibilidad con rutas o imports históricos redirigiendo
 * al contenedor moderno que gestiona el detalle de trabajos.
 */
export const TrabajoDetail: React.FC = () => <TrabajosPage />;
