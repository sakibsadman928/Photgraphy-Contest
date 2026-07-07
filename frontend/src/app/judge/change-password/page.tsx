"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/authSlice";
import { User } from "@/types";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import RequireRole from "@/components/RequireRole";

function ChangePasswordForm() {
  const user = useAppSelector((s) => s.auth.user)!;
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.patch("/auth/change-password", { currentPassword, newPassword });
      dispatch(setUser({ ...user, mustChangePassword: false }));
      router.push("/judge/dashboard");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-3xl text-ink">Set your password</h1>
      <p className="mt-2 text-sm text-ink-muted">
        For security, you need to replace the temporary password the admin gave you before continuing.
      </p>
      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="currentPassword"
            label="Temporary password"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            id="newPassword"
            label="New password"
            type="password"
            required
            minLength={8}
            hint="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {error && <p className="text-sm text-accent-text">{error}</p>}
          <Button type="submit" loading={loading} className="mt-2 w-full">
            Set password
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function JudgeChangePasswordPage() {
  return (
    <RequireRole allow={["judge"]}>
      <ChangePasswordForm />
    </RequireRole>
  );
}
