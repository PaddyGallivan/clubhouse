// Platform-level stats
export async function onRequestGet({ env }) {
  const { results: clubs } = await env.DB.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM ch_memberships m WHERE m.club_id = c.id AND m.status = 'active') as member_count,
      (SELECT COUNT(*) FROM ch_fixtures f WHERE f.club_id = c.id) as fixture_count,
      (SELECT COALESCE(SUM(fr.amount_due - fr.amount_paid),0) FROM ch_fee_records fr WHERE fr.club_id = c.id AND fr.status IN ('owing','partial')) as fees_owing
    FROM clubs c ORDER BY c.name ASC
  `).all()
  const { results: totals } = await env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM clubs) as club_count,
      (SELECT COUNT(*) FROM ch_memberships WHERE status = 'active') as member_count,
      (SELECT COUNT(*) FROM ch_fixtures) as fixture_count,
      (SELECT COUNT(*) FROM ch_training_sessions) as session_count,
      (SELECT COUNT(*) FROM ch_users) as user_count
  `).all()
  return Response.json({ stats: totals[0], clubs })
}
