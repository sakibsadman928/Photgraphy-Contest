import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  role: User["role"] | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  role: null,
  isAuthenticated: false,
  // Starts true: we don't know auth state until the initial /auth/me call
  // (made by AuthProvider) resolves. Route guards wait on this.
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.role = action.payload.role;
      state.isAuthenticated = true;
      state.loading = false;
    },
    clearUser(state) {
      state.user = null;
      state.role = null;
      state.isAuthenticated = false;
      state.loading = false;
    },
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setUser, clearUser, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;
