import "./style.css";
import tekstHtml from "./tekstje.md";

interface CatalogItem {
  id: string;
  nid: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  localImageUrl: string;
  description: string;
  materials: string[];
  tableInfo: Record<string, boolean>;
  url: string;
}

let items: CatalogItem[] = [];
let currentQuestionIndex = 0;
let totalScore = 0;
let quizQuestions: CatalogItem[] = [];
let userGuesses: Record<string, boolean> = {};

const app = document.querySelector<HTMLDivElement>("#app")!;

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -5px; margin-right: 0.6rem;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`;

const tableProperties = [
  { key: "verpakking", label: "Verpakking" },
  { key: "bijdrageplichtig", label: "Bijdrageplichtig" },
  { key: "verkooppuntverpakking", label: "Verkooppuntverpakking" },
  {
    key: "potetieleMeermaligeVerpakking",
    label: "Potentiële meermalige verpakking",
  },
  { key: "logistiekHulpmiddel", label: "Logistiek hulpmiddel" },
  { key: "verpaktProduct", label: "Verpakt product" },
  { key: "exoot", label: "Exoot" },
];

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
    <header style="cursor: pointer;" id="header-home">
      <h1>${logoSvg}Verpakkings-Quiz</h1>
      <p>Ontdek alles over verpakkingen met de officiële Verpact Verpakkingencatalogus!</p>
    </header>
    <main>
      <div class="card" style="text-align: center;">
        <h2 style="margin-bottom: 1rem;">Catalogus laden...</h2>
        <p style="margin-bottom: 1.5rem; color: var(--text-muted);">Even geduld terwijl de officiële Verpact data wordt geladen.</p>
      </div>
    </main>
  `;
}

function renderWelcomeReady() {
  app.innerHTML = `
    <header style="cursor: pointer;" id="header-home">
      <h1>${logoSvg}Verpakkings-Quiz</h1>
      <p>Ontdek alles over verpakkingen met de officiële Verpact Verpakkingencatalogus!</p>
    </header>
    <main style="max-width: 900px; width: 100%; margin: 2rem auto; padding: 0 1rem;">
      <div class="card" style="text-align: center; margin-bottom: 2rem;">
        <h2 style="margin-bottom: 1rem;">Test je kennis van de Verpakkingscatalogus</h2>
        <p style="margin-bottom: 1.5rem; color: var(--text-muted);">
          Je krijgt telkens een product te zien met afbeelding, omschrijving en materialen. 
          Aan jou de taak om voor alle 7 eigenschappen uit de tabel te gokken of ze wel of niet van toepassing zijn.
        </p>
        <button id="start-btn" class="btn" style="font-size: 1.1rem; padding: 1rem 2rem; width: 100%;">Start de Quiz</button>
      </div>

      <!-- Tekstvak met inhoud uit tekstje.md gecompileerd tijdens build-time (server-side) door Vite plugin -->
      <div class="card" style="text-align: left; background: #f8fafc; border-left: 5px solid var(--primary-color);">
        ${tekstHtml}
      </div>
    </main>
  `;

  document
    .querySelector("#header-home")
    ?.addEventListener("click", renderWelcomeReady);
  document.querySelector("#start-btn")?.addEventListener("click", startQuiz);
}

function startQuiz() {
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  quizQuestions = shuffled.slice(0, 10);
  currentQuestionIndex = 0;
  totalScore = 0;
  renderQuestion();
}

