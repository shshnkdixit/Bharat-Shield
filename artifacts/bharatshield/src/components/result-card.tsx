import { useState } from 'react';
import { Link } from 'wouter';
import { AlertTriangle, ArrowUpRight, Check, ChevronRight, ShieldAlert } from 'lucide-react';
import type { AnalysisResult } from '@workspace/api-client-react';
import { RiskBadge, RiskRing, riskMeta } from '@/lib/ui';

export function ResultCard({ result }: { result: AnalysisResult }) {
  const [saved, setSaved] = useState(false);
  const meta = riskMeta(result.riskLevel);

  return (
    <div className="panel panel-pad" data-testid="card-result">
      <div className="result-top">
        <RiskRing score={result.score} color={meta.color} caption="Risk score" />
        <div className="result-verdict">
          <div className="eyebrow no-rule" style={{ color: meta.color }}>
            {result.demo ? 'Demo data' : 'Assessment complete'}
          </div>
          <h3 style={{ color: meta.color }} data-testid="text-result-headline">
            {meta.headline}
          </h3>
          <RiskBadge level={result.riskLevel} />
          <p style={{ margin: '12px 0 0', color: 'var(--text-soft)', fontSize: 13.5 }}>{meta.action}.</p>
        </div>
      </div>

      <div className="result-section">
        <h4>What we found</h4>
        <p className="explanation" data-testid="text-result-explanation">
          {result.explanation}
        </p>
      </div>

      <div className="result-section">
        <h4>Detected signals</h4>
        <ul className="signal-list">
          {result.signals.map((s, i) => (
            <li key={i} data-testid={`text-signal-${i}`}>
              <ShieldAlert size={16} className="s-ico" />
              <span className="s-body">
                <span className="s-title">{s}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="result-section">
        <h4>Recommended next step</h4>
        <ul className="recommend-list">
          {result.recommendations.map((r, i) => (
            <li key={i}>
              <Check size={15} />
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <div className="result-meta">
          <span className="meta-tag">{result.contentType}</span>
          <span className="meta-tag">{result.language}</span>
          <span className="meta-tag">{result.prototype ? 'prototype model' : 'analysis'}</span>
        </div>
      </div>

      {result.id && !result.demo && (
        <div className="result-actions">
          <button
            className="btn btn-ghost"
            onClick={() => setSaved(true)}
            disabled={saved}
            data-testid="button-save-analysis"
          >
            {saved ? 'Saved to history' : 'Saved to history'} <Check size={15} />
          </button>
          <Link href="/history" className="btn btn-primary" data-testid="link-view-saved-analysis">
            View in history <ChevronRight size={15} />
          </Link>
        </div>
      )}

      {result.demo && (
        <div className="notice info" style={{ marginTop: 18, marginBottom: 0 }}>
          <AlertTriangle size={15} />
          <span>Demo data only. Run a real check on the Analyze page to create a saved assessment.</span>
        </div>
      )}
    </div>
  );
}

export function ResultEmpty() {
  return (
    <div className="panel result-empty">
      <div>
        <div className="empty-icon pulse">
          <ArrowUpRight size={26} />
        </div>
        <h3>Your readout will appear here</h3>
        <p>A score is only the start. We show the signals behind it and a practical next step.</p>
      </div>
    </div>
  );
}
