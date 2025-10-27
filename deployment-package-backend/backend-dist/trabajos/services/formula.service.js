"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormulaService = void 0;
const common_1 = require("@nestjs/common");
const hot_formula_parser_1 = require("hot-formula-parser");
let FormulaService = class FormulaService {
    constructor() {
        this.parser = new hot_formula_parser_1.Parser();
    }
    evaluar(formula, datos, filaActual) {
        try {
            if (!formula || !formula.toString().startsWith('=')) {
                return formula;
            }
            const expresion = formula.substring(1);
            const expresionResuelta = this.resolverReferencias(expresion, datos, filaActual);
            const resultado = this.parser.parse(expresionResuelta);
            if (resultado.error) {
                throw new common_1.BadRequestException(`Error en fórmula: ${resultado.error}`);
            }
            return resultado.result;
        }
        catch (error) {
            throw new common_1.BadRequestException(`Error evaluando fórmula: ${error.message}`);
        }
    }
    resolverReferencias(expresion, datos, filaActual) {
        let expresionResuelta = expresion;
        const patronCelda = /([A-Z]+)(\d+)/g;
        expresionResuelta = expresionResuelta.replace(patronCelda, (match, col, row) => {
            const columna = this.columnaLetraANumero(col);
            const fila = parseInt(row) - 1;
            if (datos[fila] &&
                datos[fila][columna] !== undefined) {
                return datos[fila][columna].toString();
            }
            return '0';
        });
        if (filaActual !== undefined) {
            expresionResuelta = expresionResuelta.replace(/{fila}/g, (filaActual + 1).toString());
        }
        const patronRango = /([A-Z]+)(\d+):([A-Z]+)(\d+)/g;
        expresionResuelta = expresionResuelta.replace(patronRango, (match, col1, row1, col2, row2) => {
            const valores = this.obtenerValoresRango(col1, parseInt(row1), col2, parseInt(row2), datos);
            return valores.join(',');
        });
        return expresionResuelta;
    }
    obtenerValoresRango(col1, row1, col2, row2, datos) {
        const valores = [];
        const columna1 = this.columnaLetraANumero(col1);
        const columna2 = this.columnaLetraANumero(col2);
        for (let fila = row1 - 1; fila < row2; fila++) {
            for (let col = columna1; col <= columna2; col++) {
                if (datos[fila] && datos[fila][col] !== undefined) {
                    const valor = datos[fila][col];
                    if (typeof valor === 'number' || !isNaN(parseFloat(valor))) {
                        valores.push(parseFloat(valor) || 0);
                    }
                }
            }
        }
        return valores;
    }
    columnaLetraANumero(letra) {
        let numero = 0;
        for (let i = 0; i < letra.length; i++) {
            numero = numero * 26 + (letra.charCodeAt(i) - 64);
        }
        return numero - 1;
    }
    numeroAColumnaLetra(numero) {
        let letra = '';
        let temp = numero + 1;
        while (temp > 0) {
            const resto = (temp - 1) % 26;
            letra = String.fromCharCode(65 + resto) + letra;
            temp = Math.floor((temp - 1) / 26);
        }
        return letra;
    }
    extraerDependencias(formula) {
        const dependencias = [];
        const patronCelda = /([A-Z]+\d+)/g;
        const matches = formula.match(patronCelda);
        if (matches) {
            dependencias.push(...matches);
        }
        return [...new Set(dependencias)];
    }
    async recalcularFormulas(formulas, datos, celdaModificada) {
        const formulasActualizadas = { ...formulas };
        if (celdaModificada) {
            for (const [key, formula] of Object.entries(formulasActualizadas)) {
                if (formula.dependencias &&
                    formula.dependencias.includes(celdaModificada)) {
                    const [fila] = key.split(',').map(Number);
                    formula.resultado = this.evaluar(formula.expresion, datos, fila);
                    formula.ultima_evaluacion = new Date().toISOString();
                }
            }
        }
        else {
            for (const [key, formula] of Object.entries(formulasActualizadas)) {
                const [fila] = key.split(',').map(Number);
                formula.resultado = this.evaluar(formula.expresion, datos, fila);
                formula.ultima_evaluacion = new Date().toISOString();
            }
        }
        return formulasActualizadas;
    }
};
exports.FormulaService = FormulaService;
exports.FormulaService = FormulaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], FormulaService);
//# sourceMappingURL=formula.service.js.map