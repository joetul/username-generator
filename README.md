# Username Generator

<https://joetul.github.io/username-generator/>

A small, fast, zero-dependency username generator. Runs entirely in the browser,
hosted for free on GitHub Pages. Clean minimal UI, light and dark themes, and
a handful of presets built from well-known open-source word lists.

## Presets

| Preset       | Format                 | Example             |
| ------------ | ---------------------- | ------------------- |
| Classic      | adjective + noun       | `happy-river`       |
| Wildlife     | adjective + animal     | `clever-otter`      |
| Foodie       | adjective + fruit/veg  | `tangy-mango`       |
| Colorful     | color + noun           | `crimson-lantern`   |
| Passphrase   | N diceware words       | `decent-april-stubborn-uncoated` |

Options: separator (`-` `_` `.` none), case (lower / Title / UPPER / camel),
trailing digits (0–6), max length cap, and word count (1–8).

## Run locally

It's just static files — no build step — but browsers block `fetch()` from
`file://` origins, so you need a local static server:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy

Push to GitHub, then:

1. Repo **Settings → Pages**
2. **Source:** Deploy from a branch
3. **Branch:** `main` / `/ (root)`

Save and GitHub will give you the URL. No workflow file needed.

## Project layout

```
├── index.html
├── styles.css
├── js/
│   ├── app.js         # DOM wiring, fetch + parse, clipboard, theme
│   └── generator.js   # Pure generation logic
├── data/              # Word lists (unmodified from upstream)
└── LICENSES/          # Full license text for every third-party list
```

## Credits

This project's own code is MIT (see `LICENSE`). The word lists in `data/` are
redistributed under their respective upstream licenses — full text in
`LICENSES/`.

| List                          | Source                                                                          | License     |
| ----------------------------- | ------------------------------------------------------------------------------- | ----------- |
| `adjectives-common.txt`       | [taikuukaits/SimpleWordlists](https://github.com/taikuukaits/SimpleWordlists)   | MIT         |
| `nouns-common.txt`            | [taikuukaits/SimpleWordlists](https://github.com/taikuukaits/SimpleWordlists)   | MIT         |
| `animals-common.json`         | [dariusk/corpora](https://github.com/dariusk/corpora)                           | CC0 1.0     |
| `foods-fruits.json`           | [dariusk/corpora](https://github.com/dariusk/corpora)                           | CC0 1.0     |
| `foods-vegetables.json`       | [dariusk/corpora](https://github.com/dariusk/corpora)                           | CC0 1.0     |
| `colors-crayola.json`         | [dariusk/corpora](https://github.com/dariusk/corpora)                           | CC0 1.0     |
| `eff_large_wordlist.txt`      | [EFF Long Wordlist](https://www.eff.org/dice)                                   | CC BY 3.0   |

> EFF's Long Wordlist © Electronic Frontier Foundation, licensed under
> [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). The file is
> unmodified from the original distributed at
> <https://www.eff.org/files/2016/07/18/eff_large_wordlist.txt>.

No network requests go anywhere beyond this site's own origin.
