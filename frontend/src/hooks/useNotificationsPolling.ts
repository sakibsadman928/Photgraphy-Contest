"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setNotifications } from "@/store/notificationsSlice";
import { api } from "@/lib/api";
import { AppNotification } from "@/types";

const POLL_INTERVAL_MS = 20_000;

/**
 * Polls the notifications endpoint on an interval while the user is
 * authenticated. Kept simple (polling, not WebSockets) per the project's
 * deliberate complexity/tradeoff decision.
 */
export function useNotificationsPolling() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const fetchNotifications = () => {
      api
        .get<{ notifications: AppNotification[]; unreadCount: number }>("/notifications")
        .then((data) => {
          if (!cancelled) dispatch(setNotifications(data));
        })
        .catch(() => undefined); // transient poll failures shouldn't disrupt the UI
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated, dispatch]);
}
