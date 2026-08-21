import type { AnalysisResult } from '@workspace/api-client-react';

/**
 * Client-side deterministic analysis service.
 *
 * BharatShield is deployed as a static Vite SPA (v0 preview + Vercel static
 * hosting). There is no API server running in either environment, so the
 * `/api/*` requests made by the generated API client used to resolve to the
 * SPA's index.html and fail with "The assessment could not be completed."
 *
 * This module installs a `fetch` interceptor that answers the known `/api/*`
 * routes locally using the same rule-based risk engine that the Express
 * prototype used. It is a safe, deterministic fallback that never fails and
 * requires no API keys, PORT, or BASE_PATH configuration. If a real analysis
 * backend is ever wired up, it can replace this layer without any UI changes.
 */

type RiskLevel = AnalysisResult['riskLevel'];
type ContentType = AnalysisResult['contentType'];
type FileContentType = Exclude<ContentType, 'text'>;

type RiskSignal = { label: string; points: number };

// ---------------------------------------------------------------------------
// Risk engine (ported from the api-server prototype)
// ---------------------------------------------------------------------------

function calculateRisk(signals: RiskSignal[]): { score: number; riskLevel: RiskLevel } {
  const score = Math.min(
    100,
    Math.max(0, signals.reduce((total, signal) => total + signal.points, 0)),
  );

  let riskLevel: RiskLevel = 'LOW';
  if (score >= 75) riskLevel = 'CRITICAL';
  else if (score >= 50) riskLevel = 'HIGH';
  else if (score >= 25) riskLevel = 'MEDIUM';

  return { score, riskLevel };
}

const HIGH_RISK_RECOMMENDATIONS = [
  'Verify the source independently before acting.',
  'Do not transfer money or share OTP, password, PIN, or CVV.',
  'Avoid suspicious links and unexpected attachments.',
  'Confirm the sender through another trusted channel.',
];

const LOW_RISK_RECOMMENDATIONS = [
  'The prototype found limited risk signals, but stay cautious.',
  'Verify important requests through an official channel.',
];

const textRules: Array<{ pattern: RegExp; signal: string; points: number }> = [
  {
    pattern: /urgent|immediately|today|now|hurry|तुरंत|अभी|आज|जल्दी/i,
    signal: 'Urgency detected',
    points: 20,
  },
  {
    pattern:
      /bank|account|kyc|payment|money|₹|rs\.?|upi|loan|refund|बैंक|खाता|केवाईसी|पैसे|भुगतान/i,
    signal: 'Financial request detected',
    points: 22,
  },
  {
    pattern: /otp|password|pin|cvv|credential|पासवर्ड|ओटीपी|पिन/i,
    signal: 'Credential request detected',
    points: 25,
  },
  {
    pattern: /https?:\/\/|www\.|bit\.ly|tinyurl|link|लिंक/i,
    signal: 'Suspicious link detected',
    points: 18,
  },
  {
    pattern: /blocked|block|suspend|legal|police|arrest|close|बंद|ब्लॉक|निलंबित|पुलिस/i,
    signal: 'Threat or consequence detected',
    points: 18,
  },
  {
    pattern:
      /sbi|rbi|income tax|government|police|support|customer care|official|बैंक|सरकार|आधिकारिक/i,
    signal: 'Possible impersonation detected',
    points: 12,
  },
  {
    pattern: /click|tap|verify|complete|send|share|call|क्लिक|सत्यापित|भेजें|शेयर/i,
    signal: 'Suspicious call-to-action detected',
    points: 12,
  },
];

// ---------------------------------------------------------------------------
// In-memory history store (mirrors the prototype server's behaviour)
// ---------------------------------------------------------------------------

const history = new Map<string, AnalysisResult>();

