/**
 * Celda editable para Estado SAT
 * Select con opciones Vigente/Cancelada y estilos condicionales
 */

import { getEstadoSatCellClasses } from '../../utils';
import type { EstadoSat } from '../../types';

interface EditableEstadoSatCellProps {
  /** Valor actual del estado */
  value: EstadoSat;
  /** Callback al cambiar el valor */
  onChange: (value: EstadoSat) => void;
  /** Si el select está deshabilitado */
  disabled?: boolean;
}

/**
 * Componente de celda editable para estado SAT
 */
export const EditableEstadoSatCell: React.FC<EditableEstadoSatCellProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as EstadoSat);
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className={`
        w-full px-2 py-1 border rounded
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        transition-colors
        ${getEstadoSatCellClasses(value)}
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
      `}
      title={`Estado SAT: ${value}`}
    >
      <option value="Vigente">Vigente</option>
      <option value="Cancelada">Cancelada</option>
    </select>
  );
};
