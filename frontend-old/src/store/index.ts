import { configureStore } from "@reduxjs/toolkit";
import authLoginReducer from "../features/auth/redux/authLoginSlice";
import authSignUpReducer from "../features/auth/redux/authSignUpSlice";
import authStateReducer from "../features/auth/redux/authStateSlice";
import usersFetchReducer from "../features/users/redux/usersFetchSlice";
import usersCreateReducer from "../features/users/redux/usersCreateSlice";
import usersUpdateReducer from "../features/users/redux/usersUpdateSlice";
import usersDeleteReducer from '../features/users/redux/usersDeleteSlice';
import baseExcelReducer from "../features/reporte/redux/baseExcelSlice";
import reporte01Reducer from '../features/reporte/redux/reporteIngresosSlice';
import reporte02Reducer from '../features/reporte/redux/reporteIngresosAuxiliarSlice';
import reporte03Reducer from '../features/reporte/redux/reporteIngresosMiAdminSlice';
import notificationReducer from "../shared/redux/notificationSlice";
import announcementsReducer from '../features/announcements/redux/announcementsSlice';
import tasksReducer from '../features/tasks/redux/tasksSlice';
import calendarReducer from '../features/calendar/redux/calendarSlice';

const store = configureStore({
  reducer: {
    authLogin: authLoginReducer,
    authSignUp: authSignUpReducer,
    authState: authStateReducer,
    usersFetch: usersFetchReducer,
    usersCreate: usersCreateReducer,
    usersUpdate: usersUpdateReducer,
    usersDelete: usersDeleteReducer,
    notification: notificationReducer,
    baseExcel: baseExcelReducer,
    reporte01: reporte01Reducer,
    reporte02: reporte02Reducer,
    reporte03: reporte03Reducer,
    announcements: announcementsReducer,
    tasks: tasksReducer,
    calendar: calendarReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;