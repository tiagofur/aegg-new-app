import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  FolderOpen as OpenIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useWorks, useCreateWork, useUpdateWork, useDeleteWork } from '../hooks/useDataHooks';
import { useWorkState } from '../hooks/useWorkState';
import { Work } from '../services/apiService';

interface WorkManagerProps {
  open: boolean;
  onClose: () => void;
  onLoadWork?: (work: Work) => void;
  currentWorkData?: {
    name?: string;
    description?: string;
    data?: Record<string, unknown>;
  };
}

const WorkManager: React.FC<WorkManagerProps> = ({
  open,
  onClose,
  onLoadWork,
  currentWorkData,
}) => {
  const [mode, setMode] = useState<'list' | 'save'>('list');
  const [saveForm, setSaveForm] = useState({
    name: '',
    description: '',
  });
  const [editingWork, setEditingWork] = useState<Work | null>(null);

  // Hook para gestionar el estado de los reportes
  const workState = useWorkState();

  const {
    data: worksData,
    isLoading,
    error,
  } = useWorks({
    enabled: open,
  });

  const createWorkMutation = useCreateWork({
    onSuccess: (work) => {
      console.log('Trabajo guardado:', work);
      setMode('list');
      resetSaveForm();
    },
    onError: (error) => {
      console.error('Error guardando trabajo:', error);
    },
  });

  const updateWorkMutation = useUpdateWork({
    onSuccess: (work) => {
      console.log('Trabajo actualizado:', work);
      setEditingWork(null);
      resetSaveForm();
    },
  });

  const deleteWorkMutation = useDeleteWork({
    onSuccess: () => {
      console.log('Trabajo eliminado');
    },
  });

  const resetSaveForm = () => {
    setSaveForm({ name: '', description: '' });
    setEditingWork(null);
  };

  // Prellenar el formulario con datos actuales
  useEffect(() => {
    if (mode === 'save' && currentWorkData?.name) {
      setSaveForm({
        name: currentWorkData.name,
        description: currentWorkData.description || '',
      });
    }
  }, [mode, currentWorkData]);

  const handleSaveWork = async () => {
    if (!saveForm.name.trim()) return;

    // Capturar el estado actual de todos los reportes
    const currentReportData = workState.captureCurrentState();
    const stateSummary = workState.getStateSummary();

    const workData: Partial<Work> = {
      name: saveForm.name.trim(),
      description:
        saveForm.description.trim() ||
        `Trabajo guardado el ${new Date().toLocaleString()}. Incluye ${
          stateSummary.reportCount
        } reportes.`,
      status: 'in-progress',
      tags: stateSummary.fileNames.filter(Boolean) as string[],
    };

    try {
      if (editingWork) {
        await updateWorkMutation.mutateAsync({
          id: editingWork.id,
          data: workData,
        });
        // TODO: Actualizar reporte asociado con currentReportData
      } else {
        await createWorkMutation.mutateAsync(workData);
        // TODO: Crear reporte asociado con currentReportData
        console.log('Datos de reporte capturados:', {
          reportData: currentReportData,
          summary: stateSummary,
        });
      }
    } catch (error) {
      console.error('Error en operación:', error);
    }
  };

  const handleLoadWork = (work: Work) => {
    // TODO: Obtener datos del reporte asociado y restaurar estado
    // Por ahora, solo mostramos información y delegamos al callback
    console.log('Cargando trabajo:', work);
    console.log('Tags (archivos):', work.tags);

    if (onLoadWork) {
      onLoadWork(work);
    }

    // TODO: Implementar restauración del estado de reportes
    // workState.restoreState(reportData);

    onClose();
  };

  const handleDeleteWork = async (work: Work) => {
    if (window.confirm(`¿Estás seguro de eliminar el trabajo "${work.name}"?`)) {
      try {
        await deleteWorkMutation.mutateAsync(work.id);
      } catch (error) {
        console.error('Error eliminando trabajo:', error);
      }
    }
  };

  const handleEditWork = (work: Work) => {
    setEditingWork(work);
    setSaveForm({
      name: work.name,
      description: work.description || '',
    });
    setMode('save');
  };

  const handleClose = () => {
    resetSaveForm();
    setMode('list');
    onClose();
  };

  const renderWorkList = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error">Error cargando trabajos: {error.message}</Alert>;
    }

    const works = worksData?.data || [];

    if (works.length === 0) {
      return (
        <Box textAlign="center" p={3}>
          <Typography variant="body2" color="textSecondary">
            No hay trabajos guardados
          </Typography>
        </Box>
      );
    }

    return (
      <List>
        {works.map((work) => (
          <ListItem key={work.id} divider>
            <Box display="flex" alignItems="center" mr={1}>
              <AssignmentIcon color="primary" />
            </Box>
            <ListItemText
              primary={work.name}
              secondary={
                <Box>
                  {work.description && (
                    <Typography variant="body2" color="textSecondary">
                      {work.description}
                    </Typography>
                  )}
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <Chip
                      label={work.status}
                      size="small"
                      color={
                        work.status === 'completed'
                          ? 'success'
                          : work.status === 'in-progress'
                          ? 'primary'
                          : 'default'
                      }
                    />
                    <Typography variant="caption" color="textSecondary">
                      <ScheduleIcon fontSize="small" style={{ marginRight: 4 }} />
                      {new Date(work.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <Box display="flex" gap={0.5}>
                <IconButton
                  size="small"
                  onClick={() => handleLoadWork(work)}
                  title="Cargar trabajo"
                >
                  <OpenIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleEditWork(work)}
                  title="Editar trabajo"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteWork(work)}
                  title="Eliminar trabajo"
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    );
  };

  const renderSaveForm = () => {
    const stateSummary = workState.getStateSummary();

    return (
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveWork();
        }}
      >
        <TextField
          fullWidth
          label="Nombre del trabajo"
          value={saveForm.name}
          onChange={(e) => setSaveForm((prev) => ({ ...prev, name: e.target.value }))}
          margin="normal"
          required
          autoFocus
        />
        <TextField
          fullWidth
          label="Descripción (opcional)"
          value={saveForm.description}
          onChange={(e) => setSaveForm((prev) => ({ ...prev, description: e.target.value }))}
          margin="normal"
          multiline
          rows={3}
        />

        {/* Información del estado actual */}
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Estado actual a guardar:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • {stateSummary.reportCount} reporte(s) con datos
          </Typography>
          {stateSummary.fileNames.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              • Archivos: {stateSummary.fileNames.filter(Boolean).join(', ')}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            • Mes seleccionado:{' '}
            {new Date(2024, stateSummary.selectedMonth).toLocaleString('es-ES', { month: 'long' })}
          </Typography>

          {!stateSummary.hasData && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              No hay datos de reportes para guardar. Asegúrate de cargar archivos Excel antes de
              guardar.
            </Alert>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            {mode === 'save'
              ? editingWork
                ? 'Editar Trabajo'
                : 'Guardar Trabajo'
              : 'Mis Trabajos'}
          </Typography>
          {mode === 'list' && (
            <Button variant="outlined" startIcon={<SaveIcon />} onClick={() => setMode('save')}>
              Guardar Actual
            </Button>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>{mode === 'list' ? renderWorkList() : renderSaveForm()}</DialogContent>

      <Divider />

      <DialogActions>
        {mode === 'save' ? (
          <>
            <Button onClick={() => setMode('list')}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={handleSaveWork}
              disabled={
                !saveForm.name.trim() ||
                createWorkMutation.isPending ||
                updateWorkMutation.isPending
              }
              startIcon={
                createWorkMutation.isPending || updateWorkMutation.isPending ? (
                  <CircularProgress size={16} />
                ) : (
                  <SaveIcon />
                )
              }
            >
              {editingWork ? 'Actualizar' : 'Guardar'}
            </Button>
          </>
        ) : (
          <Button onClick={handleClose}>Cerrar</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WorkManager;
