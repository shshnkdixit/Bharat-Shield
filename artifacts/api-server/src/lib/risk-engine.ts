import type { AnalysisResult } from "@workspace/api-zod";

export type RiskLevel = AnalysisResult["riskLevel"];

export type RiskSignal = {
  label: string;
  points: number;
};

export function calculateRisk(signals: RiskSignal[]): {
  score: number;
  riskLevel: RiskLevel;
} {
  const score = Math.min(
    100,
    Math.max(0, signals.reduce((total, signal) => total + signal.points, 0)),
  );

  let riskLevel: RiskLevel = "LOW";
  if (score >= 75) riskLevel = "CRITICAL";
  else if (score >= 50) riskLevel = "HIGH";
  else if (score >= 25) riskLevel = "MEDIUM";

  return { score, riskLevel };
}

export const HIGH_RISK_RECOMMENDATIONS = [
  "Verify the source independently before acting.",
  "Do not transfer money or share OTP, password, PIN, or CVV.",
  "Avoid suspicious links and unexpected attachments.",
  "Confirm the sender through another trusted channel.",
];

export const LOW_RISK_RECOMMENDATIONS = [
  "The prototype found limited risk signals, but stay cautious.",
  "Verify important requests through an official channel.",
];