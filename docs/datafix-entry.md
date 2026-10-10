# Data-fixes log entry: Ontario Facility Emissions Spine

## EN

**Dataset:** Ontario MECP "Greenhouse Gas Emissions Reporting By Facility" 2010-2024 (Reg 390/18, from files.ontario.ca), Ontario Ministry of Energy and Mines "Energy and water usage of large buildings in Ontario" 2018-2024 (EWRB), and ECCC federal GHGRP "Emissions by Gas" 2004-2024 (Ontario facilities, via the open.canada.ca catalogue API). Retrieved 2026-10-10. Vintage: 2024 reporting year.

**What was wrong:**
- The two emissions programs name the same facilities differently and publish no shared facility key. 133 of 480 Ontario facility IDs changed names across years, and the two registries recorded renames in different years.
- Company names collide across cities: Canada Brick and Hanson Brick both report plants in Aldershot, and two Ingredion plants sit in Cardinal and Port Colborne. A naive name match would fuse different facilities.
- Site suffixes equal city names: "BUNGE CANADA - HAMILTON" and "Hamilton" share only the city token, which cannot serve as a plant identifier.
- Two federal facilities in Woodstock share the name "Woodstock Plant", so a sub-form match could pair the wrong one.
- The EWRB files publish no building names and no street addresses, only city and a 3-character postal code, so no record-level join is possible. 3,002 rows (9.8%) report zero intensities and 508 report absurd GHG intensity above 1,000 kgCO2e/m2 (max 2,861,043, median 25.9).
- Ontario's published total includes biomass CO2 and the federal total excludes it, so raw totals are not comparable.

**The fix:**
- Anchor matching: uppercase, strip accents, drop legal suffixes and punctuation, then require exact match on the normalized name plus the same normalized city. 458 of 513 canonical facilities anchored (89.3%), all name histories preserved as variants.
- Merge-trap rules: a site suffix that equals the city can never anchor a merge, and conflicting site suffixes veto the merge. Anchored full-name matches are assigned before sub-form matches, so the Woodstock record paired with G10114 (Federal White Cement, 0.1% apart on emissions) instead of the Lafarge plant.
- The fuzzy tier (difflib at 0.90 or above) produced zero merges after the strict rules. Near-misses were left unmatched rather than guessed.
- EWRB quarantine: all 30,693 rows quarantined with reason codes, plus city-level manufacturing-intensity context for 49 cities carried by 96 facilities, flagged ecological.
- Biomass adjustment: the 2024 join subtracts biomass CO2 from the Ontario total before comparing to the federal total.

**Result:** 513 canonical facilities: 458 anchored, 0 resolved, 55 unmatched (22 Ontario-only, 33 federal-only, nearly all pre-2024 reporters). The agreement join over 416 pairs shows a largest gap of 3,392 t at Greenstone Mine (+2.2%), validating the anchors. 128 year-over-year anomalies flagged. Ships as spine.json/spine.csv with per-program name histories and annual series.

**Before/after:**
- Before: "Dofasco Hamilton" vs "ArcelorMittal Dofasco Hamilton" -> After: one anchored facility (ONF-000005), both name histories kept.
- Before: "Canada Brick - Aldershot" vs "Hanson Brick - Aldershot" -> After: correctly rejected, never merged (city-token rule).
- Before: "Ingredion Canada Corporation" (Cardinal) vs "Ingredion Canada Incorporated - Port Colborne Plant" -> After: correctly rejected, never merged (site-suffix veto).
- Before: "Woodstock Plant" (ambiguous, two federal candidates) -> After: paired with G10114 (Federal White Cement), emissions agree to 0.1%.
- Before: "Thunder Bay Operations: 1,384.3 kt (Ontario) vs 202.5 kt (federal)" -> After: 0.8 t apart after the biomass adjustment.
- Before: EWRB rows with no building identity -> After: 30,693 quarantined with reason codes, city-level context attached instead.

## FR

