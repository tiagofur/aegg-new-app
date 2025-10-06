import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Trabajo } from './trabajo.entity';

export enum TipoReporte {
    MENSUAL = 'mensual',
    INGRESOS = 'ingresos',
    AUXILIAR_INGRESOS = 'auxiliar_ingresos',
    ADMIN_INGRESOS = 'admin_ingresos',
    EGRESOS = 'egresos',
    AUXILIAR_EGRESOS = 'auxiliar_egresos',
    BALANCE = 'balance',
    RESUMEN = 'resumen',
    OTRO = 'otro',
}

// Interfaces para la estructura JSONB
export interface DatosOriginales {
    headers: string[];
    filas: any[][];
    metadata: {
        total_filas: number;
        total_columnas: number;
        fecha_importacion: string;
        nombre_hoja?: string;
    };
}

export interface CeldaModificada {
    valor_original: any;
    valor_nuevo: any;
    tipo_modificacion: 'edicion' | 'formula' | 'agregado';
    fecha_modificacion: string;
}

export interface FilaNueva {
    index: number;
    datos: any[];
    tipo: 'manual' | 'calculada';
    fecha_creacion: string;
}

export interface ColumnaNueva {
    index: number;
    nombre: string;
    tipo: 'texto' | 'numero' | 'fecha' | 'formula';
    formula?: string;
    valores: Record<number, any>;
    fecha_creacion: string;
}

export interface Formula {
    expresion: string;
    resultado: any;
    dependencias: string[];
    ultima_evaluacion: string;
}

export interface DatosModificados {
    celdas?: Record<string, CeldaModificada>;
    filas_nuevas?: FilaNueva[];
    columnas_nuevas?: ColumnaNueva[];
    formulas?: Record<string, Formula>;
    filas_eliminadas?: number[];
    columnas_eliminadas?: number[];
}

export interface AreaEditable {
    inicio_fila: number;
    fin_fila: number;
    inicio_columna: number;
    fin_columna: number;
    permitir_agregar_filas: boolean;
    permitir_formulas: boolean;
}

export interface ColumnaCalculadaAuto {
    columna: number;
    formula_template: string;
}

export interface ConfiguracionReporte {
    areas_editables: AreaEditable[];
    columnas_calculadas_auto?: ColumnaCalculadaAuto[];
    permisos?: {
        puede_agregar_filas: boolean;
        puede_agregar_columnas: boolean;
        puede_eliminar_filas: boolean;
    };
}

@Entity('reportes')
export class Reporte {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Trabajo, (trabajo) => trabajo.reportes, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'trabajo_id' })
    trabajo: Trabajo;

    @Column({ name: 'trabajo_id' })
    trabajoId: string;

    @Column({
        type: 'enum',
        enum: TipoReporte,
        name: 'tipo_reporte',
    })
    tipoReporte: TipoReporte;

    @Column({ name: 'archivo_original', nullable: true })
    archivoOriginal: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: {
        filas: number;
        columnas: number;
        areas_editables: AreaEditable[];
        headers: string[];
    };

    @Column({ type: 'jsonb', nullable: true, name: 'datos_originales' })
    datosOriginales: DatosOriginales;

    @Column({
        type: 'jsonb',
        default: {},
        name: 'datos_modificados',
    })
    datosModificados: DatosModificados;

    @Column({ type: 'jsonb', nullable: true })
    configuracion: ConfiguracionReporte;

    @Column({ type: 'varchar', default: 'pendiente' })
    estado: string; // 'pendiente', 'importado', 'procesado', 'exportado'

    @CreateDateColumn({ name: 'fecha_importacion' })
    fechaImportacion: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
