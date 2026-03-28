// Generate puzzle data for Ianna, Aarvi, and Abhi
// Applies the Lichess setup move to get the actual puzzle FEN
// Then extracts the solution moves (remaining moves after setup)

var Chess = require('chess.js').Chess || require('chess.js');

// Raw Lichess puzzle data: { id, fen, moves, rating, themes }
// In Lichess format: first move = setup move, remaining = solution
var rawPuzzles = {
  // ═══ FORK PUZZLES ═══
  fork: [
    // Rating 654 - beginner
    { id: "002GQ", fen: "5rk1/5ppp/4p3/4N3/8/1Pn5/5PPP/5RK1 w - - 0 28", moves: "f1c1 c3e2 g1f1 e2c1", rating: 654, themes: "crushing,endgame,fork,short" },
    // Rating 773 - beginner
    { id: "rC07N", fen: "4r1k1/pp3p1b/7P/2p3p1/5qN1/2pP1P2/P1P3Q1/R4K2 b - - 1 35", moves: "f7f5 g4f6 g8h8 f6e8", rating: 773, themes: "advantage,endgame,fork,short" },
    // Rating 818 - beginner
    { id: "00EBZ", fen: "3rr1k1/p4pp1/1pp4p/3pPQ2/1P3P2/2P3qP/P2R2P1/5RK1 w - - 1 24", moves: "f1f3 g3e1 g1h2 e1d2", rating: 818, themes: "crushing,endgame,fork,short" },
    // Rating 838 - beginner
    { id: "rByws", fen: "8/1R3p2/1p2pk1p/6p1/3PP3/4n3/PK4PP/8 w - - 0 28", moves: "b7b6 e3c4 b2b3 c4b6", rating: 838, themes: "advantage,endgame,fork,short" },
    // Rating 858 - beginner
    { id: "rC13H", fen: "8/8/2r4p/1pk2Bp1/p5P1/PrpN3P/K4R2/8 b - - 1 45", moves: "c5c4 d3e5 c4d5 e5c6", rating: 858, themes: "crushing,endgame,fork,short" },
    // Rating 866 - beginner
    { id: "00GBX", fen: "r6k/pp2n1pp/2nN4/4p1Br/1PB5/2P4b/P3Nb1P/R2R3K b - - 1 22", moves: "h5g5 d6f7 h8g8 f7g5", rating: 866, themes: "advantage,discoveredAttack,discoveredCheck,fork,middlegame,short" },
    // Rating 973 - intermediate
    { id: "001wr", fen: "r4rk1/p3ppbp/Pp1q1np1/3PpbB1/2B5/2N5/1PPQ1PPP/3RR1K1 w - - 4 18", moves: "f2f3 d6c5 g1h1 c5c4", rating: 973, themes: "advantage,fork,master,masterVsMaster,middlegame,short" },
    // Rating 993 - intermediate
    { id: "003Jb", fen: "6k1/3bqr1p/2rpp1pR/p7/Pp1QP3/1B3P2/1PP3P1/2KR4 w - - 6 22", moves: "d4a7 e7g5 c1b1 g5h6", rating: 993, themes: "advantage,fork,master,middlegame,short" },
    // Rating 1007 - intermediate
    { id: "003jv", fen: "1R6/1p2k2p/p2n2p1/4K3/8/6P1/P6P/8 w - - 10 37", moves: "b8h8 d6f7 e5e4 f7h8", rating: 1007, themes: "crushing,endgame,fork,short" },
    // Rating 1008 - intermediate
    { id: "003jb", fen: "r3kb1r/p4ppp/b1p1p3/3q4/3Q4/4BN2/PPP2PPP/R3K2R b KQkq - 0 11", moves: "c6c5 d4a4 a6b5 a4b5", rating: 1008, themes: "crushing,fork,master,middlegame,short" },
    // Rating 1065 - intermediate
    { id: "003jH", fen: "rn3rk1/p5pp/3N4/4np1q/5Q2/1P3K2/PB1P2P1/2R4R w - - 0 25", moves: "f3f2 e5d3 f2e3 d3f4 h1h5 f4h5", rating: 1065, themes: "crushing,fork,long,middlegame" },
    // Rating 1107 - intermediate
    { id: "003r5", fen: "r2qr1k1/ppp2ppp/4b3/3P4/1nP2Q2/2N2N1P/PP3KP1/R4R2 w - - 1 15", moves: "d5e6 b4d3 f2g1 d3f4", rating: 1107, themes: "crushing,fork,middlegame,short" },
    // Rating 1335
    { id: "003mh", fen: "r4k1r/1pp2p2/p2p3p/3N4/3P2q1/8/PPP5/1K2Q1NR b - - 1 23", moves: "a8e8 e1e8 f8e8 d5f6 e8e7 f6g4", rating: 1335, themes: "advantage,attraction,fork,long,middlegame,sacrifice" },
  ],

  // ═══ PIN PUZZLES ═══
  pin: [
    // Rating 1287
    { id: "003nQ", fen: "6rk/pp6/2n5/3ppn1p/3p4/2P2P1q/PP3QNB/R4R1K w - - 2 29", moves: "f1g1 f5g3 f2g3 g8g3", rating: 1287, themes: "crushing,kingsideAttack,master,middlegame,pin,short" },
    // Rating 1308
    { id: "01OAI", fen: "2r2rk1/pp1b1pq1/4p1p1/6Q1/3p4/1P3R1P/P4PPB/R5K1 b - - 3 27", moves: "d7c6 h2e5 g7e5 g5e5", rating: 1308, themes: "advantage,middlegame,short,pin" },
    // Rating 1359
    { id: "01PBg", fen: "5r2/2p2pbk/4p1p1/5n1p/1q3P1P/pP3Q2/P5P1/1BBR3K b - - 1 28", moves: "f5h4 f3h5 h7g8 h5h4", rating: 1359, themes: "advantage,middlegame,pin,short" },
    // Rating 1653
    { id: "00LNH", fen: "1k2r3/pp2r2p/2pqbpp1/3n4/2BP1p2/5N1P/PPQB1PP1/1K1RR3 w - - 2 22", moves: "c4b3 e6f5 c2f5 g6f5", rating: 1653, themes: "advantage,middlegame,pin,short" },
  ],

  // ═══ SKEWER PUZZLES ═══
  skewer: [
    // Rating 776
    { id: "01Nco", fen: "8/3R2p1/2p2pkp/1bB5/pP1K2P1/P4P2/4r2P/8 w - - 7 39", moves: "h2h4 e2d2 d4c3 d2d7", rating: 776, themes: "crushing,endgame,short,skewer" },
    // Rating 836
    { id: "00F1l", fen: "8/2k1b3/5p2/RBpK1Pp1/Pp1p2P1/3P4/2r5/8 b - - 2 45", moves: "b4b3 a5a7 c7b8 a7e7", rating: 836, themes: "crushing,endgame,master,short,skewer" },
    // Rating 843
    { id: "006OI", fen: "r1bq3r/pp4kp/3p2p1/2pP4/4Pp1n/P1P2Q2/1P4PP/RNB2RK1 b - - 0 16", moves: "h4g2 f3f4 g2e1 f1e1", rating: 843, themes: "crushing,endgame,skewer" },
    // Rating 819
    { id: "006yP", fen: "1k6/p7/1p1R4/2p2p2/P1P2P2/1P4K1/8/4r3 b - - 1 42", moves: "e1b1 d6d1 b1d1 g3h4", rating: 819, themes: "crushing,endgame,skewer" },
    // Rating 1084
    { id: "001xl", fen: "8/4R1k1/p5pp/3B4/5q2/8/5P1P/6K1 b - - 5 40", moves: "g7f6 e7f7 f6e5 f7f4", rating: 1084, themes: "advantage,endgame,master,masterVsMaster,short,skewer,superGM" },
    // Rating 1156
    { id: "003eP", fen: "8/r1b1q2k/2p3p1/2Pp4/1P2p1n1/2B1P3/NQ6/2K4R b - - 1 36", moves: "h7g8 h1h8 g8f7 h8h7 f7e8 h7e7", rating: 1156, themes: "crushing,exposedKing,long,middlegame,skewer" },
  ],

  // ═══ DISCOVERED ATTACK PUZZLES ═══
  discoveredAttack: [
    // Rating 874
    { id: "0GW13", fen: "r3r1k1/p4ppB/2pq4/3pp3/6b1/2P1PN2/PP3P2/R2Q1RK1 b - - 0 19", moves: "g8h7 f3g5 h7g8 d1g4", rating: 874, themes: "advantage,discoveredAttack,middlegame,short" },
    // Rating 1087
    { id: "rBz3S", fen: "3r4/p6p/1p1p1p1k/5B2/2P3PP/2P1r3/PK6/3R4 b - - 4 28", moves: "e3h3 g4g5 h6h5 f5h3", rating: 1087, themes: "advantage,discoveredAttack,endgame,short" },
    // Rating 1300
    { id: "00O37", fen: "r1q1r1k1/1p3pp1/n1p4p/p1bpp2P/P3P3/2P2P2/1P1QBP2/R1BK3R b - - 3 23", moves: "c5f2 e2a6 b7a6 d2f2", rating: 1300, themes: "advantage,discoveredAttack,middlegame,short" },
    // Rating 1579
    { id: "03KYx", fen: "r1bq1r2/p4ppk/1p3b2/n2P2N1/7P/P7/1B3PP1/R2QK2R b KQ - 1 16", moves: "f6g5 h4g5 h7g8 d1h5", rating: 1579, themes: "crushing,discoveredAttack,discoveredCheck,master,middlegame,short" },
    // Rating 1870
    { id: "003wQ", fen: "2r2rk1/6pp/3Q1q2/8/3N1B2/6P1/PP1K3P/R4b2 w - - 0 24", moves: "a1f1 f6d6 f4d6 f8f1", rating: 1870, themes: "advantage,discoveredAttack,middlegame,pin,short" },
  ],

  // ═══ ANASTASIA MATE PUZZLES ═══
  anastasiaMate: [
    // Rating 789
    { id: "gZF3K", fen: "5rk1/R2Q3p/4p1p1/3p4/5r2/1P1P4/1PP1nPPq/5R1K w - - 0 29", moves: "h1h2 f4h4", rating: 789, themes: "anastasiaMate,endgame,mate,mateIn1,oneMove" },
    // Rating 1087
    { id: "AdLLB", fen: "r1b2rk1/pp3pp1/2np4/2pN4/2B1PR2/8/PPP3PP/R5K1 b - - 0 16", moves: "c6e5 d5e7 g8h7 f4h4", rating: 1087, themes: "anastasiaMate,kingsideAttack,mate,mateIn2,middlegame,short" },
  ],

  // ═══ ARABIAN MATE PUZZLES ═══
  arabianMate: [
    // Rating 909
    { id: "VvIQl", fen: "2R4k/4rpr1/p3pNpp/1p1q4/8/3P4/PP3PPP/6K1 b - - 3 28", moves: "e7e8 c8e8 g7g8 e8g8", rating: 909, themes: "arabianMate,endgame,hangingPiece,mate,mateIn2,short" },
    // Rating 1004
    { id: "lsBiW", fen: "r4bk1/1R1N1p1p/2p1B1p1/r2p4/3P1P2/4P3/5P1P/6K1 b - - 4 40", moves: "f7e6 d7f6 g8h8 b7h7", rating: 1004, themes: "arabianMate,discoveredAttack,endgame,mate,mateIn2,short" },
    // Rating 1271
    { id: "rC0Fw", fen: "r2r1b1k/pp3pp1/1qp1pN1Q/4B3/2PP4/6R1/PP3PPP/n5K1 b - - 0 26", moves: "g7h6 g3g8", rating: 1271, themes: "arabianMate,mate,mateIn1,middlegame,oneMove" },
  ],

  // ═══ DEFLECTION PUZZLES ═══
  deflection: [
    // Rating 948
    { id: "002Mm", fen: "rn1qr1k1/ppp3pQ/3p1pP1/3Pp3/2P1P3/8/PP3PP1/R1B1K3 b Q - 2 16", moves: "g8f8 h7h8 f8e7 h8g7", rating: 948, themes: "deflection,mate,mateIn2,middlegame,short" },
    // Rating 1096
    { id: "003IM", fen: "8/5kp1/p3pb2/8/6Pp/1P4qP/P2RQ3/7K w - - 2 34", moves: "e2g2 g3e1 g2g1 e1d2", rating: 1096, themes: "crushing,deflection,endgame,master,short" },
    // Rating 1187
    { id: "004LZ", fen: "r3kbnr/ppp2ppp/2n5/4p3/2B1P2q/5N2/PPPP1bPP/RNBQ1R1K b kq - 2 6", moves: "f2g1 d1g4 h4g4 f3g1", rating: 1187, themes: "advancedPawn,deflection,middlegame,promotion" },
  ],

  // ═══ KINGSIDE ATTACK PUZZLES ═══
  kingsideAttack: [
    // Rating 967
    { id: "0GVAb", fen: "rnb2r1k/ppqp1p1p/2p2p1N/2b1p3/2B1P3/2NP1Q2/PPP2PPP/R3K2R b KQ - 7 11", moves: "d7d5 f3f6", rating: 967, themes: "kingsideAttack,mate,mateIn1,middlegame,oneMove" },
    // Rating 1015
    { id: "003AX", fen: "2k2r2/1bNp4/pB1P4/8/P7/4Kn2/1P3R1p/5R2 w - - 0 43", moves: "e3e2 f3g1 e2d2 f8f2 b6f2 h2h1q", rating: 1015, themes: "kingsideAttack,mate,mateIn1,middlegame,oneMove" },
    // Rating 1233
    { id: "00SgB", fen: "b3rrk1/qn2R3/1p3ppp/1P1p4/1Q2nB2/P3P3/4BPPP/5RK1 b - - 0 28", moves: "e8e7 b4e7 f8f7 e7e8 g8g7 f4h6", rating: 1233, themes: "advantage,exposedKing,kingsideAttack,long,middlegame" },
    // Rating 1287
    { id: "003nQ_ks", fen: "6rk/pp6/2n5/3ppn1p/3p4/2P2P1q/PP3QNB/R4R1K w - - 2 29", moves: "f1g1 f5g3 f2g3 g8g3", rating: 1287, themes: "crushing,kingsideAttack,master,middlegame,pin,short" },
  ],

  // ═══ SMOTHERED MATE PUZZLES ═══
  smotheredMate: [
    // Rating 683
    { id: "0X0QD", fen: "r1b2rk1/ppp3pp/4P2B/2np4/4n1Q1/1P6/P1P3PP/R4RqK w - - 3 18", moves: "f1g1 e4f2", rating: 683, themes: "mate,mateIn1,middlegame,oneMove,smotheredMate" },
    // Rating 870
    { id: "001pC", fen: "r4rk1/pp3ppp/3b4/2p1pPB1/7N/2PP3n/PP4PP/R2Q1RqK w - - 5 18", moves: "f1g1 h3f2", rating: 870, themes: "mate,mateIn1,middlegame,oneMove,smotheredMate" },
    // Rating 934
    { id: "00LWa", fen: "2r3k1/5ppp/2P5/8/5P2/P5Pn/6BP/R3R1qK w - - 6 32", moves: "e1g1 h3f2", rating: 934, themes: "endgame,mate,mateIn1,oneMove,smotheredMate" },
  ],

  // ═══ BACK RANK MATE PUZZLES ═══
  backRankMate: [
    // Rating 538
    { id: "0030b", fen: "6k1/5ppp/5nb1/pp6/6rP/5N1Q/Pq2r1P1/3R2RK b - - 4 32", moves: "g6e4 d1d8 f6e8 d8e8", rating: 538, themes: "backRankMate,mate,mateIn2,middlegame,short" },
    // Rating 555
    { id: "0042j", fen: "3r2k1/4nppp/pq1p1b2/1p2P3/2r2P2/2P1NR2/PP1Q2BP/3R2K1 b - - 0 24", moves: "d6e5 d2d8 b6d8 d1d8", rating: 555, themes: "backRankMate,mate,mateIn2,middlegame,short" },
    // Rating 596
    { id: "00465", fen: "3r1Q1k/pp4pp/2p5/6q1/5R2/2P5/P1P2PPP/3rR1K1 b - - 8 27", moves: "d8f8 f4f8", rating: 596, themes: "backRankMate,endgame,mate,mateIn1,oneMove,queenRookEndgame" },
    // Rating 683
    { id: "00HAM", fen: "R2q1r1k/1p3Qpp/1n6/3P2pP/2PP2P1/1P6/2K5/5R2 b - - 0 29", moves: "d8a8 f7f8 a8f8 f1f8", rating: 683, themes: "backRankMate,endgame,mate,mateIn2,short" },
    // Rating 796
    { id: "143SQ", fen: "2r3k1/pR3pp1/4b2p/3p4/8/2q5/r3QPPP/1R4K1 w - - 0 24", moves: "e2a2 c3c1 b1c1 c8c1", rating: 796, themes: "backRankMate,endgame,mate,mateIn2,sacrifice,short" },
    // Rating 1003
    { id: "144YP", fen: "4r1k1/Q5pp/4P3/3q1P2/1rp3P1/1b1p4/3R3P/4R1K1 b - - 0 30", moves: "c4c3 a7f7 g8h8 f7e8", rating: 1003, themes: "backRankMate,fork,mate,mateIn2,middlegame,short" },
    // Rating 1118
    { id: "001Wz", fen: "4r1k1/5ppp/r1p5/p1n1RP2/8/2P2N1P/2P3P1/3R2K1 b - - 0 21", moves: "e8e5 d1d8 e5e8 d8e8", rating: 1118, themes: "backRankMate,endgame,mate,mateIn2,short" },
  ],

  // ═══ HOOK MATE PUZZLES ═══
  hookMate: [
    // Rating 708
    { id: "rC14e", fen: "3r1r2/ppp1qpkp/2b1pNp1/4P3/2P5/4P2R/P2Q2PP/1BR3K1 b - - 2 22", moves: "d8d2 h3h7", rating: 708, themes: "hookMate,mate,mateIn1,middlegame,oneMove" },
    // Rating 1326
    { id: "lsBjG", fen: "6k1/pp3pp1/2p4p/P2p4/1PnP2P1/2P2PP1/r2KN3/2R5 w - - 3 44", moves: "d2d3 a2d2", rating: 1326, themes: "endgame,hookMate,mate,mateIn1,oneMove" },
    // Rating 1328
    { id: "FxJLz", fen: "6k1/4B2p/2p3p1/1p1p1pP1/1P1Pn2Q/2P2K1P/r7/8 w - - 1 37", moves: "h4h6 a2f2 f3e3 f5f4 e3d3 f2d2", rating: 1328, themes: "endgame,exposedKing,hookMate,long,mate,mateIn3" },
  ],
};

