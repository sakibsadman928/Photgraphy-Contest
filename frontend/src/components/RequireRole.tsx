"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { UserRole } from "@/types";

/**
 * Gates a page/layout to specific roles. Middleware (see middleware.ts)
 * already redirects fully anonymous visitors away from protected paths
 * using the presence of the auth cookie; this component handles the
 * finer-grained "logged in, but wrong role" case once the session is known.
 */
export default function RequireRole({
  allow,
  children,
}: {
  allow: UserRole[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user && !allow.includes(user.role)) {
      router.replace("/");
    }
  }, [loading, isAuthenticated, user, allow, router]);

  if (loading || !isAuthenticated || (user && !allow.includes(user.role))) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-ink-muted font-mono text-sm">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