function renderQuestion() {
  if (currentQuestionIndex >= quizQuestions.length) {
    renderResults();
    return;
  }

  const item = quizQuestions[currentQuestionIndex];
  userGuesses = {};
  tableProperties.forEach((p) => {
    userGuesses[p.key] = false;
  });

  const progress = (currentQuestionIndex / quizQuestions.length) * 100;
  const imgSrc = item.localImageUrl || item.imageUrl;

  app.innerHTML = `
    <header style="cursor: pointer;" id="header-home">
      <h1>${logoSvg}Verpakkings-Quiz</h1>
      <p>Test je kennis van de Verpakkingscatalogus</p>
    </header>
    <main style="max-width: 1250px; width: 100%; margin: 2rem auto; padding: 0 1rem;">
      <div class="card quiz-container" style="max-width: 100%;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 600; color: var(--text-muted);">
          <span>Product ${currentQuestionIndex + 1} van ${quizQuestions.length}</span>
          <span>${Math.round(progress)}% voltooid</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; align-items: start; margin-top: 1.5rem;">
          
          <!-- LINKER KOLOM: Product informatie (naam, afbeelding, omschrijving, materialen) -->
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div style="text-align: left;">
              <h2 style="color: var(--primary-dark); margin-bottom: 0.25rem; font-size: 1.6rem;">${item.title}</h2>
              ${item.subtitle ? `<p style="font-style: italic; color: var(--text-muted); font-size: 1rem;">${item.subtitle}</p>` : ""}
            </div>

            ${
              imgSrc
                ? `
              <div style="width: 100%; background: #f8fafc; border-radius: 8px; border: 1px solid #cbd5e1; padding: 0; text-align: center; overflow: hidden;">
                <img src="${imgSrc}" alt="${item.title}" style="width: 100%; height: auto; object-fit: contain; display: block; border-radius: 7px;" />
              </div>
            `
                : ""
            }

            <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
              <p style="font-size: 1rem; margin-bottom: 0.75rem; line-height: 1.5;">${item.description}</p>
              <p style="font-size: 0.9rem; color: var(--text-muted);"><strong>Materialen:</strong> ${item.materials.join(", ")}</p>
            </div>
          </div>

          <!-- RECHTER KOLOM: Vragen / 7 tabel-eigenschappen -->
          <div style="display: flex; flex-direction: column;">
            <h3 style="font-size: 1.1rem; margin-bottom: 1rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">Geef aan welke 7 tabel-eigenschappen van toepassing zijn:</h3>

            <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem;">
              ${tableProperties
                .map(
                  (prop) => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <span style="font-weight: 600; font-size: 0.95rem;">${prop.label}</span>
                  <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-secondary guess-btn ${userGuesses[prop.key] === true ? "btn-success" : ""}" data-prop="${prop.key}" data-val="true" style="padding: 0.4rem 1rem; font-size: 0.9rem;">Ja</button>
                    <button class="btn btn-secondary guess-btn ${userGuesses[prop.key] === false ? "btn-danger" : ""}" data-prop="${prop.key}" data-val="false" style="padding: 0.4rem 1rem; font-size: 0.9rem;">Nee</button>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>

            <div id="feedback-area"></div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
              <span style="font-size: 0.9rem; color: var(--text-muted);">Score tot nu toe: ${totalScore}</span>
              <button id="submit-btn" class="btn" style="padding: 0.75rem 2rem;">Controleer antwoorden</button>
              <button id="next-btn" class="btn" style="display: none; padding: 0.75rem 2rem;">Volgend product</button>
            </div>
          </div>

        </div>
      </div>
    </main>
  `;

  document
    .querySelector("#header-home")
    ?.addEventListener("click", renderWelcomeReady);

  document.querySelectorAll(".guess-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLElement;
      const prop = target.getAttribute("data-prop")!;
      const val = target.getAttribute("data-val") === "true";
      userGuesses[prop] = val;

      const parentRow = target.parentElement!;
      parentRow.querySelectorAll(".guess-btn").forEach((b) => {
        b.classList.remove("btn-success", "btn-danger");
        b.classList.add("btn-secondary");
      });
      if (val) {
        target.classList.remove("btn-secondary");
        target.classList.add("btn-success");
      } else {
        target.classList.remove("btn-secondary");
        target.classList.add("btn-danger");
      }
    });
  });

  document.querySelector("#submit-btn")?.addEventListener("click", () => {
    checkAnswers(item);
  });

  document.querySelector("#next-btn")?.addEventListener("click", () => {
    currentQuestionIndex++;
    renderQuestion();
  });
}

function checkAnswers(item: CatalogItem) {
  let roundScore = 0;
  tableProperties.forEach((prop) => {
    const correct = item.tableInfo[prop.key] === true;
    const guessed = userGuesses[prop.key] === true;
    if (correct === guessed) {
      roundScore++;
    }
  });

  totalScore += roundScore;

  document.querySelectorAll(".guess-btn").forEach((b) => {
    (b as HTMLButtonElement).disabled = true;
  });

  const feedbackArea = document.querySelector("#feedback-area")!;
  feedbackArea.innerHTML = `
    <div class="feedback-box ${roundScore === 7 ? "correct-feedback" : "incorrect-feedback"}">
      <strong>Je had ${roundScore} van de 7 eigenschappen goed!</strong><br>
      <div style="margin-top: 0.5rem; font-size: 0.85rem;">
        ${tableProperties
          .map((p) => {
            const corr = item.tableInfo[p.key] === true ? "Ja" : "Nee";
            const guess = userGuesses[p.key] === true ? "Ja" : "Nee";
            const ok = corr === guess;
            return `<div>${p.label}: Jouw gok: <strong>${guess}</strong> | Correct: <strong>${corr}</strong> ${ok ? "✅" : "❌"}</div>`;
          })
          .join("")}
      </div>
    </div>
  `;

  (document.querySelector("#submit-btn") as HTMLElement).style.display = "none";
  (document.querySelector("#next-btn") as HTMLElement).style.display =
    "inline-flex";
}

function renderResults() {
  const maxPossible = quizQuestions.length * 7;
  const percentage = Math.round((totalScore / maxPossible) * 100);
  let feedbackText =
    "Geweldig! Jij bent een absolute Verpact Catalogus Expert!";
  if (percentage < 50) {
    feedbackText =
      "Dat kan beter! Tijd om de catalogus nog eens door te nemen.";
  } else if (percentage < 80) {
    feedbackText =
      "Knap gedaan! Je hebt de meeste productkenmerken goed ingeschat.";
  }

  app.innerHTML = `
    <header style="cursor: pointer;" id="header-home">
      <h1>${logoSvg}Quiz Voltooid!</h1>
      <p>Je eindresultaat</p>
    </header>
    <main>
      <div class="card" style="text-align: center;">
        <h2 style="font-size: 2.5rem; color: var(--primary-color); margin-bottom: 0.5rem;">${totalScore} / ${maxPossible}</h2>
        <p style="font-size: 1.2rem; font-weight: 600; margin-bottom: 1rem;">Juiste kenmerken: ${percentage}%</p>
        <p style="margin-bottom: 2rem; color: var(--text-muted);">${feedbackText}</p>
        
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button id="restart-btn" class="btn">Speel opnieuw</button>
          <button id="home-btn" class="btn btn-secondary">Terug naar start</button>
        </div>
      </div>
    </main>
  `;

  document
    .querySelector("#header-home")
    ?.addEventListener("click", renderWelcomeReady);
  document.querySelector("#restart-btn")?.addEventListener("click", startQuiz);
  document
    .querySelector("#home-btn")
    ?.addEventListener("click", renderWelcomeReady);
}

loadData();
