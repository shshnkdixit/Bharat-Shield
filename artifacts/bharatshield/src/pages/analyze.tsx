import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Image as ImageIcon, Loader2, Mic, UploadCloud, Video, X } from 'lucide-react';
import {
  useAnalyzeText,
  useAnalyzeFile,
  getGetHistoryQueryKey,
  type AnalysisResult,
  type FileAnalysisInputContentType,
} from '@workspace/api-client-react';
import { Reveal } from '@/lib/ui';
import { ResultCard, ResultEmpty } from '@/components/result-card';
import { t, type Lang } from '@/lib/i18n';

const TEXT_MAX = 10000;
const FILE_MAX = 26214400; // 25MB
const MODES = [
  { id: 'text', label: 'Text', icon: FileText, content: null },
  { id: 'audio', label: 'Audio', icon: Mic, content: 'audio' },
  { id: 'image', label: 'Image', icon: ImageIcon, content: 'image' },
  { id: 'video', label: 'Video', icon: Video, content: 'video' },
] as const;

type ModeId = (typeof MODES)[number]['id'];

const ACCEPT: Record<Exclude<ModeId, 'text'>, string> = {
  audio: 'audio/*',
  image: 'image/*',
  video: 'video/*',
};

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AnalyzePage({ lang }: { lang: Lang }) {
  const [mode, setMode] = useState<ModeId>('text');
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi'>(lang);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const analyzeText = useAnalyzeText();
  const analyzeFile = useAnalyzeFile();
  const pending = analyzeText.isPending || analyzeFile.isPending;

  const textCount = text.length;
  const overLimit = textCount > TEXT_MAX;

  const modeMeta = useMemo(() => MODES.find((m) => m.id === mode)!, [mode]);

  function reset(next: ModeId) {
    setMode(next);
    setFile(null);
    setError(null);
  }

  function pickFile(f: File | null) {
    setError(null);
    if (!f) return;
    if (f.size < 1) {
      setError('That file looks empty. Choose a different file.');
      return;
    }
    if (f.size > FILE_MAX) {
      setError(`File is too large. The prototype accepts up to ${fmtSize(FILE_MAX)}.`);
      return;
    }
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    try {
      if (mode === 'text') {
        const trimmed = text.trim();
        if (!trimmed) {
          setError('Paste the message you want to check first.');
          return;
        }
        if (overLimit) {
          setError(`Message is too long. Keep it under ${TEXT_MAX.toLocaleString()} characters.`);
          return;
        }
        const res = await analyzeText.mutateAsync({ data: { text: trimmed, language } });
        setResult(res);
      } else {
        if (!file) {
          setError('Choose a file to run the prototype check.');
          return;
        }
        const contentType = modeMeta.content as FileAnalysisInputContentType;
        const res = await analyzeFile.mutateAsync({
          data: {
            fileName: file.name,
            fileType: file.type || `${contentType}/unknown`,
            fileSize: file.size,
            contentType,
            demo: false,
          },
        });
        setResult(res);
      }
      qc.invalidateQueries({ queryKey: getGetHistoryQueryKey() });
    } catch (err) {
      const message =
        (err as { data?: { error?: string } })?.data?.error ||
        (err as Error)?.message ||
        'Something went wrong. Please try again.';
      setError(message);
    }
  }

  return (
    <div className="page">
      <section className="section section-tight">
        <div className="container">
          <Reveal className="page-head">
            <div className="eyebrow">Analysis workspace</div>
            <h1>{t(lang, 'analyzeTitle')}</h1>
            <p className="lede">{t(lang, 'analyzeLede')}</p>
          </Reveal>

          <div className="analyze-grid">
            {/* ---- Input column ---- */}
            <Reveal className="panel panel-pad analyze-input" as="div">
              <div className="mode-tabs" role="tablist" aria-label="Content type">
                {MODES.map((m) => {
                  const Icon = m.icon;
                  const active = m.id === mode;
                  return (
                    <button
                      key={m.id}
                      role="tab"
                      aria-selected={active}
                      className={`mode-tab ${active ? 'active' : ''}`}
                      onClick={() => reset(m.id)}
                      type="button"
                      data-testid={`tab-${m.id}`}
                    >
                      <Icon size={16} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={onSubmit} className="analyze-form">
                {mode === 'text' ? (
                  <div className="field">
                    <div className="field-row">
                      <label htmlFor="msg">Suspicious message</label>
                      <div className="lang-toggle" role="group" aria-label="Language">
                        {(['en', 'hi'] as const).map((l) => (
                          <button
                            key={l}
                            type="button"
                            className={language === l ? 'active' : ''}
                            onClick={() => setLanguage(l)}
                            data-testid={`lang-${l}`}
                          >
                            {l === 'en' ? 'English' : 'हिंदी'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      id="msg"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste an SMS, WhatsApp forward, email, or call transcript here..."
                      rows={9}
                      data-testid="input-text"
                      aria-invalid={overLimit}
                    />
                    <div className={`char-count ${overLimit ? 'over' : ''}`}>
                      {textCount.toLocaleString()} / {TEXT_MAX.toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="field">
                    <label>{modeMeta.label} file</label>
                    <div
                      className={`dropzone ${dragOver ? 'over' : ''} ${file ? 'filled' : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        pickFile(e.dataTransfer.files?.[0] ?? null);
                      }}
                      onClick={() => !file && fileInput.current?.click()}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && !file) fileInput.current?.click();
                      }}
                      data-testid="dropzone"
                    >
                      <input
                        ref={fileInput}
                        type="file"
                        accept={ACCEPT[mode as Exclude<ModeId, 'text'>]}
                        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                        hidden
                        data-testid="input-file"
                      />
                      {!file ? (
                        <div className="dz-empty">
                          <span className="dz-icon">
                            <UploadCloud size={24} />
                          </span>
                          <p className="dz-title">Drop your {modeMeta.label.toLowerCase()} here</p>
                          <p className="dz-sub">or click to browse — up to {fmtSize(FILE_MAX)}</p>
                        </div>
                      ) : (
                        <div className="dz-file">
                          <span className="dz-file-icon">
                            <modeMeta.icon size={20} />
                          </span>
                          <div className="dz-file-meta">
                            <strong data-testid="text-file-name">{file.name}</strong>
                            <span>{fmtSize(file.size)}</span>
                          </div>
                          <button
                            type="button"
                            className="dz-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                              if (fileInput.current) fileInput.current.value = '';
                            }}
                            aria-label="Remove file"
                            data-testid="button-remove-file"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="hint">
                      The prototype inspects file metadata only. Nothing is uploaded to a server for storage.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="notice warn" role="alert" data-testid="text-error">
                    {error}
                  </div>
                )}

                <button className="btn btn-primary btn-block" type="submit" disabled={pending} data-testid="button-analyze">
                  {pending ? (
                    <>
                      <Loader2 size={16} className="spin" /> Analyzing…
                    </>
                  ) : (
                    <>Run risk check</>
                  )}
                </button>
              </form>
            </Reveal>

            {/* ---- Result column ---- */}
            <div className="analyze-result">
              {result ? <ResultCard result={result} /> : <ResultEmpty />}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
