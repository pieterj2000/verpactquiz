# Quiz-opzet op basis van verpakkingen.json

Dit document beschrijft mogelijke quizvragen en quiz-types die ontwikkeld kunnen worden op basis van de datastructuur in `verpakking-quiz/public/verpakkingen.json`.

## Datastructuur Overzicht

Elk item in `verpakkingen.json` bevat de volgende velden:
- `id` / `nid`: Unieke identificatie
- `title`: De naam van het item (bijv. "Stretchfolie", "Markeringsstift")
- `subtitle`: Alternatieve benamingen / synoniemen
- `imageUrl`: Afbeelding van het item
- `description`: Korte omschrijving
- `materials`: Array van materialen (bijv. `["Plastic"]`, `["Plastic", "Papier en Karton"]`)
- `tableInfo`: Object met booleans:
  - `verpakking` (of het officieel een verpakking is)
  - `bijdrageplichtig` (of er een verpakkingsbelasting/bijdrage voor geldt)
  - `verkooppuntverpakking`
  - `potetieleMeermaligeVerpakking`
  - `logistiekHulpmiddel`
  - `verpaktProduct`
  - `exoot` (of het een uitzondering/buitenbeentje is)
- `url`: Bronlink

---

## Mogelijke Quiz-types

### 1. "Wel of geen verpakking?" (Waar / Niet-waar)
* **Vraagstelling:** "Is dit product volgens de officiële regels een verpakking?"
* **Datapunt:** `tableInfo.verpakking` (true/false)
* **Spelmechaniek:** Spelers krijgen een afbeelding en beschrijving te zien (bijv. van een markeringsstift of stretchfolie) en moeten aangeven of het om een verpakking gaat of niet.

### 2. "Raad het materiaal" (Materiaal-quiz)
* **Vraagstelling:** "Uit welke materialen bestaat deze verpakking?"
* **Datapunt:** `materials` (array van strings)
* **Spelmechaniek:** Meerkeuzevraag of checkbox-selectie waarbij de speler de juiste materialen (zoals Plastic, Glas, Papier en Karton, Overige metalen) moet selecteren bij een gegeven verpakking.

### 3. "De Exoten-jacht" (Buitenbeentjes-quiz)
* **Vraagstelling:** "Welk van deze items is een 'exoot' en geen reguliere verpakking?"
* **Datapunt:** `tableInfo.exoot` (true/false) of `tableInfo.verpakking: false`
* **Spelmechaniek:** Toon vier items waarvan er één een exoot of geen verpakking is. De speler moet het buitenbeentje aanwijzen.

### 4. "Bijdrageplichtig of niet?" (Milieu- en regels-quiz)
* **Vraagstelling:** "Valt deze verpakking onder de bijdrageplicht?"
* **Datapunt:** `tableInfo.bijdrageplichtig` (true/false)
* **Spelmechaniek:** Snelle ja/nee quiz of swipe-mechaniek (bijv. naar links voor niet-bijdrageplichtig, naar rechts voor bijdrageplichtig).

### 5. "Wie ben ik?" (Visuele en omschrijvingsquiz)
* **Vraagstelling:** "Welke verpakking wordt hier omschreven?" of "Bij welke verpakking hoort deze afbeelding?"
* **Datapunt:** `imageUrl`, `description`, `subtitle`, `title`
* **Spelmechaniek:** Klassieke trivia-quiz waarbij de titel verborgen is en de speler uit vier opties de juiste verpakkingsnaam moet kiezen.

### 6. "Logistiek of Consument?" (Eigenschappen-expert)
* **Vraagstelling:** "Is dit item een logistiek hulpmiddel of een verkooppuntverpakking?"
* **Datapunt:** `tableInfo.logistiekHulpmiddel`, `tableInfo.verkooppuntverpakking`, `tableInfo.potetieleMeermaligeVerpakking`
* **Spelmechaniek:** Vragen over de specifieke functie of hergebruiksmogelijkheden van de verpakking in de keten.
