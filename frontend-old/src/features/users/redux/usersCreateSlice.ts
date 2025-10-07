import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "../../../config/api";
import { CreateUserFormData } from "../components/CreateUserForm";
import { UserWithId } from "../../../shared/types/user";

interface CreateUserState {
  isCreating: boolean;
  error: string | null;
  success: boolean;
}

const initialState: CreateUserState = {
  isCreating: false,
  error: null,
  success: false,
};

// Thunk para crear un usuario
export const createUser = createAsyncThunk<
  UserWithId,
  CreateUserFormData,
  { rejectValue: string }
>("users/create", async (userData, thunkAPI) => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return thunkAPI.rejectWithValue("No se encontró token de autenticación.");
    }
    const rawUser = await apiRequest("/users/create", "POST", userData, token) as any;
    return { id: rawUser._id, name: rawUser.name, email: rawUser.email, role: rawUser.role };
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Error al crear usuario.");
  }
});

const usersCreateSlice = createSlice({
  name: "usersCreate",
  initialState,
  reducers: {
    resetCreateUserState: (state) => {
      state.isCreating = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createUser.pending, (state) => {
        state.isCreating = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createUser.fulfilled, (state) => {
        state.isCreating = false;
        state.success = true;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload || "Error desconocido.";
      });
  },
});

export const { resetCreateUserState } = usersCreateSlice.actions;
export default usersCreateSlice.reducer;