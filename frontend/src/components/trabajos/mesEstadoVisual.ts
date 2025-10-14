import { Mes } from "../../types/trabajo";

export type MesEstadoTone = "success" | "warning" | "muted";

export interface MesEstadoVisual {
  icon: string;
  label: string;
  tone: MesEstadoTone;
}

export const MES_ESTADO_TONE_CLASSES: Record<
  MesEstadoTone,
  {
    textClass: string;
    dotClass: string;
    badgeBgClass: string;
    badgeBorderClass: string;
  }
> = {
  success: {
    textClass: "text-green-700",
    dotClass: "bg-green-500",
    badgeBgClass: "bg-green-50",
    badgeBorderClass: "border-green-200",
  },
  warning: {
    textClass: "text-amber-700",
    dotClass: "bg-amber-500",
    badgeBgClass: "bg-amber-50",
    badgeBorderClass: "border-amber-200",
  },
  muted: {
    textClass: "text-slate-600",
    dotClass: "bg-slate-300",
    badgeBgClass: "bg-slate-100",
    badgeBorderClass: "border-slate-200",
  },
};

export const getMesEstadoVisual = (mes: Mes): MesEstadoVisual => {
  switch (mes.estado) {
    case "COMPLETADO":
      return {
        icon: "✓",
        label: "Completado",
        tone: "success",
      };
    case "EN_PROCESO":
      return {
        icon: "⏳",
        label: "En proceso",
        tone: "warning",
      };
    default:
      return {
        icon: "○",
        label: "Pendiente",
        tone: "muted",
      };
  }
};
