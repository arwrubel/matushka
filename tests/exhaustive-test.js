/**
 * Matushka Exhaustive Test Suite
 *
 * Tests category detection, ILR scoring, speech filter, and pedagogical level estimation
 * by extracting pure functions from worker.js (which has no module exports).
 *
 * Usage: node tests/exhaustive-test.js
 * No npm dependencies required.
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// TEST FRAMEWORK (zero dependencies)
// ============================================================================

let totalTests = 0, passed = 0, failed = 0;
const failures = [];

function section(name) {
  console.log(`\n--- ${name} ---`);
}

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passed++;
    console.log(`  \x1b[32mPASS\x1b[0m  ${name}`);
  } catch (e) {
    failed++;
    const detail = e.expected !== undefined
      ? `Expected: ${JSON.stringify(e.expected)}, Got: ${JSON.stringify(e.actual)}`
      : e.message;
    failures.push({ name, detail });
    console.log(`  \x1b[31mFAIL\x1b[0m  ${name}`);
    console.log(`        ${detail}`);
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    const e = new Error(msg || `${actual} !== ${expected}`);
    e.actual = actual;
    e.expected = expected;
    throw e;
  }
}

function assertNotEqual(actual, unexpected, msg) {
  if (actual === unexpected) {
    const e = new Error(msg || `Got unexpected: ${actual}`);
    e.actual = actual;
    e.expected = `not ${unexpected}`;
    throw e;
  }
}

function assertOneOf(actual, options, msg) {
  if (!options.includes(actual)) {
    const e = new Error(msg || `${actual} not in [${options.join(', ')}]`);
    e.actual = actual;
    e.expected = options;
    throw e;
  }
}

function assertTrue(val, msg) {
  if (!val) {
    const e = new Error(msg || `Expected truthy, got ${val}`);
    e.actual = val;
    e.expected = true;
    throw e;
  }
}

function assertFalse(val, msg) {
  if (val) {
    const e = new Error(msg || `Expected falsy, got ${val}`);
    e.actual = val;
    e.expected = false;
    throw e;
  }
}

function assertGreater(actual, threshold, msg) {
  if (actual <= threshold) {
    const e = new Error(msg || `${actual} not > ${threshold}`);
    e.actual = actual;
    e.expected = `> ${threshold}`;
    throw e;
  }
}

function assertLessOrEqual(actual, threshold, msg) {
  if (actual > threshold) {
    const e = new Error(msg || `${actual} not <= ${threshold}`);
    e.actual = actual;
    e.expected = `<= ${threshold}`;
    throw e;
  }
}

// ============================================================================
// FUNCTION EXTRACTION HARNESS
// ============================================================================

/**
 * Extract a top-level block from source using a start pattern.
 * Counts braces/brackets to find the complete block.
 */
function extractBlock(source, startPattern, openChar = '{', closeChar = '}') {
  const match = source.match(startPattern);
  if (!match) throw new Error(`Cannot find pattern: ${startPattern}`);

  const startIdx = match.index;
  let braceStart = source.indexOf(openChar, startIdx);
  if (braceStart === -1) throw new Error(`No ${openChar} after: ${startPattern}`);

  let depth = 0;
  let i = braceStart;
  for (; i < source.length; i++) {
    if (source[i] === openChar) depth++;
    if (source[i] === closeChar) depth--;
    if (depth === 0) break;
  }

  // Include trailing semicolon if present
  let end = i + 1;
  if (source[end] === ';') end++;

  return source.substring(startIdx, end);
}

/**
 * Extract a function definition (handles nested braces).
 */
function extractFunction(source, name) {
  return extractBlock(source, new RegExp(`function\\s+${name}\\s*\\(`));
}

/**
 * Extract a const/let/var assignment (object, array, or set).
 * type: 'object' → { }, 'array' → [ ], 'set' → ( ) (for new Set(...))
 */
function extractConst(source, name, type = 'object') {
  const open = type === 'array' ? '[' : type === 'set' ? '(' : '{';
  const close = type === 'array' ? ']' : type === 'set' ? ')' : '}';
  return extractBlock(source, new RegExp(`const\\s+${name}\\s*=`), open, close);
}

