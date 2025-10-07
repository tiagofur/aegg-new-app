import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiRequest } from "../../../config/api";
import { UserWithId } from "../../../shared/types/user";

interface FetchUsersState {
  users: UserWithId[];
  isLoading: boolean;
  error: string | null;
}

const initialState: FetchUsersState = {
  users: [],
  isLoading: false,
  error: null,
};

// Thunk para obtener usuarios
export const fetchUsers = createAsyncThunk<
  UserWithId[],
  void,
  { rejectValue: string }
>("users/fetchAll", async (_, thunkAPI) => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return thunkAPI.rejectWithValue("No se encontró token de autenticación.");
    }
    const rawUsers = await apiRequest("/users", "GET", undefined, token) as any[];
    return rawUsers.map((user: any) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }));
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Error al obtener usuarios.");
  }
});

const usersFetchSlice = createSlice({
  name: "usersFetch",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<UserWithId[]>) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Error desconocido.";
      });
  },
});

export default usersFetchSlice.reducer;