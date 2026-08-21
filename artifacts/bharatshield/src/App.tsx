import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { AlertTriangle, ArrowRight, AudioLines, Check, ChevronRight, CircleHelp, Eye, FileAudio, FileImage, FileVideo, Fingerprint, History as HistoryIcon, Info, Languages, Lock, Menu, MessageSquareText, Play, Plus, Radar, ScanSearch, ShieldCheck, Sparkles, Trash2, Upload, X, Zap } from 'lucide-react';
import { getGetHistoryQueryKey, getGetModelsQueryKey, useAnalyzeFile, useAnalyzeText, useDeleteHistory, useGetHistory, useGetModels, useHealthCheck } from '@workspace/api-client-react';
import type { AnalysisResult, FileAnalysisInput } from '@workspace/api-client-react';

const queryClient = new QueryClient();

type Lang = 'en' | 'hi';
const copy = {
  en: { analyze:'Analyze', history:'History', demo:'Demo lab', models:'Model center', about:'About', start:'Check something now', tagline:'Before you click. Before you pay. Before you forward.', hero:'A second opinion for the messages you trust.', heroSub:'BharatShield turns suspicious texts, audio, images, and video metadata into a clear first-pass risk assessment — with reasons, not mystery.', check:'Private by design. Prototype-grade insight. Human judgment stays in charge.', how:'How a safer decision starts', howSub:'Three calm steps between a strange message and an expensive mistake.', text:'Text message', media:'Media file', textPrompt:'Paste a message, link, or offer you are unsure about.', run:'Run assessment', choose:'Choose a file', noFile:'No file selected yet', analyzeMedia:'Assess media', language:'Language', recent:'Recent checks', noHistory:'Your checked messages will appear here.', view:'View', delete:'Delete', demoData:'DEMO DATA', limitations:'Prototype limits', footer:'A clearer pause in a noisy inbox.' },
  hi: { analyze:'जाँच', history:'इतिहास', demo:'डेमो लैब', models:'मॉडल सेंटर', about:'हमारे बारे में', start:'अभी जाँचें', tagline:'क्लिक करने से पहले। भुगतान से पहले। फ़ॉरवर्ड करने से पहले।', hero:'भरोसे वाले संदेशों के लिए एक दूसरी राय।', heroSub:'भारतशील्ड संदिग्ध टेक्स्ट, ऑडियो, इमेज और वीडियो मेटाडेटा को आसान जोखिम आकलन में बदलता है — कारणों के साथ, रहस्य के बिना।', check:'डिज़ाइन से निजी। प्रोटोटाइप अंतर्दृष्टि। अंतिम निर्णय आपका।', how:'सुरक्षित निर्णय ऐसे शुरू होता है', howSub:'अजीब संदेश और महंगी गलती के बीच तीन शांत कदम।', text:'टेक्स्ट संदेश', media:'मीडिया फ़ाइल', textPrompt:'जिस संदेश, लिंक या ऑफ़र पर संदेह हो, उसे यहाँ पेस्ट करें।', run:'जाँच शुरू करें', choose:'फ़ाइल चुनें', noFile:'अभी कोई फ़ाइल नहीं चुनी', analyzeMedia:'मीडिया जाँचें', language:'भाषा', recent:'हाल की जाँच', noHistory:'आपके जाँचे हुए संदेश यहाँ दिखेंगे।', view:'देखें', delete:'हटाएँ', demoData:'डेमो डेटा', limitations:'प्रोटोटाइप सीमाएँ', footer:'शोर भरे इनबॉक्स में एक साफ़ विराम।' },
};

function Shell({ lang, setLang, children }: { lang: Lang; setLang: (v: Lang) => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const t = copy[lang];
  const [location] = useLocation();
  const links = [['/', lang === 'hi' ? 'होम' : 'Home'], ['/analyze', t.analyze], ['/history', t.history], ['/demo', t.demo], ['/models', t.models], ['/about', t.about]];
  return <div className="app-shell">
    <header className="topbar">
      <Link href="/" className="brand" data-testid="link-brand"><span className="brand-mark"><ShieldCheck size={18} /></span><span className="brand-word">Bharat<em>Shield</em></span></Link>
      <button className="mobile-menu" onClick={() => setOpen(!open)} data-testid="button-mobile-menu" aria-label="Toggle navigation" aria-expanded={open}><Menu size={22} /></button>
      <nav className={`nav ${open ? 'open' : ''}`} aria-label="Main navigation">
        {links.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`nav-link ${location === href ? 'active' : ''}`} aria-current={location === href ? 'page' : undefined} data-testid={`link-nav-${href === '/' ? 'home' : href.slice(1)}`}>{label}</Link>)}
        <span className="lang-switch"><button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')} data-testid="button-language-en" aria-label="English">EN</button><button className={`lang-btn ${lang === 'hi' ? 'active' : ''}`} onClick={() => setLang('hi')} data-testid="button-language-hi" aria-label="Hindi">हिं</button></span>
        <Link href="/analyze" onClick={() => setOpen(false)} className="btn btn-primary nav-cta" data-testid="link-nav-cta">{lang === 'hi' ? 'जाँच करें' : 'Analyze Something'}<ArrowRight size={15} /></Link>
      </nav>
    </header>
    {children}
  </div>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return <div className={`faq-item ${open ? 'open' : ''}`}>
    <button className="faq-q" onClick={() => setOpen(!open)} aria-expanded={open} data-testid="button-faq">{q}<Plus size={18} /></button>
    <div className="faq-a">{a}</div>
  </div>;
}

