# NSE-trainer

Een eenvoudige webapp om oefenvragen te maken voor meerdere examens. Draait volledig statisch, dus geschikt voor GitHub Pages.

## Werking

- Kies een examen en start.
- Je krijgt één vraag tegelijk (meerkeuze) met direct feedback.
- Een fout antwoord wordt rood gemarkeerd en je probeert opnieuw.
- Bij een goed antwoord ga je door naar de volgende vraag.
- Aan het einde zie je het aantal foute pogingen.

## Publiceren op GitHub Pages

1. Push naar GitHub.
2. Ga naar **Settings → Pages**, kies **Deploy from a branch**, branch `master`, map `/ (root)`.
3. De site staat daarna op `https://<gebruiker>.github.io/NSE-trainer/`.

Lokaal testen (fetch werkt niet via `file://`):

```bash
python -m http.server 8000
```

## Vragen en examens toevoegen

Alle stof staat in [data/](data):

1. Maak een bestand aan, bijvoorbeeld `data/mijn-examen.json`:

   ```json
   {
     "questions": [
       {
         "question": "Vraagtekst?",
         "options": ["A", "B", "C"],
         "answer": 1,
         "explanation": "Optionele uitleg bij een goed antwoord."
       }
     ]
   }
   ```

   `answer` is de index (beginnend bij 0) van het juiste antwoord in `options`.

2. Registreer het examen in `data/exams.json`:

   ```json
   { "title": "Mijn examen", "description": "Korte omschrijving", "file": "data/mijn-examen.json" }
   ```

Meer vragen toevoegen aan een bestaand examen kan door een object aan `questions` toe te voegen. Er is geen code-aanpassing nodig.
