import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import { fetchCalendar, navigate } from '@features/calendar/redux/calendarSlice';
import { Box, IconButton, Typography, Skeleton, Stack, Divider } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { DayDetailModal } from './DayDetailModal';
import { AnnouncementItem } from '@features/announcements/redux/announcementsSlice';

const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function buildCells(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const startWeekDay = (first.getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(year, month, 0).getDate();
  const total = 42; // 6 weeks
  const cells: (number | null)[] = Array(total).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells[startWeekDay + d - 1] = d;
  }
  return cells;
}

export const MonthCalendar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { year, month, status } = useAppSelector((s) => s.calendar);
  const today = new Date();

  // State for day detail modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const tasks = useAppSelector((s) => s.tasks.items);
  const announcements = useAppSelector((s) => s.announcements.items);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchCalendar({ year, month }));
  }, [dispatch, status, year, month]);

  // Función para verificar si un comunicado está activo en una fecha específica
  const isAnnouncementActiveOnDate = (announcement: AnnouncementItem, dateStr: string) => {
    // Extraer fecha de publicación en formato YYYY-MM-DD
    const publishedDateStr = announcement.publishedAt.split('T')[0]; // Si viene con hora, tomar solo la fecha

    // Si no hay fecha de expiración, el comunicado está activo indefinidamente
    if (!announcement.expiresAt) {
      return dateStr >= publishedDateStr;
    }

    // Comparar strings directamente para evitar problemas de zona horaria
    return dateStr >= publishedDateStr && dateStr <= announcement.expiresAt;
  };

  // Función para extraer fecha YYYY-MM-DD de cualquier formato
  const extractDateString = (dateStr: string) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr; // Ya está en formato YYYY-MM-DD
    }
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0]; // Extraer fecha de formato ISO
    }
    // Si viene en otro formato, intentar convertir
    try {
      const date = new Date(dateStr);
      return (
        date.getFullYear() +
        '-' +
        String(date.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date.getDate()).padStart(2, '0')
      );
    } catch {
      return dateStr; // Devolver como está si no se puede parsear
    }
  };

  // Función para obtener la fecha en formato YYYY-MM-DD desde una fecha del calendario
  function getDateStringForCalendar(year: number, month: number, day: number) {
    return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
  }

  const cells = useMemo(() => buildCells(year, month), [year, month]);

  const prev = () => {
    let y = year,
      m = month - 1;
    if (m < 1) {
      m = 12;
      y--;
    }
    dispatch(navigate({ year: y, month: m }));
  };
  const next = () => {
    let y = year,
      m = month + 1;
    if (m > 12) {
      m = 1;
      y++;
    }
    dispatch(navigate({ year: y, month: m }));
  };

  const handleDayClick = (day: number, tasksCount: number, announcementsCount: number) => {
    if (tasksCount > 0 || announcementsCount > 0) {
      setSelectedDay(day);
      setModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedDay(null);
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <IconButton size="small" onClick={prev}>
          <ArrowBackIosNewIcon fontSize="inherit" />
        </IconButton>
        <Typography variant="subtitle2" fontWeight={600}>
          {new Date(year, month - 1).toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
        </Typography>
        <IconButton size="small" onClick={next}>
          <ArrowForwardIosIcon fontSize="inherit" />
        </IconButton>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
          mb: 0.5,
        }}
      >
        {dayNames.map((d) => (
          <Typography key={d} variant="caption" fontWeight={600} textAlign="center">
            {d}
          </Typography>
        ))}
      </Box>
      <Divider sx={{ mb: 1 }} />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
        }}
      >
        {cells.map((day, i) => {
          // Fecha del día de la celda en formato YYYY-MM-DD
          const cellDateStr = day ? getDateStringForCalendar(year, month, day) : '';

          // Para comparar con hoy, necesitamos la fecha de hoy en el mismo formato
          const todayStr = getDateStringForCalendar(
            today.getFullYear(),
            today.getMonth() + 1,
            today.getDate()
          );
          const isToday = cellDateStr === todayStr;

          // Calcular si hay tareas para el día comparando strings directamente
          const hasTasks =
            day &&
            tasks.some((t) => {
              if (!t.dueDate) return false;
              const taskDateStr = extractDateString(t.dueDate);
              const match = taskDateStr === cellDateStr;

              // Debug temporal - remover después
              if (cellDateStr === '2025-09-07' || cellDateStr === '2025-09-08') {
                console.log(`🔍 DEBUG: Día ${day} (${cellDateStr})`);
                console.log(`   Tarea: ${t.title}`);
                console.log(`   dueDate original: ${t.dueDate}`);
                console.log(`   dueDate extraída: ${taskDateStr}`);
                console.log(`   ¿Match?: ${match}`);
              }

              return match;
            });
          const hasAnnouncements =
            day && announcements.some((a) => isAnnouncementActiveOnDate(a, cellDateStr));
          return (
            <Box
              key={i}
              sx={{
                border: '1px solid',
                borderColor: isToday ? 'primary.main' : 'divider',
                borderRadius: 1,
                minHeight: 40, // Reduced from 70
                p: 0.2, // Reduced from 0.3
                bgcolor: isToday ? 'primary.light' : 'background.paper',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                cursor: day && (hasTasks || hasAnnouncements) ? 'pointer' : 'default',
                '&:hover':
                  day && (hasTasks || hasAnnouncements)
                    ? {
                        bgcolor: isToday ? 'primary.main' : 'action.hover',
                        transform: 'scale(1.02)',
                        transition: 'all 0.2s ease-in-out',
                      }
                    : {},
              }}
              onClick={() =>
                day &&
                (hasTasks || hasAnnouncements) &&
                handleDayClick(day, hasTasks ? 1 : 0, hasAnnouncements ? 1 : 0)
              }
            >
              {status === 'loading' && !day ? (
                <Skeleton variant="rectangular" width={50} height={40} />
              ) : day ? (
                <Stack spacing={0.4} alignItems="center" sx={{ width: '100%' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: isToday ? 700 : 400,
                      color: isToday ? 'common.white' : 'text.primary',
                    }}
                  >
                    {day}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 0.3,
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      minHeight: 10,
                    }}
                  >
                    {/* Punto azul para tareas */}
                    {hasTasks ? (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#1976d2', // Azul real
                          display: 'inline-block',
                        }}
                      />
                    ) : null}
                    {/* Punto rojo para comunicados */}
                    {hasAnnouncements ? (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'error.main',
                          display: 'inline-block',
                        }}
                      />
                    ) : null}
                  </Box>
                </Stack>
              ) : null}
            </Box>
          );
        })}
      </Box>

      {/* Day Detail Modal */}
      <DayDetailModal
        open={modalOpen}
        onClose={handleCloseModal}
        day={selectedDay}
        month={month}
        year={year}
        tasks={tasks.filter((t) => {
          if (!t.dueDate || !selectedDay) return false;
          const cellDateStr = getDateStringForCalendar(year, month, selectedDay);
          const taskDateStr = extractDateString(t.dueDate);
          return taskDateStr === cellDateStr;
        })}
        announcements={announcements.filter((a) => {
          if (!selectedDay) return false;
          const cellDateStr = getDateStringForCalendar(year, month, selectedDay);
          return isAnnouncementActiveOnDate(a, cellDateStr);
        })}
      />
    </Box>
  );
};

export default MonthCalendar;