const problems = [
  { icon: MessageSquareText, title: 'Manufactured urgency', body: 'Fraud borrows the language of banks, courier services, and government offices to rush you into acting before you think.' },
  { icon: AlertTriangle, title: 'Trusted-looking senders', body: 'A familiar number, a copied logo, or a forwarded voice note can make a scam feel routine and safe.' },
  { icon: Eye, title: 'Signals are hard to read', body: 'Most people never get a plain-language explanation of why a message is risky — only a gut feeling that is easy to override.' },
];
const modes = [
  { icon: MessageSquareText, title: 'Text', body: 'Messages, links, and offers are checked for pressure, payment traps, and identity requests.', tag: 'Active' },
  { icon: FileAudio, title: 'Audio', body: 'Voice-note and call-recording metadata workflows for scam-phrase analysis.', tag: 'Prototype' },
  { icon: FileImage, title: 'Image', body: 'Screenshots and forwarded notices, checked for manipulation and copied context.', tag: 'Prototype' },
  { icon: FileVideo, title: 'Video', body: 'Clip metadata as a step toward provenance and deepfake-signal review.', tag: 'Prototype' },
];
const flow = [
  { no: 'STEP 01', title: 'Input', body: 'Paste a message or add a media file that made you hesitate.' },
  { no: 'STEP 02', title: 'Analysis', body: 'BharatShield reads the available content and metadata for known patterns.' },
  { no: 'STEP 03', title: 'Signals', body: 'Each warning pattern is named in plain language, not hidden in a score.' },
  { no: 'STEP 04', title: 'Risk assessment', body: 'A first-pass risk level frames how much caution the message deserves.' },
  { no: 'STEP 05', title: 'Recommended action', body: 'A concrete next step: verify, pause, or do not forward.' },
];
const faqs = [
  { q: 'Does BharatShield guarantee a message is a scam?', a: 'No. It gives a first-pass risk assessment and names the signals behind it. Final judgment always stays with you and, where money is involved, with your bank’s fraud team.' },
  { q: 'What content can I check?', a: 'Text messages today, with prototype workflows for audio, image, and video metadata. Text analysis produces real saved reports; media currently demonstrates the workflow using file metadata.' },
  { q: 'Which languages are supported?', a: 'The interface ships in English and Hindi, with the structure prepared for Punjabi and Bhojpuri next. Analysis copy is written for Indian digital contexts.' },
  { q: 'Is my data kept private?', a: 'BharatShield is built as a first-pass companion. Do not upload sensitive documents you do not need to check, and treat every result as guidance rather than a verdict.' },
];

