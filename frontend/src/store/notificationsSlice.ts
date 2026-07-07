import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppNotification } from "@/types";

interface NotificationsState {
  unreadCount: number;
  notifications: AppNotification[];
}

const initialState: NotificationsState = {
  unreadCount: 0,
  notifications: [],
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications(
      state,
      action: PayloadAction<{ notifications: AppNotification[]; unreadCount: number }>
    ) {
      state.notifications = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
    },
    markAllReadLocally(state) {
      state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
      state.unreadCount = 0;
    },
  },
});

export const { setNotifications, markAllReadLocally } = notificationsSlice.actions;
export default notificationsSlice.reducer;
