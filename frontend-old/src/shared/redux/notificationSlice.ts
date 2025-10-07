import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AlertColor } from '@mui/material/Alert';

interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

const initialState: NotificationState = {
  open: false,
  message: '',
  severity: 'info',
};

const notificationReducer = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    showNotification(state, action: PayloadAction<{ message: string; severity: AlertColor }>) {
      state.open = true;
      state.message = action.payload.message;
      state.severity = action.payload.severity;
    },
    hideNotification(state) {
      state.open = false;
    },
  },
});

export const { showNotification, hideNotification } = notificationReducer.actions;
export default notificationReducer.reducer;