function buildSandbox(source) {
  const blocks = [];

  // Stubs
  blocks.push(`
    const CONFIG = { debug: false };
    function log() {}
  `);

  // Data structures
  blocks.push(extractConst(source, 'CATEGORIES'));
  blocks.push(extractConst(source, 'CATEGORY_DETECTION'));
  blocks.push(extractConst(source, 'DISAMBIGUATION_RULES'));
  blocks.push(extractConst(source, 'ILR_ADVANCED_VOCAB', 'array'));
  blocks.push(extractConst(source, 'ILR_INTERMEDIATE_VOCAB', 'array'));
  blocks.push(extractConst(source, 'ILR_BEGINNER_VOCAB', 'array'));
  blocks.push(extractConst(source, 'CONTENT_TYPE_INDICATORS'));
  blocks.push(extractConst(source, 'ARGUMENTATIVE_INDICATORS', 'array'));
  blocks.push(extractConst(source, 'FACTUAL_INDICATORS', 'array'));
  blocks.push(extractConst(source, 'ADVANCED_TOPICS'));
  blocks.push(extractConst(source, 'INTERMEDIATE_TOPICS'));
  blocks.push(extractConst(source, 'TEXT_TYPE_LEVELS'));
  blocks.push(extractConst(source, 'RUSSIAN_STOP_WORDS', 'set'));
  blocks.push(extractConst(source, 'DISCOURSE_MARKERS'));

  // Frequency band data (new Set([...]))
  blocks.push(extractConst(source, 'FREQ_BAND_1', 'set'));
  blocks.push(extractConst(source, 'FREQ_BAND_2', 'set'));
  blocks.push(extractConst(source, 'FREQ_BAND_3', 'set'));
  blocks.push(extractConst(source, 'FREQ_BAND_4', 'set'));

  // Functions
  blocks.push(extractFunction(source, 'escapeRegex'));
  blocks.push(extractFunction(source, 'tokenizeText'));
  blocks.push(extractFunction(source, 'wordBoundaryMatch'));
  blocks.push(extractFunction(source, 'getDisambiguationAdjustment'));
  blocks.push(extractFunction(source, 'inferCategory'));
  blocks.push(extractFunction(source, 'detectContentType'));
  blocks.push(extractFunction(source, 'estimatePedagogicalLevel'));
  blocks.push(extractFunction(source, 'ilrLevelLabel'));
  blocks.push(extractFunction(source, 'cleanTranscriptForAnalysis'));
  blocks.push(extractFunction(source, 'vocabMatchPercent'));
  // Stemmer and frequency functions
  blocks.push(extractFunction(source, 'findRegions'));
  blocks.push(extractFunction(source, 'tryRemoveSuffix'));
  blocks.push(extractFunction(source, 'tryRemoveGroup1Suffix'));
  blocks.push(extractFunction(source, 'russianStem'));
  blocks.push(extractFunction(source, 'getFrequencyBand'));
  blocks.push(extractFunction(source, 'computeMTLDPass'));
  blocks.push(extractFunction(source, 'computeMTLD'));
  blocks.push(extractFunction(source, 'countDiscourseMarkers'));
  // New Textometr-inspired functions
  blocks.push(extractFunction(source, 'computeRkiCoverage'));
  blocks.push(extractFunction(source, 'computeReadability'));
  blocks.push(extractFunction(source, 'ilrToCefr'));
  // Stemmer suffix arrays (needed by russianStem)
  blocks.push(extractConst(source, 'RUSSIAN_VOWELS'));
  blocks.push(extractConst(source, 'PERFECTIVE_GERUND_1', 'array'));
  blocks.push(extractConst(source, 'PERFECTIVE_GERUND_2', 'array'));
  blocks.push(extractConst(source, 'REFLEXIVE', 'array'));
  blocks.push(extractConst(source, 'ADJECTIVE', 'array'));
  blocks.push(extractConst(source, 'PARTICIPLE_1', 'array'));
  blocks.push(extractConst(source, 'PARTICIPLE_2', 'array'));
  blocks.push(extractConst(source, 'VERB_1', 'array'));
  blocks.push(extractConst(source, 'VERB_2', 'array'));
  blocks.push(extractConst(source, 'NOUN', 'array'));
  blocks.push(extractConst(source, 'SUPERLATIVE', 'array'));
  blocks.push(extractConst(source, 'DERIVATIONAL', 'array'));
  // Analysis functions
  blocks.push(extractFunction(source, 'splitRussianSentences'));
  blocks.push(extractFunction(source, 'analyzeTranscript'));
  blocks.push(extractFunction(source, 'estimateIlrFromMetrics'));

  // Return all symbols
  blocks.push(`
    return {
      CATEGORIES, CATEGORY_DETECTION, DISAMBIGUATION_RULES,
      ILR_ADVANCED_VOCAB, ILR_INTERMEDIATE_VOCAB, ILR_BEGINNER_VOCAB,
      CONTENT_TYPE_INDICATORS, ARGUMENTATIVE_INDICATORS, FACTUAL_INDICATORS,
      ADVANCED_TOPICS, INTERMEDIATE_TOPICS, TEXT_TYPE_LEVELS,
      RUSSIAN_STOP_WORDS, DISCOURSE_MARKERS,
      FREQ_BAND_1, FREQ_BAND_2, FREQ_BAND_3, FREQ_BAND_4,
      escapeRegex, tokenizeText, wordBoundaryMatch,
      getDisambiguationAdjustment, inferCategory,
      detectContentType, estimatePedagogicalLevel,
      ilrLevelLabel, cleanTranscriptForAnalysis, vocabMatchPercent,
      russianStem, getFrequencyBand, computeMTLD, countDiscourseMarkers,
      computeRkiCoverage, computeReadability, ilrToCefr,
      splitRussianSentences, analyzeTranscript, estimateIlrFromMetrics,
    };
  `);

  const code = blocks.join('\n\n');
  try {
    return new Function(code)();
  } catch (e) {
    console.error('Sandbox creation failed:', e.message);
    // Write debug file
    fs.writeFileSync(path.join(__dirname, '_sandbox_debug.js'), code);
    console.error('Debug code written to tests/_sandbox_debug.js');
    process.exit(1);
  }
}

// ============================================================================
// SPEECH FILTER (reconstructed from worker.js lines 6018-6077)
// ============================================================================

