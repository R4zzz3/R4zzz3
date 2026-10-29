# Vaatekartta: data verification (2026-10-29)

## Changes

- Nudie Jeans | ship.days | null → [1, 5] (general T&C, not Finland-specific) | https://assets.ctfassets.net/7er3lxiqbzqz/3DmKAAJ03ZoWxplHJ7hsij/882e2f84c8670b723cade0881df95c90/GTC-ww-en-1.9-20240529.pdf
- Nudie Jeans | ship.from/lat/lng | Göteborg 57.71, 11.97 → Borås 57.72, 12.94 (return address c/o Korallen AB, assumed warehouse) | same GTC PDF
- Varusteleka | ship.days | null → [2, 4] (next-day dispatch + 1–3 working days) | https://varusteleka.com/policies/shipping-policy
- Varusteleka | ship.freeOver | 80 → 100 | https://varusteleka.com/policies/shipping-policy
- Varusteleka | ship.from/lat/lng | Helsinki 60.19, 24.97 → Helsinki (Konala) 60.24, 24.84 | https://varusteleka.com/policies/shipping-policy
- COS | ship.returns | null → "30 pv (alennustuotteet 14 pv), käsittelymaksu 3 € vähennetään" | https://www.cos.com/en-eu-e/customer-service/returns
- Fjällräven | products[Övik Heavy Flannel Shirt M].url | category → product page (129 € confirmed) | https://www.fjallraven.com/fi/fi-fi/miehet/ylaosat/paidat/ovik-heavy-flannel-shirt-m/
- Fjällräven | products[Singi Heavy Flannel Shirt M].url | category → product page (139 € confirmed) | https://www.fjallraven.com/fi/fi-fi/miehet/ylaosat/paidat/singi-heavy-flannel-shirt-m/
- Kings Of Indigo | ship.returns | "30 pv, palautus 5-15 €" → "30 pv, palautusmaksu 15 € (muu EU)" (refund policy lists other EU at €15) | https://kingsofindigo.com/en-eu/policies/refund-policy
- Kings Of Indigo | products[RYAN Rinse].url | collection → product page (140 € confirmed) | https://kingsofindigo.com/en-eu/products/ryan-rinse
- Cuisse de Grenouille | ship.returns | "Asiakas maksaa palautuksen ulkomailta" → "45 pv ulkomailta, asiakas maksaa palautuksen" (FAQ #18, international returns) | https://www.cuissedegrenouille.com/pages/faq
- Saint James | products[Méridien].url | collection → product page (95 € confirmed) | https://eu.saint-james.com/products/meridien-unisex-striped-sailor-shirt-regular-fit-thick-cotton-ecru-marine
- Daily Paper | products[Mole Alias Dias Hoodie].url | collection → product page (119,95 € confirmed) | https://dailypaperclothing.com/products/mole-alias-dias-hoodie
- hessnatur | ship.days | null → [3, 5] (general promise, not Finland-specific) | https://service.hessnatur.com/portal/de/kb/articles/wie-ist-die-lieferzeit-einer-bestellung
- Zara | notes only | all 3 prices re-seen on FI men's category page; product URLs still unavailable, confidence stays low | https://www.zara.com/fi/fi/miehet-l534.html
- Kopyto | products[BARIBAL RWS].price | 132.95 → 137.95 EUR | https://kopyto.de/products/baribal-m-rws-herrenpullover-aus-merinowolle
- Universal Works | ship.cost | 7.5 → 9.41 (€7.50 "plus tax" + 25,5 % ALV) | https://universalworks.com/products/brown-brushed-flannel-square-pocket-shirt?currency=EUR
- Universal Works | ship.returns | null → "EU-palautus £20 (vähennetään hyvityksestä)" | https://universalworks.com/products/brown-brushed-flannel-square-pocket-shirt?currency=EUR
- Universal Works | products[Brushed Flannel Square Pocket Shirt] | price 114.95 → 144.26 (EUR prices are ex-VAT, +25,5 %); url collection → product | https://universalworks.com/products/brown-brushed-flannel-square-pocket-shirt
- Universal Works | products[Work Denim Fatigue Shirt] | price 109.95 → 137.99; url collection → product | https://universalworks.com/products/indigo-work-denim-fatigue-shirt
- Universal Works | products[Prince Chambray Daybrook Shirt] | price 105.95 → 132.97; url collection → product | https://universalworks.com/products/indigo-prince-chambray-daybrook-shirt
- Far Afield | ship.vat | ddp confirmed (EU prices include duties and taxes, no extra charges) | https://farafieldclothing.com/pages/shipping
- Far Afield | ship.returns | "28 pv täysihintaisille, …" → "14 pv, postikulut asiakkaalle" | https://farafieldclothing.com/pages/faq
- Far Afield | products[Bagh Motif Jumper].url | collection → product page (€122,95 confirmed) | https://farafieldclothing.com/products/bagh-motif-jumper-camel
- Folk | ship.vat | ddp confirmed (product page: "Taxes included", "no additional charges on delivery"; delivery FAQ says otherwise, likely outdated) | https://www.folkclothing.com/collections/25th-anniversary-collection/products/folk-direction-babycord-shirt-dark-navy?currency=EUR
- Folk | products[Herringbone Curve Shirt].url | collection → product page (Soft Black, £110) | https://www.folkclothing.com/products/folk-herringbone-curve-shirt-soft-black
- Percival | ship.cost | null → 12 (lowest EU rate; only express €12–15 is listed under €150) | https://www.percivalclo.com/pages/international-shipping-returns
- Superdry | ship.vat | null → eu (non-UK European orders ship from Belgium) | https://www.bleckmann.com/client-stories/superdry
- Superdry | ship.from/lat/lng | Cheltenham 51.9, -2.08 → Grobbendonk, BE 51.19, 4.73; confidence low → medium | https://helpcentre.superdry.ie/s/article/where-will-my-order-be-dispatched-from

## Checked, left null (not published or only shown at checkout)

- Nudie Jeans cost; ASKET cost and days; Dedicated cost; ARKET cost and days; COS cost; Samsøe Samsøe cost; Armor-Lux cost; Brava Fabrics cost and days; Replay cost and days. For all of these, the cost or time is shown only at checkout.
- Resteröds days (2–3 days is for Sweden only); R-Collection days; Rains days; Asphalte days (only UK and non-EU are given); Saint James days (FAQ updated 12.10.2026: shown at checkout); Portuguese Flannel days; Far Afield days.
- Folk cost and days ("up to 7 business days" internationally, no lower bound); howies days ("up to 14 working days"); Moleskin Jeans Co cost, days and vat; Superdry days.

## Spot checks (10 random brands)

- Wood Wood: ok (4–6 working days; WWCloud Pullover €135)
- Dr. Denim: ok (Finland 12 € and up; 3–5/4–7 days; Dash Straight 899 SEK)
- Bonnegueule: ok (EU 10 €, free over 200 €, 3–8 days; Jean Alberto 145 €)
- Silbon: ok (Europe Zone III incl. Finland 30 €, no free threshold; EU 5–7 days; Cruise overshirt 79,90 €)
- Daily Paper: ok (Finland 10 €, free over 99 €, 7–10 days; Dias Knit 139,95 €)
- Fjällräven: ok (PostNord 7,50 €, free over 100 €, 5–7 days; Övik Heavy Flannel 129 €, Singi 139 €)
- Passenger: ok (EU 9,95 €, 7–10 days, DDP; Sandbar 79,95 €). The shipping page says free over €80 and the product page says over €100; 100 is kept.
- Kopyto: fix (Finland 17,83 € and 5–14 days ok; BARIBAL RWS 132,95 → 137,95 €)
- Peregrine: ok (Europe €12,99, free over €200, 3–11 days, DDP; Ford Crew €132,95)
- Ecoalf: ok (Europe 8 €, 3–5 working days, returns 4 €; William Shirt 109,90 €)