function applySetupMove(fen, uciMove) {
  var c;
  try { c = new Chess(fen); } catch(e) { c = Chess(fen); }
  var from = uciMove.substring(0, 2);
  var to = uciMove.substring(2, 4);
  var promo = uciMove.length > 4 ? uciMove[4] : undefined;
  var result = c.move({ from: from, to: to, promotion: promo });
  if (!result) {
    console.error("FAILED to apply setup move " + uciMove + " to FEN: " + fen);
    return null;
  }
  return c.fen();
}

function processPuzzle(raw, themeLabel) {
  var moveList = raw.moves.split(' ');
  var setupMove = moveList[0];
  var solutionMoves = moveList.slice(1).join(' ');
  var puzzleFen = applySetupMove(raw.fen, setupMove);
  if (!puzzleFen) return null;
  return {
    fen: puzzleFen,
    moves: solutionMoves,
    rating: raw.rating,
    theme: themeLabel,
    solved: false,
    _id: raw.id
  };
}

// ═══ IANNA (beginner, 600-900) ═══
var iannaPuzzles = [];

// Fork (3 puzzles, 600-900)
[rawPuzzles.fork[0], rawPuzzles.fork[1], rawPuzzles.fork[2]].forEach(function(p) {
  iannaPuzzles.push(processPuzzle(p, "Fork"));
});

