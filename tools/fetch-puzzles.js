// Fetch themed Lichess puzzles and output in dashboard format
const { Chess } = require('chess.js');
const https = require('https');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'text/html' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch(e) { reject(e) } });
    }).on('error', reject);
  });
}

function pgnToFen(pgn, ply) {
  const chess = new Chess();
  const moves = pgn.split(/\s+/).filter(m => !m.match(/^\d+\./) && m.length > 0);
  for (let i = 0; i < ply && i < moves.length; i++) {
    const result = chess.move(moves[i]);
    if (!result) {
      // Try cleaning the move
      const cleaned = moves[i].replace(/[+#!?]+$/, '');
      const r2 = chess.move(cleaned);
      if (!r2) return null;
    }
  }
  return chess.fen();
}

async function getPuzzlesForTheme(theme, count, minRating, maxRating) {
  const puzzles = [];
  const seenIds = new Set();
  const attempts = count * 8;

  for (let i = 0; i < attempts && puzzles.length < count; i++) {
    try {
      const html = await fetch(`https://lichess.org/training/${theme}`);

      // Extract game PGN
      const pgnMatch = html.match(/"pgn":"([^"]+)"/);
      // Extract puzzle data
      const idMatch = html.match(/"puzzle":\{"id":"([^"]+)"/);
      const ratingMatch = html.match(/"puzzle":\{[^}]*"rating":(\d+)/);
      const solMatch = html.match(/"solution":\[([^\]]+)\]/);
      const plyMatch = html.match(/"initialPly":(\d+)/);
      const gameMatch = pgnMatch && idMatch;
      const puzzleMatch = idMatch && ratingMatch && solMatch && plyMatch;

      if (!gameMatch || !puzzleMatch) continue;

      const puzzleId = idMatch[1];
      if (seenIds.has(puzzleId)) continue;
      seenIds.add(puzzleId);

      const pgn = pgnMatch[1];
      const rating = parseInt(ratingMatch[1]);
      const solution = solMatch[1].replace(/"/g, '').split(',');
      const initialPly = parseInt(plyMatch[1]);

      // Filter by rating
      if (rating < minRating || rating > maxRating) continue;

      // Get FEN at puzzle position
      const fen = pgnToFen(pgn, initialPly);
      if (!fen) continue;

      puzzles.push({
        id: puzzleId,
        fen: fen,
        moves: solution.join(' '),
        rating: rating,
        theme: theme.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim(),
        solved: false
      });
      // small delay between requests
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`  Error: ${e.message}`);
    }
  }
  return puzzles;
}

async function main() {
  console.log('Fetching puzzles from Lichess...\n');

  // Ianna - beginner (widen to 600-1500 since lichess puzzles skew higher)
  const iannaThemes = [
    { theme: 'fork', count: 3, min: 600, max: 1500 },
    { theme: 'pin', count: 2, min: 600, max: 1500 },
    { theme: 'skewer', count: 2, min: 600, max: 1500 },
    { theme: 'discoveredAttack', count: 2, min: 600, max: 1500 },
  ];

  // Aarvi - intermediate (900-1500)
  const aarviThemes = [
    { theme: 'anastasiaMate', count: 2, min: 800, max: 1500 },
    { theme: 'arabianMate', count: 2, min: 800, max: 1500 },
    { theme: 'deflection', count: 2, min: 800, max: 1500 },
    { theme: 'kingsideAttack', count: 2, min: 800, max: 1500 },
  ];

  // Abhi - strong tactics (1000-1400)
  const abhiThemes = [
    { theme: 'smotheredMate', count: 2, min: 900, max: 1500 },
    { theme: 'backRankMate', count: 2, min: 900, max: 1400 },
    { theme: 'hookMate', count: 2, min: 800, max: 1400 },
    { theme: 'fork', count: 2, min: 1000, max: 1400 },
    { theme: 'discoveredAttack', count: 2, min: 1000, max: 1400 },
  ];

  const results = { ianna: [], aarvi: [], abhi: [] };

  for (const t of iannaThemes) {
    console.log(`Ianna: fetching ${t.theme} (${t.min}-${t.max})...`);
    const p = await getPuzzlesForTheme(t.theme, t.count, t.min, t.max);
    results.ianna.push(...p);
    console.log(`  Got ${p.length} puzzles`);
  }

  for (const t of aarviThemes) {
    console.log(`Aarvi: fetching ${t.theme} (${t.min}-${t.max})...`);
    const p = await getPuzzlesForTheme(t.theme, t.count, t.min, t.max);
    results.aarvi.push(...p);
    console.log(`  Got ${p.length} puzzles`);
  }

  for (const t of abhiThemes) {
    console.log(`Abhi: fetching ${t.theme} (${t.min}-${t.max})...`);
    const p = await getPuzzlesForTheme(t.theme, t.count, t.min, t.max);
    results.abhi.push(...p);
    console.log(`  Got ${p.length} puzzles`);
  }

  console.log('\n=== RESULTS ===\n');
  for (const [student, puzzles] of Object.entries(results)) {
    console.log(`// ${student.toUpperCase()} — ${puzzles.length} puzzles`);
    console.log(JSON.stringify(puzzles, null, 2));
    console.log('');
  }
}

main().catch(console.error);
