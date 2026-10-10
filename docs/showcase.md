# Showcase Q&A: Ontario Facility Emissions Spine

## EN

### Q: Why can't Ontario's emissions data find itself?

**A:** Ontario runs two facility emissions registries, the provincial MECP program and the federal GHGRP, that name the same plants differently and publish no shared key. This spine resolves 513 canonical facilities across both programs for 2010 to 2024: 458 anchored on exact normalized name plus same city (89.3%), 55 honestly unmatched, and 30,693 large-building rows quarantined. The payoff is identity: one query follows a plant across both registries and twenty years. Bruce Power files as "Bruce Power" in one registry and "Bruce Power Inc" in the other. Dofasco became ArcelorMittal Dofasco and both registries recorded the old and new names in different years. 133 of the 480 Ontario facility IDs changed names across years, and the spine keeps every historical name as a variant.

### Q: How do you know the anchors pair the right facilities?

**A:** 416 anchored facilities report 2024 totals to both programs. Ontario's published total includes biomass CO2 and the federal total excludes it, so the join subtracts biomass from the Ontario side first. After that adjustment the largest absolute gap is 3,392 tonnes at Greenstone Mine (+2.2%) and the largest percentage gap is +3.5% at Musselwhite Mine (1,105 tonnes). Near-zero deltas across 416 independent pairs is the corroboration: reporters file nearly identical numbers to both programs, so a wrong anchor would show up as a large delta. The Thunder Bay Operations example shows the mechanism: Ontario publishes 1,384.3 kt against 202.5 kt in the federal file, and the two agree within 1 tonne after the biomass adjustment.

Cite: "The Ontario Facility Emissions Spine (Open Nshipyard, 2026): 458 of 513 canonical Ontario facilities anchor across the MECP and federal GHGRP programs (89.3%). After adjusting Ontario totals to exclude biomass CO2, the largest 2024 program-vs-program gap is 3,392 t at Greenstone Mine (+2.2%). Sources: Ontario MECP Greenhouse Gas Emissions Reporting By Facility 2010-2024, ECCC GHGRP Emissions by Gas via open.canada.ca."

### Q: Why is the "resolved" tier zero?

**A:** On purpose. The fuzzy tier (difflib at 0.90 or above) produced zero merges after the strict rules, because the rules rejected every near-miss rather than guessing. Three merge traps were found and defused: Canada Brick - Aldershot versus Hanson Brick - Aldershot are different companies whose shared token is the city name itself (full-name ratio 0.76), BUNGE CANADA - HAMILTON versus Hamilton fails the same way (ratio 0.52), and two Ingredion plants in Cardinal and Port Colborne share a company name but are different facilities, blocked by the site-suffix veto. A near-miss like Hamilton Specialty Bar (2007) Inc. versus Hamilton Specialty Bar Corporation (ratio 0.75) was left unmatched rather than guessed.

### Q: What did the big-building data turn out to be worth?

**A:** A cautionary quarantine. The EWRB program publishes no building names and no street addresses, only city and a 3-character postal code, so no row can join to a named facility. All 30,693 rows (2018-2024, 9,250 buildings) are quarantined. The data quality inside is poor: 3,002 rows (9.8%) report zero energy or GHG intensity, and 508 report GHG intensity above 1,000 kgCO2e per m2 against a dataset median of 25.9. The worst row claims 2,861,043 kgCO2e per m2 for a Brampton distribution centre, a physical impossibility consistent with a unit or floor-area entry error. What the data can still support is city-level context: for 49 cities with enough anonymized manufacturing-plant records, the median weather-normalized intensity across local plants, carried by 96 matched industrial facilities and flagged ecological. It is a ceiling on what the dataset can support, not a gap in the pipeline.

Cite: "The Ontario Facility Emissions Spine (Open Nshipyard, 2026): all 30,693 EWRB large-building rows (2018-2024) are quarantined because the files publish no building names or street addresses, so no row can join to a named facility. 9.8% report zero intensities and 508 report GHG intensity above 1,000 kgCO2e/m2. Source: Ontario Ministry of Energy and Mines large-building files."

### Q: Where does facility methane come from?

