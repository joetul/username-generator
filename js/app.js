import { generate, PRESETS, DEFAULT_OPTIONS } from "./generator.js";

// Paths are verbatim upstream files; loadLists below hard-codes each source's
// JSON shape (`animals.animals`, `colors.colors[].color`, tab-separated EFF
// diceware, etc.). Don't edit the data files — re-run the upstream sources.
const DATA_FILES = {
  adjectives: "data/adjectives-common.txt",
  nouns: "data/nouns-common.txt",
  animals: "data/animals-common.json",
  fruits: "data/foods-fruits.json",
  vegetables: "data/foods-vegetables.json",
  colors: "data/colors-crayola.json",
  eff: "data/eff_large_wordlist.txt",
};

const STORAGE_KEY_OPTIONS = "username-generator:options";
const STORAGE_KEY_THEME = "username-generator:theme";

// Restrict to pure-alphabet single-word entries — matches how usernames read.
const SINGLE_WORD = /^[A-Za-z]+$/;

// Filter a handful of ambiguous words post-load. Upstream files stay verbatim
// (license-clean); we just don't sample these.
const BLOCKLIST = new Set([
  "cocky",
  "crude",
  "dicey",
  "dirty",
  "horny",
  "kinky",
  "nasty",
  "rude",
  "seedy",
  "shady",
  "slimy",
]);

async function fetchText(path) {
  const res = await fetch(path, { cache: "force-cache" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.text();
}

function parseLines(text) {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function cleanWords(arr) {
  return arr
    .map((w) => (typeof w === "string" ? w.trim() : ""))
    .filter((w) => SINGLE_WORD.test(w))
    .map((w) => w.toLowerCase())
    .filter((w) => !BLOCKLIST.has(w));
}

async function loadLists() {
  const [adjRaw, nounRaw, animalsRaw, fruitsRaw, vegRaw, colorsRaw, effRaw] =
    await Promise.all([
      fetchText(DATA_FILES.adjectives),
      fetchText(DATA_FILES.nouns),
      fetchText(DATA_FILES.animals),
      fetchText(DATA_FILES.fruits),
      fetchText(DATA_FILES.vegetables),
      fetchText(DATA_FILES.colors),
      fetchText(DATA_FILES.eff),
    ]);

  const animalsJson = JSON.parse(animalsRaw);
  const fruitsJson = JSON.parse(fruitsRaw);
  const vegJson = JSON.parse(vegRaw);
  const colorsJson = JSON.parse(colorsRaw);

  return {
    adjectives: cleanWords(parseLines(adjRaw)),
    nouns: cleanWords(parseLines(nounRaw)),
    animals: cleanWords(animalsJson.animals ?? []),
    foods: cleanWords([
      ...(fruitsJson.fruits ?? []),
      ...(vegJson.vegetables ?? []),
    ]),
    colors: cleanWords((colorsJson.colors ?? []).map((c) => c.color)),
    eff: cleanWords(parseLines(effRaw).map((line) => line.split("\t")[1] ?? "")),
  };
}

function populatePresets(select, hintEl) {
  for (const [key, { label }] of Object.entries(PRESETS)) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = label;
    select.append(option);
  }
  const updateHint = () => {
    hintEl.textContent = PRESETS[select.value]?.description ?? "";
  };
  select.addEventListener("change", updateHint);
  updateHint();
}

function clampInt(raw, min, max, fallback) {
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function readOptions(form) {
  const fd = new FormData(form);
  return {
    preset: String(fd.get("preset") ?? DEFAULT_OPTIONS.preset),
    wordCount: clampInt(fd.get("wordCount"), 1, 8, DEFAULT_OPTIONS.wordCount),
    separator: String(fd.get("separator") ?? DEFAULT_OPTIONS.separator),
    caseStyle: String(fd.get("caseStyle") ?? DEFAULT_OPTIONS.caseStyle),
    digits: clampInt(fd.get("digits"), 0, 6, DEFAULT_OPTIONS.digits),
    maxLength: clampInt(fd.get("maxLength"), 0, 64, DEFAULT_OPTIONS.maxLength),
  };
}

function applyOptionsToForm(form, opts) {
  for (const [name, value] of Object.entries(opts)) {
    const el = form.elements.namedItem(name);
    if (el) el.value = String(value);
  }
}

function loadSavedOptions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OPTIONS);
    if (!raw) return null;
    return { ...DEFAULT_OPTIONS, ...JSON.parse(raw) };
  } catch {
    return null;
  }
}

function saveOptions(opts) {
  try {
    localStorage.setItem(STORAGE_KEY_OPTIONS, JSON.stringify(opts));
  } catch {
    /* quota / private-mode: safe to ignore */
  }
}

