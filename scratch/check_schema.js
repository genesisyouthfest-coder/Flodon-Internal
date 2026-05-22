import '../packages/core/src/loadEnv.js'

async function getOpenApiSpec() {
  const url = `${process.env.SUPABASE_URL}/rest/v1/`
  console.log("Fetching OpenAPI schema from:", url)
  const res = await fetch(url, {
    headers: {
      'apikey': process.env.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
    }
  })
  const spec = await res.json()
  
  console.log("Client Definition:")
  console.log(JSON.stringify(spec.definitions.clients, null, 2))
}

getOpenApiSpec()
