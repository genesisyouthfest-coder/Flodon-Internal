import crypto from 'crypto'
import { supabase } from '../supabase.js'
import { log } from '../utils/logger.js'

function generateApiKey() {
  const prefix = 'fk_'
  const randomBytes = crypto.randomBytes(32)
  const key = prefix + randomBytes.toString('hex')
  return key
}

function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex')
}

function getKeyPrefix(key) {
  return key.substring(0, 10) + '...'
}

export async function createApiKey({ name, permissions = [], rateLimit = 100, profileId }) {
  const key = generateApiKey()
  const keyHash = hashApiKey(key)
  const keyPrefix = key.substring(0, 8)

  const { error } = await supabase.from('api_keys').insert({
    name,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    permissions,
    rate_limit: rateLimit,
    profile_id: profileId || null,
  })

  if (error) throw error

  log(`[APIKeys] Created key "${name}" (${keyPrefix}...)`, 'ok')

  return {
    name,
    key,
    keyPrefix,
    permissions,
    rateLimit,
  }
}

export async function listApiKeys() {
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, permissions, rate_limit, last_used_at, expires_at, active, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function revokeApiKey(id) {
  const { error } = await supabase
    .from('api_keys')
    .update({ active: false })
    .eq('id', id)

  if (error) throw error
  return { success: true }
}

export async function validateApiKey(key) {
  if (!key || !key.startsWith('fk_')) return null

  const keyHash = hashApiKey(key)

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, permissions, rate_limit, profile_id, active, expires_at')
    .eq('key_hash', keyHash)
    .maybeSingle()

  if (error || !data) return null
  if (!data.active) return null
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null

  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)

  return {
    id: data.id,
    name: data.name,
    permissions: data.permissions,
    rateLimit: data.rate_limit,
    profileId: data.profile_id,
  }
}
