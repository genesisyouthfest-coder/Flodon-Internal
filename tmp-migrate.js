import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://ulnjqrkdwheqskbcdxxj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbmpxcmtkd2hlcXNrYmNkeHhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyMjQxMiwiZXhwIjoyMDkwNzk4NDEyfQ.vm0Qfy1EAiXbPJNH3qDOETEdFuvYB-d6wBrMZ29vM0U'
)
async function run() {
  const { error: e1 } = await supabase.rpc('exec_sql', { sql: 'CREATE TABLE IF NOT EXISTS public.expenses (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), amount NUMERIC NOT NULL DEFAULT 0, category TEXT NOT NULL DEFAULT \'other\', description TEXT, date DATE NOT NULL DEFAULT CURRENT_DATE, created_at TIMESTAMPTZ DEFAULT NOW());' })
  if (e1) console.log('exec_sql not available:', e1.message)
  else console.log('Migration OK')
  const { error: e2 } = await supabase.rpc('exec_sql', { sql: 'CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);' })
  if (e2) console.log('Index error:', e2.message)
  const { error: e3 } = await supabase.rpc('exec_sql', { sql: 'ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS cogs_monthly NUMERIC DEFAULT 0;' })
  if (e3) console.log('cogs_monthly error:', e3.message)
  console.log('Done')
}
run()
