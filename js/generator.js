// Pure username-generation logic. No DOM access.
// Takes parsed word lists + options, returns a string.

export const PRESETS = {
  classic: {
    label: "Classic",
    sources: ["adjectives", "nouns"],
    description: "Adjective + noun. Safe, short, everyday words.",
  },
  wildlife: {
    label: "Wildlife",
    sources: ["adjectives", "animals"],
    description: "Adjective + animal.",
  },
  foodie: {
    label: "Foodie",
    sources: ["adjectives", "foods"],
    description: "Adjective + fruit or vegetable.",
  },
  colorful: {
    label: "Colorful",
    sources: ["colors", "nouns"],
    description: "Color + noun.",
  },
  passphrase: {
    label: "Passphrase",
    sources: ["eff"],
    description: "Multiple words from the EFF diceware list.",
  },
};

const SEPARATORS = {
  hyphen: "-",
  underscore: "_",
  dot: ".",
  none: "",
};

export const DEFAULT_OPTIONS = Object.freeze({
  preset: "classic",
  wordCount: 2,
  separator: "hyphen",
  caseStyle: "lower",
  digits: 0,
  maxLength: 0,
});

// Unbiased integer in [0, maxExclusive) using the Web Crypto API.
function randomInt(maxExclusive) {
  if (maxExclusive <= 0) throw new Error("randomInt: max must be > 0");
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive;
  let n;
  do {
    crypto.getRandomValues(buf);
    n = buf[0];
  } while (n >= limit);
  return n % maxExclusive;
}

function pickRandom(arr) {
  return arr[randomInt(arr.length)];
}

function randomDigits(count) {
  let out = "";
  for (let i = 0; i < count; i++) out += String(randomInt(10));
  return out;
}

function titleCase(word) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function applyCase(words, caseStyle) {
  switch (caseStyle) {
    case "upper":
      return words.map((w) => w.toUpperCase());
    case "title":
      return words.map(titleCase);
    case "camel":
      return words.map((w, i) => (i === 0 ? w.toLowerCase() : titleCase(w)));
    default:
      return words.map((w) => w.toLowerCase());
  }
}

function pickWords(lists, preset, wordCount) {
  const { sources } = PRESETS[preset];
  const words = [];
  for (let i = 0; i < wordCount; i++) {
    const source = sources[Math.min(i, sources.length - 1)];
    const pool = lists[source];
    if (!pool?.length) {
      throw new Error(`No words available for source "${source}"`);
    }
    words.push(pickRandom(pool));
  }
  return words;
}

function buildOnce(lists, opts) {
  const words = applyCase(
    pickWords(lists, opts.preset, opts.wordCount),
    opts.caseStyle,
  );
  // camelCase has no separator regardless of user choice.
  const sep =
    opts.caseStyle === "camel" ? "" : (SEPARATORS[opts.separator] ?? "-");
  return words.join(sep) + randomDigits(opts.digits);
}

export function generate(lists, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (!PRESETS[opts.preset]) throw new Error(`Unknown preset "${opts.preset}"`);

  const { maxLength } = opts;
  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = buildOnce(lists, opts);
    if (!maxLength || candidate.length <= maxLength) return candidate;
  }
  // Couldn't satisfy maxLength — return best-effort so the UI always has something.
  return buildOnce(lists, opts);
}
