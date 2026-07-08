/**
 * Lead auto-assignment — conditional rules + round robin.
 * Mirrors runAssignment() in the CRM frontend store. Mutates the config's
 * rotation pointers in place; the caller is responsible for saving the doc.
 *
 * @param {object} config   AssignmentConfig mongoose doc (enabled, rules, fallback)
 * @param {string[]} activeNames  display names of Active users
 * @param {object} draft    { interest, source, city }
 * @returns {{assignee: string, via: string}}
 */
export function runAssignment(config, activeNames, draft = {}) {
  if (!config || !config.enabled) return { assignee: '', via: '' }

  const hay = {
    destination: (draft.interest || '').toLowerCase(),
    source: (draft.source || '').toLowerCase(),
    city: (draft.city || '').toLowerCase(),
  }

  for (const r of config.rules || []) {
    if (!r.enabled || !r.values?.length || !r.members?.length) continue
    if (!r.values.some((v) => (hay[r.field] || '').includes(String(v).toLowerCase()))) continue
    const pool = r.members.filter((m) => activeNames.includes(m))
    if (!pool.length) continue
    const name = pool[(r.next || 0) % pool.length]
    r.next = ((r.next || 0) + 1) % pool.length
    return { assignee: name, via: r.name }
  }

  const fb = config.fallback || { mode: 'all' }
  if (fb.mode === 'unassigned') return { assignee: '', via: '' }
  const pool = (fb.mode === 'members' && fb.members?.length ? fb.members : activeNames)
    .filter((m) => activeNames.includes(m))
  if (!pool.length) return { assignee: '', via: '' }
  const name = pool[(fb.next || 0) % pool.length]
  config.fallback.next = ((fb.next || 0) + 1) % pool.length
  return { assignee: name, via: 'Round robin' }
}

export default runAssignment
