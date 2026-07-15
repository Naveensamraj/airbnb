/*
# Enforce Maximum 3 Properties Limit

## Summary
Adds a database-level trigger that prevents more than 3 rows from being
inserted into the `houses` table. This is a hard backend validation that
works regardless of how the insert is attempted (frontend, API, direct SQL).

## Changes
1. Creates a trigger function `enforce_max_three_properties()` that:
   - Counts existing rows in `houses` before each INSERT.
   - If count >= 3, raises an exception that aborts the transaction.
   - The exception message is internal only — never exposed to the UI.
2. Attaches the trigger as a BEFORE INSERT trigger on `houses`.

## Security
- No RLS policy changes.
- The trigger runs with SECURITY DEFINER so it can count rows even under RLS.
- No new tables or columns created.

## Important Notes
- This is a system-wide limit of 3 total properties across all hosts.
- Deleting a property frees up a slot; the next insert will succeed.
- The trigger is idempotent (DROP IF EXISTS before CREATE).
*/

-- Drop existing trigger if re-running
DROP TRIGGER IF EXISTS trg_enforce_max_three_properties ON houses;

-- Create the trigger function
CREATE OR REPLACE FUNCTION enforce_max_three_properties()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count int;
BEGIN
  SELECT COUNT(*) INTO current_count FROM houses;
  IF current_count >= 3 THEN
    RAISE EXCEPTION 'Property limit reached'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

-- Attach as BEFORE INSERT trigger
CREATE TRIGGER trg_enforce_max_three_properties
  BEFORE INSERT ON houses
  FOR EACH ROW
  EXECUTE FUNCTION enforce_max_three_properties();
