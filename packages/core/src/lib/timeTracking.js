import { supabase } from '../supabase.js'
import { log } from '../utils/logger.js'

// ─── TIME ENTRIES ───

export async function listTimeEntries({ team_member, client_id, project_id, date_from, date_to, page = 1, limit = 50 } = {}) {
  let query = supabase.from('time_entries').select('*, clients(name), projects(name), tasks(title)', { count: 'exact' })

  if (team_member) query = query.eq('team_member', team_member)
  if (client_id) query = query.eq('client_id', client_id)
  if (project_id) query = query.eq('project_id', project_id)
  if (date_from) query = query.gte('date', date_from)
  if (date_to) query = query.lte('date', date_to)

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await query
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { entries: data || [], total: count || 0, page, totalPages: Math.ceil((count || 0) / limit) }
}

export async function createTimeEntry({ client_id, project_id, deal_id, task_id, team_member, description, duration_minutes, date, billable, hourly_rate }) {
  if (!team_member || !description || !duration_minutes) {
    throw new Error('team_member, description, and duration_minutes are required')
  }

  const { data, error } = await supabase.from('time_entries').insert({
    client_id: client_id || null,
    project_id: project_id || null,
    deal_id: deal_id || null,
    task_id: task_id || null,
    team_member,
    description,
    duration_minutes,
    date: date || new Date().toISOString().slice(0, 10),
    billable: billable !== undefined ? billable : true,
    hourly_rate: hourly_rate || 0,
  }).select().single()

  if (error) throw error
  log(`[Time] Entry logged: ${description} (${duration_minutes}min by ${team_member})`, 'ok')
  return data
}

