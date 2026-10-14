# MINNA N5 (work in progress)

Vanilla HTML/CSS/JS Japanese study app. Progress is saved in your browser's LocalStorage (it does not sync between devices; use Settings → Export/Import).

## Status (honest)
Built: Dashboard, Vocabulary (842 words, Lessons 1-25: search, filters, flashcards, quizzes, learned/bookmark), Grammar & Particles (82 patterns + 15 particles, 85 practice questions), Kanji 1-320 (index, search, filters, ranges, detail, flashcards, quizzes, timed/weak/custom-range tests), Settings (export/import/reset).
Not built yet: 25 lessons, vocabulary, grammar, kana, reading, listening, mock exams, review notebook, study plan.
Not browser-tested: the quiz question generator was tested in Node (4,701 generated questions, all with 4 unique options including the answer). The UI has not been run in a browser.

## Run
The app uses ES modules, so open it through a local server (not file://):
- VS Code: install "Live Server", right-click index.html -> Open with Live Server, or
- `python3 -m http.server 8000` in this folder, then visit http://localhost:8000

## Kanji data
`js/data/kanji-320.js` is extracted from *Basic Kanji 320* (Meguro Language Center), keeping the source numbering 1-320. Entries with a non-empty `review` field need a manual check against the PDF. Stroke counts/order, romaji and a single "main meaning" are not in the source and are not invented.

## GitHub
git init && git add . && git commit -m "Initial MINNA N5" && git branch -M main
git remote add origin <your-repo-url> && git push -u origin main
Description: Complete Japanese beginner study platform featuring all 25 Minna no Nihongo Shokyu I lessons, a source-based 320-kanji learning system, vocabulary and grammar practice, quizzes, mock exams, and progress tracking. (Currently: kanji module only.)

## Vocabulary and grammar data
`js/data/vocabulary-*.js` and `grammar-*.js` were written for this app (original wording) following the standard Minna no Nihongo I order and checked against English glosses OCR'd from the reference PDF. About 93% of words matched automatically; the rest were not individually verified. Lessons 15, 20 and 23-25 have fewer entries than the others and should be expanded. Verify against your own textbook before relying on lesson numbers.
