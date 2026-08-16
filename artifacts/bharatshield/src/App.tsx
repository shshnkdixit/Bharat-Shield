import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  AlertTriangle, ArrowRight, AudioLines, Check, ChevronRight, CircleHelp, Cpu, Eye, FileAudio,
  FileImage, FileVideo, History as HistoryIcon, Info, Languages, Layers,
  Lock, Menu, MessageSquareText, Play, Radar, ScanSearch, Search, ShieldCheck, Sparkles,
  Trash2, Upload, X, Zap,
} from 'lucide-react';
import { getGetHistoryQueryKey, getGetModelsQueryKey, useAnalyzeFile, useAnalyzeText, useDeleteHistory, useGetHistory, useGetModels, useHealthCheck } from '@workspace/api-client-react';
import type { AnalysisResult, FileAnalysisInput } from '@workspace/api-client-react';

const queryClient = new QueryClient();

type Lang = 'en' | 'hi';
const copy = {
  en: {
    analyze: 'Analyze', history: 'History', demo: 'Demo Lab', models: 'Model Center', about: 'About', home: 'Home',
    start: 'Analyze something', exploreDemo: 'Explore demo',
    heroA: "Don't trust the message.", heroB: 'Verify it first.',
    heroSub: 'BharatShield turns suspicious texts, audio, images, and video metadata into a clear first-pass risk assessment — with the reasons behind it, not a black-box verdict.',
    check: 'Private by design. Prototype-grade insight. Your judgment stays in charge.',
    how: 'How a safer decision starts', howSub: 'Three calm steps between a strange message and an expensive mistake.',
    text: 'Text', media: 'Media file', textPrompt: 'Paste a message, link, or offer you are unsure about.',
    run: 'Run assessment', choose: 'Choose a file', noFile: 'No file selected yet', analyzeMedia: 'Assess media',
    language: 'Language', recent: 'Analysis history', noHistory: 'Your checked messages will appear here.',
    view: 'View', delete: 'Delete', demoData: 'DEMO DATA', limitations: 'Prototype limits', footer: 'A clearer pause in a noisy inbox.',
  },
  hi: {
    analyze: 'जाँच', history: 'इतिहास', demo: 'डेमो लैब', models: 'मॉडल सेंटर', about: 'हमारे बारे में', home: 'होम',
    start: 'अभी जाँचें', exploreDemo: 'डेमो देखें',
    heroA: 'संदेश पर भरोसा न करें।', heroB: 'पहले जाँच करें।',
    heroSub: 'भारतशील्ड संदिग्ध टेक्स्ट, ऑडियो, इमेज और वीडियो मेटाडेटा को आसान जोखिम आकलन में बदलता है — कारणों के साथ, रहस्य के बिना।',
    check: 'डिज़ाइन से निजी। प्रोटोटाइप अंतर्दृष्टि। अंतिम निर्णय आपका।',
    how: 'सुरक्षित निर्णय ऐसे शुरू होता है', howSub: 'अजीब संदेश और महंगी गलती के बीच तीन शांत कदम।',
    text: 'टेक्स्ट', media: 'मीडिया फ़ाइल', textPrompt: 'जिस संदेश, लिंक या ऑफ़र पर संदेह हो, उसे यहाँ पेस्ट करें।',
    run: 'जाँच शुरू करें', choose: 'फ़ाइल चुनें', noFile: 'अभी कोई फ़ाइल नहीं चुनी', analyzeMedia: 'मीडिया जाँचें',
    language: 'भाषा', recent: 'जाँच इतिहास', noHistory: 'आपके जाँचे हुए संदेश यहाँ दिखेंगे।',
    view: 'देखें', delete: 'हटाएँ', demoData: 'डेमो डेटा', limitations: 'प्रोटोटाइप सीमाएँ', footer: 'शोर भरे इनबॉक्स में एक साफ़ विराम।',
  },
};

const RISK: Record<string, { hint: string; cls: string; color: string; label: string }> = {
  LOW: { hint: 'Looks low-risk — stay alert', cls: 'low', color: 'var(--safe)', label: 'LOW' },
  MEDIUM: { hint: 'Verify before you act', cls: 'medium', color: 'var(--warn)', label: 'MEDIUM' },
  HIGH: { hint: 'Pause before acting', cls: 'high', color: 'var(--high)', label: 'HIGH' },
  CRITICAL: { hint: 'Do not act — verify now', cls: 'critical', color: 'var(--crit)', label: 'CRITICAL' },
};
const riskInfo = (level?: string) => RISK[(level || 'MEDIUM').toUpperCase()] ?? RISK.MEDIUM;

