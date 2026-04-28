"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES } from "@/lib/constants";

type FeedbackItem = {
  id: number;
  feedbackId: string;
  title: string;
  description: string;
  category: string;
  otherCategory: string | null;
  status: string;
  likesCount: number;
  attachmentPath: string | null;
  tags: string[];
  createdAt: string;
  responseMessage: string | null;
  likedByCurrentSession: boolean;
};

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    if (sort) params.set("sort", sort);
    if (query) params.set("q", query);
    return params.toString();
  }, [category, status, sort, query]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/feedback${queryString ? `?${queryString}` : ""}`);
        const data = await response.json();
        if (!cancelled) {
          setItems(data.items ?? []);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load feedback feed.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await fetch("/api/feedback", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Failed to submit feedback.");
      setSubmitting(false);
      return;
    }

    setSuccess(`Feedback submitted successfully. Your ID: ${data.feedbackId}`);
    form.reset();
    setSubmitting(false);
    const responseReload = await fetch(`/api/feedback${queryString ? `?${queryString}` : ""}`);
    const dataReload = await responseReload.json();
    setItems(dataReload.items ?? []);
  }

  async function likeFeedback(id: number) {
    const response = await fetch(`/api/feedback/${id}/like`, { method: "POST" });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, likesCount: data.likesCount, likedByCurrentSession: true } : item,
      ),
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
      <header className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Anonymous Campus Feedback</h1>
            <p className="mt-2 text-sm text-slate-600">
              Submit anonymous campus concerns and track public updates from stakeholders.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className="rounded-md border border-slate-300 px-4 py-2 text-sm">
              Home
            </Link>
            <a href="/admin" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Admin Portal
            </a>
          </div>
        </div>
      </header>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Submit Feedback</h2>
        <form className="mt-4 grid gap-3" onSubmit={onSubmit}>
          <input
            name="title"
            required
            minLength={5}
            maxLength={120}
            placeholder="Feedback title"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            name="description"
            required
            minLength={20}
            maxLength={3000}
            placeholder="Detailed description"
            className="min-h-28 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <select name="category" required className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select Category</option>
              {FEEDBACK_CATEGORIES.map((value) => (
                <option value={value} key={value}>
                  {value}
                </option>
              ))}
            </select>
            <input
              name="otherCategory"
              placeholder="If category is Other, specify here"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              name="tags"
              placeholder="Optional tags (comma separated, e.g. urgent,maintenance)"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              name="attachment"
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            disabled={submitting}
            className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Anonymously"}
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-green-700">{success}</p> : null}
        </form>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Public Feedback Feed</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {FEEDBACK_CATEGORIES.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            {FEEDBACK_STATUSES.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="likes">Most Liked</option>
            <option value="status">Status</option>
          </select>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by ID/title/description"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        {loading ? <p className="mt-6 text-sm text-slate-500">Loading feedback...</p> : null}
        {!loading && items.length === 0 ? <p className="mt-6 text-sm text-slate-500">No feedback found.</p> : null}

        <div className="mt-5 grid gap-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded bg-slate-100 px-2 py-1 font-medium">{item.feedbackId}</span>
                <span>{item.createdAt}</span>
                <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">{item.category}</span>
                <span className="rounded bg-amber-50 px-2 py-1 text-amber-700">{item.status}</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.description}</p>
              {item.tags.length > 0 ? <p className="mt-2 text-xs text-slate-500">Tags: {item.tags.join(", ")}</p> : null}
              {item.attachmentPath ? (
                <a
                  href={item.attachmentPath}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-blue-700 hover:underline"
                >
                  View attachment
                </a>
              ) : null}
              {item.responseMessage ? (
                <div className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
                  <span className="font-semibold">Admin Response: </span>
                  {item.responseMessage}
                </div>
              ) : null}
              <button
                type="button"
                disabled={item.likedByCurrentSession}
                onClick={() => likeFeedback(item.id)}
                className="mt-3 rounded-md border border-slate-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                {item.likedByCurrentSession ? `Liked (${item.likesCount})` : `Like (${item.likesCount})`}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

