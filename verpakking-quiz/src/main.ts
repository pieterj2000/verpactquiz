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

const app = document.querySelector<HTMLDivElement>("#app")!;

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 0.5rem;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`;

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
        <h2 style="margin-bottom: 1rem;">Test je kennis van de Verpakkingencatalogus</h2>
        <p style="margin-bottom: 1.5rem; color: var(--text-muted);">
          Alle data op deze website is live gescrapt uit de officiële Verpact catalogus (${items.length} items). 
          Test je kennis aan de hand van echte productvragen!
        </p>
        <button id="start-btn" class="btn" style="font-size: 1.1rem; padding: 1rem 2rem;">Start de Quiz</button>
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
        <strong>Materialen:</strong> ${item.materials.join(", ")}
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
    const otherItems = items.filter((i) => i.id !== item.id);
    const wrongOptions = otherItems
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((i) => i.title);
    const options = [item.title, ...wrongOptions].sort(
      () => 0.5 - Math.random(),
    );

    return {
      item,
      questionText: `Welke omschrijving of product hoort bij deze gegevens uit de catalogus?<br><br><em>"${item.description}"</em>`,
      correctAnswer: item.title,
      options,
    };
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
        <div class="question-meta">Live Verpact Catalogus</div>
        <div class="question-text">${q.questionText}</div>
        
        <div id="feedback-area"></div>

        <div class="options-grid" id="options-grid">
          ${q.options
            .map(
              (opt: string) => `
            <button class="option-btn" data-answer="${opt}">
              ${opt}
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
      <p>Verpakkings-Quiz &copy; 2025 - Puur gescrapte data</p>
    </footer>
  `;

  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (answered) return;
      answered = true;
      const userAns = (e.currentTarget as HTMLElement).getAttribute(
        "data-answer",
      );
      handleAnswer(userAns, q);
    });
  });

  document.querySelector("#next-btn")?.addEventListener("click", () => {
    currentQuestionIndex++;
    renderQuestion();
  });
}

function handleAnswer(userAns: string | null, q: any) {
  const isCorrect = userAns === q.correctAnswer;
  if (isCorrect) score++;

  const buttons = document.querySelectorAll(".option-btn");
  buttons.forEach((b) => {
    const ans = b.getAttribute("data-answer");
    if (ans === q.correctAnswer) {
      b.classList.add("correct");
    } else if (ans === userAns) {
      b.classList.add("incorrect");
    }
    (b as HTMLButtonElement).disabled = true;
  });

  const feedbackArea = document.querySelector("#feedback-area")!;
  feedbackArea.innerHTML = `
    <div class="feedback-box ${isCorrect ? "correct-feedback" : "incorrect-feedback"}">
      <strong>${isCorrect ? "Juist!" : "Onjuist!"}</strong><br>
      Het juiste product is: <strong>${q.correctAnswer}</strong><br>
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
  let feedbackText = "Uitstekend gedaan! Je bent een echte cataloguskenner.";
  if (percentage < 50) {
    feedbackText = "Dat kan beter! Neem de catalogus nog eens door.";
  } else if (percentage < 80) {
    feedbackText = "Goed bezig! Je weet al een hele hoop.";
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