function RiskDonut({ score, level, small }: { score: number; level?: string; small?: boolean }) {
  const info = riskInfo(level);
  const r = small ? 38 : 52;
  const box = small ? 92 : 132;
  const stroke = small ? 8 : 11;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className={`donut ${small ? 'small' : ''}`} role="img" aria-label={`Risk score ${score} of 100, ${info.label} risk`} style={{ ['--dash-full' as string]: `${c}` }}>
      <svg viewBox={`0 0 ${box} ${box}`}>
        <circle className="track" cx={box / 2} cy={box / 2} r={r} strokeWidth={stroke} />
        <circle className="meter" cx={box / 2} cy={box / 2} r={r} strokeWidth={stroke} stroke={info.color} strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      </svg>
      <div className="donut-center"><strong style={{ color: info.color }}>{score}</strong><small>/ 100</small></div>
    </div>
  );
}

function RiskBadge({ level }: { level?: string }) {
  const info = riskInfo(level);
  return <span className={`risk-badge risk-${info.cls}`}>{info.label} RISK</span>;
}

function Footer({ lang }: { lang: Lang }) {
  const t = copy[lang];
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link href="/" className="brand"><span className="brand-mark"><ShieldCheck size={18} /></span><span className="brand-word">Bharat<em>Shield</em></span></Link>
          <p>{t.footer} A first-pass digital-safety companion built for Indian internet life — not a replacement for your judgment or your bank&apos;s fraud team.</p>
        </div>
        <div className="footer-col">
          <h4>Product</h4>
          <Link href="/analyze">Analyze</Link>
          <Link href="/demo">Demo Lab</Link>
          <Link href="/history">History</Link>
        </div>
        <div className="footer-col">
          <h4>Technology</h4>
          <Link href="/models">Model Center</Link>
          <Link href="/about">About</Link>
        </div>
        <div className="footer-col">
          <h4>Prototype</h4>
          <span>Metadata-only media</span>
          <span>EN + HI first</span>
          <span>Explainable signals</span>
        </div>
      </div>
      <div className="footer-bottom">
        <p>BharatShield · Digital safety / India</p>
        <p className="footer-disclaimer">Prototype for demonstration. Assessments are first-pass signals, not guarantees. A clear result can still be wrong — verify important requests independently.</p>
      </div>
    </footer>
  );
}

function Shell({ lang, setLang, children }: { lang: Lang; setLang: (v: Lang) => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const t = copy[lang];
  const [location] = useLocation();
  const links: [string, string][] = [['/', t.home], ['/analyze', t.analyze], ['/history', t.history], ['/demo', t.demo], ['/models', t.models], ['/about', t.about]];
  return (
    <div className="app-shell">
      <div className="bg-grid" aria-hidden="true" />
      <div className="bg-glow" aria-hidden="true" />
      <header className="topbar">
        <Link href="/" className="brand" data-testid="link-brand"><span className="brand-mark"><ShieldCheck size={18} /></span><span className="brand-word">Bharat<em>Shield</em></span></Link>
        <button className="mobile-menu" onClick={() => setOpen(!open)} data-testid="button-mobile-menu" aria-label="Toggle navigation" aria-expanded={open}><Menu size={22} /></button>
        <nav className={`nav ${open ? 'open' : ''}`} aria-label="Main navigation">
          {links.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`nav-link ${location === href ? 'active' : ''}`} aria-current={location === href ? 'page' : undefined} data-testid={`link-nav-${href === '/' ? 'home' : href.slice(1)}`}>{label}</Link>)}
          <span className="lang-switch" role="group" aria-label={t.language}>
            <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')} data-testid="button-language-en" aria-pressed={lang === 'en'}>EN</button>
            <button className={`lang-btn ${lang === 'hi' ? 'active' : ''}`} onClick={() => setLang('hi')} data-testid="button-language-hi" aria-pressed={lang === 'hi'}>हिं</button>
          </span>
        </nav>
      </header>
      {children}
      <Footer lang={lang} />
    </div>
  );
}

const scanRows = [
  { icon: <MessageSquareText size={15} />, label: 'Text', tag: 'PARSED', w: '86%' },
  { icon: <AudioLines size={15} />, label: 'Audio', tag: 'METADATA', w: '54%' },
  { icon: <FileImage size={15} />, label: 'Image', tag: 'METADATA', w: '48%' },
  { icon: <FileVideo size={15} />, label: 'Video', tag: 'METADATA', w: '61%' },
];

