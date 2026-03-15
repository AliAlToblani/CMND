-- Allow Batelco users (role='batelco') to view, create, and update contracts for Batelco customers
-- Batelco customers are those with partner_label = 'batelco'

-- Add partner_label to customers if missing (for Batelco partner tracking)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS partner_label text;

-- Ensure batelco is in app_role enum (idempotent)
DO $$
BEGIN
  ALTER TYPE app_role ADD VALUE 'batelco';
EXCEPTION
  WHEN duplicate_object THEN NULL; -- already exists
END
$$;

-- Batelco users can SELECT contracts for Batelco customers only
CREATE POLICY "Batelco users can view Batelco contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'batelco')
    AND customer_id IN (
      SELECT id FROM customers
      WHERE LOWER(COALESCE(partner_label::text, '')) = 'batelco'
    )
  );

-- Batelco users can INSERT contracts for Batelco customers only
CREATE POLICY "Batelco users can create Batelco contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'batelco')
    AND customer_id IN (
      SELECT id FROM customers
      WHERE LOWER(COALESCE(partner_label::text, '')) = 'batelco'
    )
  );

-- Batelco users can UPDATE contracts for Batelco customers only
CREATE POLICY "Batelco users can update Batelco contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'batelco')
    AND customer_id IN (
      SELECT id FROM customers
      WHERE LOWER(COALESCE(partner_label::text, '')) = 'batelco'
    )
  );
