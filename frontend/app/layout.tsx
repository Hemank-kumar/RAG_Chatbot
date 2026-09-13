import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/lib/theme';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'AgentRAG AI — Production Multi-Agent Knowledge Platform',
    template: '%s | AgentRAG AI',
  },
  description:
    'High-performance evidence-grounded multi-agent RAG engine powered by Gemini AI, Hugging Face semantic embeddings, and pgvector HNSW indexing.',
  keywords: [
    'Multi-Agent RAG Platform',
    'Enterprise AI Knowledge Base',
    'pgvector Vector Search',
    'HuggingFace Embeddings',
    'Gemini AI Agent Orchestration',
    'Document Intelligence',
    'Evidence Grounded RAG Chat',
    'Retrieval Augmented Generation',
  ],
  authors: [{ name: 'AgentRAG AI Team' }],
  creator: 'AgentRAG AI',
  metadataBase: new URL('https://agentrag.ai'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'AgentRAG AI — Multi-Agent Knowledge Engine',
    description:
      'Empower teams with evidence-grounded multi-agent AI knowledge retrieval, pgvector vector search, and real-time document intelligence.',
    url: 'https://agentrag.ai',
    siteName: 'AgentRAG AI',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentRAG AI — Multi-Agent RAG Platform',
    description:
      'High-performance evidence-grounded AI knowledge platform with Hugging Face embeddings and pgvector storage.',
    creator: '@agentrag_ai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#0d0d0d',
  width: 'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'AgentRAG AI',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  description:
    'Production-ready evidence-grounded multi-agent RAG knowledge assistant with pgvector search and Hugging Face embeddings.',
  offers: {
    '@type': 'Offer',
    price: '0.00',
    priceCurrency: 'USD',
  },
  author: {
    '@type': 'Organization',
    name: 'AgentRAG AI',
    url: 'https://agentrag.ai',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${montserrat.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.className} antialiased min-h-screen`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
