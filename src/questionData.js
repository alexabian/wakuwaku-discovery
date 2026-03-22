// ─── Utility ─────────────────────────────────────────────────────────────────

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Build a 10-question session: 5 from stage 1, 5 from stage 2.
// Choices are shuffled so the correct answer is in a random position each time.
export function buildSession(mod) {
  const s1 = shuffle([...mod.pool1]).slice(0, 5)
  const s2 = shuffle([...mod.pool2]).slice(0, 5)
  return [...s1, ...s2].map(q => {
    const shuffled = shuffle([...q.choices])
    return { ...q, choices: shuffled, correctJp: q.correctJp }
  })
}

// Question shape:
// { visual, q, qEn, choices: [{jp, en}, ...], correctJp }
// correctJp is matched against choices[i].jp to find the correct index at render time.

// ─── World 1 Module 1 — Plants (しょくぶつ) ───────────────────────────────────

export const m11 = {
  pool1: [
    {
      visual: '🌱',
      q: 'みずを すいあげる ぶぶんは？',
      qEn: 'Which part absorbs water from the soil?',
      choices: [{ jp: 'ねっこ', en: 'root' }, { jp: 'くき', en: 'stem' }, { jp: 'は', en: 'leaf' }],
      correctJp: 'ねっこ',
    },
    {
      visual: '🌿',
      q: 'みずを はこぶ ぶぶんは？',
      qEn: 'Which part carries water upwards?',
      choices: [{ jp: 'くき', en: 'stem' }, { jp: 'ねっこ', en: 'root' }, { jp: 'はな', en: 'flower' }],
      correctJp: 'くき',
    },
    {
      visual: '☀️',
      q: 'ひかりで えいようを つくる ぶぶんは？',
      qEn: 'Which part makes food using sunlight?',
      choices: [{ jp: 'は', en: 'leaf' }, { jp: 'ねっこ', en: 'root' }, { jp: 'くき', en: 'stem' }],
      correctJp: 'は',
    },
    {
      visual: '🐝',
      q: 'みつばちを よびよせる ぶぶんは？',
      qEn: 'Which part attracts bees?',
      choices: [{ jp: 'はな', en: 'flower' }, { jp: 'は', en: 'leaf' }, { jp: 'ねっこ', en: 'root' }],
      correctJp: 'はな',
    },
    {
      visual: '🌻',
      q: 'これは なんという しょくぶつ？',
      qEn: 'What plant is this?',
      choices: [{ jp: 'ひまわり', en: 'sunflower' }, { jp: 'さくら', en: 'cherry blossom' }, { jp: 'チューリップ', en: 'tulip' }],
      correctJp: 'ひまわり',
    },
    {
      visual: '🌸',
      q: 'これは なんという しょくぶつ？',
      qEn: 'What plant is this?',
      choices: [{ jp: 'さくら', en: 'cherry blossom' }, { jp: 'ひまわり', en: 'sunflower' }, { jp: 'バラ', en: 'rose' }],
      correctJp: 'さくら',
    },
    {
      visual: '🌷',
      q: 'これは なんという しょくぶつ？',
      qEn: 'What plant is this?',
      choices: [{ jp: 'チューリップ', en: 'tulip' }, { jp: 'バラ', en: 'rose' }, { jp: 'さくら', en: 'cherry blossom' }],
      correctJp: 'チューリップ',
    },
    {
      visual: '🌹',
      q: 'これは なんという しょくぶつ？',
      qEn: 'What plant is this?',
      choices: [{ jp: 'バラ', en: 'rose' }, { jp: 'チューリップ', en: 'tulip' }, { jp: 'ひまわり', en: 'sunflower' }],
      correctJp: 'バラ',
    },
    {
      visual: '🌳',
      q: 'きの ふとい みきを なんという？',
      qEn: 'What do we call the thick main stem of a tree?',
      choices: [{ jp: 'みき', en: 'trunk' }, { jp: 'ねっこ', en: 'root' }, { jp: 'えだ', en: 'branch' }],
      correctJp: 'みき',
    },
    {
      visual: '🌱',
      q: 'ねっこは どこに ある？',
      qEn: 'Where is the root found?',
      choices: [{ jp: 'つちの なか', en: 'underground' }, { jp: 'くきの さき', en: 'tip of stem' }, { jp: 'えだに', en: 'on branches' }],
      correctJp: 'つちの なか',
    },
  ],
  pool2: [
    {
      visual: '🌸',
      q: 'はなびらは どの ぶぶん？',
      qEn: 'Petals are part of which structure?',
      choices: [{ jp: 'はな', en: 'flower' }, { jp: 'くき', en: 'stem' }, { jp: 'ねっこ', en: 'root' }],
      correctJp: 'はな',
    },
    {
      visual: '🌻',
      q: 'はなが うむ ものは？',
      qEn: 'What does a flower produce?',
      choices: [{ jp: 'たね', en: 'seeds' }, { jp: 'みず', en: 'water' }, { jp: 'つち', en: 'soil' }],
      correctJp: 'たね',
    },
    {
      visual: '🍂',
      q: 'あきに はっぱが おちる きを なんという？',
      qEn: 'Trees that lose their leaves in autumn are called?',
      choices: [{ jp: 'らくようじゅ', en: 'deciduous' }, { jp: 'じょうりょくじゅ', en: 'evergreen' }, { jp: 'はなき', en: 'flowering tree' }],
      correctJp: 'らくようじゅ',
    },
    {
      visual: '🌲',
      q: 'いちねんじゅう みどりの きを なんという？',
      qEn: 'Trees that stay green all year are called?',
      choices: [{ jp: 'じょうりょくじゅ', en: 'evergreen' }, { jp: 'らくようじゅ', en: 'deciduous' }, { jp: 'はなき', en: 'flowering tree' }],
      correctJp: 'じょうりょくじゅ',
    },
    {
      visual: '🌲',
      q: 'これは じょうりょくじゅ？ らくようじゅ？',
      qEn: 'Is this evergreen or deciduous?',
      choices: [{ jp: 'じょうりょくじゅ', en: 'evergreen' }, { jp: 'らくようじゅ', en: 'deciduous' }, { jp: 'はなき', en: 'flowering tree' }],
      correctJp: 'じょうりょくじゅ',
    },
    {
      visual: '🌳',
      q: 'これは じょうりょくじゅ？ らくようじゅ？',
      qEn: 'Is this evergreen or deciduous?',
      choices: [{ jp: 'らくようじゅ', en: 'deciduous' }, { jp: 'じょうりょくじゅ', en: 'evergreen' }, { jp: 'はなき', en: 'flowering tree' }],
      correctJp: 'らくようじゅ',
    },
    {
      visual: '🌷',
      q: 'チューリップは なにから そだつ？',
      qEn: 'What do tulips grow from?',
      choices: [{ jp: 'きゅうこん', en: 'bulb' }, { jp: 'たね', en: 'seed' }, { jp: 'えだ', en: 'branch' }],
      correctJp: 'きゅうこん',
    },
    {
      visual: '🌳',
      q: 'みきから そだつのは？',
      qEn: 'What grows from a trunk?',
      choices: [{ jp: 'えだ', en: 'branches' }, { jp: 'ねっこ', en: 'roots' }, { jp: 'たね', en: 'seeds' }],
      correctJp: 'えだ',
    },
    {
      visual: '💧',
      q: 'しょくぶつが そだつのに ひつような ものは？',
      qEn: 'What do plants need to grow?',
      choices: [{ jp: 'みずと ひかり', en: 'water and light' }, { jp: 'いしと かぜ', en: 'rocks and wind' }, { jp: 'ゆきと やみ', en: 'snow and darkness' }],
      correctJp: 'みずと ひかり',
    },
    {
      visual: '🌿',
      q: 'くきの さきには なにが ある？',
      qEn: 'What is found at the tip of a stem?',
      choices: [{ jp: 'は または はな', en: 'leaves or flowers' }, { jp: 'ねっこ', en: 'roots' }, { jp: 'つち', en: 'soil' }],
      correctJp: 'は または はな',
    },
  ],
}

