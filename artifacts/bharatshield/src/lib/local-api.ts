import type {
  AnalysisResult,
  ClaimItem,
  EvidenceItem,
  EvidenceSeverity,
  ManipulationStage,
  MediaAuthenticity,
  ProvenanceInfo,
} from '@workspace/api-client-react';

/**
 * Client-side deterministic analysis service (FakeTrace threat engine).
 *
 * FakeTrace is deployed as a static Vite SPA (v0 preview + Vercel static
 * hosting). There is no API server running in either environment, so the
 * `/api/*` requests made by the generated API client used to resolve to the
 * SPA's index.html and fail. This module installs a `fetch` interceptor that
 * answers the known `/api/*` routes locally using a deterministic,
 * evidence-based risk engine. Every score is derived from concrete detected
 * signals — there is no random or fabricated output, and media authenticity /
 * deepfake claims are always reported as "Unavailable" because no forensic
 * model is connected in this build.
 */

type RiskLevel = AnalysisResult['riskLevel'];
type ContentType = AnalysisResult['contentType'];
type FileContentType = Exclude<ContentType, 'text'>;

// ---------------------------------------------------------------------------
// Deterministic detection rules
// ---------------------------------------------------------------------------

type DetectionRule = {
  category: string;
  label: string;
  points: number;
  severity: EvidenceSeverity;
  reason: string;
  patterns: RegExp[];
};