**Jeu de données :** « Déclaration des émissions de gaz à effet de serre par installation » du MECP de l'Ontario 2010-2024 (Règl. 390/18, via files.ontario.ca), « Consommation d'énergie et d'eau des grands bâtiments en Ontario » du ministère de l'Énergie et des Mines de l'Ontario 2018-2024 (PGRGE), et « Émissions par gaz » du PDGES fédéral d'ECCC 2004-2024 (installations ontariennes, via l'API du catalogue open.canada.ca). Récupérés le 2026-10-10. Millésime : année de déclaration 2024.

**Ce qui clochait :**
- Les deux programmes d'émissions nomment les mêmes installations différemment et ne publient aucune clé d'installation commune. 133 des 480 ID ontariens ont changé de nom au fil des ans, et les deux registres ont consigné les renommages des années différentes.
- Les noms d'entreprises se heurtent entre villes : Canada Brick et Hanson Brick déclarent des usines à Aldershot, et deux usines Ingredion se trouvent à Cardinal et Port Colborne. Un appariement de noms naïf fusionnerait des installations différentes.
- Les suffixes de site égalent les noms de villes : « BUNGE CANADA - HAMILTON » et « Hamilton » ne partagent que le jeton de ville, qui ne peut pas servir d'identifiant d'usine.
- Deux installations fédérales à Woodstock partagent le nom « Woodstock Plant », donc un appariement de sous-forme pourrait jumeler la mauvaise.
- Les fichiers PGRGE ne publient ni noms de bâtiments ni adresses, seulement la ville et un code postal à 3 caractères, donc aucune jonction au niveau du dossier n'est possible. 3 002 lignes (9,8 %) déclarent des intensités nulles et 508 déclarent une intensité de GES absurde au-dessus de 1 000 kg éq. CO2/m2 (max 2 861 043, médiane 25,9).
- Le total publié de l'Ontario inclut le CO2 de biomasse et le total fédéral l'exclut, donc les totaux bruts ne sont pas comparables.

**La correction :**
- Appariement direct : majuscules, accents retirés, suffixes juridiques et ponctuation enlevés, puis appariement exact exigé sur le nom normalisé plus la même ville normalisée. 458 des 513 installations canoniques appariées directement (89,3 %), tous les historiques de noms conservés comme variantes.
- Règles anti-pièges : un suffixe de site égal à la ville ne peut jamais ancrer un appariement, et des suffixes de site contradictoires opposent un veto à l'appariement. Les appariements directs sur nom complet sont assignés avant les appariements de sous-formes, donc le dossier de Woodstock s'est apparié avec G10114 (Federal White Cement, à 0,1 % près sur les émissions) plutôt qu'avec l'usine Lafarge.
- Le niveau flou (difflib à 0,90 ou plus) n'a produit aucun appariement après les règles strictes. Les quasi-appariements sont restés non appariés plutôt que devinés.
- Quarantaine PGRGE : les 30 693 lignes mises en quarantaine avec des codes de motif, plus un contexte d'intensité manufacturière au niveau municipal pour 49 villes porté par 96 installations, marqué écologique.
- Ajustement biomasse : la jonction 2024 soustrait le CO2 de biomasse du total ontarien avant de comparer au total fédéral.

**Résultat :** 513 installations canoniques : 458 appariements directs, 0 résolus, 55 non appariées (22 Ontario seulement, 33 fédéral seulement, presque toutes déclarant avant 2024). La jonction d'accord sur 416 paires montre un écart maximal de 3 392 t à la mine Greenstone (+2,2 %), validant les appariements directs. 128 anomalies d'une année à l'autre signalées. Livré dans spine.json/spine.csv avec historiques de noms par programme et séries annuelles.

**Avant/après :**
- Avant : « Dofasco Hamilton » contre « ArcelorMittal Dofasco Hamilton » -> Après : une installation appariée directement (ONF-000005), les deux historiques de noms conservés.
- Avant : « Canada Brick - Aldershot » contre « Hanson Brick - Aldershot » -> Après : correctement rejeté, jamais fusionné (règle du jeton de ville).
- Avant : « Ingredion Canada Corporation » (Cardinal) contre « Ingredion Canada Incorporated - Port Colborne Plant » -> Après : correctement rejeté, jamais fusionné (veto du suffixe de site).
- Avant : « Woodstock Plant » (ambigu, deux candidates fédérales) -> Après : apparié avec G10114 (Federal White Cement), émissions concordant à 0,1 %.
- Avant : « Thunder Bay Operations : 1 384,3 kt (Ontario) contre 202,5 kt (fédéral) » -> Après : 0,8 t d'écart après l'ajustement biomasse.
- Avant : lignes PGRGE sans identité de bâtiment -> Après : 30 693 mises en quarantaine avec codes de motif, contexte municipal joint à la place.
