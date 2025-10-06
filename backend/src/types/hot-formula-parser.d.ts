declare module 'hot-formula-parser' {
    export class Parser {
        constructor();
        parse(formula: string): { result: any; error: string | null };
        setVariable(name: string, value: any): void;
    }
}
