import { supabase } from '../supabase.js'
import { log } from '../utils/logger.js'

export async function listProjects({ status, client_id, page = 1, limit = 50 } = {}) {
  let query = supabase.from('projects').select('*, clients(name, email), project_milestones(count)', { count: 'exact' })

  if (status) query = query.eq('status', status)
  if (client_id) query = query.eq('client_id', client_id)

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return {
    projects: (data || []).map(p => ({
      ...p,
      milestone_count: p.project_milestones?.[0]?.count || 0,
      project_milestones: undefined,
    })),
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  }
}

export async function getProject(id) {
  const { data, error } = await supabase
    .from('projects')
    .select('*, clients(name, email, company_name)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createProject({ client_id, deal_id, name, description, assigned_team, start_date, target_date }) {
  if (!client_id || !name) throw new Error('Client and project name are required')

  const { data, error } = await supabase.from('projects').insert({
    client_id, deal_id: deal_id || null, name, description: description || null,
    assigned_team: assigned_team || [], start_date: start_date || null, target_date: target_date || null,
  }).select().single()

  if (error) throw error
  log(`[Projects] Created "${name}"`, 'ok')
  return data
}

export async function updateProject(id, updates) {
  const fields = {}
  if (updates.name !== undefined) fields.name = updates.name
  if (updates.description !== undefined) fields.description = updates.description
  if (updates.status !== undefined) fields.status = updates.status
  if (updates.assigned_team !== undefined) fields.assigned_team = updates.assigned_team
  if (updates.start_date !== undefined) fields.start_date = updates.start_date
  if (updates.target_date !== undefined) fields.target_date = updates.target_date
  if (updates.deal_id !== undefined) fields.deal_id = updates.deal_id
  if (updates.status === 'completed') fields.completed_at = new Date().toISOString()
  fields.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('projects')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  log(`[Projects] Updated "${data.name}"`, 'ok')
  return data
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
  log(`[Projects] Deleted ${id}`, 'ok')
  return { success: true }
}

export async function listMilestones(projectId) {
  const { data, error } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('due_date', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createMilestone({ project_id, name, description, due_date, sort_order }) {
  if (!project_id || !name) throw new Error('Project ID and milestone name are required')

  const { data, error } = await supabase.from('project_milestones').insert({
    project_id, name, description: description || null, due_date: due_date || null, sort_order: sort_order || 0,
  }).select().single()

  if (error) throw error
  log(`[Projects] Milestone "${name}" created`, 'ok')
  return data
}

export async function updateMilestone(id, updates) {
  const fields = {}
  if (updates.name !== undefined) fields.name = updates.name
  if (updates.description !== undefined) fields.description = updates.description
  if (updates.due_date !== undefined) fields.due_date = updates.due_date
  if (updates.status !== undefined) {
    fields.status = updates.status
    if (updates.status === 'completed') fields.completed_at = new Date().toISOString()
  }
  if (updates.sort_order !== undefined) fields.sort_order = updates.sort_order
  fields.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('project_milestones')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteMilestone(id) {
  const { error } = await supabase.from('project_milestones').delete().eq('id', id)
  if (error) throw error
  return { success: true }
}

export async function getClientProjects(clientId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*, project_milestones(*)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []).map(p => {
    const milestones = p.project_milestones || []
    const total = milestones.length
    const completed = milestones.filter(m => m.status === 'completed').length
    return { ...p, milestones, progress: total > 0 ? Math.round((completed / total) * 100) : 0 }
  })
}

export async function getClientProject(projectId, clientId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*, project_milestones(*)')
    .eq('id', projectId)
    .eq('client_id', clientId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const milestones = data.project_milestones || []
  const total = milestones.length
  const completed = milestones.filter(m => m.status === 'completed').length
  return { ...data, milestones, progress: total > 0 ? Math.round((completed / total) * 100) : 0 }
}
