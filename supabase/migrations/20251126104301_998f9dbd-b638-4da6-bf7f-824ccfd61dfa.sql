-- Add manual stage override fields to customers table
ALTER TABLE customers
ADD COLUMN manual_stage TEXT,
ADD COLUMN manual_stage_note TEXT,
ADD COLUMN manual_stage_set_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN manual_stage_set_by UUID REFERENCES auth.users(id);

-- Update the pipeline trigger function to support manual overrides
CREATE OR REPLACE FUNCTION public.update_customer_pipeline_stage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_customer_id UUID;
  v_pipeline_stage TEXT;
  v_status TEXT;
  v_furthest_stage_index INTEGER := -1;
  v_current_stage_index INTEGER;
  v_canonical_name TEXT;
  v_has_completed BOOLEAN := FALSE;
  v_has_in_progress BOOLEAN := FALSE;
  v_is_churned BOOLEAN;
  v_go_live_completed BOOLEAN := FALSE;
  v_manual_stage TEXT;
  v_manual_stage_index INTEGER := -1;
  v_auto_calculated_stage TEXT;
  rec RECORD;
BEGIN
  v_customer_id := COALESCE(NEW.customer_id, OLD.customer_id);
  
  -- Get manual stage if set
  SELECT manual_stage INTO v_manual_stage
  FROM customers
  WHERE id = v_customer_id;
  
  -- Check if customer is churned
  SELECT (churn_date IS NOT NULL) INTO v_is_churned
  FROM customers
  WHERE id = v_customer_id;
  
  -- Loop through all lifecycle stages to calculate auto stage
  FOR rec IN 
    SELECT name, status 
    FROM lifecycle_stages 
    WHERE customer_id = v_customer_id
  LOOP
    v_canonical_name := INITCAP(LOWER(TRIM(rec.name)));
    
    IF v_canonical_name = 'Go Live' AND LOWER(TRIM(rec.status)) IN ('done', 'completed', 'complete', 'finished') THEN
      v_go_live_completed := TRUE;
    END IF;
    
    IF LOWER(TRIM(rec.status)) IN ('done', 'completed', 'complete', 'finished') THEN
      v_has_completed := TRUE;
      v_current_stage_index := -1;
      
      CASE 
        WHEN v_canonical_name IN ('Prospect', 'Meeting Set') THEN v_current_stage_index := 0;
        WHEN v_canonical_name IN ('Qualified Lead', 'Discovery Call') THEN v_current_stage_index := 1;
        WHEN v_canonical_name = 'Demo' THEN v_current_stage_index := 2;
        WHEN v_canonical_name IN ('Proposal Sent', 'Proposal Approved') THEN v_current_stage_index := 3;
        WHEN v_canonical_name IN ('Contract Sent', 'Contract Signed') THEN v_current_stage_index := 4;
        WHEN v_canonical_name IN ('Onboarding', 'Technical Setup', 'Training') THEN v_current_stage_index := 5;
        WHEN v_canonical_name = 'Go Live' THEN v_current_stage_index := 6;
        ELSE v_current_stage_index := -1;
      END CASE;
      
      IF v_current_stage_index > v_furthest_stage_index THEN
        v_furthest_stage_index := v_current_stage_index;
      END IF;
    END IF;
    
    IF LOWER(TRIM(rec.status)) IN ('in-progress', 'in progress', 'ongoing') THEN
      v_has_in_progress := TRUE;
    END IF;
  END LOOP;
  
  -- Override: Cannot be Live unless Go Live is completed
  IF v_furthest_stage_index = 6 AND NOT v_go_live_completed THEN
    v_furthest_stage_index := 5;
  END IF;
  
  -- Map auto-calculated stage
  CASE v_furthest_stage_index
    WHEN 0 THEN v_auto_calculated_stage := 'Lead';
    WHEN 1 THEN v_auto_calculated_stage := 'Qualified';
    WHEN 2 THEN v_auto_calculated_stage := 'Demo';
    WHEN 3 THEN v_auto_calculated_stage := 'Proposal';
    WHEN 4 THEN v_auto_calculated_stage := 'Contract';
    WHEN 5 THEN v_auto_calculated_stage := 'Implementation';
    WHEN 6 THEN v_auto_calculated_stage := 'Live';
    ELSE v_auto_calculated_stage := 'Lead';
  END CASE;
  
  -- Apply manual override logic
  IF v_manual_stage IS NOT NULL THEN
    -- Get manual stage index
    CASE v_manual_stage
      WHEN 'Lead' THEN v_manual_stage_index := 0;
      WHEN 'Qualified' THEN v_manual_stage_index := 1;
      WHEN 'Demo' THEN v_manual_stage_index := 2;
      WHEN 'Proposal' THEN v_manual_stage_index := 3;
      WHEN 'Contract' THEN v_manual_stage_index := 4;
      WHEN 'Implementation' THEN v_manual_stage_index := 5;
      WHEN 'Live' THEN v_manual_stage_index := 6;
      ELSE v_manual_stage_index := -1;
    END CASE;
    
    -- If auto stage has progressed beyond manual, clear manual and use auto
    IF v_furthest_stage_index > v_manual_stage_index THEN
      v_pipeline_stage := v_auto_calculated_stage;
      UPDATE customers SET manual_stage = NULL, manual_stage_note = NULL WHERE id = v_customer_id;
    ELSE
      -- Use manual stage
      v_pipeline_stage := v_manual_stage;
    END IF;
  ELSE
    -- No manual override, use auto-calculated
    v_pipeline_stage := v_auto_calculated_stage;
  END IF;
  
  -- Determine status
  IF v_is_churned THEN
    v_status := 'churned';
  ELSIF v_go_live_completed THEN
    v_status := 'done';
  ELSIF v_has_in_progress THEN
    v_status := 'in-progress';
  ELSIF v_has_completed THEN
    v_status := 'in-progress';
  ELSE
    v_status := 'not-started';
  END IF;
  
  UPDATE customers
  SET 
    stage = v_pipeline_stage,
    status = v_status,
    updated_at = NOW()
  WHERE id = v_customer_id;
  
  RETURN NEW;
END;
$function$;