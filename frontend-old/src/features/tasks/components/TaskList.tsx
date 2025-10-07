import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { fetchTasks, toggleTaskDone, TaskItem } from '../redux/tasksSlice';
import {
  Checkbox,
  Chip,
  Stack,
  Skeleton,
  Typography,
  IconButton,
  Box,
  Alert,
  Button,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import EditTaskForm from './EditTaskForm';

export const TaskList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector((s) => s.tasks);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Función helper para formatear fechas de manera consistente
  const formatTaskDate = (dateStr: string) => {
    try {
      // Debug temporal - remover después
      console.log(`🔍 TaskList formatTaskDate input: "${dateStr}"`);

      // Si es solo fecha YYYY-MM-DD, crear fecha local
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-');
        const result = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        ).toLocaleDateString('es-ES');
        console.log(`   Solo fecha → ${result}`);
        return result;
      }
      // Si tiene formato ISO completo (YYYY-MM-DDTHH:mm:ss.sssZ), extraer solo la fecha
      if (dateStr.includes('T')) {
        const dateOnly = dateStr.split('T')[0];
        const [year, month, day] = dateOnly.split('-');
        const result = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        ).toLocaleDateString('es-ES');
        console.log(`   ISO → ${dateOnly} → ${result}`);
        return result;
      }
      // Fallback: intentar parsear directamente
      const result = new Date(dateStr).toLocaleDateString('es-ES');
      console.log(`   Fallback → ${result}`);
      return result;
    } catch (error) {
      console.log(`   Error: ${error}`);
      return 'Fecha inválida';
    }
  };

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  // Debug temporal - mostrar todas las tareas cargadas
  useEffect(() => {
    if (items.length > 0) {
      console.log('🔍 Tareas cargadas:');
      items.forEach((task, index) => {
        console.log(`  ${index + 1}. ${task.title}`);
        console.log(`     dueDate: ${task.dueDate}`);
        console.log(`     status: ${task.status}`);
      });
    }
  }, [items]);

  const toggle = (id: string, done: boolean) => {
    dispatch(toggleTaskDone({ id, done }));
  };

  const handleRetry = () => {
    dispatch(fetchTasks());
  };

  if (status === 'failed' && error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={handleRetry}>
            Reintentar
          </Button>
        }
      >
        {error === 'No se encontró token de autenticación'
          ? 'Sesión expirada. Por favor, inicia sesión nuevamente.'
          : error === 'Rejected'
          ? 'No se pudo conectar con el servidor. Verifica tu conexión.'
          : `Error al cargar tareas: ${error}`}
      </Alert>
    );
  }

  if (status === 'loading') {
    return (
      <Stack spacing={1}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              p: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Skeleton variant="circular" width={20} height={20} />
              <Box flexGrow={1}>
                <Skeleton variant="text" width="80%" height={20} />
                <Skeleton variant="text" width="60%" height={16} />
              </Box>
              <Box display="flex" gap={0.5}>
                <Skeleton variant="rounded" width={50} height={20} />
                <Skeleton variant="circular" width={24} height={24} />
              </Box>
            </Box>
          </Box>
        ))}
      </Stack>
    );
  }

  if (!items.length && status === 'succeeded') {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 3,
          color: 'text.secondary',
          fontStyle: 'italic',
        }}
      >
        <Typography variant="body2">✅ No hay tareas pendientes</Typography>
        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
          ¡Excelente! No tienes tareas por completar
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Stack spacing={1}>
        {items.map((t: TaskItem) => (
          <Box
            key={t._id}
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor:
                t.status === 'done'
                  ? 'grey.100'
                  : t.priority === 'high'
                  ? 'error.light'
                  : 'background.paper',
              border: '1px solid',
              borderColor:
                t.status === 'done' ? 'grey.400' : t.priority === 'high' ? 'error.main' : 'divider',
              opacity: t.status === 'done' ? 0.7 : 1,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Checkbox
                edge="start"
                checked={t.status === 'done'}
                onChange={(e) => toggle(t._id, e.target.checked)}
                sx={{ mr: 1 }}
              />
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={{
                  flex: 1,
                  textDecoration: t.status === 'done' ? 'line-through' : 'none',
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                }}
              >
                {t.title}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mt: 0.5, gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {t.dueDate ? formatTaskDate(t.dueDate) : ''}
              </Typography>
              {t.priority !== 'normal' && (
                <Chip
                  size="small"
                  label={t.priority}
                  color={t.priority === 'high' ? 'error' : 'default'}
                  sx={{ height: 20 }}
                />
              )}
              <Box sx={{ flex: 1 }} />
              <IconButton size="small" onClick={() => setEditingTask(t)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Stack>

      {editingTask && (
        <EditTaskForm
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
        />
      )}
    </>
  );
};

export default TaskList;
