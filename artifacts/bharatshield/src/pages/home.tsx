import { useState } from 'react';
import { Link } from 'wouter';
import {
  ArrowRight,
  AudioLines,
  Check,
  Eye,
  FileVideo,
  Fingerprint,
  Image as ImageIcon,
  Languages,
  Layers,
  Lock,
  MessageSquareText,
  Play,
  Plus,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useHealthCheck } from '@workspace/api-client-react';
import { copy, type Lang } from '@/lib/i18n';
import { Reveal } from '@/lib/ui';

/* ---------------- Hero security console ---------------- */
function HeroConsole() {
  const signals = [
    ['Urgency and pressure language', 'URG'],
    ['Payment link has no clear context', 'PAY'],
    ['Sender identity needs verification', 'ID'],
  ];
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - 0.72 * circ;
  return (
    <div className="console">
      <div className="console-glow" />
      <div className="console-card">
        <div className="console-bar">
          <span className="dots">
            <i />
            <i />
            <i />
          </span>
          <span className="console-tag">bharatshield · first pass</span>
          <span className="console-tag">#042</span>
        </div>
        <div className="console-body">
          <div className="console-head">
            <span className="label">Assessment</span>
            <span className="chip">
              <span className="dot" /> live engine
            </span>
          </div>
          <div className="console-scoreline">
            <div className="ring" style={{ width: 124, height: 124 }}>
              <svg width={124} height={124} aria-hidden="true">
                <circle className="ring-track" cx={62} cy={62} r={r} fill="none" strokeWidth={11} />
                <circle
                  cx={62}
                  cy={62}
                  r={r}
                  fill="none"
                  stroke="var(--risk-high)"
                  strokeWidth={11}
                  strokeLinecap="round"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  transform="rotate(-90 62 62)"
                  style={{ filter: 'drop-shadow(0 0 6px var(--risk-high))' }}
                />
              </svg>
              <div className="ring-center">
                <strong style={{ fontSize: 34, color: 'var(--risk-high)' }}>72</strong>
                <small>Risk score</small>
              </div>
            </div>
            <div className="console-copy">
              <strong>High risk</strong>
              <span>Pause before acting</span>
            </div>
          </div>
          {signals.map(([label, tag]) => (
            <div className="console-signal" key={tag}>
              <span className="s-dot" />
              {label}
              <span className="s-tag">{tag}</span>
            </div>
          ))}
          <div className="console-foot">
            <ShieldCheck size={16} /> Recommended: do not forward or pay
          </div>
        </div>
      </div>
      <div className="console-chip tr">
        <div className="cap">Signals found</div>
        <div className="val">03 patterns</div>
      </div>
      <div className="console-chip br">
        <div className="cap">Verdict</div>
        <div className="val ok">Explained</div>
      </div>
    </div>
  );
}

/* ---------------- Capabilities ---------------- */
const capabilities = [
  {
    icon: Layers,
    kicker: 'Multimodal',
    title: 'Text, audio, image & video',
    body: 'One workspace to check the four kinds of content that reach you every day, each with its own analysis flow.',
    tags: ['Text', 'Audio', 'Image', 'Video'],
    indigo: false,
  },
  {
    icon: Languages,
    kicker: 'Multilingual',
    title: 'Built for Indian languages',
    body: 'English and Hindi today, with detection tuned for mixed-script, transliterated scam patterns — and room for more.',
    tags: ['English', 'हिंदी', '+ more'],
    indigo: true,
  },
  {
    icon: Eye,
    kicker: 'Explainable',
    title: 'Signals, not black boxes',
    body: 'Every score comes with the specific patterns behind it and a practical next step, so you learn what to watch for.',
    tags: ['Score', 'Signals', 'Next step'],
    indigo: false,
  },
  {
    icon: Lock,
    kicker: 'Privacy-aware',
    title: 'Only what it needs',
    body: 'Media checks read file metadata, not your private content. It is a first-pass companion — clear about its limits.',
    tags: ['Metadata', 'Prototype', 'Honest'],
    indigo: true,
  },
];

