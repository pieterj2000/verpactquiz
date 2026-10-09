import "./style.css";

interface PackagingItem {
  id: string;
  nid: number;
  title: string;
  url: string;
  description: string;
  isPackaging: boolean;
  category: string;
  feeLiable: boolean;
}

let items: PackagingItem[] = [];
let currentQuestionIndex = 0;
let score = 0;
let quizQuestions: any[] = [];
let answered = false;

const app = document.querySelector<HTMLDivElement>("#app")!;

async function loadData() {
  try {
    const res = await fetch("/verpakkingen.json");
    items = await res.json();
    renderWelcome();
  } catch {
    app.innerHTML = `
      <div class="card">
        <h2>Fout bij het laden</h2>
        <p>Kon de verpakkingscatalogus niet laden. Zorg ervoor dat <code>verpakkingen.json</code> aanwezig is.</p>
      </div>
    `;
  }
}

function renderWelcome() {
  app.innerHTML = `
    <header>
      <h1>Verpakkings-Quiz</h1>
      <p>Test je kennis met de officiële Verpact Verpakkingencatalogus!</p>
    </header>
    <main>
      <div class="card" style="text-align: center;">
        <h2 style="margin-bottom: 1rem;">Is het een verpakking of niet?</h2>
        <p style="margin-bottom: 1.5rem; color: var(--text-muted);">
          In de wetgeving en de Verpact Verpakkingencatalogus is het cruciaal om te weten wat wel en geen verpakking is, 
          en welke categorie van toepassing is. Speel de quiz met ${items.length} echte voorbeelden en word een verpakkingskenner!
        </p>
        <button id="start-btn" class="btn" style="font-size: 1.1rem; padding: 1rem 2rem;">Start de Quiz</button>
      </div>

      <div class="card catalog-section">
        <h3 style="margin-bottom: 1rem;">Doorzoek de Verpakkingscatalogus</h3>
        <input type="text" id="search-input" class="catalog-search" placeholder="Zoek op product (bijv. fles, zak, markeringsstift)..." />
        <div id="catalog-list" class="catalog-list"></div>
      </div>
    </main>
    <footer>
      <p>Gebaseerd op de <a href="https://www.verpact.nl/nl/verpakkingencatalogus" target="_blank">Verpact Verpakkingencatalogus</a>.</p>
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
      <p>${item.description}</p>
      <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <span class="badge ${item.isPackaging ? "badge-yes" : "badge-no"}">
          ${item.isPackaging ? "Wel verpakking" : "Geen verpakking"}
        </span>
        <span class="badge" style="background: #e2e8f0; color: #1e293b;">
          ${item.category}
        </span>
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
    const questionType = Math.random() > 0.5 ? "packaging" : "category";
    if (questionType === "packaging") {
      return {
        type: "packaging",
        item,
        questionText: `Is <strong>"${item.title}"</strong> volgens de Verpact catalogus een officiële verpakking?`,
        correctAnswer: item.isPackaging,
        options: [
          { label: "Wel een verpakking", value: true },
          { label: "Geen verpakking", value: false },
        ],
      };
    } else {
      return {
        type: "category",
        item,
        questionText: `In welke categorie valt <strong>"${item.title}"</strong> in de Verpact catalogus?`,
        correctAnswer: item.category,
        options: [
          { label: "Verkoopverpakking", value: "Verkoopverpakking" },
          { label: "Verkooppuntverpakking", value: "Verkooppuntverpakking" },
          {
            label: "Logistiek hulpmiddel / Transportverpakking",
            value: "Logistiek hulpmiddel / Transportverpakking",
          },
          {
            label: "Geen verpakking (product/hulpmiddel)",
            value: "Geen verpakking (product/hulpmiddel)",
          },
        ].sort(() => 0.5 - Math.random()),
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
      <h1>Verpakkings-Quiz</h1>
      <p>Vraag ${currentQuestionIndex + 1} van ${quizQuestions.length}</p>
    </header>
    <main>
      <div class="card quiz-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        <div class="question-meta">Verpact Catalogus</div>
        <div class="question-text">${q.questionText}</div>
        
        <div id="feedback-area"></div>

        <div class="options-grid" id="options-grid">
          ${q.options
            .map(
              (opt: any) => `
            <button class="option-btn" data-answer="${typeof opt.value === "boolean" ? opt.value : opt.label}">
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
      <p>Verpakkings-Quiz &copy; 2025 - Verpact Data</p>
    </footer>
  `;

  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      if (answered) return;
      answered = true;
      const target = e.currentTarget as HTMLElement;
      const rawVal = target.getAttribute("data-answer");
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
      Categorie: <strong>${q.item.category}</strong><br>
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
  let feedbackText = "Uitstekend gedaan! Je bent een echte verpakkingskenner.";
  if (percentage < 50) {
    feedbackText =
      "Dat kan beter! Tijd om de verpakkingscatalogus nog eens door te nemen.";
  } else if (percentage < 80) {
    feedbackText = "Goed bezig! Je weet al een hele hoop over verpakkingen.";
  }

  app.innerHTML = `
    <header>
      <h1>Quiz Voltooid!</h1>
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
  document.querySelector("#home-btn")?.addEventListener("click", renderWelcome);
}

loadData();