function Home({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const health = useHealthCheck({ query: { queryKey: ['/api/healthz'] as const, retry: 1 } });
  return <main>
    <section className="hero">
      <div className="hero-copy">
        <span className="hero-badge"><span className="dot" /> DIGITAL SAFETY · INDIA</span>
        <h1 className="hero-title">Don’t trust the message. <span>Verify it first.</span></h1>
        <p className="hero-sub">{t.heroSub}</p>
        <div className="hero-actions"><Link href="/analyze" className="btn btn-primary" data-testid="link-start-analysis">Analyze Something<ArrowRight size={16} /></Link><Link href="/demo" className="btn btn-outline" data-testid="link-see-demo"><Play size={14} /> Explore Demo</Link></div>
        <div className="hero-note"><Check size={15} /> {t.check}</div>
      </div>
      <div className="signal-board" aria-label="Illustrative BharatShield assessment — not a real analysis">
        <div className="board-card board-main">
          <div className="board-label"><span>BHARATSHIELD / FIRST PASS</span><span className="mono">ILLUSTRATIVE</span></div>
          <div className="board-modes"><span className="mode-chip"><MessageSquareText size={16} />TEXT</span><span className="mode-chip"><FileAudio size={16} />AUDIO</span><span className="mode-chip"><FileImage size={16} />IMAGE</span><span className="mode-chip"><FileVideo size={16} />VIDEO</span></div>
          <div className="board-score"><div className="score-ring"><strong>72</strong><small>RISK SCORE</small></div><div className="score-copy"><strong>HIGH RISK</strong><span>Pause before acting</span></div></div>
          <div className="signal-row"><span className="signal-dot" /> Urgency and pressure language</div>
          <div className="signal-row"><span className="signal-dot" /> Payment link has no clear context</div>
          <div className="signal-row"><span className="signal-dot" /> Sender identity needs verification</div>
        </div>
        <div className="board-card board-float"><div className="float-caption">signals found</div><div className="float-value">03 patterns</div></div>
        <div className="board-card board-float bottom"><div className="float-caption">recommended next step</div><div className="float-value">Do not forward</div></div>
      </div>
    </section>

    <section className="stripe"><div className="stripe-inner"><p><strong>{health.isLoading ? 'Connecting' : health.isError ? 'Offline-ready' : 'Service ready'}</strong> · Built for the moment before a decision.</p><div className="stats"><div className="stat"><strong>4</strong><span>content types</span></div><div className="stat"><strong>2</strong><span>languages</span></div><div className="stat"><strong>1</strong><span>clear pause</span></div></div></div></section>

    <section className="section" id="why">
      <div className="section-head"><div className="eyebrow">Why BharatShield</div><h2>Scams rarely arrive looking like scams.</h2><p>Suspicious digital content, misinformation and manipulation are engineered to feel ordinary. BharatShield helps you slow down and see the signals.</p></div>
      <div className="problem-grid">{problems.map((p) => { const Icon = p.icon; return <article className="problem-card" key={p.title}><span className="problem-icon"><Icon size={20} /></span><h3>{p.title}</h3><p>{p.body}</p></article>; })}</div>
    </section>

    <section className="section section-alt" id="multimodal">
      <div className="section-head"><div className="section-kicker">Multimodal Intelligence</div><h2>One assessment across four kinds of content.</h2><p>Threats do not stay in one format. BharatShield is designed to reason across text, audio, image and video signals.</p></div>
      <div className="mode-grid">{modes.map((m) => { const Icon = m.icon; return <article className="mode-card" key={m.title}><span className="m-icon"><Icon size={22} /></span><h3>{m.title}</h3><p>{m.body}</p><span className="m-tag">{m.tag}</span></article>; })}</div>
    </section>

    <section className="section" id="how">
      <div className="section-head"><div className="eyebrow">How BharatShield works</div><h2>Five calm steps from a strange message to a safer decision.</h2></div>
      <div className="flow">{flow.map((f) => <div className="flow-step" key={f.no}><span className="f-no">{f.no}</span><h4>{f.title}</h4><p>{f.body}</p><ChevronRight className="f-arrow" size={18} /></div>)}</div>
    </section>

    <section className="section section-alt" id="explainable">
      <div className="split">
        <div>
          <div className="section-kicker">Explainable Assessment</div>
          <h2>A score is the start of the story, not the end.</h2>
          <p>Black-box verdicts are easy to distrust and easy to ignore. BharatShield shows the understandable signals behind every assessment, so you can judge them yourself.</p>
          <ul className="feature-list">
            <li><Zap size={17} /> Named signals in plain language, not opaque probabilities.</li>
            <li><Check size={17} /> A recommended next step you can actually act on.</li>
            <li><Eye size={17} /> Honest labels when a result is a prototype or demo.</li>
          </ul>
        </div>
        <div className="explain-panel">
          <div className="ep-head"><div className="eyebrow">Signal breakdown</div><span className="risk-badge risk-high">HIGH RISK</span></div>
          <div className="explain-row"><span className="er-mark"><AlertTriangle size={15} /></span><div><strong>Artificial urgency</strong><span>“Act within 30 minutes” pressures you past your own judgment.</span></div></div>
          <div className="explain-row"><span className="er-mark"><AlertTriangle size={15} /></span><div><strong>Unexplained payment link</strong><span>A request to pay with no legitimate context or reference.</span></div></div>
          <div className="explain-row"><span className="er-mark"><AlertTriangle size={15} /></span><div><strong>Unverified identity</strong><span>The sender claims authority the message cannot prove.</span></div></div>
        </div>
      </div>
    </section>

    <section className="section" id="context">
      <div className="section-head"><div className="eyebrow">Built for India</div><h2>Local languages. Local context. Privacy by default.</h2></div>
      <div className="band">
        <div className="band-card accent"><span className="band-icon"><Languages size={22} /></span><h3>Multilingual by design</h3><p>Indian users move between scripts and languages in a single conversation. The interface starts in English and Hindi, and the assessment copy is written for Indian digital life.</p><div className="chip-row"><span className="lang-chip">English</span><span className="lang-chip">हिन्दी</span><span className="lang-chip">ਪੰਜਾਬੀ · soon</span><span className="lang-chip">भोजपुरी · soon</span></div></div>
        <div className="band-card"><span className="band-icon"><Lock size={22} /></span><h3>Privacy-conscious</h3><p>BharatShield is a first-pass companion, not an archive of your private life. Check only what you need to check, and treat every result as guidance rather than a stored verdict.</p><p style={{ marginTop: 12 }}><Fingerprint size={15} style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--saffron)' }} />Human judgment always stays in charge.</p></div>
      </div>
    </section>

    <section className="quote-section"><p className="quote"><span className="quote-mark">“</span> A warning is useful only when it tells you what to do next.</p></section>

    <section className="section" id="faq">
      <div className="section-head"><div className="eyebrow">Questions</div><h2>What BharatShield does — and does not — claim.</h2></div>
      <div className="faq">{faqs.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}</div>
    </section>

    <section className="cta-final">
      <h2>Before you click.<br />Before you pay. Before you forward.</h2>
      <p>Bring the message that made you hesitate and get a clear, explainable first-pass assessment in seconds.</p>
      <div className="hero-actions"><Link href="/analyze" className="btn btn-primary" data-testid="link-cta-analyze">Analyze Something<ArrowRight size={16} /></Link><Link href="/about" className="btn btn-outline" data-testid="link-cta-about">Read our limits<ChevronRight size={15} /></Link></div>
    </section>

    <footer className="home-footer">
      <div className="footer-inner">
        <div className="footer-brand"><div className="brand"><span className="brand-mark"><ShieldCheck size={18} /></span><span className="brand-word">Bharat<em>Shield</em></span></div><p>{t.footer} BharatShield is a first-pass companion, not a replacement for your judgment or your bank’s fraud team.</p></div>
        <div className="footer-col"><h4>Product</h4><Link href="/analyze">Analyze</Link><Link href="/demo">Demo Lab</Link><Link href="/models">Model Center</Link><Link href="/history">History</Link></div>
        <div className="footer-col"><h4>Company</h4><Link href="/about">About</Link><a href="#why">Why BharatShield</a><a href="#how">How it works</a><a href="#faq">FAQ</a></div>
        <div className="footer-col"><h4>Approach</h4><a href="#explainable">Explainable</a><a href="#multimodal">Multimodal</a><a href="#context">India-focused</a></div>
      </div>
      <div className="footer-bar"><div className="footer-bar-inner"><span>© {new Date().getFullYear()} BharatShield · A clearer pause in a noisy inbox.</span><span className="mono">Prototype · Not financial advice</span></div></div>
    </footer>
  </main>;
}

