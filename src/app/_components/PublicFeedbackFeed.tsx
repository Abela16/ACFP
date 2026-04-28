"use client";

import { useEffect, useMemo, useState } from "react";

import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES } from "@/lib/constants";

type FeedbackItem = {
  id: number;
  feedbackId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  likesCount: number;
  attachmentPath: string | null;
  tags: string[];
  createdAt: string;
  responseMessage: string | null;
};

export default function PublicFeedbackFeed() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Public Feedback</h2>
          <p className="mt-1 text-sm text-slate-600">Browse what’s been submitted (submission is via the button above).</p>
        </div>
      </div>

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

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="mt-4 text-sm text-slate-500">Loading feedback...</p> : null}
      {!loading && !error && items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No feedback found.</p>
      ) : null}

      <div className="mt-5 grid gap-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-lg border border-slate-200 p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded bg-slate-100 px-2 py-1 font-medium">{item.feedbackId}</span>
              <span>{item.createdAt}</span>
              <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">{item.category}</span>
              <span className="rounded bg-amber-50 px-2 py-1 text-amber-700">{item.status}</span>
              <span className="ml-auto text-slate-600">Likes: {item.likesCount}</span>
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
          </article>
        ))}
      </div>
    </section>
  );
}