let saveOptionsTimer;
function scheduleSaveOptions(opts) {
  clearTimeout(saveOptionsTimer);
  saveOptionsTimer = setTimeout(() => saveOptions(opts), 250);
}

function resolvedTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function setupTheme(toggleBtn) {
  const stored = localStorage.getItem(STORAGE_KEY_THEME);
  if (stored === "light" || stored === "dark") {
    document.documentElement.setAttribute("data-theme", stored);
  }
  syncToggleAria(toggleBtn);

  toggleBtn.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme") ?? resolvedTheme();
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY_THEME, next);
    } catch {
      /* ignore */
    }
    syncToggleAria(toggleBtn);
  });
}

function syncToggleAria(btn) {
  const current =
    document.documentElement.getAttribute("data-theme") ?? resolvedTheme();
  btn.setAttribute("aria-pressed", String(current === "dark"));
  btn.setAttribute(
    "aria-label",
    current === "dark" ? "Switch to light theme" : "Switch to dark theme",
  );
}

let toastTimer;
function showToast(toast, message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 1500);
}

function setupSteppers(root) {
  const steppers = root.querySelectorAll(".stepper");
  const syncDisabled = (stepper) => {
    const input = stepper.querySelector('input[type="number"]');
    if (!input) return;
    const value = Number.parseInt(input.value, 10);
    const min = input.min !== "" ? Number(input.min) : -Infinity;
    const max = input.max !== "" ? Number(input.max) : Infinity;
    for (const btn of stepper.querySelectorAll(".stepper-btn")) {
      const delta = btn.dataset.action === "increment" ? 1 : -1;
      const atLimit = Number.isNaN(value)
        ? false
        : delta > 0
          ? value >= max
          : value <= min;
      btn.disabled = atLimit;
    }
  };

  for (const stepper of steppers) {
    const input = stepper.querySelector('input[type="number"]');
    if (!input) continue;
    stepper.addEventListener("click", (e) => {
      const btn = e.target.closest(".stepper-btn");
      if (!btn || btn.disabled) return;
      const delta = btn.dataset.action === "increment" ? 1 : -1;
      const current = Number.parseInt(input.value, 10) || 0;
      const min = input.min !== "" ? Number(input.min) : -Infinity;
      const max = input.max !== "" ? Number(input.max) : Infinity;
      const next = Math.max(min, Math.min(max, current + delta));
      if (next === current) return;
      input.value = String(next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    input.addEventListener("input", () => syncDisabled(stepper));
    syncDisabled(stepper);
  }
}

let copyFlashTimer;
function flashCopied(btn) {
  const original = btn.dataset.originalLabel ?? btn.textContent;
  btn.dataset.originalLabel = original;
  btn.classList.add("is-copied");
  btn.textContent = "Copied!";
  clearTimeout(copyFlashTimer);
  copyFlashTimer = setTimeout(() => {
    btn.classList.remove("is-copied");
    btn.textContent = original;
  }, 1000);
}

async function main() {
  const form = document.getElementById("options");
  const presetSelect = document.getElementById("preset");
  const presetHint = document.getElementById("preset-hint");
  const resultEl = document.getElementById("result");
  const generateBtn = document.getElementById("generate-btn");
  const copyBtn = document.getElementById("copy-btn");
  const toastEl = document.getElementById("toast");
  const themeToggle = document.getElementById("theme-toggle");

  setupTheme(themeToggle);
  populatePresets(presetSelect, presetHint);

  const saved = loadSavedOptions();
  if (saved) applyOptionsToForm(form, saved);
  // Re-fire so the hint reflects a saved non-default preset.
  presetSelect.dispatchEvent(new Event("change"));
  setupSteppers(form);

  let lists;
  try {
    lists = await loadLists();
  } catch (err) {
    console.error(err);
    resultEl.textContent = "failed to load word lists";
    resultEl.dataset.state = "error";
    return;
  }

  const doGenerate = () => {
    const opts = readOptions(form);
    scheduleSaveOptions(opts);
    try {
      resultEl.textContent = generate(lists, opts);
      delete resultEl.dataset.state;
    } catch (err) {
      console.error(err);
      resultEl.textContent = "error";
      resultEl.dataset.state = "error";
    }
  };

  const doCopy = async () => {
    const text = resultEl.textContent?.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      flashCopied(copyBtn);
    } catch (err) {
      console.error(err);
      showToast(toastEl, "Copy failed");
    }
  };

  generateBtn.addEventListener("click", doGenerate);
  copyBtn.addEventListener("click", doCopy);
  resultEl.addEventListener("click", doCopy);
  form.addEventListener("input", doGenerate);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    doGenerate();
  });

  generateBtn.disabled = false;
  copyBtn.disabled = false;
  doGenerate();
}

main();