function shouldPassSpeechFilter(item) {
  const title = (item.title || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const text = title + ' ' + desc;
  const dur = item.duration || 0;

  // Music
  if (/(?:музык|music|playlist|плейлист|подборка\s+музык|сборник|mix\b|remix)/i.test(text)) return false;
  // Slideshow
  if (/(?:слайд[-\s]?шоу|slideshow|фотогалере|photo\s*gallery)/i.test(text)) return false;
  // No commentary
  if (/(?:без\s+комментари|без\s+слов|no\s+comment|no\s+words)/i.test(text)) return false;
  // Relaxation/ASMR
  if (/(?:релакс|relax|ambient|медитаци|asmr|белый\s+шум|white\s+noise)/i.test(text)) return false;
  // Music video
  if (/(?:^клип(?=\s|$)|музыкальный\s+клип|music\s+video)/i.test(text)) return false;
  // Timelapse (unless reportage)
  if (/(?:timelapse|таймлапс|аэросъёмк|аэросъемк)/i.test(text) && !/(?:репортаж|сюжет|корреспондент)/i.test(text)) return false;

  // Full broadcasts > 40min
  if (dur > 2400) return false;

  // Date-only title = full broadcast
  if (/^\d{1,2}\s+(?:январ|феврал|март|апрел|ма[яй]|июн|июл|август|сентябр|октябр|ноябр|декабр)[а-яё]*\s+\d{4}/i.test(title) && !title.includes(':')) {
    return false;
  }

  // Raw footage without narration keywords
  if (/(?:^кадры(?=\s|$)|видеокадры|^видео\s|видеозапись|видеозаписи)/i.test(title)) {
    if (!/(?:сообщ|заяви|рассказ|объясн|коммент|корреспондент|сюжет|репортаж)/i.test(text)) {
      return false;
    }
  }

  // Live streams > 30min
  if (/(?:прямой\s+эфир|прямая\s+трансляция|live\s+stream|livestream|стрим(?=\s|$))/i.test(text) && dur > 1800) {
    return false;
  }

  // Hashtag-only short clip
  if (desc && desc.length < 30 && /^[#@\s\w]+$/.test(desc) && dur > 0 && dur < 60) {
    if (!/(?:сообщ|заяви|рассказ|объясн)/i.test(title)) {
      return false;
    }
  }

  // Very short clips < 15s
  if (dur > 0 && dur < 15) {
    if (!/(?:сообщ|заяви|рассказ|объясн|коммент|корреспондент|сюжет)/i.test(text)) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// MAIN
// ============================================================================

console.log('=== MATUSHKA EXHAUSTIVE TEST SUITE ===\n');

// Load and extract
const workerPath = path.join(__dirname, '..', 'worker', 'worker.js');
console.log(`Loading worker.js from: ${workerPath}`);
const source = fs.readFileSync(workerPath, 'utf8');
console.log(`Worker source: ${source.length} chars, ${source.split('\n').length} lines`);

const W = buildSandbox(source);
console.log(`Extracted ${Object.keys(W).length} symbols from worker.js\n`);

// ============================================================================
// SECTION 1: HELPER FUNCTIONS
// ============================================================================

section('Helper Functions (8 tests)');

test('wordBoundaryMatch: prefix "школ" in "школьники сдали экзамен"', () => {
  assertTrue(W.wordBoundaryMatch('школьники сдали экзамен', 'школ'));
});

test('wordBoundaryMatch: multi-word "прогноз погоды" in text', () => {
  assertTrue(W.wordBoundaryMatch('прогноз погоды на завтра', 'прогноз погоды'));
});

test('cleanTranscriptForAnalysis: removes URLs, hashtags, mentions', () => {
  const result = W.cleanTranscriptForAnalysis('Текст https://example.com и #хэштег @user конец.');
  assertTrue(!result.includes('https://'), 'URL not removed');
  assertTrue(!result.includes('#хэштег'), 'Hashtag not removed');
  assertTrue(!result.includes('@user'), 'Mention not removed');
  assertTrue(result.includes('Текст'), 'Content text removed');
  assertTrue(result.includes('конец'), 'Content text removed');
});

test('ilrLevelLabel: level 1', () => {
  assertEqual(W.ilrLevelLabel(1), 'ILR 1 — Elementary Proficiency');
});

test('ilrLevelLabel: level 2.5 (plus)', () => {
  assertEqual(W.ilrLevelLabel(2.5), 'ILR 2+ — Limited Working Proficiency, Plus');
});

test('ilrLevelLabel: level 3.5 (plus)', () => {
  assertEqual(W.ilrLevelLabel(3.5), 'ILR 3+ — General Professional Proficiency, Plus');
});

test('ilrLevelLabel: level 4', () => {
  assertEqual(W.ilrLevelLabel(4), 'ILR 4 — Advanced Professional Proficiency');
});

test('vocabMatchPercent: beginner words match beginner list', () => {
  const result = W.vocabMatchPercent(['погода', 'дождь', 'утро', 'дом'], W.ILR_BEGINNER_VOCAB);
  assertGreater(result, 0, `Beginner vocab match should be > 0, got ${result}`);
});

// ============================================================================
// SECTION 2: CATEGORY DETECTION (50 tests - 5 per category)
// ============================================================================

section('Category Detection — Politics (5 tests)');

const catTests = [
  // Politics
  { text: 'Путин подписал указ о назначении нового министра обороны', expected: 'politics', note: 'presidential decree' },
  { text: 'Госдума приняла законопроект о бюджете на 2026 год в третьем чтении', expected: 'politics', note: 'parliament legislation' },
  { text: 'Лавров заявил о готовности России к дипломатическим переговорам', expected: 'politics', note: 'MFA diplomacy' },
  { text: 'Выборы губернатора Московской области: предварительные результаты голосования', expected: 'politics', note: 'elections' },
  { text: 'Новые санкции ЕС: дипломатический ответ МИД России на решение западных политиков', expected: 'politics', note: 'EU sanctions' },
];

section('Category Detection — Economy (5 tests)');
catTests.push(
  { text: 'Курс рубля обновил максимум за полгода на фоне роста цен на нефть', expected: 'economy', note: 'currency rates' },
  { text: 'Центральный банк повысил ключевую ставку до 21 процента', expected: 'economy', note: 'central bank rate' },
  { text: 'Ипотека под 2 процента: кто может получить льготную субсидию', expected: 'economy', note: 'mortgage subsidy' },
  { text: 'Инфляция в России замедлилась до 4,5 процента годовых', expected: 'economy', note: 'inflation report' },
  { text: 'Газпром увеличил экспорт газа: выручка компании и прибыль растут на бирже', expected: 'economy', note: 'Gazprom export' },
);

section('Category Detection — Society (5 tests)');
catTests.push(
  { text: 'Новая школа на 1200 мест для учеников открылась в Подмосковье', expected: 'society', note: 'school opening' },
  { text: 'Врачи рассказали о пользе витаминов в зимний период для здоровья', expected: 'society', note: 'health advice' },
  { text: 'ЕГЭ 2026: какие изменения ждут выпускников при сдаче экзамена', expected: 'society', note: 'education exam' },
  { text: 'Как правильное питание помогает улучшить здоровье: советы диетолога', expected: 'society', note: 'diet/health' },
  { text: 'Волонтёры помогли многодетным семьям с детьми собрать вещи к школе', expected: 'society', note: 'volunteers families' },
);

section('Category Detection — Military (5 tests)');
catTests.push(
  { text: 'Минобороны: ВС РФ освободили населённый пункт в Донецкой области', expected: 'military', note: 'MoD liberation' },
  { text: 'Новый танк Т-14 Армата прошёл испытания на полигоне Минобороны', expected: 'military', note: 'tank testing' },
  { text: 'СВО: артиллерия уничтожила три бронемашины противника ВСУ', expected: 'military', note: 'SVO artillery' },
  { text: 'Гиперзвуковая ракета Циркон поступила на вооружение ВМФ России', expected: 'military', note: 'hypersonic weapon' },
  { text: 'Военные учения НАТО вблизи границ России вызвали беспокойство в Кремле', expected: 'military', note: 'NATO exercises' },
);

section('Category Detection — Sports (5 tests)');
catTests.push(
  { text: 'Сборная России по хоккею победила в финале чемпионата мира со счётом 3:1', expected: 'sports', note: 'hockey championship' },
  { text: 'Спартак выиграл матч Лиги чемпионов со счётом 2:1 у Баварии', expected: 'sports', note: 'football Champions League' },
  { text: 'Олимпиада 2026: расписание соревнований по фигурному катанию', expected: 'sports', note: 'Olympics skating' },
  { text: 'Боксёр Бетербиев защитил чемпионский пояс нокаутом в десятом раунде', expected: 'sports', note: 'boxing champion' },
  { text: 'Биатлон: российские спортсмены завоевали золото на этапе Кубка мира', expected: 'sports', note: 'biathlon gold' },
);

section('Category Detection — Culture (5 tests)');
catTests.push(
  { text: 'Большой театр представил новую постановку балета Лебединое озеро', expected: 'culture', note: 'Bolshoi ballet' },
  { text: 'В Москве открылась выставка художников-импрессионистов в Третьяковской галерее', expected: 'culture', note: 'art exhibition' },
  { text: 'Каннский кинофестиваль: российский фильм получил специальный приз жюри', expected: 'culture', note: 'Cannes film prize' },
  { text: 'Масленица 2026: где пройдут народные гулянья и празднования в Москве', expected: 'culture', note: 'Maslenitsa festival' },
  { text: 'Концерт симфонического оркестра состоялся в Московской филармонии', expected: 'culture', note: 'symphony concert' },
);

section('Category Detection — Science (5 tests)');
catTests.push(
  { text: 'Учёные РАН совершили научное открытие в области генетики и ДНК', expected: 'science', note: 'RAN genetics discovery' },
  { text: 'Роскосмос: космонавты вышли в открытый космос с борта МКС для ремонта', expected: 'science', note: 'Roscosmos spacewalk' },
  { text: 'Клинические испытания новой вакцины от гриппа начались в лаборатории', expected: 'science', note: 'vaccine trials' },
  { text: 'Квантовый компьютер: российские физики установили мировой рекорд', expected: 'science', note: 'quantum physics' },
  { text: 'Археологи обнаружили древний артефакт при научных раскопках в Крыму', expected: 'science', note: 'archaeology' },
);

section('Category Detection — Technology (5 tests)');
catTests.push(
  { text: 'Яндекс разработал новую нейросеть: технология искусственного интеллекта для разработчиков', expected: 'technology', note: 'Yandex neural network' },
  { text: 'Кибератака на российские банки: кибербезопасность под угрозой', expected: 'technology', note: 'cyberattack' },
  { text: 'Искусственный интеллект в Сколково: новый центр разработки технологий', expected: 'technology', note: 'AI Skolkovo' },
  { text: 'Робототехника на выставке технологий в Москве: роботы будущего', expected: 'technology', note: 'robotics expo' },
  { text: 'Блокчейн и криптовалюта: регулирование цифровых активов в России', expected: 'technology', note: 'blockchain crypto' },
);

section('Category Detection — Weather (5 tests)');
catTests.push(
  { text: 'Прогноз погоды на неделю: в Москве ожидаются сильные морозы до минус 25', expected: 'weather', note: 'weather forecast frost' },
  { text: 'Ураган обрушился на побережье: ветер до 150 километров в час, шторм', expected: 'weather', note: 'hurricane storm' },
  { text: 'МЧС предупреждает о сильном снегопаде и метели в Сибири', expected: 'weather', note: 'MChS snowstorm' },
  { text: 'Землетрясение магнитудой 6,5 произошло у берегов Камчатки', expected: 'weather', note: 'earthquake' },
  { text: 'Температура воздуха резко поднимется: синоптики обещают потепление', expected: 'weather', note: 'temperature warming' },
);

section('Category Detection — Crime (5 tests)');
catTests.push(
  { text: 'Полиция задержала группу мошенников: возбуждено уголовное дело, подозреваемые арестованы', expected: 'crime', note: 'fraud arrest' },
  { text: 'Убийство бизнесмена в центре Петербурга: полиция ищет подозреваемых', expected: 'crime', note: 'murder investigation' },
  { text: 'ФСБ задержала контрабандистов наркотиков на таможне при перевозке', expected: 'crime', note: 'drug smuggling' },
  { text: 'Суд вынес приговор по делу о хищении бюджетных средств в крупном размере', expected: 'crime', note: 'embezzlement verdict' },
  { text: 'Похищение ребёнка: полиция задержала подозреваемого через три дня поисков', expected: 'crime', note: 'kidnapping arrest' },
);

// Run all category tests
for (const tc of catTests) {
  test(`${tc.expected}: ${tc.note}`, () => {
    const result = W.inferCategory(tc.text, tc.url || '');
    assertEqual(result, tc.expected, `"${tc.text.substring(0, 50)}..." → ${result}, expected ${tc.expected}`);
  });
}

// ============================================================================
// SECTION 3: DISAMBIGUATION EDGE CASES (10 tests)
// ============================================================================

section('Disambiguation Edge Cases (10 tests)');

test('Ледниковый период шоу → sports, not weather', () => {
  const result = W.inferCategory('Ледниковый период: звёзды на льду вышли в эфир нового шоу сезона на Первом канале', '');
  assertEqual(result, 'sports');
});

test('Дед Мороз поздравил детей → NOT weather', () => {
  const result = W.inferCategory('Дед Мороз и Снегурочка поздравили детей в больнице с Новым годом', '');
  assertNotEqual(result, 'weather', 'Дед Мороз should not trigger weather');
});

test('Десант Дедов Морозов → NOT military', () => {
  const result = W.inferCategory('Десант Дедов Морозов в детской больнице: праздник для маленьких пациентов', '');
  assertNotEqual(result, 'military', 'Holiday десант should not trigger military');
});

test('Футболка с логотипом → NOT sports', () => {
  const result = W.inferCategory('Мужчина в футболке с логотипом компании вышел на пресс-конференцию для журналистов', '');
  assertNotEqual(result, 'sports', 'Футболка (t-shirt) should not trigger sports');
});

test('Голод в Африке → NOT sports', () => {
  const result = W.inferCategory('Голод в Африке: ООН запросила гуманитарную помощь для миллионов людей', '');
  assertNotEqual(result, 'sports', 'Голод (hunger) should not trigger sports');
});

test('Нападение на школу: стрельба → crime, NOT military', () => {
  const result = W.inferCategory('Нападение на школу: стрельба в гимназии, есть раненые ученики и учителя', '');
  assertNotEqual(result, 'military', 'School attack should not be military');
  // Could be crime or society
});

test('Лавина погибли → weather, NOT crime', () => {
  const result = W.inferCategory('Лавина сошла в горах Кавказа: погибли три туриста, спасатели ведут поиски', '');
  assertEqual(result, 'weather', 'Avalanche deaths should be weather');
});

test('Карнавал в Европе → culture, NOT politics', () => {
  const result = W.inferCategory('Яркий карнавал в Ницце: праздничное шествие с масками и костюмами', '');
  assertEqual(result, 'culture', 'European carnival should be culture');
});

test('Военная полиция задержала → military', () => {
  const result = W.inferCategory('Военная полиция задержала дезертира на блокпосту в зоне СВО', '');
  assertEqual(result, 'military');
});

test('Выставка в Третьяковской галерее → culture', () => {
  const result = W.inferCategory('Открытие выставки живописи в Третьяковской галерее: новые экспонаты представлены публике', '');
  assertEqual(result, 'culture');
});

// ============================================================================
// SECTION 4: URL-BASED CATEGORY SHORTCUTS (5 tests)
// ============================================================================

section('URL-based Category Shortcuts (5 tests)');

test('URL /ekonomika/ → economy', () => {
  const result = W.inferCategory('Новости дня', 'https://smotrim.ru/ekonomika/ruble-rate');
  assertEqual(result, 'economy');
});

test('URL /sport/ → sports', () => {
  const result = W.inferCategory('Результаты матча', 'https://smotrim.ru/sport/football-results');
  assertEqual(result, 'sports');
});

test('URL /kultura/ → culture', () => {
  const result = W.inferCategory('Премьера спектакля', 'https://smotrim.ru/kultura/bolshoi-ballet');
  assertEqual(result, 'culture');
});

test('URL /proisshestviya/ → crime', () => {
  const result = W.inferCategory('Происшествие в городе', 'https://smotrim.ru/proisshestviya/incident');
  assertEqual(result, 'crime');
});

test('URL /v-mire/ → politics', () => {
  const result = W.inferCategory('Международные новости', 'https://smotrim.ru/v-mire/summit');
  assertEqual(result, 'politics');
});

// ============================================================================
// SECTION 5: SPEECH FILTER (12 tests)
// ============================================================================

section('Speech Filter — Should be FILTERED (7 tests)');

test('filter: music compilation', () => {
  assertFalse(shouldPassSpeechFilter({ title: 'Музыка для релаксации: лучшие композиции', duration: 3600 }));
});

test('filter: slideshow', () => {
  assertFalse(shouldPassSpeechFilter({ title: 'Слайд-шоу лучших моментов года 2025', duration: 300 }));
});

test('filter: без комментариев', () => {
  assertFalse(shouldPassSpeechFilter({ title: 'Без комментариев: кадры с места событий', duration: 120 }));
});

test('filter: date-only title (full broadcast)', () => {
  assertFalse(shouldPassSpeechFilter({ title: '15 февраля 2026 года', duration: 2500 }));
});

test('filter: raw footage "Кадры" without narration', () => {
  assertFalse(shouldPassSpeechFilter({ title: 'Кадры взрыва на складе боеприпасов', duration: 45 }));
});

test('filter: live stream > 30min', () => {
  assertFalse(shouldPassSpeechFilter({ title: 'Прямой эфир из Кремля: ожидание заявления', duration: 7200 }));
});

test('filter: very short clip < 15s', () => {
  assertFalse(shouldPassSpeechFilter({ title: 'Момент удара', duration: 10 }));
});

section('Speech Filter — Should PASS (5 tests)');

test('pass: reportage with корреспондент', () => {
  assertTrue(shouldPassSpeechFilter({ title: 'Репортаж корреспондента о наводнении', duration: 180 }));
});

test('pass: presidential speech', () => {
  assertTrue(shouldPassSpeechFilter({ title: 'Путин выступил с обращением к нации', duration: 900 }));
});

test('pass: Вести news segment', () => {
  assertTrue(shouldPassSpeechFilter({ title: 'Вести: задержание подозреваемых в Москве', duration: 150 }));
});

test('pass: interview', () => {
  assertTrue(shouldPassSpeechFilter({ title: 'Интервью с экспертом о ситуации на рынке', duration: 600 }));
});

test('pass: footage WITH narration keyword', () => {
  assertTrue(shouldPassSpeechFilter({ title: 'Кадры с места событий: корреспондент рассказал', duration: 90 }));
});

// ============================================================================
// SECTION 6: ILR TRANSCRIPT ANALYSIS (7 tests)
// ============================================================================

section('ILR Transcript Analysis (7 tests)');

// ILR 1: Very basic, short words, slow speech rate
test('ILR 1: basic beginner text', () => {
  const text = 'Дом. Погода. Дождь. Снег. Утро. День. Вечер. Мама. Папа. Семья. Школа. Работа. Магазин. Автобус. Хлеб.';
  const metrics = W.analyzeTranscript(text, 180); // 15 words in 3 min = 5 wpm (very slow)
  const result = W.estimateIlrFromMetrics(metrics);
  assertEqual(result.level, 1, `Expected ILR 1, got ${result.level} (score would be low)`);
});

// ILR 1.5: Simple weather sentences
test('ILR 1+ (1.5): simple weather', () => {
  const text = 'Сегодня утром в Москве было облачно. Температура составит десять градусов. Завтра ожидается дождь. Хорошая погода вернётся в среду. На улице было холодно. Ветер слабый.';
  const metrics = W.analyzeTranscript(text, 90);
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [1, 1.5, 2, 2.5], `Simple weather should be ILR 1-2.5, got ${result.level}`);
});

// ILR 2: Standard news report (short text — score lower than full-length corpus texts)
test('ILR 2: standard news report', () => {
  const text = 'В понедельник в Москве произошла авария на Ленинском проспекте. Полиция сообщает о трёх пострадавших. Движение было перекрыто на два часа. Причины инцидента выясняются. Расследование ведёт следственный комитет. Водитель грузовика задержан на месте происшествия. Свидетели дали показания.';
  const metrics = W.analyzeTranscript(text, 120);
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [1, 1.5, 2, 2.5], `Standard news should be ILR 1-2.5 (short text), got ${result.level}`);
});

// ILR 2.5: Current events with intermediate vocab
test('ILR 2+ (2.5): current events + intermediate vocab', () => {
  const text = 'Эксперты считают, что ситуация на рынке труда существенно меняется. Безработица снизилась, однако многие специалисты ищут новые вакансии в смежных областях. Представитель министерства сообщил о новой программе поддержки занятости населения. Митинг профсоюзов состоялся у здания правительства. Официальное заявление ожидается завтра. Протест продолжался несколько часов. Реформа затронет миллионы граждан.';
  const metrics = W.analyzeTranscript(text, 120);
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [1.5, 2, 2.5, 3], `Current events should be ILR 1.5-3 (short text), got ${result.level}`);
});

// ILR 3: Analytical text with advanced vocab + subordinate clauses
test('ILR 3: analytical text with advanced vocab', () => {
  const text = 'По мнению аналитиков, макроэкономическая ситуация свидетельствует о необходимости структурных реформ в ключевых секторах экономики. Эксперты полагают, что инфляционные риски возрастают, хотя Центральный банк предпринимает активные монетарные меры для стабилизации финансовой системы. В результате девальвации национальной валюты, которая произошла вследствие геополитических факторов, экономика столкнулась с серьёзными вызовами. Несмотря на это, правительство сохраняет оптимизм, поскольку валовой внутренний продукт продемонстрировал устойчивый рост в последнем квартале.';
  const metrics = W.analyzeTranscript(text, 120);
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [2, 2.5, 3, 3.5], `Analytical text should be ILR 2-3.5 (short text), got ${result.level}`);
});

