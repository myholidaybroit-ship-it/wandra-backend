/* ------------------------------------------------------------------
   Free-plan trial. Every agency put on the Free plan gets a time-boxed
   trial (default 7 days). Access is cut off automatically the moment the
   trial passes — enforced lazily at login + on every agency request, so
   no cron/background job is needed. The Wandra team can extend it, or the
   agency upgrades to Pro (which drops the trial entirely).
   ------------------------------------------------------------------ */
const DAY = 24 * 60 * 60 * 1000
export const TRIAL_DAYS = 7

/** A fresh trial window starting now. */
export function newTrial(days = TRIAL_DAYS) {
  const n = Number(days) > 0 ? Number(days) : TRIAL_DAYS
  const now = new Date()
  return {
    startedAt: now.toISOString(),
    endsAt: new Date(now.getTime() + n * DAY).toISOString(),
    lengthDays: n,
  }
}

/** Live trial status for an agency — only Free-plan agencies have a trial. */
export function trialState(agency) {
  const endsAt = agency?.trial?.endsAt || null
  const startedAt = agency?.trial?.startedAt || null
  if (agency?.plan !== 'Free' || !endsAt) {
    return { onTrial: false, expired: false, daysLeft: null, endsAt, startedAt }
  }
  const ends = new Date(endsAt).getTime()
  const now = Date.now()
  return {
    onTrial: true,
    expired: now > ends,
    daysLeft: Math.ceil((ends - now) / DAY),
    endsAt,
    startedAt,
  }
}

/** Extend (or start) a trial by N days from the later of now / current end. */
export function extendTrial(agency, days) {
  const n = Number(days)
  const cur = agency?.trial?.endsAt ? new Date(agency.trial.endsAt).getTime() : 0
  const base = Math.max(Date.now(), cur)
  return {
    startedAt: agency?.trial?.startedAt || new Date().toISOString(),
    endsAt: new Date(base + n * DAY).toISOString(),
    lengthDays: agency?.trial?.lengthDays || TRIAL_DAYS,
  }
}
