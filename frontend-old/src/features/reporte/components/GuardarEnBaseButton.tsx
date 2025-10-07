import React, { useCallback, useState } from 'react';
import { Button, Tooltip } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useReportComparison } from '../context/ReportComparisonContext';

interface GuardarEnBaseButtonProps {
  selectedMonth: number;
}

const monthNames = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export const GuardarEnBaseButton: React.FC<GuardarEnBaseButtonProps> = ({ selectedMonth }) => {
  console.log('🎬 GuardarEnBaseButton - Componente renderizando con selectedMonth:', selectedMonth);

  const [isGuardando, setIsGuardando] = useState(false);
  const [, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  const {
    isComparisonActive,
    areSubtotalsEqual,
    getSubtotalMXNFromReporte03,
    saveToPlantillaBase,
  } = useReportComparison();

  const handleGuardarEnBase = useCallback(async () => {
    console.log('🔴 CLICK en Guardar en Base - Iniciando proceso...');

    if (!areSubtotalsEqual()) {
      console.log('⚠️ Subtotales no coinciden, cancelando guardado');
      setToast({ open: true, message: 'Subtotales no coinciden', severity: 'warning' });
      return;
    }

    const subtotal = getSubtotalMXNFromReporte03?.();
    if (subtotal == null || isNaN(subtotal)) {
      console.log('⚠️ No se pudo obtener Subtotal MXN válido:', subtotal);
      setToast({ open: true, message: 'No se pudo obtener Subtotal MXN', severity: 'error' });
      return;
    }

    console.log(`🔥 Llamando saveToPlantillaBase con: subtotal=${subtotal}, mes=${selectedMonth}`);
    setIsGuardando(true);
    try {
      const ok = await saveToPlantillaBase(subtotal, selectedMonth);
      if (ok) {
        setToast({
          open: true,
          message: `✅ Guardado en hoja 0 (${monthNames[selectedMonth]})`,
          severity: 'success',
        });
        console.log(
          `✅ Guardado exitoso en Plantilla Base: $${subtotal} en ${monthNames[selectedMonth]}`
        );
      } else {
        setToast({ open: true, message: 'Error al guardar en hoja 0', severity: 'error' });
        console.error('❌ Error al guardar en Plantilla Base');
      }
    } catch (error) {
      console.error('❌ Error inesperado al guardar:', error);
      setToast({ open: true, message: 'Error inesperado al guardar', severity: 'error' });
    } finally {
      setIsGuardando(false);
    }
  }, [areSubtotalsEqual, getSubtotalMXNFromReporte03, saveToPlantillaBase, selectedMonth]);

  console.log('🔧 handleGuardarEnBase creado/actualizado:', {
    functionExists: typeof handleGuardarEnBase === 'function',
    dependencies: {
      areSubtotalsEqual: !!areSubtotalsEqual,
      getSubtotalMXNFromReporte03: !!getSubtotalMXNFromReporte03,
      saveToPlantillaBase: !!saveToPlantillaBase,
      selectedMonth,
    },
  });

  // Solo mostrar el botón si:
  // 1. La comparación está activa
  // 2. Los subtotales coinciden
  // 3. Hay un subtotal válido
  const shouldShowButton =
    isComparisonActive && areSubtotalsEqual() && getSubtotalMXNFromReporte03() != null;

  // 🔍 DEBUGGING: Ver por qué no aparece el botón
  console.log('🔍 GuardarEnBaseButton - Estado de visibilidad:', {
    isComparisonActive,
    areSubtotalsEqual: areSubtotalsEqual(),
    subtotalValue: getSubtotalMXNFromReporte03(),
    subtotalIsValid: getSubtotalMXNFromReporte03() != null,
    shouldShowButton,
    selectedMonth,
  });

  if (!shouldShowButton) {
    console.log('❌ GuardarEnBaseButton - Botón oculto, condiciones no cumplidas');
    return null;
  }

  console.log('✅ GuardarEnBaseButton - Botón visible, renderizando...');

  const subtotalMXN = getSubtotalMXNFromReporte03();

  console.log('🔍 Estado del botón:', {
    isGuardando,
    disabled: isGuardando,
    handleGuardarEnBaseDefined: typeof handleGuardarEnBase === 'function',
  });

  return (
    <Tooltip
      title={`Guardar Subtotal MXN ($${subtotalMXN?.toFixed(2)}) en Plantilla Base (${
        monthNames[selectedMonth]
      })`}
      arrow
    >
      <Button
        variant="contained"
        color="success"
        size="small"
        startIcon={<SaveIcon />}
        onMouseDown={() => {
          console.log('🔵 MOUSE DOWN DETECTADO en botón Guardar');
        }}
        onClick={(e) => {
          console.log('🟡 EVENTO CLICK DETECTADO - Elemento:', e.target);
          console.log('🟡 Evento detalles:', {
            type: e.type,
            bubbles: e.bubbles,
            currentTarget: e.currentTarget,
          });
          e.preventDefault();
          e.stopPropagation();
          console.log('🟡 Llamando handleGuardarEnBase...');
          handleGuardarEnBase();
        }}
        disabled={isGuardando}
        sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          px: 1.5,
          height: '32px',
          backgroundColor: '#2e7d32',
          '&:hover': {
            backgroundColor: '#1b5e20',
          },
          '&:disabled': {
            backgroundColor: '#a5d6a7',
          },
        }}
      >
        {isGuardando ? '...' : 'Guardar en Base'}
      </Button>
    </Tooltip>
  );
};

export default GuardarEnBaseButton;
