import Link from 'next/link';
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

const capabilities = [
  { icon: BrainCircuit, title: 'Multi-agent reasoning', text: 'Specialized agents interpret, retrieve, rerank, synthesize, and verify every answer.' },
  { icon: Search, title: 'Hybrid retrieval', text: 'Semantic and keyword retrieval work together to surface the strongest evidence.' },
  { icon: ShieldCheck, title: 'Grounded answers', text: 'Citation-aware responses show which source passages support each conclusion.' },
  { icon: Zap, title: 'Streaming workflow', text: 'Follow the agent pipeline as it works, then continue with suggested next questions.' },
];

const steps = [
  { icon: FileText, number: '01', title: 'Add your knowledge', text: 'Upload PDFs, DOCX files, Markdown, HTML, or text documents to an organized knowledge base.' },
  { icon: Network, number: '02', title: 'Retrieve and validate', text: 'Agents combine semantic and keyword retrieval, then filter and rerank the evidence.' },
  { icon: Sparkles, number: '03', title: 'Receive a cited answer', text: 'A model synthesizes a response, verification checks grounding, and citations lead back to the source.' },
];

const technologies = ['Next.js 14', 'React + TypeScript', 'FastAPI', 'PostgreSQL + pgvector', 'Hugging Face', 'Redis', 'Three.js', 'SSE streaming'];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0d0d0d] text-white">
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="absolute -top-48 left-[8%] h-96 w-96 rounded-full bg-[#f84525]/15 blur-[120px]" />
        <div className="absolute top-[32rem] -right-40 h-[30rem] w-[30rem] rounded-full bg-orange-500/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
      </div>

      <header className="relative z-10 border-b border-[#262626] bg-[#0d0d0d]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="AgentRAG home">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f84525]/50 bg-[#f84525]/10"><span className="h-2.5 w-2.5 rounded-full bg-[#f84525] shadow-[0_0_16px_#f84525]" /></span>
            <span><span className="block font-display text-lg font-extrabold uppercase leading-none tracking-wider">Agent<span className="text-[#f84525]">RAG</span></span><span className="mt-1 block font-mono text-[9px] tracking-[0.18em] text-[#9c9c9c]">MULTI-AGENT AI</span></span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Landing page navigation">
            <a href="#capabilities" className="baunfire-swipe-link text-xs font-semibold uppercase tracking-widest text-[#9c9c9c] hover:text-white">Capabilities</a>
            <a href="#workflow" className="baunfire-swipe-link text-xs font-semibold uppercase tracking-widest text-[#9c9c9c] hover:text-white">How it works</a>
            <a href="#technology" className="baunfire-swipe-link text-xs font-semibold uppercase tracking-widest text-[#9c9c9c] hover:text-white">Technology</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3"><Link href="/login" className="hidden rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#9c9c9c] hover:text-white sm:inline-flex">Sign in</Link><Link href="/register" className="inline-flex items-center gap-2 rounded-md border border-[#f84525] bg-[#f84525] px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-[#f84525]/20 transition-colors hover:bg-[#e03819]">Get started <ArrowRight className="h-3.5 w-3.5" /></Link></div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-20 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:px-8 lg:pb-28 lg:pt-28">
          <div className="flex flex-col justify-center"><div className="section-tag">Evidence-first intelligence</div><h1 className="mt-5 max-w-3xl font-display text-5xl font-extrabold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">Your knowledge.<br /><span className="text-[#f84525]">Verified</span> answers.</h1><p className="mt-7 max-w-xl text-base leading-7 text-[#9c9c9c] sm:text-lg">AgentRAG turns your documents into a searchable, evidence-grounded AI workspace. Ask complex questions, trace the reasoning pipeline, and inspect the sources behind every answer.</p><div className="mt-8 flex flex-wrap items-center gap-3"><Link href="/register" className="inline-flex items-center gap-2 rounded-md bg-[#f84525] px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-white shadow-xl shadow-[#f84525]/25 transition hover:bg-[#e03819]">Build your knowledge base <ArrowRight className="h-4 w-4" /></Link><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-md border border-[#333] bg-[#161616] px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition hover:border-[#f84525]">Open dashboard <ArrowRight className="h-4 w-4" /></Link></div><div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-mono uppercase tracking-wider text-[#6f6f6f]"><span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Source-aware answers</span><span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Multi-provider models</span><span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Your documents, searchable</span></div></div>
          <div className="relative mx-auto w-full max-w-xl lg:pt-4"><div className="absolute -inset-3 rounded-[2rem] bg-[#f84525]/10 blur-2xl" /><div className="relative overflow-hidden rounded-2xl border border-[#343434] bg-[#121212] shadow-2xl shadow-black/60"><div className="flex items-center justify-between border-b border-[#262626] bg-[#141414] px-5 py-4"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#f84525]" /><span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#9c9c9c]">Agent workflow</span></div><span className="rounded bg-emerald-500/10 px-2 py-1 font-mono text-[9px] font-bold text-emerald-400">LIVE</span></div><div className="space-y-4 p-5 sm:p-6"><div className="rounded-xl border border-[#303030] bg-[#161616] p-4"><p className="font-mono text-[10px] uppercase tracking-wider text-[#6f6f6f]">Question</p><p className="mt-2 text-sm leading-6 text-white">What are the eligibility requirements and exceptions in our policy?</p></div><div className="grid grid-cols-2 gap-3">{['Analyze intent', 'Retrieve sources', 'Rerank evidence', 'Verify answer'].map((step, index) => <div key={step} className={`rounded-lg border p-3 ${index === 3 ? 'border-[#f84525]/50 bg-[#f84525]/10' : 'border-[#303030] bg-[#141414]'}`}><span className="font-mono text-[10px] text-[#f84525]">0{index + 1}</span><p className="mt-1 text-xs font-semibold text-white">{step}</p></div>)}</div><div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-bold text-emerald-300"><ShieldCheck className="h-4 w-4" /> Grounded response</span><span className="font-mono text-[10px] text-emerald-400">0.92 CONFIDENCE</span></div><div className="mt-3 flex gap-2"><span className="rounded border border-[#f84525]/30 bg-[#f84525]/10 px-2 py-1 font-mono text-[9px] text-[#f84525]">[S1]</span><span className="rounded border border-[#f84525]/30 bg-[#f84525]/10 px-2 py-1 font-mono text-[9px] text-[#f84525]">[S2]</span></div></div></div></div></div>
        </section>

        <section id="capabilities" className="border-y border-[#262626] bg-[#111111]/80 py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="max-w-2xl"><div className="section-tag">What AgentRAG does</div><h2 className="mt-4 text-3xl font-extrabold uppercase sm:text-4xl">A reliable path from document to decision.</h2></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{capabilities.map(({ icon: Icon, title, text }, index) => <article key={title} className="rounded-xl border border-[#292929] bg-[#151515] p-5 transition hover:-translate-y-1 hover:border-[#f84525]/60"><span className="font-mono text-[10px] text-[#6f6f6f]">0{index + 1}</span><Icon className="mt-5 h-6 w-6 text-[#f84525]" /><h3 className="mt-4 text-sm font-bold uppercase tracking-wide">{title}</h3><p className="mt-2 text-sm leading-6 text-[#9c9c9c]">{text}</p></article>)}</div></div></section>

        <section id="workflow" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start"><div><div className="section-tag">How it works</div><h2 className="mt-4 text-3xl font-extrabold uppercase sm:text-4xl">Ask once.<br /><span className="text-[#f84525]">Inspect everything.</span></h2><p className="mt-5 max-w-md leading-7 text-[#9c9c9c]">The system gives every question a structured evidence workflow—not a single opaque model call.</p></div><div className="space-y-3">{steps.map(({ icon: Icon, number, title, text }) => <div key={number} className="flex gap-4 rounded-xl border border-[#292929] bg-[#141414] p-5 sm:gap-6"><span className="font-mono text-xs font-bold text-[#f84525]">{number}</span><Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#f84525]" /><div><h3 className="text-sm font-bold uppercase tracking-wide">{title}</h3><p className="mt-2 text-sm leading-6 text-[#9c9c9c]">{text}</p></div></div>)}</div></div></section>

        <section id="technology" className="border-y border-[#262626] bg-[#141414] py-20"><div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8"><div><div className="section-tag">Technology</div><h2 className="mt-4 text-3xl font-extrabold uppercase sm:text-4xl">Built for modern knowledge work.</h2><p className="mt-5 max-w-md leading-7 text-[#9c9c9c]">A pragmatic stack for responsive interfaces, async APIs, vector search, document intelligence, and provider flexibility.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{technologies.map((technology) => <div key={technology} className="flex min-h-24 items-center rounded-xl border border-[#303030] bg-[#0d0d0d] p-4"><span className="font-mono text-xs font-bold text-[#d0d0d0]">{technology}</span></div>)}</div></div></section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="relative overflow-hidden rounded-2xl border border-[#f84525]/35 bg-[#f84525]/10 px-6 py-12 text-center sm:px-12"><div className="absolute left-1/2 top-0 h-56 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f84525]/25 blur-[90px]" /><div className="relative"><div className="section-tag justify-center">Start exploring</div><h2 className="mt-4 text-3xl font-extrabold uppercase sm:text-4xl">Make your documents useful.</h2><p className="mx-auto mt-4 max-w-xl text-[#c6a69f]">Create a workspace, upload your source material, and ask the questions that matter.</p><div className="mt-7 flex justify-center gap-3"><Link href="/register" className="inline-flex items-center gap-2 rounded-md bg-[#f84525] px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#e03819]">Create account <ArrowRight className="h-4 w-4" /></Link><Link href="/login" className="rounded-md border border-[#f84525]/40 bg-[#0d0d0d]/60 px-5 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition hover:border-[#f84525]">Sign in</Link></div></div></div></section>
      </main>

      <footer className="relative z-10 border-t border-[#262626]"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-xs text-[#6f6f6f] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><div className="flex items-center gap-2 font-mono uppercase tracking-wider"><span className="h-2 w-2 rounded-full bg-[#f84525]" /> AgentRAG AI · Evidence-first knowledge</div><div className="flex items-center gap-5"><Link href="/dashboard" className="hover:text-white">Dashboard</Link><Link href="/login" className="hover:text-white">Sign in</Link><Link href="/register" className="hover:text-white">Create account</Link></div></div></footer>
    </div>
  );
}
