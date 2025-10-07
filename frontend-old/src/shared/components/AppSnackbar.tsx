import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { RootState, AppDispatch } from '../../store/index';
import { hideNotification } from '../redux/notificationSlice';

const AppSnackbar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { open, message, severity } = useSelector(
    (state: RootState) => state.notification
  );

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(hideNotification());
  };

  const alertSeverity = severity || 'info';

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity={alertSeverity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AppSnackbar;
