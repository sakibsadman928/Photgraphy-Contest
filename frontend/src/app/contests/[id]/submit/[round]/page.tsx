"use client";

import { useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api";
import { Input, Textarea } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import RequireRole from "@/components/RequireRole";

function SubmissionForm() {
  const { id, round } = useParams<{ id: string; round: string }>();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Choose a photo to upload.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("title", title);
      formData.append("description", description);
      await api.postForm(`/contests/${id}/submissions/${round}`, formData);
      router.push(`/contests/${id}`);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Could not submit your photo.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-3xl text-ink">
        Submit your {round === "final" ? "Final" : "Round 1"} photo
      </h1>
      <p className="mt-2 text-sm text-accent-text">
        This is a one-shot upload — once submitted, it can't be edited or
        replaced.
      </p>

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Photo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
              className="mt-1.5 block w-full text-sm text-ink-muted file:mr-4 file:rounded-xl file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-accent-hover"
            />
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Preview of your upload"
                className="mt-4 max-h-80 w-full rounded-xl border border-hairline object-contain"
              />
            )}
          </div>

          <Input
            id="title"
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            id="description"
            label="Description (optional)"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {error && <p className="text-sm text-accent-text">{error}</p>}
          <Button type="submit" loading={loading} className="mt-2 w-full">
            Lock in submission
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function SubmitPage() {
  return (
    <RequireRole allow={["participant"]}>
      <SubmissionForm />
    </RequireRole>
  );
}