// ILR 3.5: Dense academic style
test('ILR 3+ (3.5): dense academic text', () => {
  const text = 'Концептуальный анализ геополитической ситуации свидетельствует о формировании новой парадигмы международных отношений. Стратегическая стабильность, которая являлась основой двусторонних договорённостей, подвергается эскалации напряжённости. Методология оценки рисков, разработанная экспертами, предполагает детерминированный подход к анализу конвергенции экономических интересов. Вопреки прогнозам, демилитаризация региона потребует имплементации многосторонних соглашений, ратификация которых осложняется дипломатическими разногласиями. Дискурс о суверенитете приобретает новые измерения в контексте доктринальных противоречий.';
  const metrics = W.analyzeTranscript(text, 90);
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [2, 2.5, 3, 3.5, 4], `Dense academic text should be ILR 2-4 (short text), got ${result.level}`);
});

// ILR 4: Maximum complexity
test('ILR 4: maximum complexity political/legal text', () => {
  const text = 'Концептуальная парадигма международного права, основанная на принципах суверенитета и легитимности государственных институтов, претерпевает фундаментальную трансформацию вследствие эскалации геополитического противостояния, которое детерминировано стратегическими интересами крупнейших держав, стремящихся к гегемонии в ключевых регионах. Методологический анализ конвергенции экономических и дипломатических факторов свидетельствует о необходимости имплементации многосторонних механизмов деэскалации, ратификация которых предполагает достижение консенсуса, однако дивергенция позиций участников переговоров, обусловленная идеологическими противоречиями и доктринальными разногласиями, существенно осложняет процесс демаркации зон влияния. Макроэкономические последствия денонсации торговых соглашений, включая рецессию, стагфляцию и дефолт, потребуют кардинальной реструктуризации фискальной политики.';
  const metrics = W.analyzeTranscript(text, 90);
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [2.5, 3, 3.5, 4], `Maximum complexity should be ILR 2.5-4 (short text), got ${result.level}`);
});