// Pin (2 puzzles) - using lower-rated pin puzzles available
[rawPuzzles.pin[0], rawPuzzles.pin[1]].forEach(function(p) {
  iannaPuzzles.push(processPuzzle(p, "Pin"));
});

// Skewer (2 puzzles, 600-900)
[rawPuzzles.skewer[0], rawPuzzles.skewer[1]].forEach(function(p) {
  iannaPuzzles.push(processPuzzle(p, "Skewer"));
});

// Discovered Attack (2 puzzles, 600-900)
[rawPuzzles.discoveredAttack[0], rawPuzzles.discoveredAttack[1]].forEach(function(p) {
  iannaPuzzles.push(processPuzzle(p, "Discovered Attack"));
});

// ═══ AARVI (intermediate, 900-1300) ═══
var aarviPuzzles = [];

// Anastasia Mate (2 puzzles)
rawPuzzles.anastasiaMate.forEach(function(p) {
  aarviPuzzles.push(processPuzzle(p, "Anastasia Mate"));
});

// Arabian Mate (2 puzzles)
[rawPuzzles.arabianMate[0], rawPuzzles.arabianMate[1]].forEach(function(p) {
  aarviPuzzles.push(processPuzzle(p, "Arabian Mate"));
});

// Deflection (2 puzzles)
[rawPuzzles.deflection[0], rawPuzzles.deflection[1]].forEach(function(p) {
  aarviPuzzles.push(processPuzzle(p, "Deflection"));
});

