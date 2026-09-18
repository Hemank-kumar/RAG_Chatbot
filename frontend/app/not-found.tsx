import Link from 'next/link';
import { ArrowLeft, ArrowRight, Compass, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0d0d0d] px-4 text-white">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#f84525]/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-[#f84525]/10 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <section className="relative w-full max-w-2xl rounded-2xl border border-[#303030] bg-[#141414]/95 p-7 text-center shadow-2xl shadow-black/60 sm:p-12">
        <Link href="/" className="inline-flex items-center gap-2 font-display text-lg font-extrabold uppercase tracking-wider"><span className="h-2.5 w-2.5 rounded-full bg-[#f84525] shadow-[0_0_12px_#f84525]" />Agent<span className="text-[#f84525]">RAG</span></Link>
        <div className="mx-auto mt-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#f84525]/40 bg-[#f84525]/10 text-[#f84525]"><SearchX className="h-7 w-7" /></div>
        <p className="mt-7 font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#f84525]">Error 404 // Lost route</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold uppercase tracking-tight sm:text-5xl">This path has no source.</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#9c9c9c]">The page you requested does not exist, was moved, or is not available in this workspace.</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#f84525] px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#e03819]"><Compass className="h-4 w-4" /> Back to home</Link><Link href="/dashboard" className="inline-flex items-center justify-center gap-2 rounded-md border border-[#353535] bg-[#0d0d0d] px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition hover:border-[#f84525]"><ArrowRight className="h-4 w-4" /> Go to dashboard</Link></div>
        <Link href="/login" className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-[#9c9c9c] transition hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Sign in to your workspace</Link>
      </section>
    </main>
  );
}
