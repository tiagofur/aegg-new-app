// Type declarations for ExcelJS (xlsx package)
// This file provides type definitions for the xlsx package

declare module 'xlsx' {
  export const read: (data: any, options?: any) => any;
  export const utils: {
    sheet_to_json: (worksheet: any, options?: any) => any[][];
    decode_range: (range: string) => any;
  };
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [key: string]: any };
  }
}
