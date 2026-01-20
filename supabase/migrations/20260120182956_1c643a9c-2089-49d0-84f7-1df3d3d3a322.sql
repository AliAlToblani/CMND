-- ============================================
-- SECURITY FIX: Tighten RLS Policies for Multiple Critical Tables
-- Fixes: project_manager_public_exposure, activity_logs_user_exposure, rls_permissive_policies
-- ============================================

-- ============================================
-- 1. FIX PROJECT_MANAGER TABLE - Remove public access
-- ============================================
DROP POLICY IF EXISTS "Allow all authenticated users full access to project_manager" ON project_manager;
DROP POLICY IF EXISTS "Enable all access" ON project_manager;

-- Create role-based policies for project_manager
CREATE POLICY "Authenticated users can view projects"
  ON project_manager FOR SELECT
  TO authenticated
  USING (true);  -- Read access for collaboration

CREATE POLICY "Admins and managers can insert projects"
  ON project_manager FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can update projects"
  ON project_manager FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and managers can delete projects"
  ON project_manager FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- ============================================
-- 2. FIX ACTIVITY_LOGS TABLE - Restrict to own logs + admins
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view activity logs" ON activity_logs;

-- Users can only view their own activity logs
CREATE POLICY "Users view own activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all activity logs
CREATE POLICY "Admins view all activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- 3. FIX CONTRACTS TABLE - Restrict to admin/manager
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view contracts" ON contracts;
DROP POLICY IF EXISTS "Authenticated users can create contracts" ON contracts;
DROP POLICY IF EXISTS "Authenticated users can update contracts" ON contracts;

-- Only admins and managers can view contracts
CREATE POLICY "Admins and managers can view contracts"
  ON contracts FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Only admins and managers can create contracts
CREATE POLICY "Admins and managers can create contracts"
  ON contracts FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Only admins and managers can update contracts
CREATE POLICY "Admins and managers can update contracts"
  ON contracts FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- ============================================
-- 4. FIX CALCULATOR_DRAFTS TABLE - Restrict to own drafts + admins/managers
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view calculator drafts" ON calculator_drafts;
DROP POLICY IF EXISTS "Authenticated users can create calculator drafts" ON calculator_drafts;
DROP POLICY IF EXISTS "Authenticated users can update calculator drafts" ON calculator_drafts;
DROP POLICY IF EXISTS "Authenticated users can delete calculator drafts" ON calculator_drafts;

-- Users can view their own drafts or if admin/manager
CREATE POLICY "Users view own drafts or admins view all"
  ON calculator_drafts FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Users can create their own drafts
CREATE POLICY "Users create own drafts"
  ON calculator_drafts FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Users can update their own drafts or if admin
CREATE POLICY "Users update own drafts or admins"
  ON calculator_drafts FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Users can delete their own drafts or if admin
CREATE POLICY "Users delete own drafts or admins"
  ON calculator_drafts FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

-- ============================================
-- 5. FIX CUSTOMERS TABLE - Restrict UPDATE to admin/manager
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;

-- Only admins and managers can update customers
CREATE POLICY "Admins and managers can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));