// ============================================================================
// SECTION 7: VOCABULARY MATCHING (10 tests)
// ============================================================================

section('Vocabulary Matching (10 tests)');

test('advanced stem "законопроект" matches "законопроекта"', () => {
  assertTrue(W.ILR_ADVANCED_VOCAB.some(v => 'законопроекта'.includes(v)),
    'законопроекта should match an advanced vocab stem');
});

test('advanced stem "геополитич" matches "геополитического"', () => {
  assertTrue(W.ILR_ADVANCED_VOCAB.some(v => 'геополитического'.includes(v)),
    'геополитического should match an advanced vocab stem');
});

test('advanced stem "макроэкономич" matches "макроэкономическая"', () => {
  assertTrue(W.ILR_ADVANCED_VOCAB.some(v => 'макроэкономическая'.includes(v)),
    'макроэкономическая should match an advanced vocab stem');
});

test('beginner stem "погода" matches "погода"', () => {
  assertTrue(W.ILR_BEGINNER_VOCAB.some(v => 'погода'.includes(v)),
    'погода should match a beginner vocab stem');
});

test('beginner stem "дождь" matches', () => {
  assertTrue(W.ILR_BEGINNER_VOCAB.some(v => 'дождь'.includes(v)),
    'дождь should match a beginner vocab stem');
});