// Kingside Attack (2 puzzles)
[rawPuzzles.kingsideAttack[0], rawPuzzles.kingsideAttack[1]].forEach(function(p) {
  aarviPuzzles.push(processPuzzle(p, "Kingside Attack"));
});

// ═══ ABHI (strong tactics, 1000-1400) ═══
var abhiPuzzles = [];

// Smothered Mate (2 puzzles)
[rawPuzzles.smotheredMate[1], rawPuzzles.smotheredMate[2]].forEach(function(p) {
  abhiPuzzles.push(processPuzzle(p, "Smothered Mate"));
});

// Back Rank Mate (2 puzzles, 1000-1400)
[rawPuzzles.backRankMate[5], rawPuzzles.backRankMate[6]].forEach(function(p) {
  abhiPuzzles.push(processPuzzle(p, "Back Rank Mate"));
});

// Hook Mate (2 puzzles)
[rawPuzzles.hookMate[1], rawPuzzles.hookMate[2]].forEach(function(p) {
  abhiPuzzles.push(processPuzzle(p, "Hook Mate"));
});

// Fork (2 puzzles, 1000-1400)
[rawPuzzles.fork[8], rawPuzzles.fork[9]].forEach(function(p) {
  abhiPuzzles.push(processPuzzle(p, "Fork"));
});

// Discovered Attack (2 puzzles, 1000-1400)
[rawPuzzles.discoveredAttack[2], rawPuzzles.discoveredAttack[3]].forEach(function(p) {
  abhiPuzzles.push(processPuzzle(p, "Discovered Attack"));
});

console.log("=== IANNA'S PUZZLES (" + iannaPuzzles.length + ") ===");
console.log(JSON.stringify(iannaPuzzles, null, 2));
console.log("\n=== AARVI'S PUZZLES (" + aarviPuzzles.length + ") ===");
console.log(JSON.stringify(aarviPuzzles, null, 2));
console.log("\n=== ABHI'S PUZZLES (" + abhiPuzzles.length + ") ===");
console.log(JSON.stringify(abhiPuzzles, null, 2));