**A:** Landfills. 89 landfill-like facilities were identified by NAICS 56221 or name, and methane is 90 to 100 percent of their reported totals. Essex-Windsor Regional Landfill emitted 332,600 tonnes CO2e of methane in 2024 (99.2% of its total), followed by Twin Creeks Landfill at 320,601 tonnes (99.1%) and Keele Valley Landfill at 222,895 tonnes. The same methane figures appear in both programs for matched landfills, which is expected: reporters file one set of numbers twice.

Cite: "The Ontario Facility Emissions Spine (Open Nshipyard, 2026): 89 landfill-like facilities emit almost pure methane, 90 to 100% of their reported totals. Essex-Windsor Regional Landfill emitted 332,600 t CO2e of methane in 2024, 99.2% of its total. Sources: Ontario MECP facility GHG 2010-2024 and ECCC GHGRP Emissions by Gas."

### Q: What are the honest limits?

**A:** Four. First, matching requires the same normalized city, so a facility whose municipality is recorded differently in the two programs will not merge. Second, 22 Ontario-only and 33 federal-only facilities remain unmatched, and nearly all stopped reporting before 2024, which reads as closures or sub-threshold years rather than matching failures. Third, the EWRB city context is ecological: a city median, never a building's own intensity. Fourth, the landfill registry join is a spec, not a computed join: no registry file was downloaded.

## FR

### Q : Pourquoi les données d'émissions de l'Ontario ne se retrouvent-elles pas?

**R :** L'Ontario tient deux registres d'émissions d'installations, le programme provincial du MECP et le PDGES fédéral, qui nomment les mêmes usines différemment et ne publient aucune clé commune. Cette colonne résout 513 installations canoniques dans les deux programmes de 2010 à 2024 : 458 appariements directs sur le nom normalisé exact plus la même ville (89,3 %), 55 honnêtement non appariées, et 30 693 lignes de grands bâtiments mises en quarantaine. Le gain est l'identité : une seule requête suit une usine dans les deux programmes et vingt ans d'historique. Bruce Power déclare comme « Bruce Power » dans un registre et « Bruce Power Inc » dans l'autre. Dofasco est devenue ArcelorMittal Dofasco et les deux registres ont consigné l'ancien et le nouveau nom des années différentes. 133 des 480 ID ontariens ont changé de nom au fil des ans, et la colonne conserve chaque nom historique comme variante.

### Q : Comment savez-vous que les appariements directs jumellent les bonnes installations?

**R :** 416 installations appariées déclarent des totaux 2024 aux deux programmes. Le total publié de l'Ontario inclut le CO2 de biomasse et le total fédéral l'exclut, donc la jonction soustrait d'abord la biomasse du côté ontarien. Après cet ajustement, le plus grand écart absolu est de 3 392 tonnes à la mine Greenstone (+2,2 %) et le plus grand écart relatif est de +3,5 % à la mine Musselwhite (1 105 tonnes). Des écarts proches de zéro sur 416 paires indépendantes valident les appariements : les déclarants déposent des chiffres presque identiques aux deux programmes, donc un mauvais appariement apparaîtrait comme un grand écart. L'exemple de Thunder Bay Operations montre le mécanisme : l'Ontario publie 1 384,3 kt contre 202,5 kt dans le fichier fédéral, et les deux concordent à 1 tonne près après l'ajustement biomasse.

Citer : « La colonne vertébrale des émissions des installations de l'Ontario (Open Nshipyard, 2026) : 458 des 513 installations canoniques de l'Ontario s'apparient entre les programmes du MECP et du PDGES fédéral (89,3 %). Après ajustement des totaux ontariens pour exclure le CO2 de biomasse, le plus grand écart 2024 entre programmes est de 3 392 t à la mine Greenstone (+2,2 %). Sources : déclaration des GES par installation du MECP de l'Ontario 2010-2024, émissions par gaz du PDGES d'ECCC via open.canada.ca. »

### Q : Pourquoi le niveau « résolu » est-il à zéro?