/* ---------------- Modalities ---------------- */
const modalities = [
  {
    icon: MessageSquareText,
    kicker: '01 / Text',
    title: 'Message & link analysis',
    body: 'Paste a suspicious SMS, WhatsApp forward, email, or offer. The engine reads for urgency, payment pressure, credential requests, impersonation, and risky links.',
    meta: [
      ['Accepts', 'Any message up to 10,000 characters, English or Hindi'],
      ['Returns', 'Risk score, matched signals, plain-language explanation'],
    ],
    visual: 'text' as const,
  },
  {
    icon: AudioLines,
    kicker: '02 / Audio',
    title: 'Voice-note metadata',
    body: 'Bring a voice note or call recording that felt off. The prototype reviews file type, size, and naming metadata to demonstrate the audio workflow.',
    meta: [
      ['Accepts', 'Audio files up to 25 MB'],
      ['Returns', 'Metadata-based prototype read with a clear caveat'],
    ],
    visual: 'audio' as const,
  },
  {
    icon: ImageIcon,
    kicker: '03 / Image',
    title: 'Screenshot & poster checks',
    body: 'Upload a forwarded poster, payment screenshot, or fake notice. Drag-and-drop with instant preview, then get a first-pass metadata assessment.',
    meta: [
      ['Accepts', 'Image files up to 25 MB with live preview'],
      ['Returns', 'Metadata-based prototype read and safer next step'],
    ],
    visual: 'image' as const,
  },
  {
    icon: FileVideo,
    kicker: '04 / Video',
    title: 'Clip & metadata review',
    body: 'Check a suspicious video clip or reel before you trust or share it. The prototype inspects file metadata to model the video pipeline.',
    meta: [
      ['Accepts', 'Video files up to 25 MB'],
      ['Returns', 'Metadata-based prototype read with honest limits'],
    ],
    visual: 'video' as const,
  },
];

