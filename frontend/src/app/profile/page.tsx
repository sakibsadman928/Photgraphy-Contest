"use client";

import { useState, FormEvent } from "react";
import { api, ApiClientError } from "@/lib/api";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/authSlice";
import { User } from "@/types";
import { Input, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import RequireRole from "@/components/RequireRole";

function ProfileForm() {
  const user = useAppSelector((s) => s.auth.user)!;
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio ?? "",
    country: user.country ?? "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      const data = await api.patch<{ user: User }>("/auth/profile", form);
      dispatch(setUser(data.user));
      setStatus("saved");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save changes.");
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-3xl text-ink">Your profile</h1>
      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="name"
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input value={user.email} disabled label="Email" hint="Email cannot be changed" />
          <Input
            id="country"
            label="Country"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <Textarea
            id="bio"
            label="Bio"
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          {error && <p className="text-sm text-accent-text">{error}</p>}
          {status === "saved" && <p className="text-sm text-teal">Saved.</p>}
          <Button type="submit" loading={status === "saving"} className="mt-2 w-full">
            Save changes
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireRole allow={["participant"]}>
      <ProfileForm />
    </RequireRole>
  );
}