function RiskBadge({ level }: { level?: string }) { return <span className={`risk-badge risk-${(level || 'medium').toLowerCase()}`}>{level || 'MEDIUM'} RISK</span>; }
function ResultCard({ result }: { result: AnalysisResult }) {
  const [saved, setSaved] = useState(false);
  return <div className="panel panel-pad"><div className="risk-header"><div><div className="eyebrow">{result.demo ? 'DEMO DATA' : 'ASSESSMENT COMPLETE'}</div><div className="risk-score" data-testid="text-result-score">{result.score}<small> / 100</small></div></div><RiskBadge level={result.riskLevel} /></div><div className="result-section"><h3>What we found</h3><p className="explanation" data-testid="text-result-explanation">{result.explanation}</p></div><div className="result-section"><h3>Signals</h3><ul className="signal-list">{result.signals.map((s, i) => <li key={i} data-testid={`text-signal-${i}`}>{s}</li>)}</ul></div><div className="result-section"><h3>What to do next</h3><ul className="recommend-list">{result.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul></div><div className="result-meta"><span className="meta-tag">{result.contentType}</span><span className="meta-tag">{result.language}</span><span className="meta-tag">{result.prototype ? 'prototype model' : 'analysis'}</span></div>{result.id && !result.demo && <div className="result-actions"><button className="btn btn-quiet" onClick={() => setSaved(true)} disabled={saved} data-testid="button-save-analysis">{saved ? 'Saved to history' : 'Save Analysis'} <Check size={15} /></button><Link href="/history" className="btn btn-primary" data-testid="link-view-saved-analysis">View Report <ChevronRight size={15} /></Link></div>}</div>;
}

function Analyze({ lang }: { lang: Lang }) {
  const t = copy[lang]; const [tab, setTab] = useState<'text' | 'audio' | 'image' | 'video'>('text'); const [text, setText] = useState(''); const [file, setFile] = useState<File | null>(null); const [fileError, setFileError] = useState(''); const [result, setResult] = useState<AnalysisResult | null>(null); const [error, setError] = useState('');
  const textMutation = useAnalyzeText({ mutation: { onSuccess: (r) => { setResult(r); setError(''); }, onError: () => setError('The assessment could not be completed. Try again in a moment.') } }); const fileMutation = useAnalyzeFile({ mutation: { onSuccess: (r) => { setResult(r); setError(''); }, onError: () => setError('The file metadata could not be assessed. Try again in a moment.') } });
  const isPending = textMutation.isPending || fileMutation.isPending;
  const chooseFile = (f?: File) => { setFileError(''); setFile(null); if (!f || tab === 'text') return; if (!f.type.startsWith(`${tab}/`)) return setFileError(`Choose a ${tab} file for this tab.`); if (f.size < 1 || f.size > 26214400) return setFileError('Files must be between 1 byte and 25 MB.'); setFile(f); };
  const switchTab = (next: 'text' | 'audio' | 'image' | 'video') => { setTab(next); setFile(null); setFileError(''); setError(''); };
  const run = () => { setError(''); if (tab === 'text') { if (!text.trim()) return setError('Paste a message before running an assessment.'); textMutation.mutate({ data: { text: text.trim(), language: lang } }); } else if (file) { const data: FileAnalysisInput = { fileName: file.name, fileType: file.type, fileSize: file.size, contentType: tab }; fileMutation.mutate({ data }); } };
  return <main className="page"><div className="workspace-head"><div><div className="eyebrow">THE CHECKPOINT</div><h1 className="page-title">Make the pause<br />count.</h1><p className="page-lead">Bring the thing that made you hesitate. BharatShield looks for familiar warning patterns and tells you how to verify them.</p></div><Link href="/about" className="btn btn-outline" data-testid="link-analysis-limits"><CircleHelp size={15} /> How this works</Link></div>
    <div className="workspace-tabs"><button className={`tab ${tab === 'text' ? 'active' : ''}`} onClick={() => switchTab('text')} data-testid="button-tab-text"><MessageSquareText size={15} /> {t.text}</button><button className={`tab ${tab === 'audio' ? 'active' : ''}`} onClick={() => switchTab('audio')} data-testid="button-tab-audio"><FileAudio size={15} /> Audio</button><button className={`tab ${tab === 'image' ? 'active' : ''}`} onClick={() => switchTab('image')} data-testid="button-tab-image"><FileImage size={15} /> Image</button><button className={`tab ${tab === 'video' ? 'active' : ''}`} onClick={() => switchTab('video')} data-testid="button-tab-video"><FileVideo size={15} /> Video</button></div>
     <div className="workspace-grid"><section className="panel panel-pad"><div className="panel-title"><h2>{tab === 'text' ? 'Inspect a message' : `Inspect ${tab} metadata`}</h2><span className="eyebrow">FIRST PASS</span></div>{error && <div className="notice error-notice"><AlertTriangle size={15} /> {error}</div>}{tab === 'text' ? <><label className="field-label" htmlFor="message-input">{t.textPrompt}</label><textarea id="message-input" className="text-area" value={text} onChange={(e) => setText(e.target.value.slice(0,10000))} placeholder="Example: Congratulations, your KYC is expiring today. Pay ₹2 to keep your account active..." data-testid="input-analysis-text" /><div className="form-foot"><span className="char-count">{text.length.toLocaleString()} / 10,000</span><button className="btn btn-primary" disabled={isPending || !text.trim()} onClick={run} data-testid="button-run-text">{isPending ? 'Reading signals…' : t.run}<ArrowRight size={15} /></button></div></> : <><label className="upload-zone" htmlFor="file-input"><input id="file-input" hidden type="file" accept={tab === 'audio' ? 'audio/*' : tab === 'image' ? 'image/*' : 'video/*'} onChange={(e) => chooseFile(e.target.files?.[0])} data-testid="input-analysis-file" />{file?.type.startsWith('image/') ? <img className="preview" src={URL.createObjectURL(file)} alt="Selected preview" data-testid="img-file-preview" /> : <span className="upload-icon">{file?.type.startsWith('audio/') ? <AudioLines size={24} /> : file?.type.startsWith('video/') ? <FileVideo size={24} /> : <Upload size={24} />}</span>}<strong>{file ? file.name : t.choose}</strong><p>{file ? 'Click to replace this file' : `${tab[0].toUpperCase()}${tab.slice(1)} · up to 25 MB`}</p></label>{fileError && <div className="notice error-notice"><X size={15} /> {fileError}</div>}{file && <div className="upload-meta"><span className="file-chip">{file.type.startsWith('audio/') ? <FileAudio size={18} /> : file.type.startsWith('video/') ? <FileVideo size={18} /> : <FileImage size={18} />}</span><div><strong>{file.name}</strong><span>{file.type || 'unknown type'} · {(file.size / 1024 / 1024).toFixed(2)} MB</span></div></div>}<div className="form-foot"><span className="char-count">{file ? 'Metadata ready' : t.noFile}</span><button className="btn btn-primary" disabled={isPending || !file} onClick={run} data-testid="button-run-file">{isPending ? 'Assessing…' : t.analyzeMedia}<ScanSearch size={15} /></button></div></>}</section>
      <section className="panel result-panel">{result ? <ResultCard result={result} /> : <div className="result-empty"><div><div className="empty-icon"><Radar size={25} /></div><h3>Your readout will land here</h3><p>A score is only the start. We’ll show the signals behind it and a sensible next step.</p></div></div>}</section></div>
    <div className="notice" style={{ marginTop: 18 }}><Info size={15} /> Prototype note: media analysis currently uses file metadata, not the contents. Never upload sensitive documents you do not need to check.</div>
  </main>;
}

function HistoryPage({ lang }: { lang: Lang }) {
  const t = copy[lang]; const [selected, setSelected] = useState<AnalysisResult | null>(null); const query = useGetHistory({ query: { queryKey: getGetHistoryQueryKey() } }); const del = useDeleteHistory({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetHistoryQueryKey() }) } }); const items = query.data || [];
  return <main className="page"><div className="workspace-head"><div><div className="eyebrow">YOUR TRAIL / API-SAVED</div><h1 className="page-title">{t.recent}</h1><p className="page-lead">A quiet record of the moments you chose to check instead of trust blindly.</p></div><Link href="/analyze" className="btn btn-primary" data-testid="link-new-analysis">New check <ArrowRight size={15} /></Link></div>{query.isLoading ? <div className="list-grid">{[1,2,3].map(i => <div className="history-card" key={i}><div className="skeleton" style={{ width:68, height:68 }} /><div><div className="skeleton" style={{ height:15, width:'70%', marginBottom:10 }} /><div className="skeleton" style={{ height:11, width:'45%' }} /></div></div>)}</div> : query.isError ? <div className="empty-state"><AlertTriangle size={28} /><h2>History is taking a pause</h2><p>We couldn’t reach your saved checks. Try again without losing the message you’re checking.</p><button className="btn btn-quiet" onClick={() => query.refetch()} data-testid="button-retry-history">Try again</button></div> : items.length === 0 ? <div className="empty-state"><HistoryIcon size={30} /><h2>{t.noHistory}</h2><p>Run your first assessment and it will be saved here by the analysis service.</p><Link className="btn btn-quiet" href="/analyze" data-testid="link-empty-analysis">Start a check <ArrowRight size={15} /></Link></div> : <div className="list-grid">{items.map((item) => <div className="history-card" key={item.id} data-testid={`card-history-${item.id}`}><div className="history-score">{item.score}</div><div className="history-main"><h3>{item.sourceLabel || 'Untitled check'}</h3><p><RiskBadge level={item.riskLevel} /> <span className="mono" style={{ marginLeft:8 }}>{new Date(item.createdAt).toLocaleString()}</span></p></div><div className="history-actions"><button className="icon-btn" onClick={() => setSelected(item)} title={t.view} data-testid={`button-view-history-${item.id}`}><ScanSearch size={15} /></button><button className="icon-btn" onClick={() => { if (window.confirm('Delete this saved assessment?')) del.mutate({ id: item.id }); }} title={t.delete} data-testid={`button-delete-history-${item.id}`}><Trash2 size={15} /></button></div></div>)}</div>}{selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="modal panel panel-pad" onClick={(e) => e.stopPropagation()}><div className="panel-title"><h2>Saved assessment</h2><button className="icon-btn" onClick={() => setSelected(null)} data-testid="button-close-history"><X size={15} /></button></div><ResultCard result={selected} /></div></div>}</main>;
}

