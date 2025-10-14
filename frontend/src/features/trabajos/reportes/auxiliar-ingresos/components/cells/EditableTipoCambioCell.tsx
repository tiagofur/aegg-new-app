/**
 * Celda editable para Tipo de Cambio
 * Input numérico con validación
 */

import { useState, useEffect } from "react";
import { inputStyles } from "../../utils";

interface EditableTipoCambioCellProps {
  /** Valor actual del tipo de cambio */
  value: number | null;
  /** Callback al cambiar el valor */
  onChange: (value: number) => void;
  /** Si el input está deshabilitado (ej: moneda MXN) */
  disabled?: boolean;
  /** Moneda para mostrar info adicional */
  moneda?: string;
  /** Razón opcional para mostrar en tooltip cuando está deshabilitado */
  disabledReason?: string;
}

/**
 * Componente de celda editable para tipo de cambio
 */
export const EditableTipoCambioCell: React.FC<EditableTipoCambioCellProps> = ({
  value,
  onChange,
  disabled = false,
  moneda = "USD",
  disabledReason,
}) => {
  const [localValue, setLocalValue] = useState(value?.toString() || "");
  const [hasError, setHasError] = useState(false);

  // Sincronizar con prop value
  useEffect(() => {
    setLocalValue(value?.toString() || "");
  }, [value]);

  const handleBlur = () => {
    const numValue = parseFloat(localValue);

    // Validar que sea un número positivo
    if (isNaN(numValue) || numValue <= 0) {
      setHasError(true);
      // Restaurar valor anterior
      setLocalValue(value?.toString() || "");

      // Limpiar error después de 2 segundos
      setTimeout(() => setHasError(false), 2000);
      return;
    }

    setHasError(false);
    onChange(numValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Submit con Enter
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
    // Cancelar con Escape
    if (e.key === "Escape") {
      setLocalValue(value?.toString() || "");
      e.currentTarget.blur();
    }
  };

  return (
    <div className="relative">
      <input
        type="number"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        step="0.0001"
        min="0"
        placeholder={
          disabled
            ? value?.toString() || (moneda === "MXN" ? "1.0000" : "0.0000")
            : "0.0000"
        }
        className={`
          ${inputStyles.base}
          ${disabled ? inputStyles.disabled : ""}
          ${hasError ? inputStyles.error : ""}
          text-right
        `}
        title={
          disabled
            ? disabledReason ??
              (moneda === "MXN"
                ? "Moneda MXN - Tipo de cambio fijo 1.0"
                : "Edición deshabilitada")
            : "Tipo de cambio (ej: 19.5432)"
        }
      />
      {hasError && (
        <div className="absolute -bottom-6 left-0 text-xs text-red-600">
          Debe ser un número positivo
        </div>
      )}
    </div>
  );
};
