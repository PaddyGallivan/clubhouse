(function() {
  const API_BASE = 'https://clubhouse-e5e.pages.dev/api';
  const token = prompt('Paste your Clubhouse token (from your profile page):');
  if (!token) return;
  const slug = prompt('Enter your club slug (e.g. wps-football):');
  if (!slug) return;

  // ── Helper: parse score string "12 - 8" or "12-8" ──
  function parseScore(str) {
    if (!str) return [null, null];
    const m = str.toString().match(/(\d+)\s*[-–]\s*(\d+)/);
    return m ? [parseInt(m[1]), parseInt(m[2])] : [null, null];
  }

  // ── Detect page type from URL ──
  const url = window.location.href;
  const isLadder = url.includes('/ladder') || url.includes('/standings');
  const isFixtures = url.includes('/fixture') || url.includes('/result') || url.includes('/draw');

  const fixtures = [];
  const ladder = [];
  let competition = document.title || '';

  // ── Intercept PlayHQ's GraphQL responses ──
  // Wrap fetch to capture API responses
  const origFetch = window.fetch;
  const captured = [];
  window.fetch = function(...args) {
    return origFetch.apply(this, args).then(resp => {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
      if (url.includes('playhq.com/graphql') || url.includes('api.playhq')) {
        resp.clone().json().then(data => captured.push(data)).catch(() => {});
      }
      return resp;
    });
  };

  // ── DOM scraping — Fixtures/Results ──────────────────────────────────────
  function scrapeFixtures() {
    // PlayHQ fixture cards
    const cards = document.querySelectorAll('[class*="GameCard"], [class*="fixture-card"], [class*="game-card"], article[class*="game"]');
    cards.forEach(card => {
      const teams = card.querySelectorAll('[class*="TeamName"], [class*="team-name"], h3, h4');
      const dates = card.querySelectorAll('[class*="Date"], [class*="date"], time');
      const venue = card.querySelector('[class*="Venue"], [class*="venue"], [class*="ground"]');
      const scores = card.querySelectorAll('[class*="Score"], [class*="score"]');
      const roundEl = card.querySelector('[class*="Round"], [class*="round"]');

      if (teams.length >= 2) {
        const score1 = scores[0]?.textContent?.trim();
        const score2 = scores[1]?.textContent?.trim();
        const hasScore = score1 && /\d/.test(score1);

        fixtures.push({
          opponent: teams[1]?.textContent?.trim() || teams[0]?.textContent?.trim(),
          is_home: true, // best guess from position; admin can correct
          date: dates[0]?.getAttribute('datetime') || dates[0]?.textContent?.trim(),
          venue: venue?.textContent?.trim(),
          round: roundEl?.textContent?.replace(/[^0-9]/g, '') || '',
          round_name: roundEl?.textContent?.trim(),
          score_us: hasScore ? parseInt(score1) : null,
          score_them: hasScore ? parseInt(score2) : null,
        });
      }
    });

    // Fallback: generic table rows
    if (!fixtures.length) {
      document.querySelectorAll('table tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
          const [round, date, teams, score, venue] = [...cells].map(c => c.textContent.trim());
          const parts = teams?.split(/\s+v\.?\s+/i) || [];
          if (parts.length >= 2) {
            const [us, them] = parseScore(score);
            fixtures.push({
              round: round?.replace(/\D/g, '') || '',
              round_name: `Round ${round}`,
              date, opponent: parts[1],
              is_home: true,
              venue: venue || null,
              score_us: us, score_them: them,
            });
          }
        }
      });
    }
  }

  // ── DOM scraping — Ladder ─────────────────────────────────────────────────
  function scrapeLadder() {
    // PlayHQ ladder table
    const rows = document.querySelectorAll('[class*="LadderRow"], [class*="ladder-row"], tbody tr');
    rows.forEach((row, i) => {
      const cells = row.querySelectorAll('td, [class*="Cell"]');
      if (cells.length >= 5) {
        const arr = [...cells].map(c => c.textContent.trim());
        // Common format: Pos | Team | P | W | L | D | Pts | %
        const posMatch = arr[0]?.match(/^\d+$/);
        if (posMatch || arr.length >= 6) {
          const pos = parseInt(arr[0]) || (i + 1);
          const teamIdx = posMatch ? 1 : 0;
          ladder.push({
            position: pos,
            team_name: arr[teamIdx],
            played: parseInt(arr[teamIdx + 1]) || null,
            won: parseInt(arr[teamIdx + 2]) || null,
            lost: parseInt(arr[teamIdx + 3]) || null,
            drawn: parseInt(arr[teamIdx + 4]) || null,
            points: parseInt(arr[teamIdx + 5]) || null,
            percentage: parseFloat(arr[teamIdx + 6]) || null,
          });
        }
      }
    });
  }

  scrapeFixtures();
  scrapeLadder();

  // ── Also check captured GraphQL responses ────────────────────────────────
  // (If admin has navigated around and we captured API responses)
  setTimeout(() => {
    captured.forEach(data => {
      const season = data?.data?.season || data?.data?.competition;
      if (season?.rounds) {
        season.rounds.forEach(round => {
          (round.games || []).forEach(game => {
            fixtures.push({
              playhq_id: game.id,
              round: round.number?.toString() || '',
              round_name: round.name,
              opponent: game.awayTeam?.name || game.homeTeam?.name,
              is_home: true,
              date: game.date,
              venue: game.venueName,
              score_us: game.homeScore,
              score_them: game.awayScore,
            });
          });
        });
      }
      const ladderData = data?.data?.ladder || data?.data?.standings;
      if (ladderData) {
        (ladderData.rows || ladderData).forEach((row, i) => {
          ladder.push({
            position: row.position || (i + 1),
            team_name: row.team?.name || row.teamName,
            played: row.played, won: row.won, lost: row.lost,
            drawn: row.drawn, points: row.points,
            percentage: row.percentage,
          });
        });
      }
    });

    const total = fixtures.length + ladder.length;
    if (!total) {
      alert('No fixture or ladder data found on this page.\n\nMake sure you are on a PlayHQ fixtures, results, or ladder page and the content has fully loaded.');
      return;
    }

    const confirm_msg = `Found:\n• ${fixtures.length} fixtures/results\n• ${ladder.length} ladder rows\n\nSend to Clubhouse?`;
    if (!confirm(confirm_msg)) return;

    fetch(`${API_BASE}/clubs/${slug}/sync/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fixtures, ladder, competition, page_type: isLadder ? 'ladder' : 'fixtures' }),
    })
    .then(r => r.json())
    .then(data => {
      if (data.ok) {
        alert(`✅ Sync complete!\n\nFixtures: ${data.fixtures.inserted} new, ${data.fixtures.updated} updated\nLadder: ${data.ladder.inserted} new, ${data.ladder.updated} updated`);
      } else {
        alert('❌ Error: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(err => alert('❌ Failed: ' + err.message));
  }, 500);
})();