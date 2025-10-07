import React, { useState } from 'react';
import { useAppDispatch } from '@store/hooks';
import {
  updateAnnouncement,
  AnnouncementItem,
} from '@features/announcements/redux/announcementsSlice';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  MenuItem,
} from '@mui/material';

interface EditAnnouncementFormProps {
  open: boolean;
  onClose: () => void;
  announcement: AnnouncementItem;
}

const EditAnnouncementForm: React.FC<EditAnnouncementFormProps> = ({
  open,
  onClose,
  announcement,
}) => {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState(announcement.title);
  const [body, setBody] = useState(announcement.body);
  const [level, setLevel] = useState<'info' | 'urgent'>(announcement.level);
  const [endDate, setEndDate] = useState(
    announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().split('T')[0] : ''
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !endDate) return;

    setSubmitting(true);
    try {
      await dispatch(
        updateAnnouncement({
          id: announcement._id,
          title: title.trim(),
          body: body.trim(),
          level,
          expiresAt: endDate,
        })
      ).unwrap();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setTitle(announcement.title);
      setBody(announcement.body);
      setLevel(announcement.level);
      setEndDate(
        announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().split('T')[0] : ''
      );
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Editar Comunicado</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Título"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Mensaje"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              multiline
              rows={4}
              fullWidth
            />
            <TextField
              label="Fecha final"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              select
              label="Nivel"
              value={level}
              onChange={(e) => setLevel(e.target.value as 'info' | 'urgent')}
              sx={{ maxWidth: 160 }}
            >
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="urgent">Urgente</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditAnnouncementForm;