test('intermediate stem "расследован" matches "расследования"', () => {
  assertTrue(W.ILR_INTERMEDIATE_VOCAB.some(v => 'расследования'.includes(v)),
    'расследования should match an intermediate vocab stem');
});

test('intermediate stem "митинг" matches "митинга"', () => {
  assertTrue(W.ILR_INTERMEDIATE_VOCAB.some(v => 'митинга'.includes(v)),
    'митинга should match an intermediate vocab stem');
});

test('vocabMatchPercent with beginner words > 0', () => {
  const result = W.vocabMatchPercent(['погода', 'дождь', 'утро', 'дом', 'школа'], W.ILR_BEGINNER_VOCAB);
  assertGreater(result, 0, `Beginner words should match > 0%, got ${result}%`);
});

test('vocabMatchPercent with advanced words > 0', () => {
  const result = W.vocabMatchPercent(['парадигма', 'методология', 'дискурс', 'доктрина'], W.ILR_ADVANCED_VOCAB);
  assertGreater(result, 0, `Advanced words should match > 0%, got ${result}%`);
});

test('vocabMatchPercent: basic words have 0% advanced match', () => {
  const result = W.vocabMatchPercent(['дом', 'мама', 'папа', 'кот', 'стол'], W.ILR_ADVANCED_VOCAB);
  assertEqual(result, 0, `Basic words should have 0% advanced match, got ${result}%`);
});

// ============================================================================
// SECTION 8: ILR SCORE BOUNDARIES (5 tests)
// Scoring: speechRate(0-3) + MTLD(0-2) + avgSentLen(0-6) + freqBands(0-4*)
//   + lexDensity(0-2*) + avgWordLen(0-5) + polysyllabic(0-5) + clause(0-3)
//   + discourse(0-3) + domainBonus(0-1) + rkiCoverage(0-2**) + readability(0-2)
//   * scaled by freqConfidence = min(1, wordCount/100)
//   ** only for texts ≥ 100 words
// Boundaries: ≤7→1, ≤14→1.5, ≤21→2, ≤26→2.5, ≤29→3, ≤32→3.5, >32→4
// ============================================================================

section('ILR Score Boundaries (7 tests)');

test('score ~0 → ILR 1', () => {
  const metrics = {
    wordCount: 200, speechRate: 80, mtld: 10, avgSentenceLength: 5,
    avgWordLength: 4, polysyllabicRatio: 2, clauseComplexity: 0,
    lexicalDensity: 40, freqBand3Percent: 0, freqBand4Percent: 0,
    outOfBandPercent: 0, discoursePerSentence: 0, domainAdvancedPercent: 0,
    rkiCoverage: { level: 'A1' }, readability: 60,
  };
  const result = W.estimateIlrFromMetrics(metrics);
  assertEqual(result.level, 1, `Score ~0 should be ILR 1, got ${result.level}`);
});

test('score ~10 → ILR 1.5', () => {
  // sr(2)+mtld(1)+sent(1)+lexSoph(0)+lexDens(1)+wl(1)+poly(0)+clause(1)+disc(0)+dom(0)+rki(0)+read(1)=8
  const metrics = {
    wordCount: 200, speechRate: 125, mtld: 50, avgSentenceLength: 10,
    avgWordLength: 6.0, polysyllabicRatio: 10, clauseComplexity: 0.4,
    lexicalDensity: 58, freqBand3Percent: 2, freqBand4Percent: 1,
    outOfBandPercent: 1, discoursePerSentence: 0.05, domainAdvancedPercent: 0,
    rkiCoverage: { level: 'A1' }, readability: 45,
  };
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [1, 1.5], `Score ~8 should be ILR 1-1.5, got ${result.level}`);
});

test('score ~24 → ILR 2.5', () => {
  // sr(2)+mtld(2)+sent(3)+lexSoph(3)+lexDens(2)+wl(3)+poly(3)+clause(1)+disc(2)+dom(0)+rki(1)+read(1.5)=23.5
  const metrics = {
    wordCount: 200, speechRate: 140, mtld: 90, avgSentenceLength: 21,
    avgWordLength: 8.2, polysyllabicRatio: 45, clauseComplexity: 0.5,
    lexicalDensity: 70, freqBand3Percent: 10, freqBand4Percent: 8,
    outOfBandPercent: 12, discoursePerSentence: 0.5, domainAdvancedPercent: 1,
    rkiCoverage: { level: 'B2' }, readability: 30,
  };
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [2.5, 3], `Score ~24 should be ILR 2.5-3, got ${result.level}`);
});

test('score ~28 → ILR 3', () => {
  // sr(3)+mtld(2)+sent(4)+lexSoph(3)+lexDens(2)+wl(4)+poly(4)+clause(1)+disc(1)+dom(0)+rki(1.5)+read(2)=27.5
  const metrics = {
    wordCount: 200, speechRate: 155, mtld: 100, avgSentenceLength: 27,
    avgWordLength: 9.0, polysyllabicRatio: 55, clauseComplexity: 0.5,
    lexicalDensity: 70, freqBand3Percent: 10, freqBand4Percent: 8,
    outOfBandPercent: 10, discoursePerSentence: 0.3, domainAdvancedPercent: 1,
    rkiCoverage: { level: 'C1' }, readability: 15,
  };
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [3, 3.5], `Score ~28 should be ILR 3-3.5, got ${result.level}`);
});

test('max score → ILR 4', () => {
  // sr(3)+mtld(2)+sent(7)+lexSoph(4)+lexDens(2)+wl(5)+poly(5)+clause(4)+disc(3)+dom(1)+rki(2)+read(2)+oob(3)=43
  const metrics = {
    wordCount: 200, speechRate: 170, mtld: 100, avgSentenceLength: 60,
    avgWordLength: 10, polysyllabicRatio: 65, clauseComplexity: 2.5,
    lexicalDensity: 70, freqBand3Percent: 15, freqBand4Percent: 12,
    outOfBandPercent: 30, discoursePerSentence: 1.5, domainAdvancedPercent: 5,
    rkiCoverage: { level: 'C2' }, readability: 5,
  };
  const result = W.estimateIlrFromMetrics(metrics);
  assertEqual(result.level, 4, `Maximum score should be ILR 4, got ${result.level}`);
  assertTrue(result.components && result.components.oob === 3, `OOB component should be 3 for oob=30%, got ${result.components ? result.components.oob : 'no components'}`);
  assertTrue(result.components.sentLen === 7, `sentLen should be 7 for avgSentLen=60, got ${result.components.sentLen}`);
});

