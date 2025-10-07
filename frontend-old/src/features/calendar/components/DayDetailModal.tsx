import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Assignment as TaskIcon,
  Event as EventIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

import { TaskItem } from '@features/tasks/redux/tasksSlice';
import { AnnouncementItem } from '@features/announcements/redux/announcementsSlice';

interface DayDetailModalProps {
  open: boolean;
  onClose: () => void;
  day: number | null;
  month: number;
  year: number;
  tasks: TaskItem[];
  announcements: AnnouncementItem[];
}

const monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  open,
  onClose,
  day,
  month,
  year,
  tasks,
  announcements,
}) => {
  const [tab, setTab] = useState<'tareas' | 'comunicados'>('tareas');
  if (!day) return null;

  const dateStr = `${day} de ${monthNames[month - 1]} de ${year}`;
  const totalItems = tasks.length + announcements.length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarIcon color="primary" />
            <Typography variant="h6">{dateStr}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {totalItems === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              No hay tareas ni comunicados para este día
            </Typography>
          </Box>
        ) : (
          <Box>
            <Box display="flex" gap={2} mb={2}>
              <Button
                variant={tab === 'tareas' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => setTab('tareas')}
                size="small"
              >
                Tareas ({tasks.length})
              </Button>
              <Button
                variant={tab === 'comunicados' ? 'contained' : 'outlined'}
                color="error"
                onClick={() => setTab('comunicados')}
                size="small"
              >
                Comunicados ({announcements.length})
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {tab === 'tareas' ? (
              <List dense>
                {tasks.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No hay tareas para este día" />
                  </ListItem>
                ) : (
                  tasks.map((task) => (
                    <ListItem key={task._id}>
                      <ListItemIcon>
                        <TaskIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={
                          task.dueDate
                            ? `Para: ${new Date(task.dueDate).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}`
                            : ''
                        }
                      />
                      <Chip
                        label={task.priority}
                        size="small"
                        color={
                          task.priority === 'high'
                            ? 'error'
                            : task.priority === 'normal'
                            ? 'warning'
                            : 'default'
                        }
                      />
                    </ListItem>
                  ))
                )}
              </List>
            ) : (
              <List dense>
                {announcements.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No hay comunicados para este día" />
                  </ListItem>
                ) : (
                  announcements.map((a) => (
                    <ListItem key={a._id}>
                      <ListItemIcon>
                        <EventIcon color="error" />
                      </ListItemIcon>
                      <ListItemText primary={a.title} secondary={a.body} />
                      <Chip
                        label={a.level === 'urgent' ? 'Urgente' : 'Info'}
                        size="small"
                        color={a.level === 'urgent' ? 'error' : 'info'}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
