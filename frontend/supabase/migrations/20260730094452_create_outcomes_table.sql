/*
# PulseIQ: outcomes table (feedback loop persistence)

1. Purpose
   Stores every action-policy decision and its eventual outcome so the
   feedback loop (retrain + root-cause aggregation) survives across page
   reloads. Single-tenant demo app: no sign-in screen, so policies allow
   the anon-key frontend to read/write its own shared data.

2. New Tables
   - `outcomes`
     - id            uuid PK
     - customer_id   text (stable demo customer id)
     - customer_name text
     - risk_score    numeric(4,3)  0..1 churn risk
     - risk_band     text          low | moderate | high | critical
     - top_attribution text        feature that drove the risk score
     - selected_action  text       guided_tutorial | proactive_nudge | human_handoff | incentive
     - knowledge_response text     grounded response from the knowledge assistant
     - confidence    numeric(3,2)  0..1
     - outcome       text          pending | success | failure
     - created_at    timestamptz   when the decision was made
     - resolved_at   timestamptz   when the outcome was logged (nullable)

3. Security
   - RLS enabled.
   - anon + authenticated full CRUD: data is intentionally shared/demo.
   - USING(true)/WITH CHECK(true) is correct here because there is no
     ownership boundary; this is a single-tenant app with no sign-in.

4. Indexes
   - customer_id, selected_action, outcome for aggregation queries.
*/

CREATE TABLE IF NOT EXISTS outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text NOT NULL,
  customer_name text NOT NULL,
  risk_score numeric(4,3) NOT NULL,
  risk_band text NOT NULL DEFAULT 'moderate',
  top_attribution text NOT NULL,
  selected_action text NOT NULL,
  knowledge_response text NOT NULL DEFAULT '',
  confidence numeric(3,2) NOT NULL DEFAULT 0,
  outcome text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_outcomes" ON outcomes;
CREATE POLICY "anon_select_outcomes" ON outcomes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_outcomes" ON outcomes;
CREATE POLICY "anon_insert_outcomes" ON outcomes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_outcomes" ON outcomes;
CREATE POLICY "anon_update_outcomes" ON outcomes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_outcomes" ON outcomes;
CREATE POLICY "anon_delete_outcomes" ON outcomes FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_outcomes_customer ON outcomes (customer_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_action ON outcomes (selected_action);
CREATE INDEX IF NOT EXISTS idx_outcomes_outcome ON outcomes (outcome);
