import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiRequest } from "../../../config/api";
import { UserWithId } from "../../../shared/types/user";

interface UpdateUserState {
  isUpdating: boolean;
  updateUserError: string | null;
}

const initialState: UpdateUserState = {
  isUpdating: false,
  updateUserError: null,
};

// Thunk para actualizar un usuario
export const updateUser = createAsyncThunk<
  UserWithId,
  Partial<UserWithId> & { id: string },
  { rejectValue: string }
>("users/update", async (updatedUser, thunkAPI) => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return thunkAPI.rejectWithValue("No se encontró token de autenticación.");
    }
    const { id, ...data } = updatedUser;
    const rawUser = await apiRequest(`/users/${id}`, "PATCH", data, token) as any;
    return { id: rawUser._id, name: rawUser.name, email: rawUser.email, role: rawUser.role };
  } catch (error: any) {
    return thunkAPI.rejectWithValue(error.message || "Error al actualizar usuario.");
  }
});

const usersUpdateSlice = createSlice({
  name: "usersUpdate",
  initialState,
  reducers: {
    resetUpdateUserError: (state) => {
      state.updateUserError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateUser.pending, (state) => {
        state.isUpdating = true;
        state.updateUserError = null;
      })
      .addCase(updateUser.fulfilled, (state) => {
        state.isUpdating = false;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateUserError = action.payload || "Error desconocido.";
      });
  },
});

export const { resetUpdateUserError } = usersUpdateSlice.actions;
export default usersUpdateSlice.reducer;