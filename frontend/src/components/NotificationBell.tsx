"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { markAllReadLocally } from "@/store/notificationsSlice";
import { api } from "@/lib/api";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount } = useAppSelector((s) => s.notifications);
  const dispatch = useAppDispatch();

  const handleMarkAllRead = async () => {
    dispatch(markAllReadLocally());
    await api.patch("/notifications/read-all").catch(() => undefined);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="relative rounded-xl p-2 text-ink hover:bg-ink/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-semibold text-ink">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-hairline bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-accent-text hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-ink-muted">Nothing here yet.</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    className={`border-b border-hairline px-4 py-3 text-sm last:border-b-0 ${
                      n.read ? "text-ink-muted" : "text-ink"
                    }`}
                  >
                    <p>{n.message}</p>
                    <p className="mt-1 font-mono text-[11px] text-ink-muted">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
