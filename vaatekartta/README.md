# Vaatekartta

Eurooppalaiset miesten ja unisex-vaatemerkit, joiden tuotteet maksavat 50–150 €. Sivulla on kartta
toimituksista Suomeen, TikTok-tyylinen selaus ja vertailulista. Tiedot on tarkistettu 29.10.2026.

- `index.html`: valmis sivu, avautuu suoraan selaimessa.
- `artifact.html`: sama sivu Claude-artifaktia varten (ilman dokumenttirunkoa).
- `data/raw/*.json`: merkkitutkimus alueittain, lähteineen (`sources`, `notes`).
- `data/coupons-*.json`: alennukset lähteineen. Kentässä `verified: false` lähde on kuponkisivusto.
- `data/verification.md`: tarkistusagentin korjaukset ja pistokokeet.
- `design/`: visuaalinen suunta ja vaatekuvitukset.
- `build/`: build-skripti. Se tarkistaa hintarajan, projisoi kartan ja upottaa datan.

Uudelleenrakennus:

```sh
cd vaatekartta/build && npm install && node build.mjs
```

Postikulut ja toimitusajat koskevat vakiotoimitusta Suomeen. Tyhjä arvo tarkoittaa, että kauppa
näyttää tiedon vasta kassalla. Punnan hinnat on muunnettu kurssilla 1 £ = 1,19 €.
