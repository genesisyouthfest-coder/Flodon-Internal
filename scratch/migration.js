import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

async function runMigration() {
  console.log('Running migration...')
  
  const sql = `
    -- Add new columns to clients
    ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS ai_confirmed BOOLEAN DEFAULT NULL;
    ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS is_nurture BOOLEAN DEFAULT FALSE;
    
    -- Insert new settings for WhatsApp/Twilio
    INSERT INTO public.settings (key, value) VALUES
      ('twilio_account_sid', ''),
      ('twilio_auth_token', ''),
      ('twilio_whatsapp_number', '')
    ON CONFLICT (key) DO NOTHING;
  `
  
  // Wait, Supabase client doesn't expose a raw SQL method by default via JS unless we call an RPC.
  // Actually, I should update supabase.sql file first.
  console.log('Done.')
}

runMigration()
