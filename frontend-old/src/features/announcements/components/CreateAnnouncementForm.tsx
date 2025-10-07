import React, { useState } from 'react';
import { useAppDispatch } from '@store/hooks';
import { createAnnouncement } from '@features/announcements/redux/announcementsSlice';
import { Stack, TextField, Button, MenuItem, Alert } from '@mui/material';

const CreateAnnouncementForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [level, setLevel] = useState<'info' | 'urgent'>('info');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; body?: string; endDate?: string }>({});
  const [submitError, setSubmitError] = useState<string>('');

  const validateForm = () => {
    const newErrors: { title?: string; body?: string; endDate?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'El título es requerido';
    } else if (title.trim().length < 3) {
      newErrors.title = 'El título debe tener al menos 3 caracteres';
    } else if (title.trim().length > 100) {
      newErrors.title = 'El título no puede exceder 100 caracteres';
    }

    if (!body.trim()) {
      newErrors.body = 'El mensaje es requerido';
    } else if (body.trim().length < 10) {
      newErrors.body = 'El mensaje debe tener al menos 10 caracteres';
    } else if (body.trim().length > 1000) {
      newErrors.body = 'El mensaje no puede exceder 1000 caracteres';
    }

    if (!endDate) {
      newErrors.endDate = 'La fecha final es obligatoria';
    } else {
      const selectedDate = new Date(endDate + 'T23:59:59');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.endDate = 'La fecha de expiración no puede ser en el pasado';
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
        createAnnouncement({ title: title.trim(), body: body.trim(), level, expiresAt: endDate })
      ).unwrap();
      setTitle('');
      setBody('');
      setLevel('info');
      setEndDate('');
      setErrors({});
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear el comunicado';
      setSubmitError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <Stack spacing={2} sx={{ mt: 1 }}>
        {submitError && <Alert severity="error">{submitError}</Alert>}
        <TextField
          size="small"
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={!!errors.title}
          helperText={errors.title}
          required
        />
        <TextField
          size="small"
          label="Mensaje"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          error={!!errors.body}
          helperText={errors.body}
          required
          multiline
          rows={3}
        />
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <TextField
            size="small"
            label="Fecha final"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            error={!!errors.endDate}
            helperText={errors.endDate}
            required
            InputLabelProps={{ shrink: true }}
            sx={{ flex: 1 }}
          />
          <TextField
            size="small"
            select
            label="Nivel"
            value={level}
            onChange={(e) => setLevel(e.target.value as 'info' | 'urgent')}
            sx={{ minWidth: 120, maxWidth: 160 }}
          >
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="urgent">Urgente</MenuItem>
          </TextField>
        </Stack>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Publicar'}
        </Button>
      </Stack>
    </form>
  );
};

export default CreateAnnouncementForm;
