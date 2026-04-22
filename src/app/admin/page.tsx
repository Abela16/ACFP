"use client";

import { FormEvent, useEffect, useState } from "react";

import { FEEDBACK_CATEGORIES, FEEDBACK_STATUSES } from "@/lib/constants";

type AdminFeedbackItem = {
  id: number;
  feedbackId: string;
  title: string;
  description: string;
  category: string;
  status: string;
  likesCount: number;
  responseMessage: string | null;
  flagged: boolean;
  attachmentPath: string | null;
  createdAt: string;
};

type Admin = {
  id: number;
  username: string;
  department: string;
};

export default function AdminPortal() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [items, setItems] = useState<AdminFeedbackItem[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [responseDrafts, setResponseDrafts] = useState<Record<number, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<number, string>>({});
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const response = await fetch("/api/admin/me");
        if (!response.ok) {
          if (!cancelled) {
            setAdmin(null);
          }
          return;
        }
        const data = await response.json();
        if (!cancelled) {
          setAdmin(data.admin ?? null);
        }
      } catch {
        if (!cancelled) {
          setAdmin(null);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!admin) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (status) params.set("status", status);
        const response = await fetch(`/api/admin/feedback${params.toString() ? `?${params.toString()}` : ""}`);
        const data = await response.json();
        if (!cancelled) {
          setItems(data.items ?? []);
        }
      } catch {
        if (!cancelled) {
          setMessage("Failed to load feedback.");
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [admin, category, status]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
    };
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Login failed.");
      return;
    }
    form.reset();
    setAdmin(data.admin);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAdmin(null);
    setItems([]);
  }

  async function patchFeedback(id: number, payload: Record<string, unknown>) {
    const response = await fetch(`/api/admin/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Update failed.");
      return;
    }
    setMessage("Feedback updated.");
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    const reload = await fetch(`/api/admin/feedback${params.toString() ? `?${params.toString()}` : ""}`);
    const reloadData = await reload.json();
    setItems(reloadData.items ?? []);
  }

  if (!admin) {
    return (
      <main className="mx-auto mt-10 w-full max-w-md rounded-xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
        <p className="mt-2 text-sm text-slate-600">Department-restricted stakeholder dashboard access.</p>
        <form className="mt-4 grid gap-3" onSubmit={login}>
          <input
            required
            name="username"
            placeholder="Username"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            name="password"
            type="password"
            placeholder="Password"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Login</button>
        </form>
        <p className="mt-4 text-xs text-slate-500">
          Default seeds: cafeteria_admin / security_admin / academic_admin / super_admin with password
          {" "}
          <code>ChangeMe123!</code>
        </p>
        {message ? <p className="mt-3 text-sm text-red-600">{message}</p> : null}
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
      <header className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Stakeholder Dashboard</h1>
            <p className="text-sm text-slate-600">
              Logged in as <strong>{admin.username}</strong> ({admin.department})
            </p>
          </div>
          <button onClick={logout} className="rounded-md border border-slate-300 px-4 py-2 text-sm">
            Logout
          </button>
        </div>
      </header>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {FEEDBACK_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {FEEDBACK_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Feedback Queue</h2>
        {message ? <p className="mt-2 text-sm text-blue-700">{message}</p> : null}
        <div className="mt-4 grid gap-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded bg-slate-100 px-2 py-1 font-medium">{item.feedbackId}</span>
                <span suppressHydrationWarning>
                  {hasMounted ? new Date(item.createdAt).toLocaleString() : item.createdAt}
                </span>
                <span className="rounded bg-blue-50 px-2 py-1 text-blue-700">{item.category}</span>
                <span className="rounded bg-amber-50 px-2 py-1 text-amber-700">{item.status}</span>
                {item.flagged ? <span className="rounded bg-red-100 px-2 py-1 text-red-700">Flagged</span> : null}
              </div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{item.description}</p>
              {item.attachmentPath ? (
                <a href={item.attachmentPath} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-blue-700 hover:underline">
                  View attachment
                </a>
              ) : null}
              {item.responseMessage ? (
                <p className="mt-2 rounded-md bg-emerald-50 p-2 text-sm text-emerald-900">
                  <strong>Latest response:</strong> {item.responseMessage}
                </p>
              ) : null}
              <div className="mt-3 grid gap-2 md:grid-cols-[200px,1fr]">
                <select
                  value={statusDrafts[item.id] ?? item.status}
                  onChange={(event) =>
                    setStatusDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  {FEEDBACK_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => patchFeedback(item.id, { status: statusDrafts[item.id] ?? item.status })}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                >
                  Update Status
                </button>
              </div>
              <textarea
                value={responseDrafts[item.id] ?? ""}
                onChange={(event) =>
                  setResponseDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                }
                placeholder="Write a public response..."
                className="mt-2 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => patchFeedback(item.id, { responseMessage: responseDrafts[item.id] ?? "" })}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
                >
                  Publish Response
                </button>
                <button
                  onClick={() => patchFeedback(item.id, { flag: !item.flagged })}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                >
                  {item.flagged ? "Unflag" : "Flag"}
                </button>
                <button
                  onClick={() => patchFeedback(item.id, { delete: true })}
                  className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
          {items.length === 0 ? <p className="text-sm text-slate-500">No feedback available.</p> : null}
        </div>
      </section>
    </main>
  );
}
