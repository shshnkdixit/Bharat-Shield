import { Router, type IRouter } from "express";
import { GetModelsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/models", (_req, res) => {
  const models = GetModelsResponse.parse([
    {
      name: "Text Risk Analysis",
      status: "Active Prototype",
      description: "Rule-based signal detection for urgency, payment pressure, links, and impersonation.",
    },
    {
      name: "Multilingual Layer",
      status: "Active",
      description: "English and Hindi interface copy with a structure ready for Punjabi and Bhojpuri.",
    },
    {
      name: "Risk Engine",
      status: "Active",
      description: "Shared 0–100 score and LOW, MEDIUM, HIGH, CRITICAL risk thresholds.",
    },
    {
      name: "Audio Analysis",
      status: "Prototype",
      description: "Metadata-only demo analyzer. No trained voice deepfake model is connected.",
    },
    {
      name: "Image Analysis",
      status: "Prototype",
      description: "Metadata-only demo analyzer. No trained image forensics model is connected.",
    },
    {
      name: "Video Analysis",
      status: "Prototype",
      description: "Metadata-only demo analyzer. No trained video deepfake model is connected.",
    },
  ]);
  res.json(models);
});

export default router;