// Per the FakeTrace scoring spec: credentials +25, financial +20,
// suspicious URL +20, impersonation +15, urgency +10, contact +10, capped 100.
const RULES: DetectionRule[] = [
  {
    category: 'credentials',
    label: 'Credential / OTP request',
    points: 25,
    severity: 'high',
    reason:
      'Asks for confidential credentials (OTP, PIN, password, CVV or card details) that no legitimate organisation ever requests.',
    patterns: [
      /\bo\.?t\.?p\b/i,
      /one[\s-]?time[\s-]?(password|code|pin)/i,
      /\bpass\s?word\b/i,
      /\bpin\b/i,
      /\bcvv\b/i,
      /\bcard\s?(number|no\.?|details)\b/i,
      /net\s?banking\s?(login|password)/i,
      /ओटीपी|पासवर्ड|पिन|सीवीवी/i,
    ],
  },
  {
    category: 'financial',
    label: 'Financial / payment request',
    points: 20,
    severity: 'high',
    reason: 'Requests money, a payment, or a bank/UPI action.',
    patterns: [
      /\b(pay|payment|paid|transfer|deposit|remit)\b/i,
      /\bupi\b|gpay|google\s?pay|phonepe|paytm|bhim/i,
      /₹\s?\d|rs\.?\s?\d|inr\s?\d|\brupees?\b/i,
      /\b(fee|fine|penalty|charge|due|dues|outstanding|recharge)\b/i,
      /\b(refund|cashback|reimburse)\b/i,
      /\b(loan|emi)\b/i,
      /\bkyc\b|bank\s?account|account\s?(number|no\.?)/i,
      /भुगतान|पैसे|पैसा|बैंक|खाता|केवाईसी|शुल्क|जुर्माना/i,
    ],
  },
  {
    category: 'suspiciousUrl',
    label: 'Suspicious / shortened link',
    points: 20,
    severity: 'high',
    reason:
      'Contains a shortened or hidden link (or a raw IP address) that conceals its true destination.',
    patterns: [
      /(bit\.ly|tinyurl|t\.me|cutt\.ly|is\.gd|rebrand\.ly|goo\.gl|ow\.ly|shorturl|rb\.gy|tiny\.cc)/i,
      /https?:\/\/\d{1,3}(\.\d{1,3}){3}/i, // raw IP URL
      /https?:\/\/[^\s]*[-.](xyz|top|click|link|live|online|buzz|shop|club|info)(\/|\b)/i,
    ],
  },
  {
    category: 'link',
    label: 'Embedded link',
    points: 10,
    severity: 'medium',
    reason: 'Includes a web link or clickable URL that should be verified before opening.',
    patterns: [/https?:\/\//i, /\bwww\.[^\s]+/i, /\b[a-z0-9-]+\.(com|in|net|org|co)\b\/[^\s]/i],
  },
  {
    category: 'impersonation',
    label: 'Authority impersonation',
    points: 15,
    severity: 'medium',
    reason: 'Claims to represent a bank, government body, or other official authority.',
    patterns: [
      /\b(sbi|hdfc|icici|axis|kotak|pnb|rbi|reserve bank)\b/i,
      /income\s?tax|\bgst\b|govt\.?|government|ministry|municipal|electricity board/i,
      /\b(police|cyber\s?cell|cbi|court|customs)\b/i,
      /customer\s?(care|support)|support\s?team|help\s?desk|official/i,
      /courier|bluedart|fedex|dtdc|india\s?post|parcel/i,
      /सरकार|पुलिस|आधिकारिक|मंत्रालय|बैंक\s?अधिकारी/i,
    ],
  },
  {
    category: 'urgency',
    label: 'Urgency / time pressure',
    points: 10,
    severity: 'medium',
    reason: 'Uses urgency or a deadline to push you into acting before you can verify.',
    patterns: [
      /\b(urgent|immediately|right\s?now|asap|hurry|instant)\b/i,
      /\b(expire|expiring|expires|deactivat|last\s?chance|act\s?now|final\s?notice)\b/i,
      /\bwithin\s?\d+\s?(min|minute|hour|hr|day)/i,
      /\b(today|tonight|within\s?24|24\s?hours|30\s?minutes)\b/i,
      /तुरंत|अभी|आज|जल्दी|समय\s?सीमा|अंतिम/i,
    ],
  },
  {
    category: 'threat',
    label: 'Threat / consequence',
    points: 12,
    severity: 'high',
    reason: 'Threatens a negative consequence such as blocking, suspension, legal action or a fine.',
    patterns: [
      /\b(block|blocked|suspend|suspended|deactivat|disconnect|terminat|freeze|frozen)\b/i,
      /\b(arrest|legal\s?action|fir\b|lawsuit|court|jail|seized?)\b/i,
      /\b(penalty|fine|charged?)\b/i,
      /बंद|ब्लॉक|निलंबित|कानूनी|गिरफ्तार|जुर्माना/i,
    ],
  },
  {
    category: 'prize',
    label: 'Prize / reward lure',
    points: 12,
    severity: 'medium',
    reason: 'Offers an unexpected prize, reward, lottery, or gift to bait a response.',
    patterns: [
      /\b(won|winner|winning|congratulations|congrats)\b/i,
      /\b(lottery|prize|reward|lucky\s?draw|gift|voucher|bonus|jackpot)\b/i,
      /\bclaim\s?(your|now|reward|prize)\b/i,
      /बधाई|इनाम|लॉटरी|पुरस्कार|उपहार/i,
    ],
  },
  {
    category: 'contact',
    label: 'Unofficial contact channel',
    points: 10,
    severity: 'medium',
    reason: 'Directs you to an unofficial phone number, WhatsApp, or Telegram contact.',
    patterns: [
      /\bwhats\s?app\b|\btelegram\b/i,
      /call\s?(this\s?)?(number|no\.?|now)/i,
      /\b(dm|message)\s?(me|us)\b/i,
      /(\+91[\s-]?)?[6-9]\d{9}\b/,
      /संपर्क|कॉल\s?करें|व्हाट्सएप/i,
    ],
  },
  {
    category: 'action',
    label: 'Pressured call-to-action',
    points: 8,
    severity: 'low',
    reason: 'Pushes a specific action such as click, verify, update, share or forward.',
    patterns: [
      /\b(click|tap|verify|confirm|update|submit|activate|install|download)\b/i,
      /\b(share|forward|send\s?to\s?(all|everyone))\b/i,
      /क्लिक|सत्यापित|पुष्टि|शेयर|फॉरवर्ड|भेजें/i,
    ],
  },
];

function firstMatch(text: string, rule: DetectionRule): string | undefined {
  for (const pattern of rule.patterns) {
    const m = text.match(pattern);
    if (m && m[0]) return m[0].trim().slice(0, 60);
  }
  return undefined;
}

type Detection = {
  evidence: EvidenceItem[];
  categories: Set<string>;
};

function detectSignals(text: string): Detection {
  const evidence: EvidenceItem[] = [];
  const categories = new Set<string>();

  for (const rule of RULES) {
    const matched = firstMatch(text, rule);
    if (matched === undefined) continue;
    // "link" is superseded by "suspiciousUrl" to avoid double-counting URLs.
    if (rule.category === 'link' && categories.has('suspiciousUrl')) continue;
    categories.add(rule.category);
    evidence.push({
      category: rule.category,
      label: rule.label,
      severity: rule.severity,
      reason: rule.reason,
      points: rule.points,
      matched,
    });
  }

  return { evidence, categories };
}

// ---------------------------------------------------------------------------
// Scoring, confidence, and report builders
// ---------------------------------------------------------------------------

function scoreFromEvidence(evidence: EvidenceItem[]): { score: number; riskLevel: RiskLevel } {
  const raw = evidence.reduce((total, item) => total + item.points, 0);
  const score = Math.min(100, Math.max(0, raw));
  let riskLevel: RiskLevel = 'LOW';
  if (score >= 75) riskLevel = 'CRITICAL';
  else if (score >= 50) riskLevel = 'HIGH';
  else if (score >= 25) riskLevel = 'MEDIUM';
  return { score, riskLevel };
}

function computeConfidence(
  evidence: EvidenceItem[],
  textLength: number,
): { confidence: number; confidenceLabel: string } {
  const distinct = evidence.length;
  const highCount = evidence.filter((e) => e.severity === 'high').length;

  if (distinct === 0) {
    return { confidence: 25, confidenceLabel: 'Inconclusive / Needs Verification' };
  }

  let confidence = Math.min(92, 30 + distinct * 14 + highCount * 8);
  if (textLength < 20) confidence = Math.min(confidence, 45); // very little text to judge

  let confidenceLabel = 'Low';
  if (confidence >= 75) confidenceLabel = 'High';
  else if (confidence >= 50) confidenceLabel = 'Moderate';

  return { confidence, confidenceLabel };
}

function buildManipulationIntent(categories: Set<string>): ManipulationStage[] {
  const has = (c: string) => categories.has(c);
  return [
    {
      stage: 'Urgency',
      present: has('urgency'),
      detail: has('urgency')
        ? 'Time pressure is used to rush a decision.'
        : 'No explicit time pressure detected.',
    },
    {
      stage: 'Fear',
      present: has('threat') || has('prize'),
      detail: has('threat')
        ? 'A threatened consequence is used to create fear.'
        : has('prize')
          ? 'A prize/reward is used to trigger excitement (fear of missing out).'
          : 'No fear or excitement trigger detected.',
    },
    {
      stage: 'Authority',
      present: has('impersonation'),
      detail: has('impersonation')
        ? 'The message poses as a trusted authority.'
        : 'No authority impersonation detected.',
    },
    {
      stage: 'Money / Info',
      present: has('financial') || has('credentials'),
      detail: has('credentials')
        ? 'It tries to extract confidential credentials.'
        : has('financial')
          ? 'It tries to extract money or a financial action.'
          : 'No direct request for money or credentials detected.',
    },
    {
      stage: 'Action',
      present: has('action') || has('suspiciousUrl') || has('link') || has('contact'),
      detail:
        has('action') || has('suspiciousUrl') || has('link') || has('contact')
          ? 'It funnels you toward a link, contact, or click.'
          : 'No specific action funnel detected.',
    },
  ];
}

function buildClaims(text: string, categories: Set<string>): ClaimItem[] {
  const contradiction =
    categories.has('impersonation') &&
    (categories.has('suspiciousUrl') || categories.has('contact') || categories.has('link'));

  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const claimIndicator =
    /\b(your|you|account|won|winner|selected|blocked|suspend|expire|refund|kyc|verify|penalty|pending|has been|will be|are required|update)\b/i;

  const claims: ClaimItem[] = [];
  for (const sentence of sentences) {
    if (!claimIndicator.test(sentence)) continue;
    if (contradiction) {
      claims.push({
        text: sentence.slice(0, 200),
        status: 'Contradictory',
        note: 'Claims official authority yet routes you through an unofficial link or number — internally inconsistent.',
      });
    } else {
      claims.push({
        text: sentence.slice(0, 200),
        status: 'Unverified',
        note: 'This claim cannot be verified from the message alone. Confirm it through an official, independent channel.',
      });
    }
    if (claims.length >= 4) break;
  }

  if (claims.length === 0) {
    claims.push({
      text: 'No specific verifiable claim was detected in this message.',
      status: 'Unverified',
      note: 'No external fact-checking source is connected, so nothing here can be marked as independently supported.',
    });
  }

  return claims;
}

function threatTypesFrom(evidence: EvidenceItem[]): string[] {
  return Array.from(new Set(evidence.map((e) => e.label)));
}

function beforeYouShareFor(level: RiskLevel): string {
  switch (level) {
    case 'CRITICAL':
      return 'Do NOT share, pay, reply, or click. This message shows strong scam patterns — verify directly with the official organisation before doing anything.';
    case 'HIGH':
      return 'Do not forward or act yet. Independently verify the sender through an official channel before taking any action.';
    case 'MEDIUM':
      return 'Pause before sharing. Treat any request for money or personal details with caution and confirm through a trusted source.';
    default:
      return 'No strong scam patterns were found, but this is not proof of safety. Stay cautious with money, links, and personal details.';
  }
}

const TEXT_PROVENANCE: ProvenanceInfo = {
  status: 'No provenance data',
  detail:
    'Plain text carries no embedded content credentials (C2PA) or file metadata, so its origin cannot be cryptographically verified.',
};

const MEDIA_PROVENANCE: ProvenanceInfo = {
  status: 'No provenance data',
  detail:
    'Only file name, type, and size were provided. No embedded metadata (EXIF) or content credentials (C2PA) were available to verify origin.',
};

const MEDIA_AUTHENTICITY: MediaAuthenticity = {
  status: 'Unavailable',
  detail:
    'No forensic deepfake or manipulation model is connected in this build. FakeTrace cannot determine whether the media is AI-generated or edited, and will not claim a deepfake without evidence.',
};

const TEXT_LIMITATIONS = [
  'This is an automated, rule-based first-pass assessment — not a definitive verdict.',
  'It analyses the message text only; it cannot confirm the sender\u2019s real identity.',
  'Claims are marked unverified because no external fact-checking source is connected.',
  'Provenance verification requires content credentials that plain text does not carry.',
];

const MEDIA_LIMITATIONS = [
  'Media content is not transcribed or OCR-processed in this build, so its wording cannot be analysed.',
  'AI-generated / deepfake detection is unavailable — no forensic media model is connected.',
  'Only file metadata (name, type, size) is available; results reflect that metadata only.',
  'Provenance cannot be verified without embedded EXIF or C2PA content credentials.',
];

// ---------------------------------------------------------------------------
// In-memory history store
// ---------------------------------------------------------------------------

const history = new Map<string, AnalysisResult>();

function createId(): string {
  return `ft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function storeResult(result: AnalysisResult): AnalysisResult {
  history.set(result.id, result);
  return result;
}

// ---------------------------------------------------------------------------
// Public analysis functions (also used directly by the Demo lab)
// ---------------------------------------------------------------------------

type TextInput = { text: string; language?: 'en' | 'hi'; demo?: boolean; store?: boolean };
type FileInput = {
  fileName: string;
  fileType: string;
  fileSize: number;
  contentType: FileContentType;
  demo?: boolean;
};

export function analyzeMessage(input: TextInput): AnalysisResult {
  const { evidence, categories } = detectSignals(input.text);
  const { score, riskLevel } = scoreFromEvidence(evidence);
  const { confidence, confidenceLabel } = computeConfidence(evidence, input.text.trim().length);
  const language = input.language ?? (/[ऀ-ॿ]/.test(input.text) ? 'hi' : 'en');
  const threatTypes = threatTypesFrom(evidence);

  const explanation =
    evidence.length === 0
      ? 'No strong scam-style signals were found in this message. That is not proof it is safe — verify anything involving money, links, or personal details.'
      : `This message shows ${evidence.length} risk signal${evidence.length > 1 ? 's' : ''}: ${threatTypes
          .slice(0, 3)
          .join(', ')
          .toLowerCase()}${threatTypes.length > 3 ? ' and more' : ''}. These are common patterns used to pressure people into acting before they verify the source.`;

  const recommendations =
    score >= 50
      ? [
          'Do not transfer money or share OTP, password, PIN, or CVV.',
          'Verify the source independently through an official channel.',
          'Avoid the links and attachments in this message.',
          'Report the message if it impersonates a bank or authority.',
        ]
      : [
          'Stay cautious even though few signals were found.',
          'Verify important or unexpected requests through an official channel.',
        ];

  return storeResult({
    id: createId(),
    score,
    riskLevel,
    signals:
      evidence.length > 0
        ? evidence.map((e) => e.label)
        : ['No strong rule-based signals found'],
    explanation,
    recommendations,
    prototype: true,
    demo: input.demo === true,
    contentType: 'text',
    language,
    sourceLabel: 'Message text',
    createdAt: new Date().toISOString(),
    confidence,
    confidenceLabel,
    threatTypes,
    evidence,
    claims: buildClaims(input.text, categories),
    manipulationIntent: buildManipulationIntent(categories),
    provenance: TEXT_PROVENANCE,
    beforeYouShare: beforeYouShareFor(riskLevel),
    limitations: TEXT_LIMITATIONS,
  });
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 255);
}

export function analyzeFile(input: FileInput): AnalysisResult {
  // Only the file NAME carries analysable text; media content extraction
  // (OCR / transcription) is not available in this build. We run the same
  // deterministic engine on the filename and are explicit that media
  // authenticity / deepfake detection is unavailable — never fabricated.
  const { evidence, categories } = detectSignals(input.fileName);
  const { score, riskLevel } = scoreFromEvidence(evidence);
  const contentLabel = input.contentType[0].toUpperCase() + input.contentType.slice(1);
  const threatTypes = threatTypesFrom(evidence);

  const explanation = `FakeTrace could only inspect the ${contentLabel.toLowerCase()} file's name, type, and size — its actual content was not transcribed or scanned by a forensic model. ${
    evidence.length > 0
      ? 'The file name alone contains suspicious wording (shown below).'
      : 'No suspicious signals were found in the available metadata.'
  } Media authenticity (AI-generated / manipulated) could not be assessed.`;

  return storeResult({
    id: createId(),
    score,
    riskLevel,
    signals: [
      `${contentLabel} content analysis unavailable (no OCR/transcription in this build)`,
      ...evidence.map((e) => `Filename signal: ${e.label}`),
    ],
    explanation,
    recommendations: [
      'Do not act on the media until you verify its source independently.',
      'Be aware that AI-generated media cannot be ruled out by this build.',
      'Check whether the sender and context are what they claim to be.',
    ],
    prototype: true,
    demo: input.demo === true,
    contentType: input.contentType,
    language: 'en',
    sourceLabel: sanitizeFileName(input.fileName),
    createdAt: new Date().toISOString(),
    confidence: evidence.length > 0 ? 40 : 20,
    confidenceLabel: 'Inconclusive / Needs Verification',
    threatTypes,
    evidence,
    claims: [
      {
        text: 'Media content was not transcribed or OCR-processed.',
        status: 'Unverified',
        note: 'Content extraction is not available in this build, so no claims could be read from the media itself.',
      },
    ],
    manipulationIntent: buildManipulationIntent(categories),
    provenance: MEDIA_PROVENANCE,
    mediaAuthenticity: MEDIA_AUTHENTICITY,
    beforeYouShare: beforeYouShareFor(riskLevel),
    limitations: MEDIA_LIMITATIONS,
  });
}

const MODELS = [
  {
    name: 'Text Threat Engine',
    status: 'Active',
    description:
      'Deterministic, evidence-based detection of urgency, impersonation, financial and credential requests, suspicious links, threats, and prize lures.',
  },
  {
    name: 'Evidence & Scoring',
    status: 'Active',
    description:
      'Transparent 0\u2013100 score built by summing weighted, named signals. Confidence is reported separately from risk.',
  },
  {
    name: 'Multilingual Layer',
    status: 'Active',
    description: 'English and Hindi patterns and interface copy, with structure ready for more languages.',
  },
  {
    name: 'Media Content Extraction',
    status: 'Unavailable',
    description:
      'OCR and speech-to-text are not connected. Audio/image/video files are analysed by metadata and file name only.',
  },
  {
    name: 'Media Authenticity / Deepfake',
    status: 'Unavailable',
    description:
      'No forensic deepfake model is connected. FakeTrace never claims media is AI-generated without real evidence.',
  },
  {
    name: 'Provenance (C2PA / EXIF)',
    status: 'Unavailable',
    description:
      'Content-credential verification requires embedded metadata that is not read in this build; provenance is reported as "No provenance data".',
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
  if (pathname === '/api/healthz' && method === 'GET') {
    return jsonResponse({ status: 'ok' });
  }

  if (pathname === '/api/models' && method === 'GET') {
    return jsonResponse(MODELS);
  }

  if (pathname === '/api/history' && method === 'GET') {
    const results = Array.from(history.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return jsonResponse(results);
  }

  if (pathname.startsWith('/api/history/') && method === 'DELETE') {
    const id = decodeURIComponent(pathname.slice('/api/history/'.length));
    if (!history.delete(id)) {
      return jsonResponse({ error: 'Analysis not found.' }, 404);
    }
    return noContentResponse();
  }

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
    return jsonResponse(analyzeMessage({ text, language }));
  }

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