function Home({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const health = useHealthCheck({ query: { queryKey: ['/api/healthz'] as const, retry: 1 } });
  const live = !health.isLoading && !health.isError;
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-badge"><span className="pulse" /> Digital safety / India</span>
          <h1 className="hero-title">{t.heroA}<span>{t.heroB}</span></h1>
          <p className="hero-sub">{t.heroSub}</p>
          <div className="hero-actions">
            <Link href="/analyze" className="btn btn-primary" data-testid="link-start-analysis">{t.start}<ArrowRight size={16} /></Link>
            <Link href="/demo" className="btn btn-outline" data-testid="link-see-demo"><Play size={14} /> {t.exploreDemo}</Link>
          </div>
          <div className="hero-note"><Check size={15} /> {t.check}</div>
        </div>
        <div className="console" aria-label="Example BharatShield assessment">
          <div className="console-card">
            <div className="console-head">
              <span className={`console-dot ${live ? 'live' : ''}`} /><span className="console-dot" /><span className="console-dot" />
              <span className="console-title">BharatShield / First pass</span>
              <span className="console-id">#042 · SAMPLE</span>
            </div>
            <div className="console-body">
              <div className="console-verdict">
                <RiskDonut score={72} level="HIGH" small />
                <div className="verdict-copy"><strong>High risk</strong><span>Pause before acting · 3 signals found</span></div>
              </div>
              <div className="scan-list">
                {scanRows.map((r) => (
                  <div className="scan-row" key={r.label}>
                    <span className="scan-icon">{r.icon}</span>
                    <div className="scan-meta"><strong>{r.label}</strong><div className="scan-bar"><i style={{ width: r.w }} /></div></div>
                    <span className="scan-tag">{r.tag}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="console-scanline" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="stripe">
        <div className="stripe-inner">
          <p><strong>{health.isLoading ? 'Connecting…' : health.isError ? 'Offline-ready' : 'Service ready'}</strong> · Built for the moment before a decision.</p>
          <div className="stats">
            <div className="stat"><strong>4</strong><span>content types</span></div>
            <div className="stat"><strong>2</strong><span>languages</span></div>
            <div className="stat"><strong>1</strong><span>clear pause</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <div className="section-kicker">Why BharatShield</div>
          <h2>A second opinion for the messages you trust.</h2>
          <p>Four capabilities designed to make a first-pass safety check feel calm, honest, and understandable in seconds.</p>
        </div>
        <div className="cap-grid">
          <div className="cap-card"><span className="cap-icon"><Layers size={20} /></span><h3>Multimodal</h3><p>Bring the strange message or media that made you hesitate.</p><span className="cap-tag">Text · Audio · Image · Video</span></div>
          <div className="cap-card"><span className="cap-icon"><Languages size={20} /></span><h3>Multilingual</h3><p>Designed for Indian-language use cases, starting with English and Hindi.</p><span className="cap-tag">EN · HI · more next</span></div>
          <div className="cap-card"><span className="cap-icon"><Eye size={20} /></span><h3>Explainable</h3><p>See the signals behind an assessment instead of a black-box verdict.</p><span className="cap-tag">Signals · Reasons</span></div>
          <div className="cap-card"><span className="cap-icon"><Lock size={20} /></span><h3>Privacy-first</h3><p>A prototype that is honest about its boundaries and keeps you in control.</p><span className="cap-tag">Metadata-only media</span></div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div className="section-kicker">The method</div>
          <h2>{t.how}</h2>
          <p>{t.howSub}</p>
        </div>
        <div className="steps">
          <div className="step-card"><span className="step-no">STEP 01</span><h3>Bring the message</h3><p>Paste a suspicious text or upload media metadata that made you pause.</p></div>
          <div className="step-card"><span className="step-no">STEP 02</span><h3>Read the signals</h3><p>BharatShield names familiar warning patterns and scores the risk.</p></div>
          <div className="step-card"><span className="step-no">STEP 03</span><h3>Decide with clarity</h3><p>Get a practical next step so you verify before you act, pay, or forward.</p></div>
        </div>
      </section>

      <section className="quote-section">
        <p className="quote"><span className="quote-mark">&ldquo;</span>A warning is useful only when it tells you what to do next.</p>
      </section>

      <section className="home-cta">
        <div className="cta-card">
          <div>
            <h2>Something feel off? Check it first.</h2>
            <p>Run a suspicious message through BharatShield and get a clear, explainable read in seconds.</p>
          </div>
          <div className="hero-actions" style={{ margin: 0 }}>
            <Link href="/analyze" className="btn btn-primary" data-testid="link-learn-about">{t.start} <ArrowRight size={16} /></Link>
            <Link href="/about" className="btn btn-outline">Read our limits <ChevronRight size={15} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ResultCard({ result }: { result: AnalysisResult }) {
  const [saved, setSaved] = useState(false);
  const info = riskInfo(result.riskLevel);
  return (
    <div className="panel panel-pad">
      <div className="eyebrow" style={{ marginBottom: 14 }}>{result.demo ? 'DEMO DATA' : 'ASSESSMENT COMPLETE'}</div>
      <div className="risk-header">
        <RiskDonut score={result.score} level={result.riskLevel} />
        <div className="risk-readout">
          <div className={`risk-level-word txt-${info.cls}`} data-testid="text-result-score">{info.label} RISK</div>
          <div className="risk-hint">{info.hint}</div>
          <div style={{ marginTop: 10 }}><RiskBadge level={result.riskLevel} /></div>
        </div>
      </div>
      <div className="result-section"><h3>What we found</h3><p className="explanation" data-testid="text-result-explanation">{result.explanation}</p></div>
      <div className="result-section">
        <h3>Detected signals</h3>
        <ul className="signal-list">
          {result.signals.map((s, i) => (
            <li className="signal-item" key={i} data-testid={`text-signal-${i}`}>
              <span className="sig-icon"><AlertTriangle size={14} /></span>
              <p>{s}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="result-section">
        <h3>Recommended next step</h3>
        <ul className="recommend-list">{result.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
      </div>
      <div className="result-meta">
        <span className="meta-tag">{result.contentType}</span>
        <span className="meta-tag">{result.language}</span>
        <span className="meta-tag">{result.prototype ? 'prototype model' : 'analysis'}</span>
      </div>
      {result.id && !result.demo && (
        <div className="result-actions">
          <button className="btn btn-quiet" onClick={() => setSaved(true)} disabled={saved} data-testid="button-save-analysis">{saved ? 'Saved to history' : 'Save analysis'} <Check size={15} /></button>
          <Link href="/history" className="btn btn-primary" data-testid="link-view-saved-analysis">View report <ChevronRight size={15} /></Link>
        </div>
      )}
    </div>
  );
}

function Analyze({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const [tab, setTab] = useState<'text' | 'audio' | 'image' | 'video'>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const textMutation = useAnalyzeText({ mutation: { onSuccess: (r) => { setResult(r); setError(''); }, onError: () => setError('The assessment could not be completed. Try again in a moment.') } });
  const fileMutation = useAnalyzeFile({ mutation: { onSuccess: (r) => { setResult(r); setError(''); }, onError: () => setError('The file metadata could not be assessed. Try again in a moment.') } });
  const isPending = textMutation.isPending || fileMutation.isPending;
  const chooseFile = (f?: File) => { setFileError(''); setFile(null); if (!f || tab === 'text') return; if (!f.type.startsWith(`${tab}/`)) return setFileError(`Choose a ${tab} file for this tab.`); if (f.size < 1 || f.size > 26214400) return setFileError('Files must be between 1 byte and 25 MB.'); setFile(f); };
  const switchTab = (next: 'text' | 'audio' | 'image' | 'video') => { setTab(next); setFile(null); setFileError(''); setError(''); };
  const run = () => { setError(''); if (tab === 'text') { if (!text.trim()) return setError('Paste a message before running an assessment.'); textMutation.mutate({ data: { text: text.trim(), language: lang } }); } else if (file) { const data: FileAnalysisInput = { fileName: file.name, fileType: file.type, fileSize: file.size, contentType: tab }; fileMutation.mutate({ data }); } };
  const tabs: [typeof tab, string, React.ReactNode][] = [['text', t.text, <MessageSquareText size={15} />], ['audio', 'Audio', <FileAudio size={15} />], ['image', 'Image', <FileImage size={15} />], ['video', 'Video', <FileVideo size={15} />]];
  return (
    <main className="page">
      <div className="workspace-head">
        <div>
          <div className="eyebrow">The checkpoint</div>
          <h1 className="page-title">Make the pause count.</h1>
          <p className="page-lead">Bring the thing that made you hesitate. BharatShield looks for familiar warning patterns and tells you how to verify them.</p>
        </div>
        <Link href="/about" className="btn btn-outline" data-testid="link-analysis-limits"><CircleHelp size={15} /> How this works</Link>
      </div>

      <div className="workspace-tabs" role="tablist" aria-label="Content type">
        {tabs.map(([key, label, icon]) => (
          <button key={key} role="tab" aria-selected={tab === key} className={`tab ${tab === key ? 'active' : ''}`} onClick={() => switchTab(key)} data-testid={`button-tab-${key}`}>{icon} {label}</button>
        ))}
      </div>

      <div className="workspace-grid">
        <section className="panel panel-pad">
          <div className="panel-title"><h2>{tab === 'text' ? 'Inspect a message' : `Inspect ${tab} metadata`}</h2><span className="eyebrow">First pass</span></div>
          {error && <div className="notice error-notice"><AlertTriangle size={15} /> {error}</div>}
          {tab === 'text' ? (
            <>
              <label className="field-label" htmlFor="message-input">{t.textPrompt}</label>
              <textarea id="message-input" className="text-area" value={text} onChange={(e) => setText(e.target.value.slice(0, 10000))} placeholder="Example: Congratulations, your KYC is expiring today. Pay ₹2 to keep your account active..." data-testid="input-analysis-text" />
              <div className="form-foot">
                <span className="char-count">{text.length.toLocaleString()} / 10,000</span>
                <button className="btn btn-primary" disabled={isPending || !text.trim()} onClick={run} data-testid="button-run-text">{isPending ? 'Reading signals…' : t.run}<ArrowRight size={15} /></button>
              </div>
            </>
          ) : (
            <>
              <label className="upload-zone" htmlFor="file-input">
                <input id="file-input" hidden type="file" accept={tab === 'audio' ? 'audio/*' : tab === 'image' ? 'image/*' : 'video/*'} onChange={(e) => chooseFile(e.target.files?.[0])} data-testid="input-analysis-file" />
                {file?.type.startsWith('image/') ? <img className="preview" src={URL.createObjectURL(file)} alt="Selected preview" data-testid="img-file-preview" /> : <span className="upload-icon">{file?.type.startsWith('audio/') ? <AudioLines size={24} /> : file?.type.startsWith('video/') ? <FileVideo size={24} /> : <Upload size={24} />}</span>}
                <strong>{file ? file.name : t.choose}</strong>
                <p>{file ? 'Click to replace this file' : `${tab[0].toUpperCase()}${tab.slice(1)} · up to 25 MB`}</p>
              </label>
              {fileError && <div className="notice error-notice"><X size={15} /> {fileError}</div>}
              {file && (
                <div className="upload-meta">
                  <span className="file-chip">{file.type.startsWith('audio/') ? <FileAudio size={18} /> : file.type.startsWith('video/') ? <FileVideo size={18} /> : <FileImage size={18} />}</span>
                  <div><strong>{file.name}</strong><span>{file.type || 'unknown type'} · {(file.size / 1024 / 1024).toFixed(2)} MB</span></div>
                </div>
              )}
              <div className="form-foot">
                <span className="char-count">{file ? 'Metadata ready' : t.noFile}</span>
                <button className="btn btn-primary" disabled={isPending || !file} onClick={run} data-testid="button-run-file">{isPending ? 'Assessing…' : t.analyzeMedia}<ScanSearch size={15} /></button>
              </div>
            </>
          )}
        </section>

        <section className="panel result-panel">
          {result ? <ResultCard result={result} /> : (
            <div className="result-empty">
              <div>
                <div className="empty-icon"><Radar size={25} /></div>
                <h3>Your readout will land here</h3>
                <p>A score is only the start. We&apos;ll show the signals behind it and a sensible next step.</p>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="notice" style={{ marginTop: 18 }}><Info size={15} /> Prototype note: media analysis currently uses file metadata, not the contents. Never upload sensitive documents you do not need to check.</div>
    </main>
  );
}

function HistoryPage({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const [selected, setSelected] = useState<AnalysisResult | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const query = useGetHistory({ query: { queryKey: getGetHistoryQueryKey() } });
  const del = useDeleteHistory({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetHistoryQueryKey() }) } });
  const items = query.data || [];
  const visible = useMemo(() => {
    let out = items.filter((i) => (riskFilter === 'all' || i.riskLevel === riskFilter) && (search === '' || (i.sourceLabel || '').toLowerCase().includes(search.toLowerCase())));
    out = [...out].sort((a, b) => {
      if (sort === 'score-high') return b.score - a.score;
      if (sort === 'score-low') return a.score - b.score;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return out;
  }, [items, riskFilter, search, sort]);
  return (
    <main className="page">
      <div className="workspace-head">
        <div>
          <div className="eyebrow">Your trail / API-saved</div>
          <h1 className="page-title">{t.recent}</h1>
          <p className="page-lead">A quiet record of the moments you chose to check instead of trust blindly.</p>
        </div>
        <Link href="/analyze" className="btn btn-primary" data-testid="link-new-analysis">New check <ArrowRight size={15} /></Link>
      </div>

      {query.isLoading ? (
        <div className="history-table">{[1, 2, 3, 4].map((i) => <div className="history-row" key={i}><div className="skeleton" style={{ width: 46, height: 46, borderRadius: 11 }} /><div className="skeleton" style={{ height: 14, width: '60%' }} /><div className="skeleton" style={{ height: 12, width: 70 }} /><div className="skeleton" style={{ height: 12, width: 50 }} /><div className="skeleton" style={{ height: 12, width: 80 }} /><div className="skeleton" style={{ height: 30, width: 70 }} /></div>)}</div>
      ) : query.isError ? (
        <div className="empty-state"><AlertTriangle size={28} /><h2>History is taking a pause</h2><p>We couldn&apos;t reach your saved checks. Try again without losing the message you&apos;re checking.</p><button className="btn btn-quiet" onClick={() => query.refetch()} data-testid="button-retry-history">Try again</button></div>
      ) : items.length === 0 ? (
        <div className="empty-state"><HistoryIcon size={30} /><h2>{t.noHistory}</h2><p>Run your first assessment and it will be saved here by the analysis service.</p><Link className="btn btn-quiet" href="/analyze" data-testid="link-empty-analysis">Start a check <ArrowRight size={15} /></Link></div>
      ) : (
        <>
          <div className="history-toolbar">
            <div className="search-wrap">
              <Search size={15} />
              <input className="search-input" placeholder="Search saved checks…" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-history-search" aria-label="Search saved checks" />
            </div>
            <select className="toolbar-select" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} aria-label="Filter by risk level">
              <option value="all">All risk levels</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <select className="toolbar-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort order">
              <option value="recent">Most recent</option>
              <option value="score-high">Highest score</option>
              <option value="score-low">Lowest score</option>
            </select>
          </div>

          {visible.length === 0 ? (
            <div className="empty-state"><Search size={28} /><h2>No matching checks</h2><p>Try a different search term or clear the filters to see everything again.</p></div>
          ) : (
            <div className="history-table">
              <div className="history-head"><span>Score</span><span>Source</span><span>Type</span><span>Risk</span><span>Date</span><span style={{ textAlign: 'right' }}>Actions</span></div>
              {visible.map((item) => {
                const info = riskInfo(item.riskLevel);
                return (
                  <div className="history-row" key={item.id} data-testid={`card-history-${item.id}`}>
                    <div className="h-score">{item.score}</div>
                    <div className="h-label"><strong>{item.sourceLabel || 'Untitled check'}</strong></div>
                    <div className="h-type">{item.contentType}</div>
                    <div className="status-dot-row"><i style={{ background: info.color }} /> <span className={`txt-${info.cls}`}>{info.label}</span></div>
                    <div className="h-date">{new Date(item.createdAt).toLocaleDateString()}</div>
                    <div className="h-actions">
                      <button className="icon-btn" onClick={() => setSelected(item)} title={t.view} aria-label={t.view} data-testid={`button-view-history-${item.id}`}><ScanSearch size={15} /></button>
                      <button className="icon-btn danger" onClick={() => { if (window.confirm('Delete this saved assessment?')) del.mutate({ id: item.id }); }} title={t.delete} aria-label={t.delete} data-testid={`button-delete-history-${item.id}`}><Trash2 size={15} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal panel panel-pad" onClick={(e) => e.stopPropagation()}>
            <div className="panel-title"><h2>Saved assessment</h2><button className="icon-btn" onClick={() => setSelected(null)} data-testid="button-close-history" aria-label="Close"><X size={15} /></button></div>
            <ResultCard result={selected} />
          </div>
        </div>
      )}
    </main>
  );
}

const demos = [
  { title: 'The urgent KYC', desc: 'Pressure + payment request', message: 'Your KYC will expire in 30 minutes. Pay ₹2 now to keep UPI active.', score: 86, risk: 'CRITICAL', signals: ['Artificial urgency and account threat', 'Small payment used to lower suspicion', 'No trusted sender context'] },
  { title: 'The lucky winner', desc: 'Prize + verification link', message: 'You have won a Bharat reward. Confirm your PAN details to claim today.', score: 74, risk: 'HIGH', signals: ['Unsolicited prize claim', 'Requests sensitive identity information', 'Reward framing encourages fast action'] },
  { title: 'The family forward', desc: 'Fear + unverified claim', message: 'Forward this to everyone. A new rule means phones will stop working tomorrow.', score: 63, risk: 'HIGH', signals: ['Forwarding pressure', 'Vague authority and deadline', 'Claim needs an official source'] },
  { title: 'The quiet invoice', desc: 'Context mismatch', message: 'Invoice attached. Please settle the outstanding amount to avoid a service interruption.', score: 51, risk: 'MEDIUM', signals: ['Unexpected invoice language', 'Threat of service interruption', 'Sender and account should be verified'] },
  { title: 'The normal hello', desc: 'Low-signal conversation', message: 'Hi, I\u2019m reaching out about the workshop next Tuesday. Is 4 pm still okay?', score: 12, risk: 'LOW', signals: ['No urgency or payment request', 'Specific context in the message'] },
];

function DemoPage() {
  const [index, setIndex] = useState(0);
  const d = demos[index];
  const info = riskInfo(d.risk);
  return (
    <main className="page">
      <div className="eyebrow">Visual test range / demo data</div>
      <h1 className="page-title">Five messages.<br />Five different pauses.</h1>
      <p className="page-lead">A guided lab for seeing how BharatShield explains risk. These are synthetic scenarios — they are not evidence about real senders.</p>
      <div className="demo-grid">
        {demos.map((x, i) => (
          <button key={x.title} className={`demo-card ${i === index ? 'selected' : ''}`} onClick={() => setIndex(i)} data-testid={`button-demo-scenario-${i + 1}`}>
            <span className="demo-no">DEMO 0{i + 1}</span>
            <h3>{x.title}</h3>
            <p>{x.desc}</p>
          </button>
        ))}
      </div>
      <div className="demo-layout">
        <section className="demo-script">
          <div className="eyebrow">DEMO 0{index + 1} / synthetic</div>
          <h2>{d.title}</h2>
          <p>{d.desc}. Notice how the assessment names a pattern without pretending to know the sender&apos;s intent.</p>
          <div className="demo-message">&ldquo;{d.message}&rdquo;</div>
          <Link href="/analyze" className="btn btn-quiet" data-testid="link-demo-real-check">Try a real check <ArrowRight size={15} /></Link>
          <div className="flow">
            <div className="flow-step"><span className="flow-icon"><MessageSquareText size={15} /></span><div><div className="flow-label">Input</div><div className="flow-value">Suspicious message</div></div></div>
            <div className="flow-arrow"><ChevronRight size={15} style={{ transform: 'rotate(90deg)' }} /></div>
            <div className="flow-step"><span className="flow-icon"><Cpu size={15} /></span><div><div className="flow-label">Analysis</div><div className="flow-value">Pattern signal reader</div></div></div>
            <div className="flow-arrow"><ChevronRight size={15} style={{ transform: 'rotate(90deg)' }} /></div>
            <div className="flow-step"><span className="flow-icon"><Zap size={15} /></span><div><div className="flow-label">Signals</div><div className="flow-value">{d.signals.length} patterns found</div></div></div>
          </div>
        </section>
        <section className="panel panel-pad">
          <div className="eyebrow" style={{ marginBottom: 14 }}>Demo readout</div>
          <div className="risk-header">
            <RiskDonut score={d.score} level={d.risk} />
            <div className="risk-readout">
              <div className={`risk-level-word txt-${info.cls}`}>{info.label} RISK</div>
              <div className="risk-hint">{info.hint}</div>
              <div style={{ marginTop: 10 }}><RiskBadge level={d.risk} /></div>
            </div>
          </div>
          <div className="result-section">
            <h3>Signals behind this read</h3>
            <ul className="signal-list">{d.signals.map((s) => <li className="signal-item" key={s}><span className="sig-icon"><AlertTriangle size={14} /></span><p>{s}</p></li>)}</ul>
          </div>
          <div className="result-section">
            <h3>Recommended pause</h3>
            <ul className="recommend-list"><li>Do not use the link or number in the message.</li><li>Open the official app or contact the person another way.</li></ul>
          </div>
          <div className="notice" style={{ marginTop: 18 }}><Sparkles size={15} /> DEMO DATA only. The production text endpoint creates real saved analyses.</div>
        </section>
      </div>
    </main>
  );
}

function ModelsPage() {
  const query = useGetModels({ query: { queryKey: getGetModelsQueryKey() } });
  const fallback = [
    { name: 'Text signal reader', status: 'active', description: 'Pattern-based first-pass checks for suspicious language, pressure, and payment requests.' },
    { name: 'Media metadata reader', status: 'prototype', description: 'Uses file name, type, and size to demonstrate a media workflow. It does not inspect media content yet.' },
    { name: 'Audio transcription', status: 'future', description: 'Planned integration for multilingual speech-to-text and scam phrase analysis.' },
    { name: 'Image provenance', status: 'future', description: 'Planned checks for manipulated visuals, copied notices, and source context.' },
  ];
  const models = query.data?.length ? query.data : fallback;
  return (
    <main className="page">
      <div className="eyebrow">Under the hood / transparent by default</div>
      <h1 className="page-title">Model Center.</h1>
      <p className="page-lead">Know what is active, what is still a prototype, and what is only a direction. Confidence starts with honest boundaries.</p>

      <section className="panel panel-pad" style={{ marginTop: 32 }}>
        <div className="panel-title"><h2>Analysis capabilities &amp; status</h2><span className="chip">Live status</span></div>
        <div className="model-grid">
          {query.isLoading ? [1, 2, 3].map((i) => <div className="model-row" key={i}><div className="skeleton" style={{ height: 16, width: 150 }} /><div className="skeleton" style={{ height: 22, width: 90 }} /><div className="skeleton" style={{ height: 30 }} /></div>) : models.map((m) => (
            <div className="model-row" key={m.name} data-testid={`row-model-${m.name.replaceAll(' ', '-').toLowerCase()}`}>
              <strong>{m.name}</strong>
              <span className={`status-pill status-${m.status.toLowerCase()}`}>{m.status}</span>
              <p>{m.description}</p>
            </div>
          ))}
        </div>
        <div className="model-legend">
          <span><i className="legend-dot" style={{ background: 'var(--safe)' }} /> active</span>
          <span><i className="legend-dot" style={{ background: 'var(--warn)' }} /> prototype</span>
          <span><i className="legend-dot" style={{ background: 'var(--ink-soft)' }} /> future</span>
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <div className="section-kicker">Architecture overview</div>
        <div className="arch-grid">
          <div className="arch-card"><span className="arch-step">01 / Intake</span><h4>Web client</h4><p>Text or media metadata is submitted from the analyze workspace over a typed API client.</p></div>
          <div className="arch-card"><span className="arch-step">02 / Analysis</span><h4>Prototype service</h4><p>A pattern-based reader scores signals and returns an explainable result shape.</p></div>
          <div className="arch-card"><span className="arch-step">03 / Record</span><h4>Saved history</h4><p>Real analyses are persisted so you can revisit the signals and score later.</p></div>
        </div>
      </section>

      <section className="future-panel">
        <div><div className="section-kicker">Future integration</div><h2>Real models can plug into this same trust layer.</h2></div>
        <p>Planned integrations include audio deepfake detection, image manipulation detection, video deepfake detection, and multilingual NLP. The prototype result shape is designed to stay explainable as those models arrive — so the interface never has to pretend to know more than it does.</p>
      </section>

      <div className="notice" style={{ marginTop: 18 }}><Info size={15} /> Model labels describe integration status, not a guarantee of accuracy. A clear result can still be wrong.</div>
    </main>
  );
}

function AboutPage({ lang }: { lang: Lang }) {
  const t = copy[lang];
  return (
    <main className="page">
      <div className="about-layout">
        <aside className="about-aside">
          <div className="eyebrow">BharatShield / 2024—25</div>
          <h1 className="page-title">Safety should sound human.</h1>
          <p>Built for Indian internet life: fast forwards, family groups, UPI urgency, mixed languages, and messages that borrow the voice of someone you trust.</p>
          <div className="about-links">
            <a href="#problem">01 / The problem</a>
            <a href="#solution">02 / Our approach</a>
            <a href="#tech">03 / The technology</a>
            <a href="#impact">04 / The impact</a>
            <a href="#limits">05 / The limits</a>
            <a href="#roadmap">06 / The roadmap</a>
          </div>
        </aside>
        <div>
          <section className="about-block" id="problem">
            <div className="section-kicker">01 / The problem</div>
            <h2>Scams rarely arrive looking like scams.</h2>
            <p>A message can be written in familiar language, arrive from a familiar-looking number, and still be engineered to rush you. Most people do not need another dramatic warning. They need a clear reason to pause.</p>
          </section>
          <section className="about-block" id="solution">
            <div className="section-kicker">02 / The approach</div>
            <h2>Explain the pattern. Return the decision.</h2>
            <p>BharatShield is a trust companion, not a chatbot. It reads first-pass signals in a text or file&apos;s available metadata, translates them into plain language, and suggests a safer next move. It does not impersonate a bank, police service, or fraud investigator.</p>
          </section>
          <section className="about-block" id="tech">
            <div className="section-kicker">03 / The technology</div>
            <h2>An explainable-by-default result shape.</h2>
            <p>A typed web client sends content to a prototype analysis service that returns a score, named signals, and a recommended next step. The same shape is designed to hold real models — audio, image, and video — as they are integrated, without changing how results are explained.</p>
          </section>
          <section className="about-block" id="impact">
            <div className="section-kicker">04 / The impact</div>
            <h2>Made with local context in mind.</h2>
            <p>Indian users navigate multiple scripts, languages, payment rails, and social circles in a single day. Our copy and scenario lab start with those realities. English and Hindi are the first UI languages; the structure is ready for Punjabi and Bhojpuri next.</p>
          </section>
          <section className="about-block" id="limits">
            <div className="section-kicker">{t.limitations}</div>
            <h2>What it cannot tell you yet.</h2>
            <div className="limits">
              <div className="limit"><strong>Not a verdict</strong><span>A low score is not proof that a message is safe. Verify important requests independently.</span></div>
              <div className="limit"><strong>Media is metadata-only</strong><span>Audio, image, and video uploads are not inspected in this prototype. Sensitive content should stay private.</span></div>
              <div className="limit"><strong>Language coverage</strong><span>Hindi and English are supported today. Mixed-language messages may need extra care.</span></div>
              <div className="limit"><strong>No emergency response</strong><span>If money has moved, contact your bank and local cybercrime channels immediately.</span></div>
            </div>
          </section>
          <section className="about-block" id="roadmap">
            <div className="section-kicker">06 / The roadmap</div>
            <h2>Where BharatShield goes next.</h2>
            <div className="roadmap">
              <div className="roadmap-item"><span className="phase">Now</span><div><strong>Explainable text analysis</strong><p>Pattern-based signal reading with saved history and bilingual UI.</p></div></div>
              <div className="roadmap-item"><span className="phase">Next</span><div><strong>Real media inspection</strong><p>Audio transcription and image provenance replacing metadata-only checks.</p></div></div>
              <div className="roadmap-item"><span className="phase">Later</span><div><strong>Deepfake &amp; NLP models</strong><p>Video deepfake detection and deeper multilingual understanding.</p></div></div>
            </div>
          </section>
          <Link href="/analyze" className="btn btn-primary" data-testid="link-about-analysis">Use the checkpoint <ArrowRight size={15} /></Link>
        </div>
      </div>
    </main>
  );
}

function NotFound() {
  return (
    <main className="page">
      <div className="empty-state">
        <AlertTriangle size={30} />
        <h2>That page is not in the signal range.</h2>
        <p>Return to the checkpoint and bring us something worth checking.</p>
        <Link href="/" className="btn btn-primary" data-testid="link-not-found-home">Back home</Link>
      </div>
    </main>
  );
}

function App() {
  const [lang, setLang] = useState<Lang>('en');
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Shell lang={lang} setLang={setLang}>
          <Switch>
            <Route path="/" component={() => <Home lang={lang} />} />
            <Route path="/analyze" component={() => <Analyze lang={lang} />} />
            <Route path="/history" component={() => <HistoryPage lang={lang} />} />
            <Route path="/demo" component={DemoPage} />
            <Route path="/models" component={ModelsPage} />
            <Route path="/about" component={() => <AboutPage lang={lang} />} />
            <Route component={NotFound} />
          </Switch>
        </Shell>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
