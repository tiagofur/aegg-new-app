import React from 'react';
import './HomePage.css';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { Box, Paper, Typography, Divider } from '@mui/material';
import AnnouncementsList from '@features/announcements/components/AnnouncementsList';
import CreateAnnouncementForm from '@features/announcements/components/CreateAnnouncementForm';
import AddTaskForm from '@features/tasks/components/AddTaskForm';
import TaskList from '@features/tasks/components/TaskList';

const HomePage: React.FC = () => {
  const user = useSelector((state: RootState) => state.authState.user);

  if (!user) {
    return <div>Cargando información del usuario...</div>;
  }

  return (
    <Box sx={{ width: '100%', px: { xs: 1, md: 2 }, py: { xs: 1, md: 2 } }}>
      <Typography
        variant="h5"
        fontWeight={600}
        gutterBottom
        sx={{
          px: 0.5,
          fontSize: { xs: '1.25rem', md: '1.5rem' },
          mb: { xs: 2, md: 3 },
        }}
      >
        Bienvenido, {user.name}! 👋
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1.5, md: 2 },
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(12, 1fr)',
          },
          alignItems: 'stretch',
        }}
      >
        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6', lg: 'span 5' } }}>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 1.5, md: 2 },
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              minHeight: { xs: 380, md: 420 },
              transition: 'elevation 0.2s ease-in-out',
              '&:hover': {
                elevation: 4,
              },
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} color="primary.main">
              📢 Comunicados
            </Typography>
            <CreateAnnouncementForm />
            <Divider />
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
              <AnnouncementsList />
            </Box>
          </Paper>
        </Box>
        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 6', lg: 'span 7' } }}>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 1.5, md: 2 },
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: { xs: 380, md: 420 },
              transition: 'elevation 0.2s ease-in-out',
              '&:hover': {
                elevation: 4,
              },
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} color="primary.main" sx={{ mb: 1.5 }}>
              ✅ Tareas
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <AddTaskForm />
            </Box>
            <Box sx={{ mt: 1, flexGrow: 1, overflowY: 'auto' }}>
              <TaskList />
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
