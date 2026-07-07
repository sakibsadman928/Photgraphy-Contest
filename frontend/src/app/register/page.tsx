"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/authSlice";
import { User } from "@/types";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", country: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post<{ user: User }>("/auth/register", form);
      dispatch(setUser(data.user));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-3xl text-ink">Create an account</h1>
      <p className="mt-2 text-sm text-ink-muted">Register as a participant to enter contests.</p>
      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            id="name"
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            id="email"
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            id="password"
            label="Password"
            type="password"
            required
            minLength={8}
            hint="At least 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Input
            id="country"
            label="Country (optional)"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          {error && <p className="text-sm text-accent">{error}</p>}
          <Button type="submit" loading={loading} className="mt-2 w-full">
            Create account
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
