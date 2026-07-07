"use client";

import { useEffect, useState, FormEvent } from "react";
import { api, ApiClientError } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import RequireRole from "@/components/RequireRole";

interface Judge {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

function JudgesContent() {
  const [judges, setJudges] = useState<Judge[] | null>(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; tempPassword: string } | null>(
    null
  );

  const load = () => api.get<{ judges: Judge[] }>("/judges").then((data) => setJudges(data.judges));

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post<{ judge: Judge; tempPassword: string }>("/judges", form);
      setCreatedCredentials({ email: data.judge.email, tempPassword: data.tempPassword });
      setForm({ name: "", email: "" });
      await load();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not create judge.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-ink">Judges</h1>

      <Card className="mt-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-ink-muted">Create a judge account</h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              id="name"
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <Input
              id="email"
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <Button type="submit" loading={loading}>
            Create
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-accent-text">{error}</p>}

        {createdCredentials && (
          <div className="mt-4 rounded-xl border border-teal/30 bg-teal-light px-4 py-3 text-sm text-teal">
            <p className="font-medium">Judge account created.</p>
            <p className="mt-1 font-mono text-xs text-ink">
              {createdCredentials.email} · temporary password: {createdCredentials.tempPassword}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Share this password with the judge directly — it won't be shown again. They'll be required to
              change it on first login.
            </p>
          </div>
        )}
      </Card>

      <div className="mt-8 flex flex-col gap-3">
        {judges === null && <p className="font-mono text-sm text-ink-muted">Loading…</p>}
        {judges?.map((j) => (
          <Card key={j._id} className="flex items-center justify-between">
            <div>
              <p className="text-ink">{j.name}</p>
              <p className="text-xs text-ink-muted">{j.email}</p>
            </div>
            <p className="font-mono text-xs text-ink-muted">
              Joined {new Date(j.createdAt).toLocaleDateString()}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminJudgesPage() {
  return (
    <RequireRole allow={["admin"]}>
      <JudgesContent />
    </RequireRole>
  );
}