// ─── World 1 Module 2 — Animals (どうぶつ) ───────────────────────────────────

export const m12 = {
  pool1: [
    {
      visual: '🐟',
      q: 'これは どの グループ？',
      qEn: 'Which animal group?',
      choices: [{ jp: 'さかな', en: 'fish' }, { jp: 'とり', en: 'bird' }, { jp: 'ほにゅうるい', en: 'mammal' }],
      correctJp: 'さかな',
    },
    {
      visual: '🐸',
      q: 'これは どの グループ？',
      qEn: 'Which animal group?',
      choices: [{ jp: 'りょうせいるい', en: 'amphibian' }, { jp: 'は虫類', en: 'reptile' }, { jp: 'さかな', en: 'fish' }],
      correctJp: 'りょうせいるい',
    },
    {
      visual: '🦎',
      q: 'これは どの グループ？',
      qEn: 'Which animal group?',
      choices: [{ jp: 'は虫類', en: 'reptile' }, { jp: 'りょうせいるい', en: 'amphibian' }, { jp: 'さかな', en: 'fish' }],
      correctJp: 'は虫類',
    },
    {
      visual: '🐦',
      q: 'これは どの グループ？',
      qEn: 'Which animal group?',
      choices: [{ jp: 'とり', en: 'bird' }, { jp: 'ほにゅうるい', en: 'mammal' }, { jp: 'は虫類', en: 'reptile' }],
      correctJp: 'とり',
    },
    {
      visual: '🐶',
      q: 'これは どの グループ？',
      qEn: 'Which animal group?',
      choices: [{ jp: 'ほにゅうるい', en: 'mammal' }, { jp: 'とり', en: 'bird' }, { jp: 'さかな', en: 'fish' }],
      correctJp: 'ほにゅうるい',
    },
    {
      visual: '🐧',
      q: 'これは どの グループ？',
      qEn: 'Which animal group?',
      choices: [{ jp: 'とり', en: 'bird' }, { jp: 'は虫類', en: 'reptile' }, { jp: 'りょうせいるい', en: 'amphibian' }],
      correctJp: 'とり',
    },
    {
      visual: '🐢',
      q: 'これは どの グループ？',
      qEn: 'Which animal group?',
      choices: [{ jp: 'は虫類', en: 'reptile' }, { jp: 'りょうせいるい', en: 'amphibian' }, { jp: 'さかな', en: 'fish' }],
      correctJp: 'は虫類',
    },
    {
      visual: '🐻',
      q: 'これは どの グループ？',
      qEn: 'Which animal group?',
      choices: [{ jp: 'ほにゅうるい', en: 'mammal' }, { jp: 'は虫類', en: 'reptile' }, { jp: 'とり', en: 'bird' }],
      correctJp: 'ほにゅうるい',
    },
    {
      visual: '🐠',
      q: 'これは どの グループ？',
      qEn: 'Which animal group?',
      choices: [{ jp: 'さかな', en: 'fish' }, { jp: 'とり', en: 'bird' }, { jp: 'ほにゅうるい', en: 'mammal' }],
      correctJp: 'さかな',
    },
    {
      visual: '🦊',
      q: 'これは どの グループ？',
      qEn: 'Which animal group?',
      choices: [{ jp: 'ほにゅうるい', en: 'mammal' }, { jp: 'は虫類', en: 'reptile' }, { jp: 'とり', en: 'bird' }],
      correctJp: 'ほにゅうるい',
    },
  ],
  pool2: [
    {
      visual: '🦁',
      q: 'ライオンは なにを たべる？',
      qEn: 'What does a lion eat?',
      choices: [{ jp: 'にく', en: 'meat' }, { jp: 'くさ', en: 'grass' }, { jp: 'なんでも', en: 'everything' }],
      correctJp: 'にく',
    },
    {
      visual: '🐄',
      q: 'うしは なにを たべる？',
      qEn: 'What does a cow eat?',
      choices: [{ jp: 'くさや はっぱ', en: 'grass and leaves' }, { jp: 'にく', en: 'meat' }, { jp: 'むし', en: 'insects' }],
      correctJp: 'くさや はっぱ',
    },
    {
      visual: '🐻',
      q: 'くまは なにを たべる？',
      qEn: 'What does a bear eat?',
      choices: [{ jp: 'なんでも', en: 'everything' }, { jp: 'にく だけ', en: 'meat only' }, { jp: 'くさ だけ', en: 'plants only' }],
      correctJp: 'なんでも',
    },
    {
      visual: '🥩',
      q: 'にくを たべる どうぶつを なんという？',
      qEn: 'Animals that only eat meat are called?',
      choices: [{ jp: 'にくしょくどうぶつ', en: 'carnivore' }, { jp: 'そうしょくどうぶつ', en: 'herbivore' }, { jp: 'ざっしょくどうぶつ', en: 'omnivore' }],
      correctJp: 'にくしょくどうぶつ',
    },
    {
      visual: '🥦',
      q: 'しょくぶつ だけを たべる どうぶつを なんという？',
      qEn: 'Animals that only eat plants are called?',
      choices: [{ jp: 'そうしょくどうぶつ', en: 'herbivore' }, { jp: 'にくしょくどうぶつ', en: 'carnivore' }, { jp: 'ざっしょくどうぶつ', en: 'omnivore' }],
      correctJp: 'そうしょくどうぶつ',
    },
    {
      visual: '🍖',
      q: 'なんでも たべる どうぶつを なんという？',
      qEn: 'Animals that eat both plants and meat are called?',
      choices: [{ jp: 'ざっしょくどうぶつ', en: 'omnivore' }, { jp: 'にくしょくどうぶつ', en: 'carnivore' }, { jp: 'そうしょくどうぶつ', en: 'herbivore' }],
      correctJp: 'ざっしょくどうぶつ',
    },
    {
      visual: '👁️',
      q: 'めで わかる かんかくは？',
      qEn: 'Which sense uses our eyes?',
      choices: [{ jp: 'しかく', en: 'sight' }, { jp: 'ちょうかく', en: 'hearing' }, { jp: 'きゅうかく', en: 'smell' }],
      correctJp: 'しかく',
    },
    {
      visual: '👂',
      q: 'みみで わかる かんかくは？',
      qEn: 'Which sense uses our ears?',
      choices: [{ jp: 'ちょうかく', en: 'hearing' }, { jp: 'しかく', en: 'sight' }, { jp: 'みかく', en: 'taste' }],
      correctJp: 'ちょうかく',
    },
    {
      visual: '👃',
      q: 'はなで わかる かんかくは？',
      qEn: 'Which sense uses our nose?',
      choices: [{ jp: 'きゅうかく', en: 'smell' }, { jp: 'みかく', en: 'taste' }, { jp: 'しょっかく', en: 'touch' }],
      correctJp: 'きゅうかく',
    },
    {
      visual: '👅',
      q: 'したで わかる かんかくは？',
      qEn: 'Which sense uses our tongue?',
      choices: [{ jp: 'みかく', en: 'taste' }, { jp: 'きゅうかく', en: 'smell' }, { jp: 'ちょうかく', en: 'hearing' }],
      correctJp: 'みかく',
    },
  ],
}

