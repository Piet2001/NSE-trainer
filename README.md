# NSE-trainer

Een eenvoudige webapp om oefenvragen te maken voor meerdere examens. Draait volledig statisch, dus geschikt voor GitHub Pages.

## Werking

- Kies een examen en start.
- Je krijgt één vraag tegelijk (meerkeuze) met direct feedback.
- Bij een fout antwoord zie je direct het juiste antwoord en ga je door naar de volgende vraag; de fout beantwoorde vraag komt later terug.
- De sessie eindigt pas als je elke vraag goed hebt beantwoord.
- Aan het einde zie je hoeveel vragen je fout had en het aantal foute pogingen.

## Publiceren op GitHub Pages

1. Push naar GitHub.
2. Ga naar **Settings → Pages**, kies **Deploy from a branch**, branch `master`, map `/ (root)`.
3. De site staat daarna op `https://<gebruiker>.github.io/NSE-trainer/`.

Lokaal testen (fetch werkt niet via `file://`):

```bash
python -m http.server 8000
```

## Vragen en examens toevoegen

Alle stof staat in [data/](data). Er is geen code-aanpassing nodig.

### Stap 1: vragenbestand maken

Maak `data/mijn-examen.json`:

```json
{
  "questions": [
    {
      "question": "Vraag met één goed antwoord?",
      "options": ["A", "B", "C"],
      "answer": 1,
      "explanation": "Optionele uitleg na een goed antwoord."
    },
    {
      "question": "Welke twee kloppen? (Choose two.)",
      "options": ["A", "B", "C", "D"],
      "answer": [0, 2]
    },
    {
      "question": "Vraag met exhibit?",
      "options": ["A", "B"],
      "answer": 0,
      "images": ["data/img/exhibit.png"]
    }
  ]
}
```

| Veld | Verplicht | Uitleg |
|------|-----------|--------|
| `question` | ja | Vraagtekst |
| `options` | ja | Lijst met antwoordopties |
| `answer` | ja | Index (start bij 0) van het juiste antwoord, of een lijst zoals `[0, 2]` bij meerdere goede antwoorden |
| `explanation` | nee | Uitleg die bij een goed antwoord getoond wordt |
| `images` | nee | Lijst met afbeeldingspaden (exhibits) |

Bij meerdere antwoorden selecteert de gebruiker alle opties en klikt op *Controleer*.

### Stap 2: examen registreren

Voeg een item toe aan `data/exams.json`:

```json
{ "title": "Mijn examen", "description": "Korte omschrijving", "file": "data/mijn-examen.json" }
```

Een examen uit meerdere bestanden (bijvoorbeeld NL + EN) gebruikt `files`:

```json
{ "title": "Mijn examen", "description": "...", "files": ["data/a.json", "data/b.json"] }
```

### Meer vragen aan een bestaand examen

Voeg een object toe aan `questions` in het bestaande bestand, of voeg een nieuw bestand toe aan `files`.
