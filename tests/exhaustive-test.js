/**
 * Matushka Exhaustive Test Suite
 *
 * Tests category detection, ILR scoring, speech filter, and pedagogical level
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
 * Extract a const/let/var assignment (object or array).
 */
function extractConst(source, name, type = 'object') {
  const open = type === 'array' ? '[' : '{';
  const close = type === 'array' ? ']' : '}';
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
  blocks.push(extractFunction(source, 'analyzeTranscript'));
  blocks.push(extractFunction(source, 'estimateIlrFromMetrics'));

  // Return all symbols
  blocks.push(`
    return {
      CATEGORIES, CATEGORY_DETECTION, DISAMBIGUATION_RULES,
      ILR_ADVANCED_VOCAB, ILR_INTERMEDIATE_VOCAB, ILR_BEGINNER_VOCAB,
      CONTENT_TYPE_INDICATORS, ARGUMENTATIVE_INDICATORS, FACTUAL_INDICATORS,
      ADVANCED_TOPICS, INTERMEDIATE_TOPICS, TEXT_TYPE_LEVELS,
      escapeRegex, tokenizeText, wordBoundaryMatch,
      getDisambiguationAdjustment, inferCategory,
      detectContentType, estimatePedagogicalLevel,
      ilrLevelLabel, cleanTranscriptForAnalysis, vocabMatchPercent,
      analyzeTranscript, estimateIlrFromMetrics,
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
  assertOneOf(result.level, [1, 1.5, 2], `Simple weather should be ILR 1-2, got ${result.level}`);
});

// ILR 2: Standard news report
test('ILR 2: standard news report', () => {
  const text = 'В понедельник в Москве произошла авария на Ленинском проспекте. Полиция сообщает о трёх пострадавших. Движение было перекрыто на два часа. Причины инцидента выясняются. Расследование ведёт следственный комитет. Водитель грузовика задержан на месте происшествия. Свидетели дали показания.';
  const metrics = W.analyzeTranscript(text, 120);
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [2, 2.5, 3], `Standard news should be ILR 2-3, got ${result.level}`);
});

// ILR 2.5: Current events with intermediate vocab
test('ILR 2+ (2.5): current events + intermediate vocab', () => {
  const text = 'Эксперты считают, что ситуация на рынке труда существенно меняется. Безработица снизилась, однако многие специалисты ищут новые вакансии в смежных областях. Представитель министерства сообщил о новой программе поддержки занятости населения. Митинг профсоюзов состоялся у здания правительства. Официальное заявление ожидается завтра. Протест продолжался несколько часов. Реформа затронет миллионы граждан.';
  const metrics = W.analyzeTranscript(text, 120);
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [2, 2.5, 3], `Current events should be ILR 2-3, got ${result.level}`);
});

// ILR 3: Analytical text with advanced vocab + subordinate clauses
test('ILR 3: analytical text with advanced vocab', () => {
  const text = 'По мнению аналитиков, макроэкономическая ситуация свидетельствует о необходимости структурных реформ в ключевых секторах экономики. Эксперты полагают, что инфляционные риски возрастают, хотя Центральный банк предпринимает активные монетарные меры для стабилизации финансовой системы. В результате девальвации национальной валюты, которая произошла вследствие геополитических факторов, экономика столкнулась с серьёзными вызовами. Несмотря на это, правительство сохраняет оптимизм, поскольку валовой внутренний продукт продемонстрировал устойчивый рост в последнем квартале.';
  const metrics = W.analyzeTranscript(text, 120);
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [3, 3.5, 4], `Analytical text should be ILR 3+, got ${result.level}`);
});

// ILR 3.5: Dense academic style
test('ILR 3+ (3.5): dense academic text', () => {
  const text = 'Концептуальный анализ геополитической ситуации свидетельствует о формировании новой парадигмы международных отношений. Стратегическая стабильность, которая являлась основой двусторонних договорённостей, подвергается эскалации напряжённости. Методология оценки рисков, разработанная экспертами, предполагает детерминированный подход к анализу конвергенции экономических интересов. Вопреки прогнозам, демилитаризация региона потребует имплементации многосторонних соглашений, ратификация которых осложняется дипломатическими разногласиями. Дискурс о суверенитете приобретает новые измерения в контексте доктринальных противоречий.';
  const metrics = W.analyzeTranscript(text, 90);
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [3, 3.5, 4], `Dense academic text should be ILR 3-4, got ${result.level}`);
});

// ILR 4: Maximum complexity
test('ILR 4: maximum complexity political/legal text', () => {
  const text = 'Концептуальная парадигма международного права, основанная на принципах суверенитета и легитимности государственных институтов, претерпевает фундаментальную трансформацию вследствие эскалации геополитического противостояния, которое детерминировано стратегическими интересами крупнейших держав, стремящихся к гегемонии в ключевых регионах. Методологический анализ конвергенции экономических и дипломатических факторов свидетельствует о необходимости имплементации многосторонних механизмов деэскалации, ратификация которых предполагает достижение консенсуса, однако дивергенция позиций участников переговоров, обусловленная идеологическими противоречиями и доктринальными разногласиями, существенно осложняет процесс демаркации зон влияния. Макроэкономические последствия денонсации торговых соглашений, включая рецессию, стагфляцию и дефолт, потребуют кардинальной реструктуризации фискальной политики.';
  const metrics = W.analyzeTranscript(text, 90);
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [3.5, 4], `Maximum complexity should be ILR 3.5-4, got ${result.level}`);
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
// ============================================================================

section('ILR Score Boundaries (5 tests)');

test('score 2 → ILR 1', () => {
  // Minimal metrics: slow speech, low TTR, short sentences, no advanced vocab
  const metrics = {
    speechRate: 80, typeTokenRatio: 0.30, avgSentenceLength: 5,
    avgWordLength: 4, polysyllabicRatio: 2, clauseComplexity: 0,
    advancedVocabPercent: 0, intermediateVocabPercent: 0, beginnerVocabPercent: 20,
  };
  const result = W.estimateIlrFromMetrics(metrics);
  assertEqual(result.level, 1, `Score ~0-1 should be ILR 1, got ${result.level}`);
});

test('score ~5 → ILR 2', () => {
  const metrics = {
    speechRate: 125, typeTokenRatio: 0.45, avgSentenceLength: 12,
    avgWordLength: 5.2, polysyllabicRatio: 4, clauseComplexity: 0.3,
    advancedVocabPercent: 0, intermediateVocabPercent: 2, beginnerVocabPercent: 10,
  };
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [1.5, 2], `Mid-low score should be ILR 1.5-2, got ${result.level}`);
});

test('score ~10 → ILR 3', () => {
  // Target: 2+2+2+0+1+1+1+1 = 10 → ≤11 → ILR 3
  const metrics = {
    speechRate: 140, typeTokenRatio: 0.55, avgSentenceLength: 15,
    avgWordLength: 5.3, polysyllabicRatio: 8, clauseComplexity: 0.6,
    advancedVocabPercent: 0.8, intermediateVocabPercent: 4, beginnerVocabPercent: 5,
  };
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [2.5, 3], `Score ~10 should be ILR 2.5-3, got ${result.level}`);
});

test('score ~13 → ILR 3.5', () => {
  // Target: 3+2+2+1+2+1+1+1 = 13 → ≤14 → ILR 3.5
  const metrics = {
    speechRate: 155, typeTokenRatio: 0.62, avgSentenceLength: 19,
    avgWordLength: 6.5, polysyllabicRatio: 14, clauseComplexity: 0.7,
    advancedVocabPercent: 1.5, intermediateVocabPercent: 4, beginnerVocabPercent: 3,
  };
  const result = W.estimateIlrFromMetrics(metrics);
  assertOneOf(result.level, [3, 3.5], `Score ~13 should be ILR 3-3.5, got ${result.level}`);
});

test('score ~18+ → ILR 4', () => {
  const metrics = {
    speechRate: 170, typeTokenRatio: 0.80, avgSentenceLength: 30,
    avgWordLength: 8, polysyllabicRatio: 25, clauseComplexity: 2.0,
    advancedVocabPercent: 8, intermediateVocabPercent: 12, beginnerVocabPercent: 1,
  };
  const result = W.estimateIlrFromMetrics(metrics);
  assertEqual(result.level, 4, `Maximum score should be ILR 4, got ${result.level}`);
});

// ============================================================================
// SECTION 9: PEDAGOGICAL LEVEL (5 tests)
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
