-- ============================================================================
-- Add 'pending' and 'running' status to function_execution_logs
-- This allows tracking function calls from start to completion
-- ============================================================================

-- Drop the existing check constraint
alter table function_execution_logs 
  drop constraint if exists function_execution_logs_status_check;

-- Add new check constraint with additional statuses
alter table function_execution_logs 
  add constraint function_execution_logs_status_check 
  check (status in ('pending', 'running', 'success', 'error'));

-- Update index to include new statuses
drop index if exists idx_function_execution_logs_status;
create index idx_function_execution_logs_status on function_execution_logs(status);
