import { supabase } from '../supabase.js'
import { log } from '../utils/logger.js'

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
}

export async function listArticles({ type, category_id, search, status, tags, page = 1, limit = 50 } = {}) {
  let query = supabase.from('kb_articles').select('*', { count: 'exact' })

  if (type) query = query.eq('type', type)
  if (category_id) query = query.eq('category_id', category_id)
  if (status) query = query.eq('status', status)
  if (tags && tags.length) query = query.contains('tags', tags)
  if (search) query = query.textSearch('idx_kb_articles_search', search, { config: 'english' })

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (error) throw error
  return { articles: data || [], total: count || 0, page, totalPages: Math.ceil((count || 0) / limit) }
}

export async function getArticle(id) {
  const { data, error } = await supabase
    .from('kb_articles')
    .select('*, kb_categories(name, slug)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getArticleBySlug(slug) {
  const { data, error } = await supabase
    .from('kb_articles')
    .select('*, kb_categories(name, slug)')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createArticle({ title, content = '', type = 'other', category_id, tags = [], status = 'draft', author, metadata = {} }) {
  const slug = slugify(title)
  if (!title) throw new Error('Title is required')

  const { data, error } = await supabase.from('kb_articles').insert({
    title, slug, content, type, category_id: category_id || null,
    tags, status, author: author || null, metadata,
  }).select().single()

  if (error) throw error
  log(`[KB] Created article "${title}" (${type})`, 'ok')
  return data
}

export async function updateArticle(id, updates) {
  const fields = {}
  if (updates.title !== undefined) {
    fields.title = updates.title
    fields.slug = slugify(updates.title)
  }
  if (updates.content !== undefined) fields.content = updates.content
  if (updates.type !== undefined) fields.type = updates.type
  if (updates.category_id !== undefined) fields.category_id = updates.category_id
  if (updates.tags !== undefined) fields.tags = updates.tags
  if (updates.status !== undefined) fields.status = updates.status
  if (updates.author !== undefined) fields.author = updates.author
  if (updates.metadata !== undefined) fields.metadata = updates.metadata
  fields.version = supabase.raw('version + 1')
  fields.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('kb_articles')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  log(`[KB] Updated article "${data.title}"`, 'ok')
  return data
}

export async function deleteArticle(id) {
  const { error } = await supabase.from('kb_articles').delete().eq('id', id)
  if (error) throw error
  log(`[KB] Deleted article ${id}`, 'ok')
  return { success: true }
}

export async function listCategories() {
  const { data, error } = await supabase
    .from('kb_categories')
    .select('*, kb_articles(count)')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return (data || []).map(c => ({
    ...c,
    article_count: c.kb_articles?.[0]?.count || 0,
    kb_articles: undefined,
  }))
}

export async function createCategory({ name, description, icon, parent_id, sort_order = 0 }) {
  const slug = slugify(name)
  if (!name) throw new Error('Category name is required')

  const { data, error } = await supabase.from('kb_categories').insert({
    name, slug, description: description || null,
    icon: icon || 'file-text', parent_id: parent_id || null, sort_order,
  }).select().single()

  if (error) throw error
  log(`[KB] Created category "${name}"`, 'ok')
  return data
}

export async function updateCategory(id, updates) {
  const fields = {}
  if (updates.name !== undefined) {
    fields.name = updates.name
    fields.slug = slugify(updates.name)
  }
  if (updates.description !== undefined) fields.description = updates.description
  if (updates.icon !== undefined) fields.icon = updates.icon
  if (updates.parent_id !== undefined) fields.parent_id = updates.parent_id
  if (updates.sort_order !== undefined) fields.sort_order = updates.sort_order

  const { data, error } = await supabase
    .from('kb_categories')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  const { count } = await supabase.from('kb_articles').select('*', { count: 'exact', head: true }).eq('category_id', id)
  if (count > 0) throw new Error(`Cannot delete category with ${count} article(s). Reassign or delete them first.`)

  const { error } = await supabase.from('kb_categories').delete().eq('id', id)
  if (error) throw error
  log(`[KB] Deleted category ${id}`, 'ok')
  return { success: true }
}