function ModalityVisual({ kind }: { kind: 'text' | 'audio' | 'image' | 'video' }) {
  if (kind === 'audio') {
    const bars = [40, 68, 30, 82, 52, 90, 44, 70, 36, 78, 48, 62, 28, 74, 50];
    return (
      <div className="modality-visual">
        <div className="mv-waveform" aria-hidden="true">
          {bars.map((h, i) => (
            <i key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="mv-line">
          <AudioLines size={16} /> voice-note.m4a
          <span className="mv-bar">
            <i style={{ width: '66%' }} />
          </span>
        </div>
      </div>
    );
  }
  if (kind === 'image') {
    return (
      <div className="modality-visual">
        <div className="mv-line">
          <ImageIcon size={16} /> forwarded-poster.jpg
          <span className="mv-bar">
            <i style={{ width: '56%' }} />
          </span>
        </div>
        <div className="mv-line">
          <ScanSearch size={16} /> metadata scan
          <span className="mv-bar">
            <i style={{ width: '80%' }} />
          </span>
        </div>
      </div>
    );
  }
  if (kind === 'video') {
    return (
      <div className="modality-visual">
        <div className="mv-line">
          <FileVideo size={16} /> viral-clip.mp4
          <span className="mv-bar">
            <i style={{ width: '48%' }} />
          </span>
        </div>
        <div className="mv-line">
          <Radar size={16} /> pipeline check
          <span className="mv-bar">
            <i style={{ width: '72%' }} />
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="modality-visual">
      <div className="mv-line">
        <MessageSquareText size={16} /> &quot;KYC expires today, pay ₹2 now&quot;
      </div>
      <div className="mv-line">
        <ShieldCheck size={16} /> urgency + payment pressure
        <span className="mv-bar">
          <i style={{ width: '88%' }} />
        </span>
      </div>
      <div className="mv-line">
        <ShieldCheck size={16} /> credential request
        <span className="mv-bar">
          <i style={{ width: '64%' }} />
        </span>
      </div>
    </div>
  );
}

/* ---------------- Process ---------------- */
const steps = [
  { no: '01', icon: MessageSquareText, title: 'Input', body: 'Share the text or media file that made you hesitate.' },
  { no: '02', icon: ScanSearch, title: 'Signal extraction', body: 'The engine pulls relevant signals from the content or its metadata.' },
  { no: '03', icon: Radar, title: 'Risk analysis', body: 'Signals are scored 0–100 and mapped to a clear risk level.' },
  { no: '04', icon: Eye, title: 'Explanation', body: 'You get an understandable readout and a safer next step.' },
];

/* ---------------- FAQ ---------------- */
const faqs = [
  {
    q: 'Is BharatShield a guaranteed scam detector?',
    a: 'No. It is a first-pass assessment tool that highlights risk signals and explains them. It does not prove that a message is safe or fraudulent — your judgment and official channels remain the final word.',
  },
  {
    q: 'What does the risk score actually mean?',
    a: 'The score is a 0–100 value built from matched signals such as urgency, payment pressure, credential requests, and risky links. It maps to Low, Medium, High, or Critical risk to help you decide how carefully to proceed.',
  },
  {
    q: 'Do you analyse the contents of my audio, images, or videos?',
    a: 'Not yet. The current prototype reviews file metadata — type, size, and filename — to demonstrate the media workflow. It does not run trained forensic models on the media content, and the readout says so clearly.',
  },
  {
    q: 'Which languages are supported?',
    a: 'The interface and text analysis support English and Hindi today, including mixed-script and transliterated patterns common in Indian scams. The structure is designed to add more Indian languages over time.',
  },
  {
    q: 'Is my data stored?',
    a: 'Text checks create a saved analysis record so you can review history within the prototype. Media checks only use metadata. This is a prototype, so avoid uploading sensitive documents you do not need to check.',
  },
  {
    q: 'Who is BharatShield for?',
    a: 'Anyone navigating everyday Indian digital life — UPI requests, family forwards, KYC messages, and prize offers — who wants a calm, explainable second opinion before they click, pay, or forward.',
  },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="faq-list">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div className={`faq-item ${isOpen ? 'open' : ''}`} key={i}>
            <button
              className="faq-q"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              data-testid={`button-faq-${i}`}
            >
              {f.q}
              <Plus className="faq-icon" size={20} />
            </button>
            <div className="faq-a">
              <p>{f.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Page ---------------- */
export function Home({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const health = useHealthCheck({ query: { queryKey: ['/api/healthz'] as const, retry: 1 } });
  const statusLabel = health.isLoading ? 'Connecting' : health.isError ? 'Offline-ready' : 'Service ready';

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">{t.hero_eyebrow}</span>
            <h1 className="hero-title">
              {t.hero_line1} <span>{t.hero_line2}</span>
            </h1>
            <p className="hero-sub">{t.hero_sub}</p>
            <div className="hero-actions">
              <Link href="/analyze" className="btn btn-primary" data-testid="link-start-analysis">
                {t.cta_analyze} <ArrowRight size={16} />
              </Link>
              <Link href="/demo" className="btn btn-ghost" data-testid="link-see-demo">
                <Play size={15} /> {t.cta_demo}
              </Link>
            </div>
            <div className="hero-trust">
              <span>
                <Check size={15} /> Multimodal analysis
              </span>
              <span>
                <Check size={15} /> Explainable signals
              </span>
              <span>
                <Check size={15} /> Privacy-aware design
              </span>
            </div>
          </div>
          <HeroConsole />
        </div>
      </section>

      {/* STATS STRIPE */}
      <div className="stripe">
        <div className="container stripe-inner">
          <span className="chip">
            <span className={`dot ${health.isError ? 'pending' : ''}`} /> {statusLabel} · built for the moment before a decision
          </span>
          <div className="stat-group">
            <div className="stat">
              <strong>
                4<em>×</em>
              </strong>
              <span>Content types</span>
            </div>
            <div className="stat">
              <strong>
                0<em>–</em>100
              </strong>
              <span>Risk scoring</span>
            </div>
            <div className="stat">
              <strong>
                2<em>+</em>
              </strong>
              <span>Languages</span>
            </div>
          </div>
        </div>
      </div>

      {/* CAPABILITIES */}
      <section className="section">
        <div className="container">
          <Reveal>
            <span className="eyebrow">Why BharatShield</span>
            <h2 className="section-title">
              Security intelligence,
              <br />
              built to be understood.
            </h2>
            <p className="section-lead">
              Most warnings tell you to be scared. BharatShield tells you why — turning suspicious content into a
              clear, explainable assessment you can act on.
            </p>
          </Reveal>
          <div className="grid-4">
            {capabilities.map((c, i) => {
              const Icon = c.icon;
              return (
                <Reveal key={c.kicker} delay={i * 80}>
                  <div className="card" style={{ height: '100%' }}>
                    <div className={`cap-icon ${c.indigo ? 'indigo' : ''}`}>
                      <Icon size={22} />
                    </div>
                    <span className="kicker">{c.kicker}</span>
                    <h3 style={{ marginTop: 8 }}>{c.title}</h3>
                    <p>{c.body}</p>
                    <div className="tags">
                      {c.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* MODALITIES */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <span className="eyebrow indigo">Four modalities</span>
            <h2 className="section-title">One workspace for every kind of suspicious content.</h2>
            <p className="section-lead">
              Each modality has its own dedicated flow. Only the capabilities that exist in the prototype are shown —
              nothing is faked.
            </p>
          </Reveal>
          <div style={{ marginTop: 56 }}>
            {modalities.map((m, i) => {
              const Icon = m.icon;
              return (
                <Reveal key={m.kicker}>
                  <div className={`modality ${i % 2 === 1 ? 'flip' : ''}`}>
                    <div className="modality-copy">
                      <span className="eyebrow no-rule">{m.kicker}</span>
                      <h3>{m.title}</h3>
                      <p>{m.body}</p>
                      <div className="modality-meta">
                        {m.meta.map(([label, val]) => (
                          <div key={label}>
                            <span className="m-label">{label}</span>
                            <span className="m-val">{val}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 24 }}>
                        <Link href="/analyze" className="btn btn-outline btn-sm">
                          Try {m.title.split(' ')[0].toLowerCase()} analysis <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                    <ModalityVisual kind={m.visual} />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="section" style={{ background: 'rgba(255,255,255,0.012)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <Reveal>
            <span className="eyebrow">How it works</span>
            <h2 className="section-title">From a strange message to a safer decision.</h2>
            <p className="section-lead">Four calm steps stand between an unexpected message and an expensive mistake.</p>
          </Reveal>
          <div className="process">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <Reveal key={s.no} delay={i * 90}>
                  <div className="step">
                    {i < steps.length - 1 && <ArrowRight className="step-arrow" size={18} />}
                    <span className="step-no">{s.no}</span>
                    <div className="step-icon">
                      <Icon size={20} />
                    </div>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <div className="container">
          <Reveal>
            <span className="eyebrow indigo">FAQ</span>
            <h2 className="section-title">Questions worth asking.</h2>
            <p className="section-lead">Honest answers about what BharatShield does — and, just as importantly, what it does not.</p>
          </Reveal>
          <Reveal>
            <Faq />
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div className="cta">
              <span className="eyebrow" style={{ justifyContent: 'center' }}>
                <Fingerprint size={14} /> Second opinion
              </span>
              <h2>
                Don&apos;t trust a message blindly.
                <br />
                Give it a second opinion.
              </h2>
              <p>Bring the text, audio, image, or video that made you pause. Get a clear, explainable read in seconds.</p>
              <div className="hero-actions">
                <Link href="/analyze" className="btn btn-primary">
                  {t.cta_analyze} <ArrowRight size={16} />
                </Link>
                <Link href="/demo" className="btn btn-ghost">
                  <Sparkles size={15} /> {t.cta_demo}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
