import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BackToTopButton,
  PrecisionVisualizer,
  TruthFieldBackground,
} from "@/app/components/landing";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const workflowSteps = [
  {
    label: "Connect",
    title: "Bring in source knowledge",
    body: "Import Google Docs and PDFs from Drive into a Space your team already understands.",
  },
  {
    label: "Scan",
    title: "Extract operational claims",
    body: "OpenAI turns policy text into precise claims like refund windows, approval limits, and escalation rules.",
  },
  {
    label: "Protect",
    title: "Quarantine risky drafts",
    body: "Capsa explains contradictions and blocks lower-authority documents before agents can retrieve them.",
  },
  {
    label: "Answer",
    title: "Serve healthy documents only",
    body: "Allowed agents get read-only access to trusted documents, with every answer and blocked source logged.",
  },
];

const integrationChips = [
  "Google Drive",
  "OpenAI",
  "Exa",
  "Supabase",
  "Allowed agents",
];

const sponsorTech = [
  {
    name: "OpenAI",
    role: "Claim extraction, contradiction detection, plain-language explanations, and safe agent answers.",
  },
  {
    name: "Exa",
    role: "External research for public policy context, shown separately from automatic quarantine decisions.",
  },
  {
    name: "Google Drive",
    role: "The first source connector for importing support documents where real policy drift lives.",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string; error?: string; next?: string }>;
}) {
  const params = await searchParams;

  if (params?.code) {
    const callbackParams = new URLSearchParams({ code: params.code });
    if (params.next) {
      callbackParams.set("next", params.next);
    }
    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  if (params?.error) {
    redirect(`/sign-in?error=${encodeURIComponent(params.error)}`);
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (user) {
    redirect("/app");
  }

  return (
    <main className="landing-shell min-h-screen overflow-hidden text-[#191c1e]">
      <header className="glass-nav sticky top-0 z-50 border-b border-[#e6e8ea]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/capsa-primary-logo-only.svg"
              alt="Capsa"
              width={30}
              height={30}
              priority
            />
            <span className="text-xl font-extrabold tracking-tight">Capsa</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#565e74] md:flex">
            <a className="transition hover:text-[#a04100]" href="#precision">
              Precision
            </a>
            <a className="transition hover:text-[#a04100]" href="#proof">
              Demo
            </a>
            <a className="transition hover:text-[#a04100]" href="#workflow">
              Workflow
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-lg bg-[#ff6a00] px-4 py-2.5 text-sm font-bold text-white shadow-[var(--shadow-orange)] transition hover:-translate-y-0.5 hover:bg-[#dc5a00]"
            >
              Launch App
            </Link>
          </div>
        </div>
      </header>

      <section className="relative min-h-[680px] overflow-hidden border-b border-[#e6e8ea]">
        <TruthFieldBackground intensity="standard" />
        <div className="stitch-grid absolute inset-0 opacity-45" />
        <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-center justify-center px-4 py-20 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="reveal-up reveal-delay-1 mx-auto mt-7 max-w-5xl text-5xl font-semibold leading-[0.98] tracking-tight text-[#191c1e] sm:text-6xl lg:text-7xl">
              <span className="block">Trusted documents.</span>
              <span className="block text-[#ff6a00]">Smarter agents.</span>
            </h1>
            <p className="reveal-up reveal-delay-2 mx-auto mt-6 max-w-3xl text-lg leading-8 text-[#565e74] sm:text-xl">
              Capsa turns company knowledge into a trusted control layer for AI
              agents, detecting contradictions, quarantining stale drafts, and
              keeping every response grounded in healthy source documents.
            </p>
            <div className="reveal-up reveal-delay-3 mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-lg bg-[#ff6a00] px-6 py-3.5 text-base font-bold text-white shadow-[var(--shadow-orange)] transition hover:-translate-y-0.5 hover:bg-[#dc5a00]"
              >
                Launch App
              </Link>
              <a
                href="#proof"
                className="inline-flex items-center justify-center rounded-lg border border-[#e2bfb0] bg-white/88 px-6 py-3.5 text-base font-bold text-[#191c1e] shadow-sm transition hover:-translate-y-0.5 hover:border-[#ff6a00]"
              >
                Watch Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="precision"
        className="border-b border-[#e6e8ea] bg-white py-20 sm:py-24"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:px-10">
          <div className="max-w-xl">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#a04100]">
              Precision
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Precision & Clarity in every response.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#565e74]">
              Capsa checks the claims behind each answer, separates trusted
              policies from risky drafts, and gives operators a clear view of
              what agents are allowed to use.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {integrationChips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-[#f2f4f6] px-3 py-1.5 text-sm font-bold text-[#565e74]"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className="min-h-[420px]">
            <PrecisionVisualizer />
          </div>
        </div>
      </section>

      <section id="proof" className="bg-[#f7f9fb] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#a04100]">
              Demo proof
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              A conflict is detected, explained, and blocked before retrieval.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#565e74]">
              The critical path is intentionally simple: an approved 14-day
              policy beats a lower-authority 30-day draft, and the allowed agent
              answers from healthy documents only.
            </p>
          </div>
          <DemoClipPlaceholder />
        </div>
      </section>

      <section
        id="workflow"
        className="border-y border-[#e6e8ea] bg-white py-20 sm:py-24"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#a04100]">
                How it works
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                A health layer for company knowledge.
              </h2>
            </div>
            <p className="max-w-xl text-lg leading-8 text-[#565e74]">
              Capsa works upstream of RAG. It cleans and explains source
              knowledge before humans and agents rely on it.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map((step) => (
              <article
                key={step.label}
                className="soft-card rounded-2xl p-5 transition hover:-translate-y-1 hover:border-[#ff6a00]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff0e8] text-sm font-extrabold text-[#a04100]">
                  {step.label.slice(0, 1)}
                </div>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-[#a04100]">
                  {step.label}
                </p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm font-medium leading-6 text-[#565e74]">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7f9fb] py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1fr] lg:px-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#a04100]">
              Built for the demo, pointed at the market
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              OpenAI reasons over internal claims. Exa adds external context.
            </h2>
          </div>
          <div className="grid gap-4">
            {sponsorTech.map((item) => (
              <article key={item.name} className="soft-card rounded-2xl p-5">
                <h3 className="text-xl font-semibold tracking-tight">
                  {item.name}
                </h3>
                <p className="mt-2 text-base leading-7 text-[#565e74]">
                  {item.role}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#e6e8ea] bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#a04100]">
            Ready knowledge for safer agents
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
            Clean the corpus before it answers.
          </h2>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-lg bg-[#ff6a00] px-6 py-3.5 text-base font-bold text-white shadow-[var(--shadow-orange)] transition hover:-translate-y-0.5 hover:bg-[#dc5a00]"
            >
              Launch App
            </Link>
            <a
              href="#workflow"
              className="inline-flex items-center justify-center rounded-lg border border-[#e2bfb0] bg-white px-6 py-3.5 text-base font-bold text-[#191c1e] transition hover:-translate-y-0.5 hover:border-[#ff6a00]"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e6e8ea] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm font-semibold text-[#565e74] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="flex items-center gap-2 text-[#191c1e]">
            <Image
              src="/capsa-primary-logo-only.svg"
              alt=""
              width={22}
              height={22}
            />
            <span>Capsa</span>
          </div>
          <p>Document health monitoring for company knowledge.</p>
        </div>
      </footer>

      <BackToTopButton />
    </main>
  );
}

function DemoClipPlaceholder() {
  return (
    <div className="soft-card mt-12 overflow-hidden rounded-2xl p-3 sm:p-4">
      <div className="overflow-hidden rounded-xl border border-[#e6e8ea] bg-[#0f172a]">
        <div className="flex h-11 items-center justify-between border-b border-white/10 bg-[#1e293b] px-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff6a00]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#e2bfb0]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#087a53]" />
          </div>
          <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-bold text-white/72">
            Product demo
          </span>
        </div>
        <video
          className="aspect-video w-full bg-[#0f172a] object-cover"
          src="/demo/capsa-demo.mp4"
          controls
          preload="metadata"
          playsInline
          aria-label="Capsa product demo"
        />
      </div>
    </div>
  );
}