test('OOB component: gated by avgWordLength >= 7.5', () => {
  // Simple text with high OOB but low wordLen should NOT get OOB points
  const simpleMetrics = {
    wordCount: 200, speechRate: 80, mtld: 10, avgSentenceLength: 5,
    avgWordLength: 5.0, polysyllabicRatio: 2, clauseComplexity: 0,
    lexicalDensity: 40, freqBand3Percent: 0, freqBand4Percent: 0,
    outOfBandPercent: 25, discoursePerSentence: 0, domainAdvancedPercent: 0,
    rkiCoverage: { level: 'A1' }, readability: 60,
  };
  const r1 = W.estimateIlrFromMetrics(simpleMetrics);
  assertTrue(r1.components.oob === 0, `OOB should be 0 when wordLen=5.0 (gated), got ${r1.components.oob}`);

  // Professional text with high OOB and high wordLen SHOULD get OOB points
  const proMetrics = { ...simpleMetrics, avgWordLength: 8.5 };
  const r2 = W.estimateIlrFromMetrics(proMetrics);
  assertTrue(r2.components.oob === 2, `OOB should be 2 when wordLen=8.5 and oob=25%, got ${r2.components.oob}`);
});

// ============================================================================
// SECTION 9: RUSSIAN SENTENCE SPLITTING (4 tests)
// ============================================================================

section('Russian Sentence Splitting (4 tests)');

test('simple sentences split correctly', () => {
  const result = W.splitRussianSentences('Это первое предложение. Это второе. А это третье!');
  assertEqual(result.length, 3, `Expected 3 sentences, got ${result.length}`);
});

test('abbreviations not treated as sentence boundaries', () => {
  // Aggressive protection: В.Д., г., ст. all protected unconditionally
  // Even "г. Дело" stays joined — critical for legal texts like "ст. Конституции"
  const text = 'Судья В.Д. Зорькин рассмотрел дело от 15 октября 2003 г. Дело касалось ст. 35 Конституции.';
  const result = W.splitRussianSentences(text);
  assertEqual(result.length, 1, `Expected 1 sentence (aggressive protection joins all), got ${result.length}`);
});

test('legal citations with multiple abbreviations', () => {
  // One massive sentence with many abbreviation periods
  const text = 'Конституционный Суд в составе К.В. Арановского и Г.А. Гаджиева рассмотрел дело о проверке конституционности положений ФЗ от 12 августа 1995 г. № 144-ФЗ.';
  const result = W.splitRussianSentences(text);
  assertEqual(result.length, 1, `Expected 1 sentence (all abbreviations protected), got ${result.length}`);
});

test('т.д. and т.п. protected', () => {
  // Aggressive protection replaces both periods in "т.д." and "т.п.",
  // so the sentence-ending period is also consumed — entire text becomes 1 segment
  const text = 'Документы включают паспорт, справку и т.д. Далее необходимо подать заявление и т.п. Процедура завершена.';
  const result = W.splitRussianSentences(text);
  assertEqual(result.length, 1, `Expected 1 sentence (aggressive protection consumes all periods), got ${result.length}`);
});

// ============================================================================
// SECTION 10: STEMMER, MTLD, FREQUENCY BANDS & DISCOURSE (15 tests)
// ============================================================================

section('Stemmer, MTLD, Frequency Bands & Discourse (15 tests)');

// --- Russian Snowball Stemmer ---
test('stemmer: noun cases → same stem', () => {
  const forms = ['политика', 'политики', 'политике', 'политику', 'политикой'];
  const stems = forms.map(w => W.russianStem(w));
  const allSame = stems.every(s => s === stems[0]);
  assertTrue(allSame, `All noun cases should stem same: got ${stems.join(', ')}`);
});

test('stemmer: verb conjugations → same stem', () => {
  const forms = ['говорить', 'говорю', 'говорит', 'говорили', 'говорящий'];
  const stems = forms.map(w => W.russianStem(w));
  // At minimum the infinitive and past tense should share a stem
  assertTrue(stems[0] === stems[3], `говорить and говорили should share stem, got ${stems[0]} vs ${stems[3]}`);
});

test('stemmer: adjective forms → same stem', () => {
  const stems = ['экономический', 'экономическая', 'экономическое', 'экономических'].map(w => W.russianStem(w));
  const allSame = stems.every(s => s === stems[0]);
  assertTrue(allSame, `Adjective forms should stem same: got ${stems.join(', ')}`);
});

test('stemmer: ё → е normalization', () => {
  const s1 = W.russianStem('ещё');
  const s2 = W.russianStem('еще');
  assertEqual(s1, s2, `ё and е variants should produce same stem`);
});

test('stemmer: short words unchanged', () => {
  const s = W.russianStem('я');
  assertEqual(s, 'я', `Single-char word should be unchanged`);
});

// --- Frequency Bands ---
test('frequency band: common word in band 1', () => {
  const stem = W.russianStem('человек');
  const band = W.getFrequencyBand(stem);
  assertEqual(band, 1, `"человек" should be in band 1 (top 1000), got band ${band} for stem "${stem}"`);
});

test('frequency band: mid-freq word in band 2-3', () => {
  const stem = W.russianStem('территория');
  const band = W.getFrequencyBand(stem);
  assertTrue(band >= 1 && band <= 3, `"территория" should be in bands 1-3, got band ${band} for stem "${stem}"`);
});

test('frequency band: rare word in high band or out-of-band', () => {
  const stem = W.russianStem('геополитический');
  const band = W.getFrequencyBand(stem);
  assertTrue(band >= 3, `"геополитический" should be in band 3+ or out-of-band, got band ${band} for stem "${stem}"`);
});

// --- MTLD ---
test('MTLD: repetitive text → low score', () => {
  const words = [];
  for (let i = 0; i < 50; i++) words.push(i % 3 === 0 ? 'дом' : i % 3 === 1 ? 'кот' : 'сад');
  const score = W.computeMTLD(words);
  assertTrue(score < 30, `Repetitive 3-word vocab should have low MTLD, got ${score}`);
});

test('MTLD: diverse text → higher score', () => {
  const words = 'политика экономика общество культура наука техника спорт погода здоровье образование финансы промышленность транспорт сельский энергия'.split(' ');
  // Repeat to get enough tokens
  const extended = [...words, ...words, ...words, ...words];
  const score = W.computeMTLD(extended);
  assertTrue(score > 10, `Diverse vocabulary should have reasonable MTLD, got ${score}`);
});

test('MTLD: too-short text returns length', () => {
  const score = W.computeMTLD(['один', 'два', 'три']);
  assertEqual(score, 3, `Text shorter than 10 tokens should return length, got ${score}`);
});