// ─── World 1 Module 3 — Materials (ざいりょう) ───────────────────────────────

export const m13 = {
  pool1: [
    {
      visual: '🪵',
      q: 'これは なんの ざいりょう？',
      qEn: 'What material is this?',
      choices: [{ jp: 'き', en: 'wood' }, { jp: 'プラスチック', en: 'plastic' }, { jp: 'きんぞく', en: 'metal' }],
      correctJp: 'き',
    },
    {
      visual: '🪨',
      q: 'これは なんの ざいりょう？',
      qEn: 'What material is this?',
      choices: [{ jp: 'いわ', en: 'rock' }, { jp: 'き', en: 'wood' }, { jp: 'プラスチック', en: 'plastic' }],
      correctJp: 'いわ',
    },
    {
      visual: '🥄',
      q: 'このスプーンは なんで できている？',
      qEn: 'What is this spoon made from?',
      choices: [{ jp: 'きんぞく', en: 'metal' }, { jp: 'き', en: 'wood' }, { jp: 'ガラス', en: 'glass' }],
      correctJp: 'きんぞく',
    },
    {
      visual: '🪟',
      q: 'まどは なんで できている？',
      qEn: 'What are windows made from?',
      choices: [{ jp: 'ガラス', en: 'glass' }, { jp: 'プラスチック', en: 'plastic' }, { jp: 'き', en: 'wood' }],
      correctJp: 'ガラス',
    },
    {
      visual: '🧴',
      q: 'このボトルは なんで できている？',
      qEn: 'What is this bottle made from?',
      choices: [{ jp: 'プラスチック', en: 'plastic' }, { jp: 'きんぞく', en: 'metal' }, { jp: 'ガラス', en: 'glass' }],
      correctJp: 'プラスチック',
    },
    {
      visual: '🪑',
      q: 'きの いすは なんで できている？',
      qEn: 'What is a wooden chair made from?',
      choices: [{ jp: 'き', en: 'wood' }, { jp: 'きんぞく', en: 'metal' }, { jp: 'プラスチック', en: 'plastic' }],
      correctJp: 'き',
    },
    {
      visual: '💧',
      q: 'こおりは なんで できている？',
      qEn: 'What is ice made from?',
      choices: [{ jp: 'みず', en: 'water' }, { jp: 'プラスチック', en: 'plastic' }, { jp: 'き', en: 'wood' }],
      correctJp: 'みず',
    },
    {
      visual: '🧱',
      q: 'レンガは なんの ざいりょう？',
      qEn: 'What material is a brick?',
      choices: [{ jp: 'いわ・ねんど', en: 'rock / clay' }, { jp: 'き', en: 'wood' }, { jp: 'ガラス', en: 'glass' }],
      correctJp: 'いわ・ねんど',
    },
    {
      visual: '🔧',
      q: 'スパナは なんで できている？',
      qEn: 'What is a spanner made from?',
      choices: [{ jp: 'きんぞく', en: 'metal' }, { jp: 'き', en: 'wood' }, { jp: 'プラスチック', en: 'plastic' }],
      correctJp: 'きんぞく',
    },
    {
      visual: '📦',
      q: 'ダンボールは なんで できている？',
      qEn: 'What is cardboard made from?',
      choices: [{ jp: 'かみ・き', en: 'paper / wood' }, { jp: 'プラスチック', en: 'plastic' }, { jp: 'きんぞく', en: 'metal' }],
      correctJp: 'かみ・き',
    },
  ],
  pool2: [
    {
      visual: '🔩',
      q: 'きんぞくは かたい？ やわらかい？',
      qEn: 'Is metal hard or soft?',
      choices: [{ jp: 'かたい', en: 'hard' }, { jp: 'やわらかい', en: 'soft' }, { jp: 'のびる', en: 'stretchy' }],
      correctJp: 'かたい',
    },
    {
      visual: '🧸',
      q: 'ぬいぐるみは かたい？ やわらかい？',
      qEn: 'Is a teddy bear hard or soft?',
      choices: [{ jp: 'やわらかい', en: 'soft' }, { jp: 'かたい', en: 'hard' }, { jp: 'つるつる', en: 'smooth' }],
      correctJp: 'やわらかい',
    },
    {
      visual: '✨',
      q: 'きんぞくは ぴかぴか？ つやなし？',
      qEn: 'Is metal shiny or dull?',
      choices: [{ jp: 'ぴかぴか', en: 'shiny' }, { jp: 'つやなし', en: 'dull' }, { jp: 'ざらざら', en: 'rough' }],
      correctJp: 'ぴかぴか',
    },
    {
      visual: '🌧️',
      q: 'みずが とおらない ざいりょうを なんという？',
      qEn: 'A material that does not let water through is called?',
      choices: [{ jp: 'みずを とおさない', en: 'waterproof' }, { jp: 'みずを すう', en: 'absorbent' }, { jp: 'かたい', en: 'hard' }],
      correctJp: 'みずを とおさない',
    },
    {
      visual: '☂️',
      q: 'かさに むいた ざいりょうは？',
      qEn: 'Which material is best for an umbrella?',
      choices: [{ jp: 'みずを とおさない ざいりょう', en: 'waterproof material' }, { jp: 'みずを すう ざいりょう', en: 'absorbent material' }, { jp: 'かたい いわ', en: 'hard rock' }],
      correctJp: 'みずを とおさない ざいりょう',
    },
    {
      visual: '🪟',
      q: 'まどに ガラスが むいているのは なぜ？',
      qEn: 'Why is glass good for windows?',
      choices: [{ jp: 'すきとおっている から', en: 'it is transparent' }, { jp: 'かたい から', en: 'it is hard' }, { jp: 'かるい から', en: 'it is light' }],
      correctJp: 'すきとおっている から',
    },
    {
      visual: '🪨',
      q: 'いわは ざらざら？ つるつる？',
      qEn: 'Is rock rough or smooth?',
      choices: [{ jp: 'ざらざら', en: 'rough' }, { jp: 'つるつる', en: 'smooth' }, { jp: 'ふわふわ', en: 'fluffy' }],
      correctJp: 'ざらざら',
    },
    {
      visual: '🔍',
      q: 'すきとおっている ざいりょうは？',
      qEn: 'Which material is transparent?',
      choices: [{ jp: 'ガラス', en: 'glass' }, { jp: 'き', en: 'wood' }, { jp: 'きんぞく', en: 'metal' }],
      correctJp: 'ガラス',
    },
    {
      visual: '🏠',
      q: 'いえの かべに よく つかわれる ざいりょうは？',
      qEn: 'Which material is often used for walls?',
      choices: [{ jp: 'れんがや き', en: 'brick or wood' }, { jp: 'ガラス', en: 'glass' }, { jp: 'プラスチック', en: 'plastic' }],
      correctJp: 'れんがや き',
    },
    {
      visual: '🥤',
      q: 'まがる ストローは なんで できている？',
      qEn: 'What is a bendy straw made from?',
      choices: [{ jp: 'プラスチック', en: 'plastic' }, { jp: 'ガラス', en: 'glass' }, { jp: 'きんぞく', en: 'metal' }],
      correctJp: 'プラスチック',
    },
  ],
}

