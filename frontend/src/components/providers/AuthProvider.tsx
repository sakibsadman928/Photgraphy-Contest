"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setUser, clearUser } from "@/store/authSlice";
import { api, ApiClientError } from "@/lib/api";
import { User } from "@/types";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;

    api
      .get<{ user: User }>("/auth/me")
      .then((data) => {
        if (!cancelled) dispatch(setUser(data.user));
      })
      .catch((err) => {
        // 401 just means "not logged in" — not an error worth surfacing.
        if (!cancelled) {
          if (!(err instanceof ApiClientError) || err.statusCode !== 401) {
            console.error("Failed to load session:", err);
          }
          dispatch(clearUser());
        }
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return <>{children}</>;
}
