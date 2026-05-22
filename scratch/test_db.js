import '../packages/core/src/loadEnv.js'
import { supabase } from '../packages/core/src/supabase.js'

async function runTests() {
  console.log("Testing settings query...")
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'anthropic_api_key')
      .maybeSingle()
    
    if (error) {
      console.error("Settings query failed with error:", error)
    } else {
      console.log("Anthropic API key settings row:", data)
    }
  } catch (err) {
    console.error("Settings query exception:", err)
  }
}

runTests()


