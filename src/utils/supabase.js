import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://slwgtilibpkewwemkccd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsd2d0aWxpYnBrZXd3ZW1rY2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NjYwNzgsImV4cCI6MjA5NDM0MjA3OH0.FrWxOFBofEZEmeIWBP_OVCIH95DVTUfGCsK8RhR3-0U'
);