// ─── World 1 Module 4 — Seasons (きせつ) ─────────────────────────────────────

export const m14 = {
  pool1: [
    {
      visual: '🌸',
      q: 'はなが さく きせつは？',
      qEn: 'Which season do flowers bloom?',
      choices: [{ jp: 'はる', en: 'spring' }, { jp: 'なつ', en: 'summer' }, { jp: 'ふゆ', en: 'winter' }],
      correctJp: 'はる',
    },
    {
      visual: '❄️',
      q: 'ゆきが ふる きせつは？',
      qEn: 'Which season does it snow?',
      choices: [{ jp: 'ふゆ', en: 'winter' }, { jp: 'なつ', en: 'summer' }, { jp: 'はる', en: 'spring' }],
      correctJp: 'ふゆ',
    },
    {
      visual: '☀️',
      q: 'いちばん あつい きせつは？',
      qEn: 'Which is the hottest season?',
      choices: [{ jp: 'なつ', en: 'summer' }, { jp: 'はる', en: 'spring' }, { jp: 'ふゆ', en: 'winter' }],
      correctJp: 'なつ',
    },
    {
      visual: '🍂',
      q: 'はっぱが きいろや あかに なる きせつは？',
      qEn: 'When do leaves turn yellow and red?',
      choices: [{ jp: 'あき', en: 'autumn' }, { jp: 'なつ', en: 'summer' }, { jp: 'はる', en: 'spring' }],
      correctJp: 'あき',
    },
    {
      visual: '📅',
      q: 'きせつは いくつ ある？',
      qEn: 'How many seasons are there?',
      choices: [{ jp: '4つ', en: 'four' }, { jp: '3つ', en: 'three' }, { jp: '6つ', en: 'six' }],
      correctJp: '4つ',
    },
    {
      visual: '🌸',
      q: 'はるの つぎは なに？',
      qEn: 'What comes after spring?',
      choices: [{ jp: 'なつ', en: 'summer' }, { jp: 'あき', en: 'autumn' }, { jp: 'ふゆ', en: 'winter' }],
      correctJp: 'なつ',
    },
    {
      visual: '☀️',
      q: 'なつの つぎは なに？',
      qEn: 'What comes after summer?',
      choices: [{ jp: 'あき', en: 'autumn' }, { jp: 'ふゆ', en: 'winter' }, { jp: 'はる', en: 'spring' }],
      correctJp: 'あき',
    },
    {
      visual: '🍂',
      q: 'あきの つぎは なに？',
      qEn: 'What comes after autumn?',
      choices: [{ jp: 'ふゆ', en: 'winter' }, { jp: 'はる', en: 'spring' }, { jp: 'なつ', en: 'summer' }],
      correctJp: 'ふゆ',
    },
    {
      visual: '❄️',
      q: 'ふゆの つぎは なに？',
      qEn: 'What comes after winter?',
      choices: [{ jp: 'はる', en: 'spring' }, { jp: 'なつ', en: 'summer' }, { jp: 'あき', en: 'autumn' }],
      correctJp: 'はる',
    },
    {
      visual: '🌡️',
      q: 'いちばん さむい きせつは？',
      qEn: 'Which is the coldest season?',
      choices: [{ jp: 'ふゆ', en: 'winter' }, { jp: 'はる', en: 'spring' }, { jp: 'あき', en: 'autumn' }],
      correctJp: 'ふゆ',
    },
  ],
  pool2: [
    {
      visual: '🌞',
      q: 'どの きせつに ひが いちばん ながい？',
      qEn: 'Which season has the longest days?',
      choices: [{ jp: 'なつ', en: 'summer' }, { jp: 'ふゆ', en: 'winter' }, { jp: 'はる', en: 'spring' }],
      correctJp: 'なつ',
    },
    {
      visual: '🌑',
      q: 'どの きせつに ひが いちばん みじかい？',
      qEn: 'Which season has the shortest days?',
      choices: [{ jp: 'ふゆ', en: 'winter' }, { jp: 'なつ', en: 'summer' }, { jp: 'あき', en: 'autumn' }],
      correctJp: 'ふゆ',
    },
    {
      visual: '🌧️',
      q: 'イギリスの はるの てんきは？',
      qEn: 'What is spring weather like in the UK?',
      choices: [{ jp: 'だんだん あたたかく なる', en: 'getting warmer' }, { jp: 'とても さむい', en: 'very cold' }, { jp: 'とても あつい', en: 'very hot' }],
      correctJp: 'だんだん あたたかく なる',
    },
    {
      visual: '☀️',
      q: 'なつに よく みられる てんきは？',
      qEn: 'What weather is common in summer?',
      choices: [{ jp: 'はれて あつい', en: 'sunny and hot' }, { jp: 'ゆき', en: 'snow' }, { jp: 'こおり', en: 'ice' }],
      correctJp: 'はれて あつい',
    },
    {
      visual: '🍁',
      q: 'あきに よく みられるのは？',
      qEn: 'What is commonly seen in autumn?',
      choices: [{ jp: 'はっぱが おちる', en: 'falling leaves' }, { jp: 'ゆきが つもる', en: 'snow falling' }, { jp: 'はなが さく', en: 'flowers blooming' }],
      correctJp: 'はっぱが おちる',
    },
    {
      visual: '🌨️',
      q: 'ふゆに よく みられる てんきは？',
      qEn: 'What weather is common in winter?',
      choices: [{ jp: 'さむくて こおる', en: 'cold and frosty' }, { jp: 'はれて あつい', en: 'sunny and hot' }, { jp: 'はなが さく', en: 'flowers blooming' }],
      correctJp: 'さむくて こおる',
    },
    {
      visual: '⛄',
      q: 'ゆきだるまを つくれる きせつは？',
      qEn: 'In which season can you build a snowman?',
      choices: [{ jp: 'ふゆ', en: 'winter' }, { jp: 'なつ', en: 'summer' }, { jp: 'はる', en: 'spring' }],
      correctJp: 'ふゆ',
    },
    {
      visual: '🌸',
      q: 'さくらが さく きせつは？',
      qEn: 'In which season do cherry blossoms bloom?',
      choices: [{ jp: 'はる', en: 'spring' }, { jp: 'あき', en: 'autumn' }, { jp: 'ふゆ', en: 'winter' }],
      correctJp: 'はる',
    },
    {
      visual: '🏫',
      q: 'イギリスで がっこうが はじまる きせつは？',
      qEn: 'In which season does school start in the UK?',
      choices: [{ jp: 'あき', en: 'autumn' }, { jp: 'なつ', en: 'summer' }, { jp: 'はる', en: 'spring' }],
      correctJp: 'あき',
    },
    {
      visual: '🌦️',
      q: 'なつに ひが ながい のは なぜ？',
      qEn: 'Why are days longer in summer?',
      choices: [{ jp: 'たいようが たかく のぼる から', en: 'the sun rises higher' }, { jp: 'ゆきが とける から', en: 'snow melts' }, { jp: 'はなが さく から', en: 'flowers bloom' }],
      correctJp: 'たいようが たかく のぼる から',
    },
  ],
}

// ─── World 1 module registry ──────────────────────────────────────────────────

export const WORLD1_MODULES = [
  { id: 1, titleJp: 'しょくぶつをしらべよう', titleEn: 'Plants', emoji: '🌱', color: '#6BAF6B', data: m11 },
  { id: 2, titleJp: 'どうぶつをしらべよう',   titleEn: 'Animals', emoji: '🐾', color: '#E8963E', data: m12 },
  { id: 3, titleJp: 'ざいりょうをしらべよう', titleEn: 'Materials', emoji: '🪨', color: '#4DAAAA', data: m13 },
  { id: 4, titleJp: 'きせつをしらべよう',     titleEn: 'Seasons', emoji: '🍂', color: '#D45B5B', data: m14 },
]