**R :** Volontairement. Le niveau flou (difflib à 0,90 ou plus) n'a produit aucun appariement après les règles strictes, parce que les règles ont rejeté chaque quasi-appariement plutôt que de deviner. Trois pièges d'appariement ont été trouvés et désamorcés : Canada Brick - Aldershot contre Hanson Brick - Aldershot sont des entreprises différentes dont le jeton commun est le nom de la ville elle-même (ratio de noms complets 0,76), BUNGE CANADA - HAMILTON contre Hamilton échoue de la même façon (ratio 0,52), et deux usines Ingredion à Cardinal et Port Colborne partagent un nom d'entreprise mais sont des installations différentes, bloquées par le veto du suffixe de site. Un quasi-appariement comme Hamilton Specialty Bar (2007) Inc. contre Hamilton Specialty Bar Corporation (ratio 0,75) est resté non apparié plutôt que deviné.

### Q : Que valent finalement les données des grands bâtiments?

**R :** Une quarantaine instructive. Le programme PGRGE ne publie ni noms de bâtiments ni adresses, seulement la ville et un code postal à 3 caractères, donc aucune ligne ne peut se joindre à une installation nommée. Les 30 693 lignes (2018-2024, 9 250 bâtiments) sont toutes mises en quarantaine. La qualité interne est faible : 3 002 lignes (9,8 %) déclarent une intensité énergétique ou de GES nulle, et 508 déclarent une intensité de GES au-dessus de 1 000 kg éq. CO2/m2 contre une médiane de 25,9. La pire ligne revendique 2 861 043 kg éq. CO2/m2 pour un centre de distribution de Brampton, une impossibilité physique cohérente avec une erreur d'unité ou de superficie. Ce que les données peuvent encore soutenir, c'est le contexte municipal : pour 49 villes avec assez de dossiers anonymisés d'usines manufacturières, l'intensité médiane, normalisée pour la météo, des usines locales, portée par 96 installations industrielles appariées et marquée écologique. C'est un plafond de ce que le jeu de données peut soutenir, pas une lacune du pipeline.

Citer : « La colonne vertébrale des émissions des installations de l'Ontario (Open Nshipyard, 2026) : les 30 693 lignes de grands bâtiments du PGRGE (2018-2024) sont toutes mises en quarantaine parce que les fichiers ne publient ni noms ni adresses de bâtiments, donc aucune ligne ne peut se joindre à une installation nommée. 9,8 % déclarent des intensités nulles et 508 déclarent une intensité de GES au-dessus de 1 000 kg éq. CO2/m2. Source : fichiers des grands bâtiments du ministère de l'Énergie et des Mines de l'Ontario. »

### Q : D'où vient le méthane des installations?

**R :** Des lieux d'enfouissement. 89 installations de type enfouissement ont été repérées par le code SCIAN 56221 ou le nom, et le méthane représente 90 à 100 % de leurs totaux déclarés. Le lieu d'enfouissement régional d'Essex-Windsor a émis 332 600 tonnes éq. CO2 de méthane en 2024 (99,2 % de son total), suivi du lieu Twin Creeks à 320 601 tonnes (99,1 %) et du lieu Keele Valley à 222 895 tonnes. Les mêmes chiffres de méthane figurent dans les deux programmes pour les lieux appariés, ce qui est attendu : les déclarants déposent une seule série de chiffres deux fois.

Citer : « La colonne vertébrale des émissions des installations de l'Ontario (Open Nshipyard, 2026) : 89 installations de type enfouissement émettent du méthane presque pur, 90 à 100 % de leurs totaux déclarés. Le lieu d'enfouissement régional d'Essex-Windsor a émis 332 600 t éq. CO2 de méthane en 2024, 99,2 % de son total. Sources : GES par installation du MECP de l'Ontario 2010-2024 et émissions par gaz du PDGES d'ECCC. »

### Q : Quelles sont les limites honnêtes?

**R :** Quatre. D'abord, l'appariement exige la même ville normalisée, donc une installation dont la municipalité est consignée différemment dans les deux programmes ne s'appariera pas. Ensuite, 22 installations Ontario seulement et 33 fédéral seulement restent non appariées, et presque toutes ont cessé de déclarer avant 2024, ce qui ressemble à des fermetures ou à des années sous le seuil plutôt qu'à des échecs d'appariement. Troisièmement, le contexte municipal du PGRGE est écologique : une médiane municipale, jamais l'intensité propre d'un bâtiment. Enfin, la jonction avec le registre des lieux d'enfouissement est une spécification, pas une jonction calculée : aucun fichier de registre n'a été téléchargé.
