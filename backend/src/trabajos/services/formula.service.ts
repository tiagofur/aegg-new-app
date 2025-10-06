import { Injectable, BadRequestException } from '@nestjs/common';
import { Parser } from 'hot-formula-parser';

@Injectable()
export class FormulaService {
    private parser: Parser;

    constructor() {
        this.parser = new Parser();
    }

    /**
     * Evalúa una fórmula con el contexto de datos proporcionado
     * @param formula - La fórmula a evaluar (ej: "=SUM(A1:A10)")
     * @param datos - Matriz de datos del reporte
     * @param filaActual - Fila actual para fórmulas relativas
     * @returns El resultado calculado
     */
    evaluar(formula: string, datos: any[][], filaActual?: number): any {
        try {
            // Si no es una fórmula, retornar el valor tal cual
            if (!formula || !formula.toString().startsWith('=')) {
                return formula;
            }

            // Remover el '=' inicial
            const expresion = formula.substring(1);

            // Reemplazar referencias de celdas por valores
            const expresionResuelta = this.resolverReferencias(
                expresion,
                datos,
                filaActual,
            );

            // Evaluar la expresión
            const resultado = this.parser.parse(expresionResuelta);

            if (resultado.error) {
                throw new BadRequestException(
                    `Error en fórmula: ${resultado.error}`,
                );
            }

            return resultado.result;
        } catch (error) {
            throw new BadRequestException(
                `Error evaluando fórmula: ${error.message}`,
            );
        }
    }

    /**
     * Resuelve referencias de celdas (A1, B5, etc.) a sus valores
     */
    private resolverReferencias(
        expresion: string,
        datos: any[][],
        filaActual?: number,
    ): string {
        // Reemplazar referencias tipo A1, B5, etc.
        let expresionResuelta = expresion;

        // Patrón para detectar referencias de celdas (ej: A1, B10, AA5)
        const patronCelda = /([A-Z]+)(\d+)/g;
        expresionResuelta = expresionResuelta.replace(
            patronCelda,
            (match, col, row) => {
                const columna = this.columnaLetraANumero(col);
                const fila = parseInt(row) - 1; // Convertir a índice 0

                if (
                    datos[fila] &&
                    datos[fila][columna] !== undefined
                ) {
                    return datos[fila][columna].toString();
                }
                return '0'; // Valor por defecto si no existe
            },
        );

        // Reemplazar {fila} con la fila actual
        if (filaActual !== undefined) {
            expresionResuelta = expresionResuelta.replace(
                /{fila}/g,
                (filaActual + 1).toString(),
            );
        }

        // Manejar rangos tipo A1:A10 para funciones SUM, AVG, etc.
        const patronRango = /([A-Z]+)(\d+):([A-Z]+)(\d+)/g;
        expresionResuelta = expresionResuelta.replace(
            patronRango,
            (match, col1, row1, col2, row2) => {
                const valores = this.obtenerValoresRango(
                    col1,
                    parseInt(row1),
                    col2,
                    parseInt(row2),
                    datos,
                );
                return valores.join(',');
            },
        );

        return expresionResuelta;
    }

    /**
     * Obtiene los valores de un rango de celdas
     */
    private obtenerValoresRango(
        col1: string,
        row1: number,
        col2: string,
        row2: number,
        datos: any[][],
    ): any[] {
        const valores: any[] = [];
        const columna1 = this.columnaLetraANumero(col1);
        const columna2 = this.columnaLetraANumero(col2);

        for (let fila = row1 - 1; fila < row2; fila++) {
            for (let col = columna1; col <= columna2; col++) {
                if (datos[fila] && datos[fila][col] !== undefined) {
                    const valor = datos[fila][col];
                    // Solo agregar números
                    if (typeof valor === 'number' || !isNaN(parseFloat(valor))) {
                        valores.push(parseFloat(valor) || 0);
                    }
                }
            }
        }

        return valores;
    }

    /**
     * Convierte letra de columna a número (A=0, B=1, ..., Z=25, AA=26, etc.)
     */
    private columnaLetraANumero(letra: string): number {
        let numero = 0;
        for (let i = 0; i < letra.length; i++) {
            numero = numero * 26 + (letra.charCodeAt(i) - 64);
        }
        return numero - 1; // Convertir a índice 0
    }

    /**
     * Convierte número de columna a letra (0=A, 1=B, ..., 25=Z, 26=AA, etc.)
     */
    numeroAColumnaLetra(numero: number): string {
        let letra = '';
        let temp = numero + 1;
        while (temp > 0) {
            const resto = (temp - 1) % 26;
            letra = String.fromCharCode(65 + resto) + letra;
            temp = Math.floor((temp - 1) / 26);
        }
        return letra;
    }

    /**
     * Extrae las dependencias de una fórmula
     */
    extraerDependencias(formula: string): string[] {
        const dependencias: string[] = [];

        // Detectar referencias tipo A1, B5, etc.
        const patronCelda = /([A-Z]+\d+)/g;
        const matches = formula.match(patronCelda);

        if (matches) {
            dependencias.push(...matches);
        }

        return [...new Set(dependencias)]; // Eliminar duplicados
    }

    /**
     * Recalcula todas las fórmulas dependientes cuando cambia una celda
     */
    async recalcularFormulas(
        formulas: Record<string, any>,
        datos: any[][],
        celdaModificada?: string,
    ): Promise<Record<string, any>> {
        const formulasActualizadas = { ...formulas };

        // Si se especifica una celda modificada, solo recalcular las que dependen de ella
        if (celdaModificada) {
            for (const [key, formula] of Object.entries(formulasActualizadas)) {
                if (
                    formula.dependencias &&
                    formula.dependencias.includes(celdaModificada)
                ) {
                    const [fila] = key.split(',').map(Number);
                    formula.resultado = this.evaluar(
                        formula.expresion,
                        datos,
                        fila,
                    );
                    formula.ultima_evaluacion = new Date().toISOString();
                }
            }
        } else {
            // Recalcular todas las fórmulas
            for (const [key, formula] of Object.entries(formulasActualizadas)) {
                const [fila] = key.split(',').map(Number);
                formula.resultado = this.evaluar(
                    formula.expresion,
                    datos,
                    fila,
                );
                formula.ultima_evaluacion = new Date().toISOString();
            }
        }

        return formulasActualizadas;
    }
}