const demos = [{ title:'The urgent KYC', desc:'Pressure + payment request', message:'Your KYC will expire in 30 minutes. Pay ₹2 now to keep UPI active.', score:86, risk:'CRITICAL', signals:['Artificial urgency and account threat','Small payment used to lower suspicion','No trusted sender context'] }, { title:'The lucky winner', desc:'Prize + verification link', message:'You have won a Bharat reward. Confirm your PAN details to claim today.', score:74, risk:'HIGH', signals:['Unsolicited prize claim','Requests sensitive identity information','Reward framing encourages fast action'] }, { title:'The family forward', desc:'Fear + unverified claim', message:'Forward this to everyone. A new rule means phones will stop working tomorrow.', score:63, risk:'HIGH', signals:['Forwarding pressure','Vague authority and deadline','Claim needs an official source'] }, { title:'The quiet invoice', desc:'Context mismatch', message:'Invoice attached. Please settle the outstanding amount to avoid a service interruption.', score:51, risk:'MEDIUM', signals:['Unexpected invoice language','Threat of service interruption','Sender and account should be verified'] }, { title:'The normal hello', desc:'Low-signal conversation', message:'Hi, I’m reaching out about the workshop next Tuesday. Is 4 pm still okay?', score:12, risk:'LOW', signals:['No urgency or payment request','Specific context in the message'] }];
function DemoPage() { const [index, setIndex] = useState(0); const d = demos[index]; return <main className="page"><div className="eyebrow">VISUAL TEST RANGE / DEMO DATA</div><h1 className="page-title">Five messages.<br />Five different pauses.</h1><p className="page-lead">A guided lab for seeing how BharatShield explains risk. These are synthetic scenarios — they are not evidence about real senders.</p><div className="demo-grid">{demos.map((x,i) => <button key={x.title} className={`demo-card ${i === index ? 'selected' : ''}`} onClick={() => setIndex(i)} data-testid={`button-demo-scenario-${i+1}`}><span className="demo-no">DEMO 0{i+1}</span><h3>{x.title}</h3><p>{x.desc}</p></button>)}</div><div className="demo-layout"><section className="demo-script"><div className="eyebrow">DEMO 0{index+1} / SYNTHETIC</div><h2>{d.title}</h2><p>{d.desc}. Notice how the assessment names a pattern without pretending to know the sender’s intent.</p><div className="demo-message">“{d.message}”</div><Link href="/analyze" className="btn btn-quiet" data-testid="link-demo-real-check">Try a real check <ArrowRight size={15} /></Link></section><section className="panel panel-pad"><div className="risk-header"><div><div className="eyebrow">DEMO READOUT</div><div className="risk-score">{d.score}<small> / 100</small></div></div><RiskBadge level={d.risk} /></div><div className="result-section"><h3>Signals behind this read</h3><ul className="signal-list">{d.signals.map((s) => <li key={s}>{s}</li>)}</ul></div><div className="result-section"><h3>Recommended pause</h3><ul className="recommend-list"><li>Do not use the link or number in the message.</li><li>Open the official app or contact the person another way.</li></ul></div><div className="notice" style={{ marginTop:18 }}><Sparkles size={15} /> DEMO DATA only. The production text endpoint creates real saved analyses.</div></section></div></main>; }

 function ModelsPage() { const query = useGetModels({ query: { queryKey: getGetModelsQueryKey() } }); const fallback = [{ name:'Text signal reader', status:'active', description:'Pattern-based first-pass checks for suspicious language, pressure, and payment requests.' }, { name:'Media metadata reader', status:'prototype', description:'Uses file name, type, and size to demonstrate a media workflow. It does not inspect media content yet.' }, { name:'Audio transcription', status:'future', description:'Planned integration for multilingual speech-to-text and scam phrase analysis.' }, { name:'Image provenance', status:'future', description:'Planned checks for manipulated visuals, copied notices, and source context.' }]; const models = query.data?.length ? query.data : fallback; return <main className="page"><div className="eyebrow">UNDER THE HOOD / TRANSPARENT BY DEFAULT</div><h1 className="page-title">Model center.</h1><p className="page-lead">Know what is active, what is still a prototype, and what is only a direction. Confidence starts with honest boundaries.</p><section className="panel panel-pad" style={{ marginTop:35 }}><div className="model-grid">{query.isLoading ? [1,2,3].map(i => <div className="model-row" key={i}><div className="skeleton" style={{ height:16, width:150 }} /><div className="skeleton" style={{ height:22, width:75 }} /><div className="skeleton" style={{ height:30 }} /></div>) : models.map((m) => <div className="model-row" key={m.name} data-testid={`row-model-${m.name.replaceAll(' ','-').toLowerCase()}`}><strong>{m.name}</strong><span className={`status-pill status-${m.status.toLowerCase()}`}>{m.status}</span><p>{m.description}</p></div>)}</div><div className="model-legend"><span><i className="legend-dot" style={{ background:'#127c78' }} /> active</span><span><i className="legend-dot" style={{ background:'#e8b44b' }} /> prototype</span><span><i className="legend-dot" style={{ background:'#9a96ae' }} /> future</span></div></section><section className="future-panel"><div><div className="section-kicker">FUTURE INTEGRATION</div><h2>Real models can plug into this same trust layer.</h2></div><p>Planned integrations include audio deepfake detection, image manipulation detection, video deepfake detection, and multilingual NLP. The prototype result shape is designed to stay explainable as those models arrive.</p></section><div className="notice" style={{ marginTop:18 }}><Info size={15} /> Model labels describe integration status, not a guarantee of accuracy. A clear result can still be wrong.</div></main>; }

