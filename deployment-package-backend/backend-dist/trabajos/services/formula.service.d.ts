export declare class FormulaService {
    private parser;
    constructor();
    evaluar(formula: string, datos: any[][], filaActual?: number): any;
    private resolverReferencias;
    private obtenerValoresRango;
    private columnaLetraANumero;
    numeroAColumnaLetra(numero: number): string;
    extraerDependencias(formula: string): string[];
    recalcularFormulas(formulas: Record<string, any>, datos: any[][], celdaModificada?: string): Promise<Record<string, any>>;
}
