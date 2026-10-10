# Chart insight specs: Ontario Facility Emissions Spine

## EN

### 1. Identity-resolution funnel (hero chart)

**What it shows:** The funnel from 971 program-side facility IDs (480 Ontario, 491 federal) into 513 canonical facilities, then the tiers: 458 anchored, 0 resolved, 55 unmatched, and the 30,693 EWRB building rows quarantined outside the spine.

**Insight:** The shape tells the whole story in one glance. The two program counts collapse into one spine, nearly nine tenths of it anchored, and the resolved slice is a deliberate zero: the strict rules rejected every fuzzy near-miss rather than guessing. The quarantined EWRB bar dwarfs everything, which is the point: the largest dataset in the build contributes zero identities.

**Build notes:** Horizontal bars on a square-root scale so the 30,693-row bar does not flatten the rest. Red for spine/anchored, navy for program IDs and unmatched, gray for the resolved zero and quarantine. Notes name the 22/33 unmatched split and the zero-resolved rule.

### 2. Ontario facility match map (centerpiece)

**What it shows:** All 513 facilities plotted at approximate municipal centroids on a hand-built SVG of Ontario. Red dots are anchored across both programs, navy dots are unmatched (one program). Dot size follows 2024 emissions.

**Insight:** The geography of Ontario industry at a glance. The big red dots trace the familiar corridor: Sarnia-Corunna petrochemicals, Hamilton steel, the Nanticoke and Toronto generating stations, Sault Ste. Marie steel. The navy dots are the interesting minority: single-program facilities, nearly all of which stopped reporting before 2024, scattered where plants closed or dropped below the 10-kilotonne threshold. EWRB rows cannot be plotted at all: the files publish no building names or addresses, which is why the quarantine exists.

**Build notes:** Equirectangular projection on the Ontario bounding box, hand-authored municipal-centroid lookup (513 of 513 facilities mapped), deterministic jitter so same-city dots separate, tooltip with name and city. Legend states the approximate-centroid caveat.

### 3. Combined emissions ranking bars

**What it shows:** The top 15 facilities by 2024 Ontario total, each with twin bars: red for the Ontario 2024 total, navy for the federal 2024 total, both in kilotonnes.

**Insight:** The twin bars are the validation made visible. For 13 of the top 15 the two bars are indistinguishable: reporters file nearly identical numbers to both programs. Thunder Bay Operations breaks the pattern on purpose: Ontario publishes 1,384.3 kt against 202.5 kt federal, because the plant burns biomass and Ontario's total includes biomass CO2. After the adjustment the two agree within 1 tonne. The chart carries that note inline so the outlier teaches instead of confusing.

**Build notes:** Paired horizontal bars per facility, kilotonne formatting with one decimal. Inline biomass note under rank 7.

### 4. Program agreement deltas

**What it shows:** Two small rankings: the largest absolute 2024 program-vs-program gaps and the largest percentage gaps, after the biomass adjustment, across the 416 facilities with 2024 totals in both programs.

**Insight:** The largest "disagreement" in the entire join is 3,392 tonnes at Greenstone Mine (+2.2%), and the largest percentage gap is +3.5% at Musselwhite Mine (1,105 tonnes). That is the whole point: the worst case is still a rounding-level difference, which independently validates the 458 anchors. "Cite this" copies the agreement citation.

**Build notes:** Two-column bar lists scaled to the top gap in each column. Numbers show the plus sign to read as Ontario-minus-federal.

### 5. EWRB quarantine breakdown

**What it shows:** The 30,693 quarantined rows split by reason: no building identifier published (30,693), zero energy or GHG intensity (3,002, 9.8%), absurd GHG intensity above 1,000 kgCO2e/m2 (508).

**Insight:** The quarantine is not one failure but three stacked ones. The identifier gap is structural: without names or addresses no join is possible. The zero and absurd intensities are data-quality failures that would poison any analysis that skipped the quarantine step. The worst row, 2,861,043 kgCO2e/m2 for a Brampton distribution centre, is 110,000 times the dataset median of 25.9.

**Build notes:** Three stat cards with mini bars scaled to the max reason. Body text names the Brampton row as the mechanism: a unit or floor-area entry error.

### 6. Landfill methane ranking

**What it shows:** The top 10 landfill-like facilities by 2024 methane in tonnes CO2e, with each row's methane share of its reported total.

**Insight:** Facility methane in Ontario is a landfill story. The top three, Essex-Windsor (332,600 t, 99.2%), Twin Creeks (320,601 t, 99.1%), and Keele Valley (222,895 t), emit almost pure methane. The shares column teaches the mechanism: these are decomposition sites, not combustion sites. The inline note is honest about the gap: the provincial landfill registry join is a spec, not a computed join.

**Build notes:** Single-axis horizontal bars with rank numbers and the methane share in parentheses. "Cite this" copies the landfill citation.

## FR

### 1. Entonnoir de résolution d'identités (graphique principal)

**Ce qu'il montre :** L'entonnoir de 971 ID d'installations côté programmes (480 Ontario, 491 fédéral) vers 513 installations canoniques, puis les niveaux : 458 appariements directs, 0 résolus, 55 non appariées, et les 30 693 lignes de bâtiments PGRGE mises en quarantaine hors de la colonne.

**L'idée :** La forme raconte toute l'histoire d'un coup d'œil. Les deux comptes de programmes se condensent en une seule colonne, presque neuf dixièmes appariés directement, et la tranche des résolus est un zéro délibéré : les règles strictes ont rejeté chaque quasi-appariement flou plutôt que de deviner. La barre de quarantaine PGRGE écrase tout le reste, ce qui est le propos : le plus gros jeu de données de la version ne fournit aucune identité.

