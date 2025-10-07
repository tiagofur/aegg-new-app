import React, { useState } from 'react';
import { useAppDispatch } from '@store/hooks';
import { createTask } from '../redux/tasksSlice';
import { Stack, TextField, Button, MenuItem, Alert, Divider } from '@mui/material';

export const AddTaskForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; dueDate?: string }>({});
  const [submitError, setSubmitError] = useState<string>('');

  const validateForm = () => {
    const newErrors: { title?: string; dueDate?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'El título de la tarea es requerido';
    } else if (title.trim().length < 3) {
      newErrors.title = 'El título debe tener al menos 3 caracteres';
    } else if (title.trim().length > 200) {
      newErrors.title = 'El título no puede exceder 200 caracteres';
    }

    if (dueDate) {
      const selectedDate = new Date(dueDate + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.dueDate = 'La fecha de vencimiento no puede ser en el pasado';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await dispatch(
        createTask({
          title: title.trim(),
          dueDate: dueDate || undefined,
          priority,
        })
      ).unwrap();
      setTitle('');
      setDueDate('');
      setPriority('normal');
      setErrors({});
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la tarea';
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {submitError && (
        <Alert severity="error" onClose={() => setSubmitError('')} sx={{ mb: 1 }}>
          {submitError}
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField
          size="small"
          label="Tarea"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={!!errors.title}
          helperText={errors.title}
          fullWidth
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            type="date"
            label="Vence"
            InputLabelProps={{ shrink: true }}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            error={!!errors.dueDate}
            helperText={errors.dueDate}
            sx={{ flex: 1, minWidth: 120 }}
          />
          <TextField
            size="small"
            select
            label="Prioridad"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            sx={{ minWidth: 110, flexShrink: 0 }}
          >
            <MenuItem value="low">Baja</MenuItem>
            <MenuItem value="normal">Normal</MenuItem>
            <MenuItem value="high">Alta</MenuItem>
          </TextField>
          <Button
            variant="contained"
            type="submit"
            disabled={submitting}
            sx={{ minWidth: 110, flexShrink: 0 }}
          >
            {submitting ? 'Agregando...' : 'Agregar'}
          </Button>
        </Stack>
        <Divider sx={{ mt: 2, mb: 1.5 }} />
      </Stack>
    </form>
  );
};

export default AddTaskForm;
