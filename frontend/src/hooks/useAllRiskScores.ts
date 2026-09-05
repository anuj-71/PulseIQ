import { useEffect, useState } from 'react';
import { getRiskScore } from '@/lib/riskEngine';
import type { RiskScoreResponse } from '@/lib/types';
import { customers } from '@/lib/customers';

export interface CustomerRisk {
  customerId: string;
  score: RiskScoreResponse | null;
  loading: boolean;
}

/** Computes risk scores for all customers in parallel (mock, instant-ish). */
export function useAllRiskScores() {
  const [rows, setRows] = useState<CustomerRisk[]>(
    () => customers.map((c) => ({ customerId: c.id, score: null, loading: true }))
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      // Resolve in parallel; update each as it lands for a staggered reveal.
      const promises = customers.map((c) =>
        getRiskScore(c.id).then((score) => ({ customerId: c.id, score, loading: false }))
      );
      // Stream results in order of resolution.
      for (const p of promises) {
        p.then((row) => {
          if (!active) return;
          setRows((prev) => prev.map((r) => (r.customerId === row.customerId ? row : r)));
        });
      }
      await Promise.all(promises);
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { rows, ready };
}