// --- Discourse Markers ---
test('discourse markers: hedging detected', () => {
  const text = 'Возможно, эта ситуация изменится. По всей видимости, переговоры продолжатся.';
  const counts = W.countDiscourseMarkers(text);
  assertTrue(counts.hedging >= 2, `Should detect 2+ hedging markers, got ${counts.hedging}`);
});

test('discourse markers: evidentiality detected', () => {
  const text = 'По данным министерства, ситуация стабильна. Как сообщает пресс-служба, меры приняты.';
  const counts = W.countDiscourseMarkers(text);
  assertTrue(counts.evidentiality >= 2, `Should detect 2+ evidentiality markers, got ${counts.evidentiality}`);
});

test('discourse markers: simple text → zero markers', () => {
  const text = 'Дом стоит на улице. Кошка сидит на окне. Дети играют во дворе.';
  const counts = W.countDiscourseMarkers(text);
  assertEqual(counts.total, 0, `Simple text should have 0 discourse markers, got ${counts.total}`);
});

// ============================================================================
// SECTION 10: RKI COVERAGE, READABILITY & CEFR MAPPING (12 tests)
// ============================================================================

section('RKI Coverage, Readability & CEFR Mapping (12 tests)');

// --- computeRkiCoverage ---
test('RKI: all band1 words → level A1', () => {
  const result = W.computeRkiCoverage([100, 0, 0, 0, 0], 100);
  assertEqual(result.level, 'A1', `All band1 should be A1, got ${result.level}`);
});

test('RKI: spread across bands 1+2 (>95%) → level B1', () => {
  const result = W.computeRkiCoverage([70, 27, 2, 1, 0], 100);
  assertEqual(result.level, 'B1', `97% in bands1+2 should be B1, got ${result.level}`);
});

test('RKI: needs 3 bands for 95% → level B2', () => {
  const result = W.computeRkiCoverage([60, 20, 16, 3, 1], 100);
  assertEqual(result.level, 'B2', `96% in bands1+2+3 should be B2, got ${result.level}`);
});

test('RKI: needs all 4 bands for 95% → level C1', () => {
  const result = W.computeRkiCoverage([50, 20, 10, 16, 4], 100);
  assertEqual(result.level, 'C1', `96% in all bands should be C1, got ${result.level}`);
});

test('RKI: many out-of-band words → level C2', () => {
  const result = W.computeRkiCoverage([40, 15, 10, 10, 25], 100);
  assertEqual(result.level, 'C2', `75% in bands should be C2, got ${result.level}`);
});

test('RKI: zero words → defaults to A1', () => {
  const result = W.computeRkiCoverage([0, 0, 0, 0, 0], 0);
  assertEqual(result.level, 'A1', `Zero words should default to A1, got ${result.level}`);
});

// --- computeReadability ---
test('readability: short sentences + few syllables → high score (easy)', () => {
  // 206.835 - 1.3*8 - 60.1*2.0 = 206.835 - 10.4 - 120.2 = 76.2
  const score = W.computeReadability(8, 2.0);
  assertGreater(score, 70, `Easy text should have readability >70, got ${score}`);
});

test('readability: long sentences + many syllables → low score (hard)', () => {
  // 206.835 - 1.3*25 - 60.1*3.5 = 206.835 - 32.5 - 210.35 = -35.0 → clamped to 0
  const score = W.computeReadability(25, 3.5);
  assertLessOrEqual(score, 30, `Hard text should have readability ≤30, got ${score}`);
});

test('readability: result clamped to 0-100', () => {
  const low = W.computeReadability(50, 5);
  const high = W.computeReadability(1, 0.5);
  assertTrue(low >= 0, `Readability should not be negative, got ${low}`);
  assertTrue(high <= 100, `Readability should not exceed 100, got ${high}`);
});

// --- ilrToCefr ---
test('ILR 1 → CEFR A2', () => {
  assertEqual(W.ilrToCefr(1), 'A2');
});

test('ILR 2 → CEFR B1, ILR 2.5 → CEFR B2', () => {
  assertEqual(W.ilrToCefr(2), 'B1');
  assertEqual(W.ilrToCefr(2.5), 'B2');
});

test('ILR 3 → CEFR C1, ILR 4 → CEFR C2', () => {
  assertEqual(W.ilrToCefr(3), 'C1');
  assertEqual(W.ilrToCefr(4), 'C2');
});

// ============================================================================
// SECTION 11: PEDAGOGICAL LEVEL (5 tests)
// ============================================================================

section('Pedagogical Level (5 tests)');

test('weather forecast short → beginner', () => {
  const result = W.estimatePedagogicalLevel({
    title: 'Прогноз погоды на завтра: ожидается дождь',
    description: 'Температура составит 5 градусов',
    category: 'weather',
    duration: 60,
    source: 'smotrim',
  });
  assertEqual(result, 'beginner');
});

test('standard Вести news → intermediate', () => {
  const result = W.estimatePedagogicalLevel({
    title: 'Вести: в Москве открыли новую станцию метро для пассажиров',
    description: 'Станция расположена на новой ветке метро',
    category: 'society',
    duration: 150,
    source: 'smotrim',
  });
  assertEqual(result, 'intermediate');
});

test('Познер interview long → advanced', () => {
  const result = W.estimatePedagogicalLevel({
    title: 'Познер: эксклюзивное интервью о геополитической ситуации, по мнению экспертов это свидетельствует о кризисе',
    description: 'Владимир Познер беседует с аналитиком о стратегическом анализе международных отношений',
    category: 'politics',
    duration: 2400,
    source: '1tv',
  });
  assertEqual(result, 'advanced');
});

test('sports Матч ТВ → intermediate', () => {
  const result = W.estimatePedagogicalLevel({
    title: 'Матч ТВ: обзор игры ЦСКА против Спартака',
    description: 'Полный обзор хоккейного матча с голами и моментами',
    category: 'sports',
    duration: 240,
    source: 'smotrim',
  });
  assertEqual(result, 'intermediate');
});

test('documentary long → advanced or intermediate', () => {
  const result = W.estimatePedagogicalLevel({
    title: 'Документальный фильм: стратегическое вооружение России, по мнению аналитиков',
    description: 'Подробный анализ оборонной промышленности и методологии разработки вооружений',
    category: 'military',
    duration: 2700,
    source: '1tv',
  });
  assertOneOf(result, ['intermediate', 'advanced'], `Documentary should be intermediate or advanced, got ${result}`);
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log(`\n=== SUMMARY ===`);
console.log(`Total: ${totalTests}  \x1b[32mPassed: ${passed}\x1b[0m  \x1b[${failed > 0 ? '31' : '32'}mFailed: ${failed}\x1b[0m`);

if (failures.length > 0) {
  console.log(`\n\x1b[31mFAILED TESTS:\x1b[0m`);
  failures.forEach((f, i) => {
    console.log(`  ${i + 1}. ${f.name}`);
    console.log(`     ${f.detail}`);
  });
}

console.log('');
process.exit(failed > 0 ? 1 : 0);
