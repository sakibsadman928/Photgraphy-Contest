"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearUser } from "@/store/authSlice";
import { api } from "@/lib/api";
import NotificationBell from "./NotificationBell";
import { useNotificationsPolling } from "@/hooks/useNotificationsPolling";

export default function Nav() {
  useNotificationsPolling();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = async () => {
    await api.post("/auth/logout").catch(() => undefined);
    dispatch(clearUser());
    router.push("/");
  };

  const dashboardHref =
    user?.role === "admin" ? "/admin/dashboard" : user?.role === "judge" ? "/judge/dashboard" : "/dashboard";

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display font-extrabold text-lg tracking-tight text-ink">
          Contact <span className="text-accent-text">Sheet</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/contests" className="text-sm font-medium text-ink hover:text-accent-text transition-colors">
            Contests
          </Link>

          {isAuthenticated ? (
            <>
              <Link href={dashboardHref} className="text-sm font-medium text-ink hover:text-accent-text transition-colors">
                Dashboard
              </Link>
              {user?.role === "participant" && (
                <Link href="/profile" className="text-sm font-medium text-ink hover:text-accent-text transition-colors">
                  Profile
                </Link>
              )}
              {user?.role === "admin" && (
                <Link href="/admin/judges" className="text-sm font-medium text-ink hover:text-accent-text transition-colors">
                  Judges
                </Link>
              )}
              <NotificationBell />
              <button onClick={handleLogout} className="text-sm text-ink-muted hover:text-accent-text transition-colors">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-ink hover:text-accent-text transition-colors">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-ink shadow-glow transition-transform hover:-translate-y-0.5 hover:bg-accent-hover"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