**Notes de construction :** Barres horizontales en échelle racine carrée pour que la barre des 30 693 lignes n'écrase pas les autres. Rouge pour la colonne et les directs, bleu marine pour les ID de programmes et les non appariées, gris pour le zéro résolu et la quarantaine. Les notes nomment la répartition 22/33 des non appariées et la règle du zéro résolu.

### 2. Carte des appariements d'installations de l'Ontario (pièce maîtresse)

**Ce qu'elle montre :** Les 513 installations placées aux centroïdes municipaux approximatifs sur un SVG de l'Ontario dessiné à la main. Les points rouges sont appariés dans les deux programmes, les points bleu marine sont non appariés (un seul programme). La taille des points suit les émissions 2024.

**L'idée :** La géographie de l'industrie ontarienne d'un coup d'œil. Les gros points rouges tracent le corridor familier : la pétrochimie de Sarnia-Corunna, l'acier de Hamilton, les centrales de Nanticoke et Toronto, l'acier de Sault-Sainte-Marie. Les points bleu marine sont la minorité intéressante : des installations d'un seul programme, presque toutes ayant cessé de déclarer avant 2024, dispersées là où des usines ont fermé ou sont passées sous le seuil de 10 kilotonnes. Les lignes PGRGE ne peuvent pas être placées du tout : les fichiers ne publient ni noms ni adresses de bâtiments, ce qui justifie la quarantaine.

**Notes de construction :** Projection équirectangulaire sur le rectangle englobant de l'Ontario, table de centroïdes municipaux rédigée à la main (513 installations sur 513 placées), décalage déterministe pour séparer les points d'une même ville, infobulle avec nom et ville. La légende énonce la réserve des centroïdes approximatifs.

### 3. Barres du classement combiné des émissions

**Ce qu'il montre :** Les 15 premières installations par total ontarien 2024, chacune avec des barres jumelées : rouge pour le total ontarien 2024, bleu marine pour le total fédéral 2024, en kilotonnes.

**L'idée :** Les barres jumelées rendent la validation visible. Pour 13 des 15 premières, les deux barres sont indiscernables : les déclarants déposent des chiffres presque identiques aux deux programmes. Thunder Bay Operations rompt le motif exprès : l'Ontario publie 1 384,3 kt contre 202,5 kt au fédéral, parce que la centrale brûle de la biomasse et que le total ontarien inclut le CO2 de biomasse. Après l'ajustement, les deux concordent à 1 tonne près. Le graphique porte cette note en ligne pour que l'exception enseigne au lieu de troubler.

**Notes de construction :** Barres horizontales jumelées par installation, format en kilotonnes avec une décimale. Note biomasse en ligne sous le rang 7.

### 4. Écarts d'accord entre programmes

**Ce qu'il montre :** Deux petits classements : les plus grands écarts absolus 2024 entre programmes et les plus grands écarts relatifs, après l'ajustement biomasse, parmi les 416 installations avec des totaux 2024 dans les deux programmes.

**L'idée :** Le plus grand « désaccord » de toute la jonction est de 3 392 tonnes à la mine Greenstone (+2,2 %), et le plus grand écart relatif est de +3,5 % à la mine Musselwhite (1 105 tonnes). C'est tout le propos : le pire cas reste une différence d'arrondi, ce qui valide indépendamment les 458 appariements directs. « Citer ceci » copie la citation d'accord.

**Notes de construction :** Deux colonnes de barres mises à l'échelle sur le plus grand écart de chaque colonne. Les chiffres portent le signe plus pour se lire comme Ontario moins fédéral.

### 5. Répartition de la quarantaine PGRGE

**Ce qu'il montre :** Les 30 693 lignes mises en quarantaine par motif : aucun identifiant de bâtiment publié (30 693), intensité énergétique ou de GES nulle (3 002, 9,8 %), intensité de GES absurde au-dessus de 1 000 kg éq. CO2/m2 (508).

**L'idée :** La quarantaine n'est pas un échec mais trois échecs empilés. Le manque d'identifiant est structurel : sans noms ni adresses, aucune jonction n'est possible. Les intensités nulles et absurdes sont des échecs de qualité des données qui empoisonneraient toute analyse qui sauterait l'étape de quarantaine. La pire ligne, 2 861 043 kg éq. CO2/m2 pour un centre de distribution de Brampton, vaut 110 000 fois la médiane de 25,9.

**Notes de construction :** Trois cartes de statistiques avec mini-barres mises à l'échelle sur le motif maximal. Le texte nomme la ligne de Brampton comme mécanisme : une erreur d'unité ou de superficie.

### 6. Classement du méthane des lieux d'enfouissement

**Ce qu'il montre :** Les 10 premières installations de type enfouissement par méthane 2024 en tonnes éq. CO2, avec la part du méthane dans le total déclaré de chaque ligne.

**L'idée :** Le méthane des installations en Ontario est une histoire de lieux d'enfouissement. Les trois premiers, Essex-Windsor (332 600 t, 99,2 %), Twin Creeks (320 601 t, 99,1 %) et Keele Valley (222 895 t), émettent du méthane presque pur. La colonne des parts enseigne le mécanisme : ce sont des sites de décomposition, pas de combustion. La note en ligne est honnête sur la lacune : la jonction avec le registre provincial des lieux d'enfouissement est une spécification, pas une jonction calculée.

**Notes de construction :** Barres horizontales à un axe avec numéros de rang et part de méthane entre parenthèses. « Citer ceci » copie la citation sur l'enfouissement.