function AboutPage({ lang }: { lang: Lang }) { const t = copy[lang]; return <main className="page"><div className="about-layout"><aside className="about-aside"><div className="eyebrow">BHARATSHIELD / 2024—25</div><h1 className="page-title">Safety should<br />sound human.</h1><p>Built for Indian internet life: fast forwards, family groups, UPI urgency, mixed languages, and messages that borrow the voice of someone you trust.</p><div className="about-links"><a href="#problem">01 / The problem</a><a href="#solution">02 / Our approach</a><a href="#limits">03 / The limits</a></div></aside><div><section className="about-block" id="problem"><div className="section-kicker">01 / THE PROBLEM</div><h2>Scams rarely arrive looking like scams.</h2><p>A message can be written in familiar language, arrive from a familiar-looking number, and still be engineered to rush you. Most people do not need another dramatic warning. They need a clear reason to pause.</p></section><section className="about-block" id="solution"><div className="section-kicker">02 / THE APPROACH</div><h2>Explain the pattern. Return the decision.</h2><p>BharatShield is a trust companion, not a chatbot. It reads first-pass signals in a text or file’s available metadata, translates them into plain language, and suggests a safer next move. It does not impersonate a bank, police service, or fraud investigator.</p></section><section className="about-block"><div className="section-kicker">03 / WHY HERE</div><h2>Made with local context in mind.</h2><p>Indian users navigate multiple scripts, languages, payment rails, and social circles in a single day. Our copy and scenario lab start with those realities. English and Hindi are the first UI languages; the structure is ready for Punjabi and Bhojpuri next.</p></section><section className="about-block" id="limits"><div className="section-kicker">{t.limitations}</div><h2>What it cannot tell you yet.</h2><div className="limits"><div className="limit"><strong>Not a verdict</strong><span>A low score is not proof that a message is safe. Verify important requests independently.</span></div><div className="limit"><strong>Media is metadata-only</strong><span>Audio, image, and video uploads are not inspected in this prototype. Sensitive content should stay private.</span></div><div className="limit"><strong>Language coverage</strong><span>Hindi and English are supported today. Mixed-language messages may need extra care.</span></div><div className="limit"><strong>No emergency response</strong><span>If money has moved, contact your bank and local cybercrime channels immediately.</span></div></div></section><Link href="/analyze" className="btn btn-primary" data-testid="link-about-analysis">Use the checkpoint <ArrowRight size={15} /></Link></div></div></main>; }

function NotFound() { return <main className="page"><div className="empty-state"><AlertTriangle size={30} /><h2>That page is not in the signal range.</h2><p>Return to the checkpoint and bring us something worth checking.</p><Link href="/" className="btn btn-primary" data-testid="link-not-found-home">Back home</Link></div></main>; }

function App() { const [lang, setLang] = useState<Lang>('en'); return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Shell lang={lang} setLang={setLang}><Switch><Route path="/" component={() => <Home lang={lang} />} /><Route path="/analyze" component={() => <Analyze lang={lang} />} /><Route path="/history" component={() => <HistoryPage lang={lang} />} /><Route path="/demo" component={DemoPage} /><Route path="/models" component={ModelsPage} /><Route path="/about" component={() => <AboutPage lang={lang} />} /><Route component={NotFound} /></Switch></Shell></WouterRouter></QueryClientProvider>; }

export default App;
