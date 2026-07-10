"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import RequireRole from "@/components/RequireRole";
import { Plus, Trash2 } from "lucide-react";

interface Judge {
  _id: string;
  name: string;
  email: string;
}

function CreateContestForm() {
  const router = useRouter();
  const [judges, setJudges] = useState<Judge[]>([]);
  const [selectedJudgeIds, setSelectedJudgeIds] = useState<string[]>([]);
  const [criteria, setCriteria] = useState([{ name: "", maxPoints: 20 }]);
  const [form, setForm] = useState({
    title: "",
    theme: "",
    registrationDeadline: "",
    submissionDeadline: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<{ judges: Judge[] }>("/judges").then((data) => setJudges(data.judges));
  }, []);

  const toggleJudge = (id: string) => {
    setSelectedJudgeIds((prev) => (prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]));
  };

  const updateCriterion = (i: number, field: "name" | "maxPoints", value: string) => {
    setCriteria((prev) =>
      prev.map((c, idx) => (idx === i ? { ...c, [field]: field === "maxPoints" ? Number(value) : value } : c))
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (criteria.some((c) => !c.name.trim())) {
      setError("Every scoring criterion needs a name.");
      return;
    }
    if (selectedJudgeIds.length === 0) {
      setError("Assign at least one judge.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.post<{ contest: { _id: string } }>("/contests", {
        ...form,
        registrationDeadline: new Date(form.registrationDeadline).toISOString(),
        submissionDeadline: new Date(form.submissionDeadline).toISOString(),
        scoringCriteria: criteria,
        judgeIds: selectedJudgeIds,
      });
      router.push(`/admin/contests/${data.contest._id}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not create contest.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-ink">Create a contest</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <Input
            id="title"
            label="Title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            id="theme"
            label="Theme"
            required
            value={form.theme}
            onChange={(e) => setForm({ ...form, theme: e.target.value })}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="registrationDeadline"
              label="Registration deadline"
              type="datetime-local"
              required
              value={form.registrationDeadline}
              onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
            />
            <Input
              id="submissionDeadline"
              label="Submission deadline"
              type="datetime-local"
              required
              hint="Must be after the registration deadline"
              value={form.submissionDeadline}
              onChange={(e) => setForm({ ...form, submissionDeadline: e.target.value })}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-ink-muted">Scoring criteria</h2>
            <button
              type="button"
              onClick={() => setCriteria([...criteria, { name: "", maxPoints: 20 }])}
              className="flex items-center gap-1 text-sm text-accent-text hover:underline"
            >
              <Plus size={14} /> Add criterion
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {criteria.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  placeholder="Criterion name (e.g. Composition)"
                  value={c.name}
                  onChange={(e) => updateCriterion(i, "name", e.target.value)}
                  className="flex-1 rounded-xl border border-hairline px-3 py-2 text-sm focus:outline-none focus:border-ink"
                />
                <input
                  type="number"
                  min={1}
                  value={c.maxPoints}
                  onChange={(e) => updateCriterion(i, "maxPoints", e.target.value)}
                  className="w-24 rounded-xl border border-hairline px-3 py-2 text-sm focus:outline-none focus:border-ink"
                />
                <span className="text-xs text-ink-muted">pts</span>
                {criteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setCriteria(criteria.filter((_, idx) => idx !== i))}
                    className="text-ink-muted hover:text-accent-text"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-sm font-medium uppercase tracking-wide text-ink-muted">Judges</h2>
          {judges.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              No judges yet — create one first from the Judges page.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {judges.map((j) => (
                <label key={j._id} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedJudgeIds.includes(j._id)}
                    onChange={() => toggleJudge(j._id)}
                    className="accent-ink"
                  />
                  {j.name} <span className="text-ink-muted">({j.email})</span>
                </label>
              ))}
            </div>
          )}
        </Card>

        {error && <p className="text-sm text-accent-text">{error}</p>}
        <Button type="submit" loading={loading}>
          Create contest
        </Button>
      </form>
    </div>
  );
}

export default function NewContestPage() {
  return (
    <RequireRole allow={["admin"]}>
      <CreateContestForm />
    </RequireRole>
  );
}