export async function updateTimeEntry(id, updates) {
  const fields = {}
  if (updates.client_id !== undefined) fields.client_id = updates.client_id
  if (updates.project_id !== undefined) fields.project_id = updates.project_id
  if (updates.description !== undefined) fields.description = updates.description
  if (updates.duration_minutes !== undefined) fields.duration_minutes = updates.duration_minutes
  if (updates.date !== undefined) fields.date = updates.date
  if (updates.billable !== undefined) fields.billable = updates.billable
  if (updates.hourly_rate !== undefined) fields.hourly_rate = updates.hourly_rate
  fields.updated_at = new Date().toISOString()

  const { data, error } = await supabase.from('time_entries').update(fields).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteTimeEntry(id) {
  const { error } = await supabase.from('time_entries').delete().eq('id', id)
  if (error) throw error
  log(`[Time] Entry ${id} deleted`, 'ok')
  return { success: true }
}

// ─── TIMERS ───

export async function startTimer({ client_id, project_id, deal_id, task_id, team_member, description }) {
  if (!team_member) throw new Error('team_member is required')

  const existing = await getActiveTimer(team_member)
  if (existing) throw new Error('Already have a running timer. Stop it first.')

  const { data, error } = await supabase.from('timers').insert({
    client_id: client_id || null,
    project_id: project_id || null,
    deal_id: deal_id || null,
    task_id: task_id || null,
    team_member,
    description: description || '',
    started_at: new Date().toISOString(),
    status: 'running',
  }).select().single()

  if (error) throw error
  log(`[Time] Timer started by ${team_member}`, 'ok')
  return data
}

export async function pauseTimer(id) {
  const { data: timer, error: fetchError } = await supabase.from('timers').select('*').eq('id', id).single()
  if (fetchError || !timer) throw new Error('Timer not found')
  if (timer.status !== 'running') throw new Error('Timer is not running')

  const now = new Date().toISOString()
  const { data, error } = await supabase.from('timers').update({
    status: 'paused',
    paused_at: now,
  }).eq('id', id).select().single()

  if (error) throw error
  return data
}

export async function resumeTimer(id) {
  const { data: timer, error: fetchError } = await supabase.from('timers').select('*').eq('id', id).single()
  if (fetchError || !timer) throw new Error('Timer not found')
  if (timer.status !== 'paused') throw new Error('Timer is not paused')

  const pausedMs = timer.paused_at ? new Date().getTime() - new Date(timer.paused_at).getTime() : 0
  const totalPaused = (timer.total_paused_seconds || 0) + Math.round(pausedMs / 1000)

  const { data, error } = await supabase.from('timers').update({
    status: 'running',
    paused_at: null,
    total_paused_seconds: totalPaused,
  }).eq('id', id).select().single()

  if (error) throw error
  return data
}

export async function stopTimer(id) {
  const { data: timer, error: fetchError } = await supabase.from('timers').select('*').eq('id', id).single()
  if (fetchError || !timer) throw new Error('Timer not found')

  const now = new Date()
  const startedAt = new Date(timer.started_at)
  const totalMs = now.getTime() - startedAt.getTime()
  const pausedMs = (timer.total_paused_seconds || 0) * 1000
  const activeMs = Math.max(0, totalMs - pausedMs)
  const durationMinutes = Math.round(activeMs / 60000)

  if (durationMinutes < 1) throw new Error('Timer ran for less than a minute. Log time manually instead.')

  const { data: entry, error: entryError } = await supabase.from('time_entries').insert({
    client_id: timer.client_id,
    project_id: timer.project_id,
    deal_id: timer.deal_id,
    task_id: timer.task_id,
    team_member: timer.team_member,
    description: timer.description || 'Tracked time',
    duration_minutes: durationMinutes,
    date: startedAt.toISOString().slice(0, 10),
  }).select().single()

  if (entryError) throw entryError

  await supabase.from('timers').update({ status: 'stopped' }).eq('id', id)
  log(`[Time] Timer stopped: ${durationMinutes}min logged by ${timer.team_member}`, 'ok')
  return { entry, duration_minutes: durationMinutes }
}

export async function getActiveTimer(team_member) {
  const { data, error } = await supabase
    .from('timers')
    .select('*, projects(name), clients(name)')
    .eq('team_member', team_member)
    .in('status', ['running', 'paused'])
    .maybeSingle()

  if (error) throw error
  return data
}

export async function listActiveTimers() {
  const { data, error } = await supabase
    .from('timers')
    .select('*, projects(name), clients(name)')
    .in('status', ['running', 'paused'])
    .order('started_at', { ascending: false })

  if (error) throw error
  return data || []
}

// ─── REPORTS ───

export async function getTimeReport({ team_member, date_from, date_to, client_id, project_id } = {}) {
  let query = supabase.from('time_entries').select('*, clients(name), projects(name)')

  if (team_member) query = query.eq('team_member', team_member)
  if (client_id) query = query.eq('client_id', client_id)
  if (project_id) query = query.eq('project_id', project_id)
  if (date_from) query = query.gte('date', date_from)
  if (date_to) query = query.lte('date', date_to)

  const { data, error } = await query.order('date', { ascending: true })
  if (error) throw error

  const entries = data || []
  const totalMinutes = entries.reduce((s, e) => s + e.duration_minutes, 0)
  const billableMinutes = entries.filter(e => e.billable).reduce((s, e) => s + e.duration_minutes, 0)
  const billableAmount = entries.filter(e => e.billable).reduce((s, e) => s + (e.hourly_rate || 0) * (e.duration_minutes / 60), 0)

  const byProject = {}
  const byClient = {}
  const byMember = {}
  const byDay = {}

  for (const e of entries) {
    const pName = e.projects?.name || 'Unassigned'
    const cName = e.clients?.name || 'Unassigned'
    byProject[pName] = (byProject[pName] || 0) + e.duration_minutes
    byClient[cName] = (byClient[cName] || 0) + e.duration_minutes
    byMember[e.team_member] = (byMember[e.team_member] || 0) + e.duration_minutes
    const day = e.date?.slice(0, 10)
    if (day) byDay[day] = (byDay[day] || 0) + e.duration_minutes
  }

  return {
    total_minutes: totalMinutes,
    total_hours: Math.round((totalMinutes / 60) * 100) / 100,
    billable_minutes: billableMinutes,
    billable_hours: Math.round((billableMinutes / 60) * 100) / 100,
    billable_amount: Math.round(billableAmount * 100) / 100,
    entry_count: entries.length,
    by_project: Object.entries(byProject).map(([k, v]) => ({ name: k, minutes: v, hours: Math.round((v / 60) * 100) / 100 })),
    by_client: Object.entries(byClient).map(([k, v]) => ({ name: k, minutes: v, hours: Math.round((v / 60) * 100) / 100 })),
    by_member: Object.entries(byMember).map(([k, v]) => ({ name: k, minutes: v, hours: Math.round((v / 60) * 100) / 100 })),
    by_day: Object.entries(byDay).map(([k, v]) => ({ date: k, minutes: v, hours: Math.round((v / 60) * 100) / 100 })),
    entries,
  }
}

export async function getWeeklyReport({ week_start, team_member } = {}) {
  if (!week_start) {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    week_start = new Date(d.setDate(diff)).toISOString().slice(0, 10)
  }

  const week_end = new Date(week_start)
  week_end.setDate(week_end.getDate() + 6)

  return getTimeReport({
    team_member,
    date_from: week_start,
    date_to: week_end.toISOString().slice(0, 10),
  })
}
