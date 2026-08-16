import { Router, type IRouter } from "express";
import {
  AnalyzeFileBody,
  AnalyzeTextBody,
  type AnalysisResult,
  type FileAnalysisInput,
  type TextAnalysisInput,
} from "@workspace/api-zod";
import {
  calculateRisk,
  HIGH_RISK_RECOMMENDATIONS,
  LOW_RISK_RECOMMENDATIONS,
  type RiskSignal,
} from "../lib/risk-engine";

const router: IRouter = Router();
const history = new Map<string, AnalysisResult>();

const textRules: Array<{
  pattern: RegExp;
  signal: string;
  points: number;
}> = [
  {
    pattern: /urgent|immediately|today|now|hurry|तुरंत|अभी|आज|जल्दी/i,
    signal: "Urgency detected",
    points: 20,
  },
  {
    pattern:
      /bank|account|kyc|payment|money|₹|rs\.?|upi|loan|refund|बैंक|खाता|केवाईसी|पैसे|भुगतान/i,
    signal: "Financial request detected",
    points: 22,
  },
  {
    pattern: /otp|password|pin|cvv|credential|पासवर्ड|ओटीपी|पिन/i,
    signal: "Credential request detected",
    points: 25,
  },
  {
    pattern: /https?:\/\/|www\.|bit\.ly|tinyurl|link|लिंक/i,
    signal: "Suspicious link detected",
    points: 18,
  },
  {
    pattern:
      /blocked|block|suspend|legal|police|arrest|close|बंद|ब्लॉक|निलंबित|पुलिस/i,
    signal: "Threat or consequence detected",
    points: 18,
  },
  {
    pattern:
      /sbi|rbi|income tax|government|police|support|customer care|official|बैंक|सरकार|आधिकारिक/i,
    signal: "Possible impersonation detected",
    points: 12,
  },
  {
    pattern: /click|tap|verify|complete|send|share|call|क्लिक|सत्यापित|भेजें|शेयर/i,
    signal: "Suspicious call-to-action detected",
    points: 12,
  },
];

function createId() {
  return `bs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function storeResult(result: AnalysisResult) {
  history.set(result.id, result);
  return result;
}

function analyzeText(input: TextAnalysisInput): AnalysisResult {
  const signals: RiskSignal[] = textRules
    .filter((rule) => rule.pattern.test(input.text))
    .map(({ signal, points }) => ({ label: signal, points }));
  const { score, riskLevel } = calculateRisk(signals);
  const language =
    input.language ?? (/[ऀ-ॿ]/.test(input.text) ? "hi" : "en");
  const signalLabels = signals.map((signal) => signal.label);
  const explanation =
    signals.length === 0
      ? "The prototype found limited scam-style signals in this message. That is not proof that it is safe."
      : `The message shows ${signalLabels
          .slice(0, 3)
          .join(", ")
          .toLowerCase()}${signalLabels.length > 3 ? " and other warning signs" : ""}. These patterns can be used to pressure someone into acting before verifying the source.`;

  return storeResult({
    id: createId(),
    score,
    riskLevel,
    signals:
      signalLabels.length > 0 ? signalLabels : ["No strong rule-based signals found"],
    explanation,
    recommendations:
      score >= 50 ? HIGH_RISK_RECOMMENDATIONS : LOW_RISK_RECOMMENDATIONS,
    prototype: true,
    demo: false,
    contentType: "text",
    language,
    sourceLabel: "Message text",
    createdAt: new Date(),
  });
}

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 255);
}

function analyzeFile(input: FileAnalysisInput): AnalysisResult {
  const baseScores: Record<FileAnalysisInput["contentType"], number> = {
    audio: 66,
    image: 56,
    video: 70,
  };
  const suspiciousName = /fake|scam|urgent|edited|deepfake|suspicious|demo/i.test(
    input.fileName,
  );
  const score = Math.min(
    100,
    baseScores[input.contentType] + (input.demo || suspiciousName ? 8 : 0),
  );
  const { riskLevel } = calculateRisk([{ label: "prototype", points: score }]);
  const contentLabel =
    input.contentType[0].toUpperCase() + input.contentType.slice(1);

  return storeResult({
    id: createId(),
    score,
    riskLevel,
    signals: [
      `${contentLabel} prototype analyzer active`,
      "Content requires further verification",
      ...(input.demo ? ["Demo data supplied"] : []),
    ],
    explanation: `This prototype reviewed the file type, size, and filename metadata for ${contentLabel.toLowerCase()} content. It did not inspect the media with a trained forensic model.`,
    recommendations: HIGH_RISK_RECOMMENDATIONS,
    prototype: true,
    demo: input.demo === true,
    contentType: input.contentType,
    language: "en",
    sourceLabel: sanitizeFileName(input.fileName),
    createdAt: new Date(),
  });
}

router.post("/analyze/text", (req, res) => {
  const parsed = AnalyzeTextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a message between 1 and 10,000 characters." });
    return;
  }

  res.json(analyzeText(parsed.data));
});

router.post("/analyze/file", (req, res) => {
  const parsed = AnalyzeFileBody.safeParse(req.body);
  if (
    !parsed.success ||
    !Number.isInteger(parsed.data.fileSize) ||
    parsed.data.fileSize <= 0
  ) {
    res.status(400).json({ error: "Provide valid non-empty file metadata." });
    return;
  }

  res.json(analyzeFile(parsed.data));
});

router.get("/history", (_req, res) => {
  const results = Array.from(history.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  res.json(results);
});

router.delete("/history/:id", (req, res) => {
  if (!history.delete(req.params.id)) {
    res.status(404).json({ error: "Analysis not found." });
    return;
  }
  res.status(204).send();
});

export default router;