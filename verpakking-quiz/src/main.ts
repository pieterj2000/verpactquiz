import "./style.css";

interface CatalogItem {
  id: string;
  nid: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  description: string;
  materials: string[];
  tableInfo: Record<string, boolean>;
  url: string;
}

let items: CatalogItem[] = [];
let currentQuestionIndex = 0;
let score = 0;
let quizQuestions: any[] = [];
let answered = false;
let currentQuizMode = "mix"; // 'mix', 'packaging', 'material', 'exoot', 'bijdrage', 'trivia', 'logistiek'

const app = document.querySelector<HTMLDivElement>("#app")!;

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -5px; margin-right: 0.6rem;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`;

async function loadData() {
  renderWelcomeLoading();
  try {
    const res = await fetch("/verpakkingen.json");
    items = await res.json();
    renderWelcomeReady();
  } catch {
    app.innerHTML = `
      <div class="card">
        <h2>Fout bij het laden</h2>
        <p>Kon de verpakkingscatalogus niet laden. Zorg ervoor dat <code>verpakkingen.json</code> aanwezig is.</p>
      </div>
    `;
  }
}

function renderWelcomeLoading() {
  app.innerHTML = `
    <header>
      <h1>${logoSvg}Verpakkings-Quiz</h1>
      <p>Ontdek alles over verpakkingen met de officiële Verpact Verpakkingencatalogus!</p>
    </header>
    <main>
      <div class="card" style="text-align: center;">
        <h2 style="margin-bottom: 1rem;">Catalogus laden...</h2>
        <p style="margin-bottom: 1.5rem; color: var(--text-muted);">Even geduld terwijl de officiële Verpact data wordt geladen.</p>
      </div>
    </main>
    <footer>
      <p>Verpakkings-Quiz &copy; 2025</p>
    </footer>
  `;
}

function renderWelcomeReady() {
  app.innerHTML = `
    <header>
      <h1>${logoSvg}Verpakkings-Quiz</h1>
      <p>Ontdek alles over verpakkingen met de officiële Verpact Verpakkingencatalogus!</p>
    </header>
    <main>
      <div class="card" style="text-align: center;">
        <h2 style="margin-bottom: 1rem;">Kies je Quiz-modus</h2>
        <p style="margin-bottom: 1.5rem; color: var(--text-muted);">
          Gebaseerd op de officiële quiz-opzet (${items.length} items uit de Verpact catalogus). Wat wil je testen?
        </p>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
          <button class="btn btn-secondary quiz-mode-btn" data-mode="mix" style="padding: 1rem; font-weight: bold;">🔀 Mix Quiz (Alle types)</button>
          <button class="btn btn-secondary quiz-mode-btn" data-mode="packaging" style="padding: 1rem;">📦 Wel of geen verpakking?</button>
          <button class="btn btn-secondary quiz-mode-btn" data-mode="material" style="padding: 1rem;">🧪 Raad het materiaal</button>
          <button class="btn btn-secondary quiz-mode-btn" data-mode="exoot" style="padding: 1rem;">🔍 Exoten-jacht (Buitenbeentjes)</button>
          <button class="btn btn-secondary quiz-mode-btn" data-mode="bijdrage" style="padding: 1rem;">💶 Bijdrageplichtig of niet?</button>
          <button class="btn btn-secondary quiz-mode-btn" data-mode="trivia" style="padding: 1rem;">❓ Wie ben ik? (Trivia)</button>
        </div>

        <button id="start-btn" class="btn" style="font-size: 1.1rem; padding: 1rem 2rem; width: 100%;">Start Gekozen Quiz</button>
      </div>

      <div class="card catalog-section">
        <h3 style="margin-bottom: 1rem;">Officiële Catalogus Bibliotheek</h3>
        <input type="text" id="search-input" class="catalog-search" placeholder="Zoek in alle gescrapte producten..." />
        <div id="catalog-list" class="catalog-list"></div>
      </div>
    </main>
    <footer>
      <p>Gebaseerd op de live gescrapte <a href="https://www.verpact.nl/nl/verpakkingencatalogus" target="_blank">Verpact Verpakkingencatalogus</a>.</p>
    </footer>
  `;

  document.querySelectorAll(".quiz-mode-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".quiz-mode-btn")
        .forEach((b) => b.classList.remove("btn-success"));
      document
        .querySelectorAll(".quiz-mode-btn")
        .forEach((b) => b.classList.add("btn-secondary"));
      (e.currentTarget as HTMLElement).classList.remove("btn-secondary");
      (e.currentTarget as HTMLElement).classList.add("btn-success");
      currentQuizMode =
        (e.currentTarget as HTMLElement).getAttribute("data-mode") || "mix";
    });
  });

  // Highlight default mix
  const defaultBtn = document.querySelector('[data-mode="mix"]');
  defaultBtn?.classList.remove("btn-secondary");
  defaultBtn?.classList.add("btn-success");

  document.querySelector("#start-btn")?.addEventListener("click", startQuiz);

  const searchInput = document.querySelector(
    "#search-input",
  ) as HTMLInputElement;
  searchInput?.addEventListener("input", (e) => {
    renderCatalogList((e.target as HTMLInputElement).value);
  });

  renderCatalogList("");
}

function renderCatalogList(filter: string) {
  const listEl = document.querySelector("#catalog-list");
  if (!listEl) return;

  const filtered = items
    .filter(
      (i) =>
        i.title.toLowerCase().includes(filter.toLowerCase()) ||
        i.description.toLowerCase().includes(filter.toLowerCase()),
    )
    .slice(0, 50);

  if (filtered.length === 0) {
    listEl.innerHTML =
      '<p style="color: var(--text-muted); text-align: center; padding: 1rem;">Geen producten gevonden.</p>';
    return;
  }

  listEl.innerHTML = filtered
    .map(
      (item) => `
    <div class="catalog-item">
      <h4>${item.title}</h4>
      ${item.subtitle ? `<p style="font-style: italic; color: var(--primary-dark);">${item.subtitle}</p>` : ""}
      <p>${item.description}</p>
      <div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">
        <strong>Materialen:</strong> ${item.materials.join(", ")} | 
        <strong>Bijdrageplichtig:</strong> ${item.tableInfo.bijdrageplichtig ? "Ja" : "Nee"} | 
        <strong>Verpakking:</strong> ${item.tableInfo.verpakking ? "Ja" : "Nee"}
      </div>
    </div>
  `,
    )
    .join("");
}

function startQuiz() {
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 10);

  quizQuestions = selected.map((item) => {
    let mode = currentQuizMode;
    if (mode === "mix") {
      const modes = [
        "packaging",
        "material",
        "exoot",
        "bijdrage",
        "trivia",
        "logistiek",
      ];
      mode = modes[Math.floor(Math.random() * modes.length)];
    }

    if (mode === "packaging") {
      return {
        item,
        type: "packaging",
        questionText: `Is <strong>"${item.title}"</strong> volgens de officiële Verpact catalogus een verpakking?`,
        correctAnswer: item.tableInfo.verpakking,
        options: [
          { label: "Ja, een verpakking", value: true },
          { label: "Nee, geen verpakking", value: false },
        ],
      };
    } else if (mode === "material") {
      const correctMat = item.materials[0] || "Plastic";
      const otherMats = [
        "Plastic",
        "Papier en Karton",
        "Glas",
        "Metaal",
        "Hout",
        "Diversen",
      ].filter((m) => m !== correctMat);
      const wrongMats = otherMats.sort(() => 0.5 - Math.random()).slice(0, 3);
      const options = [correctMat, ...wrongMats]
        .sort(() => 0.5 - Math.random())
        .map((m) => ({ label: m, value: m }));
      return {
        item,
        type: "material",
        questionText: `Welk hoofdmateriaal hoort bij <strong>"${item.title}"</strong>?`,
        correctAnswer: correctMat,
        options,
      };
    } else if (mode === "exoot") {
      // Find 1 item that is not a packaging or has special properties, plus 3 regular ones
      const isExoot = !item.tableInfo.verpakking || item.tableInfo.exoot;
      const otherRegular = items
        .filter((i) => i.tableInfo.verpakking && !i.tableInfo.exoot)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      const group = [item, ...otherRegular].sort(() => 0.5 - Math.random());
      const correctItem = isExoot ? item : otherRegular[0];
      return {
        item: correctItem,
        type: "exoot",
        questionText: `Welk van onderstaande items is een <strong>exoot of geen officiële verpakking</strong>?`,
        correctAnswer: correctItem.title,
        options: group.map((g) => ({ label: g.title, value: g.title })),
      };
    } else if (mode === "bijdrageplichtig") {
      return {
        item,
        type: "bijdrage",
        questionText: `Moet voor <strong>"${item.title}"</strong> de Afvalbeheerbijdrage Verpakkingen worden betaald (bijdrageplichtig)?`,
        correctAnswer: item.tableInfo.bijdrageplichtig,
        options: [
          { label: "Ja, bijdrageplichtig", value: true },
          { label: "Nee, niet bijdrageplichtig", value: false },
        ],
      };
    } else if (mode === "logistiek") {
      return {
        item,
        type: "logistiek",
        questionText: `Is <strong>"${item.title}"</strong> aangeduid als logistiek hulpmiddel of transportverpakking?`,
        correctAnswer: item.tableInfo.logistiekHulpmiddel,
        options: [
          { label: "Ja, logistiek hulpmiddel", value: true },
          { label: "Nee, geen logistiek hulpmiddel", value: false },
        ],
      };
    } else {
      // Trivia: Wie ben ik?
      const otherItems = items.filter((i) => i.id !== item.id);
      const wrongOptions = otherItems
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((i) => i.title);
      const options = [item.title, ...wrongOptions]
        .sort(() => 0.5 - Math.random())
        .map((o) => ({ label: o, value: o }));
      return {
        item,
        type: "trivia",
        questionText: `Welk product wordt hier omschreven?<br><br><em>"${item.description}"</em>`,
        correctAnswer: item.title,
        options,
      };
    }
  });

  currentQuestionIndex = 0;
  score = 0;
  renderQuestion();
}

function renderQuestion() {
  if (currentQuestionIndex >= quizQuestions.length) {
    renderResults();
    return;
  }

  answered = false;
  const q = quizQuestions[currentQuestionIndex];
  const progress = (currentQuestionIndex / quizQuestions.length) * 100;

  app.innerHTML = `
    <header>
      <h1>${logoSvg}Verpakkings-Quiz</h1>
      <p>Vraag ${currentQuestionIndex + 1} van ${quizQuestions.length}</p>
    </header>
    <main>
      <div class="card quiz-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="question-meta">Quiz Modus: ${q.type.toUpperCase()}</div>
        <div class="question-text">${q.questionText}</div>
        
        <div id="feedback-area"></div>

        <div class="options-grid" id="options-grid">
          ${q.options
            .map(
              (opt: any) => `
            <button class="option-btn" data-answer="${String(opt.value)}">
              ${opt.label}
            </button>
          `,
            )
            .join("")}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
          <span style="font-size: 0.9rem; color: var(--text-muted);">Score: ${score}</span>
          <button id="next-btn" class="btn" style="display: none;">Volgende vraag</button>
        </div>
      </div>
    </main>
    <footer>
      <p>Verpakkings-Quiz &copy; 2025 - Gebaseerd op quiz-opzet.md</p>
    </footer>
  `;

  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (answered) return;
      answered = true;
      const rawVal = (e.currentTarget as HTMLElement).getAttribute(
        "data-answer",
      );
      const userAns =
        rawVal === "true" ? true : rawVal === "false" ? false : rawVal;
      handleAnswer(userAns, q);
    });
  });

  document.querySelector("#next-btn")?.addEventListener("click", () => {
    currentQuestionIndex++;
    renderQuestion();
  });
}

function handleAnswer(userAns: any, q: any) {
  const isCorrect = userAns === q.correctAnswer;
  if (isCorrect) score++;

  const buttons = document.querySelectorAll(".option-btn");
  buttons.forEach((b) => {
    const rawVal = b.getAttribute("data-answer");
    const bVal = rawVal === "true" ? true : rawVal === "false" ? false : rawVal;
    if (bVal === q.correctAnswer) {
      b.classList.add("correct");
    } else if (bVal === userAns) {
      b.classList.add("incorrect");
    }
    (b as HTMLButtonElement).disabled = true;
  });

  const feedbackArea = document.querySelector("#feedback-area")!;
  feedbackArea.innerHTML = `
    <div class="feedback-box ${isCorrect ? "correct-feedback" : "incorrect-feedback"}">
      <strong>${isCorrect ? "Juist!" : "Onjuist!"}</strong><br>
      Juist antwoord: <strong>${typeof q.correctAnswer === "boolean" ? (q.correctAnswer ? "Ja" : "Nee") : q.correctAnswer}</strong><br>
      <em>${q.item.description}</em>
    </div>
  `;

  const nextBtn = document.querySelector("#next-btn") as HTMLElement;
  if (nextBtn) {
    nextBtn.style.display = "inline-flex";
  }
}

function renderResults() {
  const percentage = Math.round((score / quizQuestions.length) * 100);
  let feedbackText = "Uitstekend gedaan! Jij bent een echte verpakkingsexpert.";
  if (percentage < 50) {
    feedbackText =
      "Dat kan beter! Tijd om de catalogus nog eens door te nemen.";
  } else if (percentage < 80) {
    feedbackText = "Goed bezig! Je weet al een hele hoop over verpakkingen.";
  }

  app.innerHTML = `
    <header>
      <h1>${logoSvg}Quiz Voltooid!</h1>
      <p>Je eindresultaat</p>
    </header>
    <main>
      <div class="card" style="text-align: center;">
        <h2 style="font-size: 2.5rem; color: var(--primary-color); margin-bottom: 0.5rem;">${score} / ${quizQuestions.length}</h2>
        <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 1rem;">Score: ${percentage}%</p>
        <p style="margin-bottom: 2rem; color: var(--text-muted);">${feedbackText}</p>
        
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button id="restart-btn" class="btn">Speel opnieuw</button>
          <button id="home-btn" class="btn btn-secondary">Terug naar start</button>
        </div>
      </div>
    </main>
    <footer>
      <p>Verpakkings-Quiz &copy; 2025</p>
    </footer>
  `;

  document.querySelector("#restart-btn")?.addEventListener("click", startQuiz);
  document
    .querySelector("#home-btn")
    ?.addEventListener("click", renderWelcomeReady);
}

loadData();
