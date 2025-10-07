import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  fetchAnnouncements,
  deleteAnnouncement,
  AnnouncementItem,
} from '@features/announcements/redux/announcementsSlice';
import { Box, Typography, Chip, Stack, Skeleton, IconButton, Alert, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EditAnnouncementForm from './EditAnnouncementForm';

export const AnnouncementsList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, status, error } = useAppSelector((s) => s.announcements);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);

  // Función helper para formatear fechas de manera consistente
  // Unifica el formateo de fechas para que coincida con el calendario y tareas
  const formatAnnouncementDate = (dateStr: string) => {
    try {
      // Si es solo fecha YYYY-MM-DD, crear fecha local
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString(
          'es-ES'
        );
      }
      // Si tiene formato ISO completo (YYYY-MM-DDTHH:mm:ss.sssZ), extraer solo la fecha
      if (dateStr.includes('T')) {
        const dateOnly = dateStr.split('T')[0];
        const [year, month, day] = dateOnly.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString(
          'es-ES'
        );
      }
      // Fallback: intentar parsear directamente
      return new Date(dateStr).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  };

  useEffect(() => {
    dispatch(fetchAnnouncements());
  }, [dispatch]);

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    // Comparar fechas string directamente para evitar problemas de zona horaria
    const today = new Date();
    const todayStr =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0');
    return expiresAt < todayStr;
  };

  const isExpiringSoon = (expiresAt?: string) => {
    if (!expiresAt) return false;
    const today = new Date();
    const todayStr =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0');
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const threeDaysStr =
      threeDaysFromNow.getFullYear() +
      '-' +
      String(threeDaysFromNow.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(threeDaysFromNow.getDate()).padStart(2, '0');
    return expiresAt <= threeDaysStr && expiresAt > todayStr;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comunicado?')) return;
    dispatch(deleteAnnouncement(id));
  };

  const handleRetry = () => {
    dispatch(fetchAnnouncements());
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
          : `Error al cargar comunicados: ${error}`}
      </Alert>
    );
  }

  if (status === 'loading') {
    return (
      <Stack spacing={1}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Box
            key={i}
            sx={{
              p: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Skeleton variant="text" width="60%" height={20} />
                <Box display="flex" gap={0.5}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="circular" width={24} height={24} />
                </Box>
              </Box>
              <Skeleton variant="text" width="40%" height={16} />
              <Skeleton variant="text" width="100%" height={16} />
              <Skeleton variant="text" width="80%" height={16} />
              <Box display="flex" gap={0.5} mt={0.5}>
                <Skeleton variant="rounded" width={60} height={20} />
                <Skeleton variant="rounded" width={80} height={20} />
              </Box>
            </Stack>
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
        <Typography variant="body2">📢 No hay comunicados recientes</Typography>
        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
          Los comunicados aparecerán aquí cuando se publiquen
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Stack spacing={1}>
        {items.map((a: AnnouncementItem) => {
          const expired = isExpired(a.expiresAt);
          const expiringSoon = isExpiringSoon(a.expiresAt);

          return (
            <Box
              key={a._id}
              sx={{
                p: 1,
                borderRadius: 1,
                bgcolor: expired
                  ? 'grey.100'
                  : a.level === 'urgent'
                  ? 'error.light'
                  : 'background.paper',
                border: '1px solid',
                borderColor: expired ? 'grey.400' : a.level === 'urgent' ? 'error.main' : 'divider',
                opacity: expired ? 0.7 : 1,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" fontWeight={600}>
                  {a.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {expired && <Chip size="small" color="default" label="Expirado" />}
                  {!expired && expiringSoon && (
                    <Chip size="small" color="warning" label="Por expirar" />
                  )}
                  {a.level === 'urgent' && <Chip size="small" color="error" label="Urgente" />}
                  <IconButton size="small" onClick={() => setEditingAnnouncement(a)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(a._id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Publicado: {formatAnnouncementDate(a.publishedAt)}
                {a.expiresAt && (
                  <>
                    {' • '}
                    <span
                      style={{
                        fontWeight: 500,
                        color: expired ? '#d32f2f' : expiringSoon ? '#ed6c02' : 'inherit',
                      }}
                    >
                      Expira: {formatAnnouncementDate(a.expiresAt)}
                    </span>
                  </>
                )}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }} noWrap>
                {a.body}
              </Typography>
            </Box>
          );
        })}
      </Stack>

      {editingAnnouncement && (
        <EditAnnouncementForm
          open={!!editingAnnouncement}
          onClose={() => setEditingAnnouncement(null)}
          announcement={editingAnnouncement}
        />
      )}
    </>
  );
};

export default AnnouncementsList;