function createId(): string {
  return `bs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function storeResult(result: AnalysisResult): AnalysisResult {
  history.set(result.id, result);
  return result;
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

type TextInput = { text: string; language?: 'en' | 'hi' };
type FileInput = {
  fileName: string;
  fileType: string;
  fileSize: number;
  contentType: FileContentType;
  demo?: boolean;
};

function analyzeText(input: TextInput): AnalysisResult {
  const signals: RiskSignal[] = textRules
    .filter((rule) => rule.pattern.test(input.text))
    .map(({ signal, points }) => ({ label: signal, points }));
  const { score, riskLevel } = calculateRisk(signals);
  const language = input.language ?? (/[ऀ-ॿ]/.test(input.text) ? 'hi' : 'en');
  const signalLabels = signals.map((signal) => signal.label);
  const explanation =
    signals.length === 0
      ? 'The prototype found limited scam-style signals in this message. That is not proof that it is safe.'
      : `The message shows ${signalLabels
          .slice(0, 3)
          .join(', ')
          .toLowerCase()}${signalLabels.length > 3 ? ' and other warning signs' : ''}. These patterns can be used to pressure someone into acting before verifying the source.`;

  return storeResult({
    id: createId(),
    score,
    riskLevel,
    signals: signalLabels.length > 0 ? signalLabels : ['No strong rule-based signals found'],
    explanation,
    recommendations: score >= 50 ? HIGH_RISK_RECOMMENDATIONS : LOW_RISK_RECOMMENDATIONS,
    prototype: true,
    demo: false,
    contentType: 'text',
    language,
    sourceLabel: 'Message text',
    createdAt: new Date().toISOString(),
  });
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 255);
}

function analyzeFile(input: FileInput): AnalysisResult {
  const baseScores: Record<FileContentType, number> = { audio: 66, image: 56, video: 70 };
  const suspiciousName = /fake|scam|urgent|edited|deepfake|suspicious|demo/i.test(input.fileName);
  const score = Math.min(100, baseScores[input.contentType] + (input.demo || suspiciousName ? 8 : 0));
  const { riskLevel } = calculateRisk([{ label: 'prototype', points: score }]);
  const contentLabel = input.contentType[0].toUpperCase() + input.contentType.slice(1);

  return storeResult({
    id: createId(),
    score,
    riskLevel,
    signals: [
      `${contentLabel} prototype analyzer active`,
      'Content requires further verification',
      ...(input.demo ? ['Demo data supplied'] : []),
    ],
    explanation: `This prototype reviewed the file type, size, and filename metadata for ${contentLabel.toLowerCase()} content. It did not inspect the media with a trained forensic model.`,
    recommendations: HIGH_RISK_RECOMMENDATIONS,
    prototype: true,
    demo: input.demo === true,
    contentType: input.contentType,
    language: 'en',
    sourceLabel: sanitizeFileName(input.fileName),
    createdAt: new Date().toISOString(),
  });
}

const MODELS = [
  {
    name: 'Text Risk Analysis',
    status: 'Active Prototype',
    description:
      'Rule-based signal detection for urgency, payment pressure, links, and impersonation.',
  },
  {
    name: 'Multilingual Layer',
    status: 'Active',
    description:
      'English and Hindi interface copy with a structure ready for Punjabi and Bhojpuri.',
  },
  {
    name: 'Risk Engine',
    status: 'Active',
    description: 'Shared 0–100 score and LOW, MEDIUM, HIGH, CRITICAL risk thresholds.',
  },
  {
    name: 'Audio Analysis',
    status: 'Prototype',
    description: 'Metadata-only demo analyzer. No trained voice deepfake model is connected.',
  },
  {
    name: 'Image Analysis',
    status: 'Prototype',
    description: 'Metadata-only demo analyzer. No trained image forensics model is connected.',
  },
  {
    name: 'Video Analysis',
    status: 'Prototype',
    description: 'Metadata-only demo analyzer. No trained video deepfake model is connected.',
  },
];

// ---------------------------------------------------------------------------
// Request routing
// ---------------------------------------------------------------------------

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function noContentResponse(): Response {
  return new Response(null, { status: 204 });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readBody(input: RequestInfo | URL, init?: RequestInit): Promise<unknown> {
  let raw: string | undefined;
  if (init?.body != null && typeof init.body === 'string') {
    raw = init.body;
  } else if (typeof Request !== 'undefined' && input instanceof Request) {
    raw = await input.clone().text();
  }
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

async function handleApiRequest(
  pathname: string,
  method: string,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  // Health check
  if (pathname === '/api/healthz' && method === 'GET') {
    return jsonResponse({ status: 'ok' });
  }

  // Models
  if (pathname === '/api/models' && method === 'GET') {
    return jsonResponse(MODELS);
  }

  // History list
  if (pathname === '/api/history' && method === 'GET') {
    const results = Array.from(history.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return jsonResponse(results);
  }

  // History delete
  if (pathname.startsWith('/api/history/') && method === 'DELETE') {
    const id = decodeURIComponent(pathname.slice('/api/history/'.length));
    if (!history.delete(id)) {
      return jsonResponse({ error: 'Analysis not found.' }, 404);
    }
    return noContentResponse();
  }

  // Text analysis
  if (pathname === '/api/analyze/text' && method === 'POST') {
    const body = await readBody(input, init);
    const text = isPlainObject(body) && typeof body.text === 'string' ? body.text : '';
    if (text.length < 1 || text.length > 10000) {
      return jsonResponse({ error: 'Enter a message between 1 and 10,000 characters.' }, 400);
    }
    const language =
      isPlainObject(body) && (body.language === 'en' || body.language === 'hi')
        ? body.language
        : undefined;
    return jsonResponse(analyzeText({ text, language }));
  }

  // File metadata analysis
  if (pathname === '/api/analyze/file' && method === 'POST') {
    const body = await readBody(input, init);
    const valid =
      isPlainObject(body) &&
      typeof body.fileName === 'string' &&
      body.fileName.length >= 1 &&
      typeof body.fileType === 'string' &&
      typeof body.fileSize === 'number' &&
      Number.isInteger(body.fileSize) &&
      body.fileSize > 0 &&
      body.fileSize <= 26214400 &&
      (body.contentType === 'audio' ||
        body.contentType === 'image' ||
        body.contentType === 'video');
    if (!valid) {
      return jsonResponse({ error: 'Provide valid non-empty file metadata.' }, 400);
    }
    return jsonResponse(
      analyzeFile({
        fileName: body.fileName as string,
        fileType: body.fileType as string,
        fileSize: body.fileSize as number,
        contentType: body.contentType as FileContentType,
        demo: body.demo === true,
      }),
    );
  }

  // Unknown API route
  return jsonResponse({ error: 'Not found.' }, 404);
}

// ---------------------------------------------------------------------------
// fetch interceptor
// ---------------------------------------------------------------------------

let installed = false;

function resolvePathname(input: RequestInfo | URL): string | null {
  let url: string;
  if (typeof input === 'string') url = input;
  else if (typeof URL !== 'undefined' && input instanceof URL) url = input.toString();
  else if (typeof Request !== 'undefined' && input instanceof Request) url = input.url;
  else return null;

  try {
    // Handles both relative ("/api/...") and absolute URLs.
    return new URL(url, typeof location !== 'undefined' ? location.origin : 'http://localhost')
      .pathname;
  } catch {
    return url.startsWith('/') ? url.split('?')[0] : null;
  }
}

export function installLocalApi(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const pathname = resolvePathname(input);

    if (pathname && pathname.startsWith('/api/')) {
      const method = (
        init?.method ??
        (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')
      ).toUpperCase();
      try {
        return await handleApiRequest(pathname, method, input, init);
      } catch (error) {
        console.error('[v0] Local API handler failed:', error);
        return jsonResponse({ error: 'The request could not be completed.' }, 500);
      }
    }

    return originalFetch(input, init);
  };
}
