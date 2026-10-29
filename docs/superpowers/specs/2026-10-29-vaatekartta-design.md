# Vaatekartta: design

Päivitetty 2026-10-29. Hyväksytty keskustelussa käyttäjän kanssa.

## Tavoite

Matalan kynnyksen, lähestyttävä alusta eurooppalaisten vaatemerkkien löytämiseen Suomesta käsin.
Yksi HTML-sivu, jossa on kartta kauppojen lähetyspaikoista Suomeen, TikTok-tyylinen selaussyöte
merkkien tunnetuimmista vaatteista ja tiivis vertailulista.

Inspiraatio: raw denim, syysmuoti, "men fall outfits", cozy clothing for men, peacoatit.

## Rajaukset (käyttäjän päätökset)

- **Kohderyhmä:** miesten ja unisex-vaatteet.
- **Hinta:** jokainen näytettävä tuote maksaa tiukasti **50–150 €**. Kalliimpia tuotteita ei näytetä,
  vaikka ne olisivat merkin tunnetuimpia. Raw denimiä ja peacoateja jää vähän, ja se on hyväksytty.
- **Maat:** koko Eurooppa. UK, Norja ja Sveitsi ovat mukana, ja niiden tulli- ja ALV-käytäntö merkitään.
- **Pois:** luksusmerkit (Acne, Our Legacy, Stone Island, Moncler…) ja **H&M:n oma mallisto**.
  COS, Arket, Weekday, Zara ja Massimo Dutti ovat sallittuja.
- **Merkin ehto:** oma suunnittelu ja omaa tuotantoa (farkut, neuleet, paidat, takit jne.) sekä
  vähintään 2 luonteenomaista tuotetta hintavälillä 50–150 €.
- **Toimitusosoite:** Suomi. Kaikki postikulut, toimitusajat ja palautukset lasketaan Suomeen.
- **Kupongit:** vanhenevat, ja se on hyväksytty. Jokaisella on lähde ja tarkistuspäivä.
  Etusijalla ovat viralliset edut (uutiskirje, ensitilaus, opiskelija-ale UNiDAYS / Student Beans).

## Sivu

Yksi itsenäinen `vaatekartta/index.html`, julkaistaan yksityisenä Claude-artifaktina. Kolme näkymää:

1. **Kartta:** minimalistinen Euroopan kartta. Lähetyspaikat on merkitty pisteillä, ja viiva Suomeen
   on väritetty toimitusajan mukaan. Pisteen napautus avaa tiiviin kortin, jossa on vain pääasiat:
   postikulut, ilmaisen toimituksen raja, toimitusaika, tulli/ALV-merkintä, paras kuponki ja linkki.
   Suodattimet: tuotetyyppi ja maa.
2. **Selaa:** koko ruudun pystysyöte (scroll-snap), yksi tuote per kortti. Kortissa on tuotekuva tai
   kuvitus, merkki, tuote, hinta, yksi lause siitä miksi tuote tunnetaan, toimitus Suomeen, kuponki ja
   linkki kauppaan. Tykkäys tallennetaan localStorageen.
3. **Lista:** taulukko, joka on järjestettävissä postikulun, toimitusajan ja hinnan mukaan.

**Periaate: tiivis, ei tieto-oksennusta.** Jokaisessa näkymässä vain pääasiat; lisätiedot vain
napautuksella.

### Kuvat

Artifaktin CSP estää ulkoiset kuvat, ja tämän ympäristön verkko estää kuvien lataamisen.
Ratkaisu: tuotekortit piirretään kuvituksina (vaatesiluetti tuotteen värissä). Repoversiossa
`image`-kentän URL yritetään ladata ja kuvitus jää varalle. Jos verkko avataan, kuvat ladataan,
pienennetään (WebP, noin 600 px) ja upotetaan data-URI:na artifaktiin. Kyse on henkilökohtaisesta
käytöstä, ja repo on yksityinen.

### Tekniikka

- Ei ajonaikaisia kirjastoja. Kartan SVG-polut projisoidaan build-vaiheessa (`world-atlas` +
  `d3-geo` npm:stä), ja pisteet projisoidaan samalla projektiolla.
- Data upotetaan sivulle JSON-muodossa build-skriptillä (`vaatekartta/build/build.mjs`).
- Teema: vaalea ja tumma tokeneilla, toimii 400 px leveydellä.

## Datan skeema (agenttien yhteinen sopimus)

Jokainen tutkimusagentti kirjoittaa tiedoston `vaatekartta/data/raw/<alue>.json`:

