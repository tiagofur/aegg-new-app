import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TrabajosList } from '../TrabajosList'
import type { Trabajo } from '../../../types/trabajo'

const baseTrabajo: Trabajo = {
    id: 'trabajo-1',
    clienteId: 'cliente-1',
    clienteNombre: 'Cliente Demo',
    clienteRfc: 'RFC123456',
    anio: 2024,
    estado: 'ACTIVO',
    estadoAprobacion: 'EN_REVISION',
    visibilidadEquipo: true,
    meses: [],
    reporteBaseAnual: {
        id: 'reporte-base',
        trabajoId: 'trabajo-1',
        mesesCompletados: [],
        hojas: [],
        ultimaActualizacion: new Date().toISOString(),
    },
    miembroAsignado: null,
    aprobadoPor: null,
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
}

describe('TrabajosList', () => {
    it('no muestra el botón de creación cuando el usuario no puede crear', () => {
        render(
            <TrabajosList
                trabajos={[]}
                onSelectTrabajo={vi.fn()}
                onCreateTrabajo={vi.fn()}
                canCreate={false}
            />
        )

        expect(screen.queryByRole('button', { name: /nuevo trabajo/i })).toBeNull()
        expect(screen.queryByRole('button', { name: /crear el primer trabajo/i })).toBeNull()
    })

    it('muestra el botón de creación cuando el usuario puede crear', () => {
        render(
            <TrabajosList
                trabajos={[baseTrabajo]}
                onSelectTrabajo={vi.fn()}
                onCreateTrabajo={vi.fn()}
                canCreate={true}
            />
        )

        expect(screen.getByRole('button', { name: /nuevo trabajo/i })).toBeInTheDocument()
    })
})
