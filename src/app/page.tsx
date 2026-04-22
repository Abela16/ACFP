export default function Home() {
  return (
    <main className="snap-y snap-mandatory">
      <section className="snap-start">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-6 px-4 py-10 md:px-8">
          <header className="flex flex-col gap-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Anonymous Campus Feedback Portal
            </p>
            <h1 className="max-w-4xl text-4xl font-bold leading-tight text-slate-900 md:text-6xl">
              Share concerns. Track updates. Improve campus together.
            </h1>
            <p className="max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
              Submit feedback anonymously and follow public responses from campus stakeholders. This portal is designed
              for quick reporting, transparent updates, and better accountability.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <a href="/feedback" className="rounded-md bg-slate-900 px-6 py-3 text-sm font-semibold text-white">
                Go to Feedback Form
              </a>
              <a href="/admin" className="rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold">
                Admin Portal
              </a>
            </div>
          </header>
        </div>
      </section>

      <section className="snap-start">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-6 px-4 py-12 md:px-8">
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7 shadow-sm md:p-8">
              <p className="text-lg font-semibold text-slate-900">What you can do</p>
              <ul className="mt-3 grid gap-2 text-base leading-7 text-slate-600">
                <li>Submit anonymous feedback (with optional attachment)</li>
                <li>Browse the public feed and track status changes</li>
                <li>See official stakeholder responses when published</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm md:p-8">
              <p className="text-lg font-semibold text-slate-900">Privacy</p>
              <p className="mt-3 text-base leading-7 text-slate-600">
                Don’t include personal identifiers. Posts are intended to be anonymous and publicly viewable.
              </p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-7 shadow-sm md:p-8">
              <p className="text-xl font-semibold text-slate-900">Fast submission</p>
              <p className="mt-4 text-base leading-7 text-slate-600">A simple form that works on mobile and desktop.</p>
            </div>
            <div className="rounded-2xl bg-white p-7 shadow-sm md:p-8">
              <p className="text-xl font-semibold text-slate-900">Clear tracking</p>
              <p className="mt-4 text-base leading-7 text-slate-600">Statuses and responses help close the loop.</p>
            </div>
            <div className="rounded-2xl bg-white p-7 shadow-sm md:p-8">
              <p className="text-xl font-semibold text-slate-900">Stakeholder workflow</p>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Admins can filter, respond, and manage submissions.
              </p>
            </div>
          </section>

          <footer className="text-center text-sm text-slate-500">
            <p>
              Ready to submit?{" "}
              <a href="/feedback" className="font-semibold text-blue-700 hover:underline">
                Open the feedback form
              </a>
              .
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}