```json
{
  "region": "nordics",
  "checked": "2026-10-29",
  "brands": [
    {
      "id": "nudie-jeans",
      "name": "Nudie Jeans",
      "country": "SE",
      "city": "Göteborg",
      "url": "https://www.nudiejeans.com",
      "parent": null,
      "style": "Ruotsalainen denim-merkki, luomupuuvilla ja ilmaiset korjaukset",
      "tags": ["farkut", "neuleet", "paidat", "takit", "t-paidat", "collegit", "housut"],
      "ship": {
        "from": "Göteborg, SE",
        "lat": 57.71,
        "lng": 11.97,
        "cost": 4.95,
        "currency": "EUR",
        "freeOver": 100,
        "days": [2, 5],
        "vat": "eu",
        "returns": "30 pv, maksuton"
      },
      "products": [
        {
          "name": "Lean Dean Dry 16 Dips",
          "type": "farkut",
          "price": 149,
          "currency": "EUR",
          "url": "https://…",
          "image": "https://… (suora kuva-URL jos löytyy, muuten null)",
          "color": "#1c2433",
          "signature": true,
          "why": "Merkin myydyin kuivadenim, kuluu omaan muotoon"
        }
      ],
      "coupons": [
        {
          "code": null,
          "deal": "-10 % ensitilauksesta uutiskirjeen tilaajille",
          "type": "newsletter",
          "source": "https://…",
          "checked": "2026-10-29",
          "verified": true
        }
      ],
      "sources": ["https://…"],
      "confidence": "high",
      "notes": "Epävarmuudet tähän, lyhyesti"
    }
  ],
  "rejected": [
    { "name": "Hiut Denim", "reason": "Farkut yli 150 €" }
  ]
}
```

Kenttien säännöt:

- `tags` ja `products[].type` käyttävät vain arvoja: `farkut`, `housut`, `neuleet`, `paidat`,
  `t-paidat`, `collegit`, `takit`, `asusteet`.
- `ship.vat`: `eu` (EU:sta, ei tullia), `ioss` (EU:n ulkopuolelta, ALV peritään kassalla eikä
  perillä tule lisämaksuja), `ddp` (tullit ja ALV kassalla), `buyer` (ALV, mahdollinen tulli ja Postin
  käsittelymaksu maksetaan perillä).
- `ship.lat/lng` = varasto, josta Suomeen lähetetään. Jos sitä ei löydy, käytetään pääkonttoria ja
  asia mainitaan `notes`-kentässä.
- `ship.days` = arkipäivät Suomeen vakiotoimituksella, `[min, max]`.
- `price` = hinta merkin omassa kaupassa Suomeen/EU:hun ostettaessa, normaalihinta (ei alehinta).
  Jos vain GBP/NOK/CHF löytyy, käytetään sitä ja `currency`-kenttää.
- `products`: 2–4 kpl, kaikki 50–150 €. Kun mahdollista, joukossa on ainakin yksi syksyinen kappale
  (neule, overshirt, takki, farkut). `signature: true` merkin tunnetuimmalle hintavälin tuotteelle.
- `why`: yksi lyhyt lause suomeksi, enintään 70 merkkiä.
- `style`: enintään 90 merkkiä suomeksi.
- `coupons[].type`: `code`, `newsletter`, `firstorder`, `student`, `app`, `sale`.

## Työnjako

1. Neljä tutkimusagenttia rinnakkain: `nordics` (SE, DK, NO, FI, IS), `fr-benelux`,
   `central-south-east` (DE, AT, CH, IT, ES, PT, PL, CZ, Baltia…), `uk-ie`.
2. Front-end-valvoja-agentti: visuaalinen suunta ennen rakentamista ja kuvakaappaustarkistus
   (Playwright, puhelin + työpöytä, vaalea + tumma) rakentamisen jälkeen.
3. Kuponkiagentti käy lopullisen listan läpi.
4. Pääagentti kokoaa datan, rakentaa sivun ja julkaisee sen.
5. Datan pistokoe: erillinen agentti tarkistaa satunnaisotannan tiedoista lähteistä.

## Valmiin määritelmä

- 35–50 merkkiä, ja jokaisella vähintään 2 tuotetta väliltä 50–150 €.
- Jokaisella merkillä on toimitustiedot Suomeen ja lähde.
- Sivu toimii 400 px leveydellä ja työpöydällä sekä vaaleassa ja tummassa teemassa, eikä konsolissa
  ole virheitä.
- Valvoja-agentin visuaalinen tarkistus on läpäisty.
- Julkaistu artifaktina; tiedostot commitoitu ja pushattu haaraan
  `claude/european-clothing-brands-map-v6b4ql`.
