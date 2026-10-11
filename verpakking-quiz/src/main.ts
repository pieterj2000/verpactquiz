import "./style.css";
// @ts-expect-error markdown module
import { html as tekstHtml } from "./tekstje.md";

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

      <!-- Tekstvak met inhoud uit tekstje.md gecompileerd tijdens build-time (server-side) via virtual module -->
      <div class="card tekst-card" style="background: #f8fafc;">
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

  const progress = (currentQuestionIndex / quizQuestions.length) * 100;
  const imgSrc = item.localImageUrl || item.imageUrl;

  app.innerHTML = `
    <header style="cursor: pointer;" id="header-home">
      <h1>${logoSvg}Verpakkings-Quiz</h1>
      <p>Test je kennis van de Verpakkingscatalogus</p>
    </header>
    <main style="max-width: 1250px; width: 100%; margin: 2rem auto; padding: 0 1rem;">
      <div class="card quiz-container" style="max-width: 100%; padding: 1rem 2.5rem 2.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; font-size: 0.9rem; font-weight: 600; color: var(--text-muted);">
          <span>Product ${currentQuestionIndex + 1} van ${quizQuestions.length}</span>
          <span>${Math.round(progress)}% voltooid</span>
        </div>
        <div class="progress-bar" style="margin-bottom: 0.75rem;">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>

        <!-- Product Titel & Subtitel bovenaan -->
        <div style="margin-bottom: 0.75rem; text-align: left;">
          <h2 style="color: var(--primary-dark); font-size: 1.8rem; line-height: 1.3;">
            ${item.title}
            ${item.subtitle ? `<span style="font-style: italic; color: var(--text-muted); font-size: 1.1rem; font-weight: normal; margin-left: 0.5rem;">(${item.subtitle})</span>` : ""}
          </h2>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; align-items: start;">
          
          <!-- LINKER KOLOM: Afbeelding, omschrijving, materialen -->
          <div style="display: flex; flex-direction: column; gap: 1rem;">
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

          <!-- RECHTER KOLOM: Vragen -->
          <div style="display: flex; flex-direction: column;">
            <!-- Prominente Verpakking Hoofdvraag -->
            <div id="verpakking-box" style="background: ${userGuesses["verpakking"] !== undefined ? (item.tableInfo["verpakking"] === userGuesses["verpakking"] ? "#f0fdf4" : "#fef2f2") : "#fff"}; border: 2px solid ${userGuesses["verpakking"] !== undefined ? (item.tableInfo["verpakking"] === userGuesses["verpakking"] ? "#16a34a" : "#dc2626") : "#cbd5e1"}; padding: 1.25rem; border-radius: 10px; margin-bottom: 1.5rem; box-shadow: 0 4px 12px rgb(0 0 0 / 8%);">
              <label style="display: block; font-size: 1.25rem; font-weight: 700; color: var(--primary-dark); margin-bottom: 0.75rem;">
                Is dit product een verpakking? 📦
              </label>
              <div style="display: flex; gap: 1rem; margin-bottom: 0.5rem;">
                <button class="btn guess-btn ${userGuesses["verpakking"] === true ? "btn-success" : "btn-secondary"}" data-prop="verpakking" data-val="true" style="flex: 1; padding: 0.75rem; font-size: 1.1rem;" ${userGuesses["verpakking"] !== undefined ? "disabled" : ""}>Ja</button>
                <button class="btn guess-btn ${userGuesses["verpakking"] === false ? "btn-danger" : "btn-secondary"}" data-prop="verpakking" data-val="false" style="flex: 1; padding: 0.75rem; font-size: 1.1rem;" ${userGuesses["verpakking"] !== undefined ? "disabled" : ""}>Nee</button>
              </div>
              <div id="verpakking-immediate-feedback">
                ${
                  userGuesses["verpakking"] !== undefined
                    ? `
                  <div style="font-size: 0.95rem; font-weight: 600; color: ${item.tableInfo["verpakking"] === userGuesses["verpakking"] ? "#166534" : "#991b1b"}; margin-top: 0.5rem;">
                    ${item.tableInfo["verpakking"] === userGuesses["verpakking"] ? "✅ Correct! Dit is " + (item.tableInfo["verpakking"] ? "wel" : "geen") + " verpakking." : "❌ Helaas, dit is " + (item.tableInfo["verpakking"] ? "wel" : "geen") + " verpakking."}
                  </div>
                `
                    : ""
                }
              </div>
            </div>

            <!-- Overige 6 eigenschappen (pas zichtbaar na beantwoorden hoofdvraag) -->
            <div id="other-properties-container" style="display: ${userGuesses["verpakking"] !== undefined ? "flex" : "none"}; flex-direction: column; gap: 0.35rem; margin-bottom: 0.75rem;">
              <h3 style="font-size: 0.95rem; margin-top: 0.1rem; margin-bottom: 0.25rem; color: var(--text-color);">Bonus: is dit product een...</h3>
              ${tableProperties
                .slice(1)
                .map(
                  (prop) => `
                <div id="prop-row-${prop.key}" style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 0.3rem 0.6rem; border-radius: 6px; border: 2px solid #e2e8f0;">
                  <span style="font-weight: 600; font-size: 0.85rem;">${prop.label}</span>
                  <div style="display: flex; gap: 0.3rem;">
                    <button class="btn btn-secondary guess-btn" data-prop="${prop.key}" data-val="true" style="padding: 0.2rem 0.6rem; font-size: 0.8rem;">Ja</button>
                    <button class="btn btn-secondary guess-btn" data-prop="${prop.key}" data-val="false" style="padding: 0.2rem 0.6rem; font-size: 0.8rem;">Nee</button>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>

            <div id="feedback-area"></div>

            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap;">
              <button id="catalog-btn" class="btn btn-secondary catalog-btn" style="display: ${userGuesses["verpakking"] !== undefined ? "inline-block" : "none"}; padding: 0.6rem 0.9rem;">Catalogus</button>
              <button id="show-answers-btn" class="btn btn-secondary" style="display: ${userGuesses["verpakking"] !== undefined ? "inline-flex" : "none"}; padding: 0.6rem 0.9rem;">Antwoorden</button>
              <button id="next-btn" class="btn" style="display: ${userGuesses["verpakking"] !== undefined ? "inline-flex" : "none"}; padding: 0.6rem 1.25rem;">Volgende</button>
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
      const isCorrect = item.tableInfo[prop] === val;

      parentRow.querySelectorAll(".guess-btn").forEach((b) => {
        (b as HTMLButtonElement).disabled = true;
        b.classList.remove("btn-success", "btn-danger");
        b.classList.add("btn-secondary");
      });

      if (prop === "verpakking") {
        const feedbackDiv = document.querySelector(
          "#verpakking-immediate-feedback",
        )!;
        feedbackDiv.innerHTML = `
          <div style="font-size: 0.95rem; font-weight: 600; color: ${isCorrect ? "#166534" : "#991b1b"}; margin-top: 0.5rem;">
            ${isCorrect ? "✅ Correct! Dit is " + (item.tableInfo["verpakking"] ? "wel" : "geen") + " verpakking." : "❌ Helaas, dit is " + (item.tableInfo["verpakking"] ? "wel" : "geen") + " verpakking."}
          </div>
        `;

        const box = document.querySelector("#verpakking-box") as HTMLElement;
        if (box) {
          box.style.background = isCorrect ? "#f0fdf4" : "#fef2f2";
          box.style.border = isCorrect
            ? "2px solid #16a34a"
            : "2px solid #dc2626";
          box.classList.add(isCorrect ? "anim-correct" : "anim-incorrect");
        }

        const otherContainer = document.querySelector(
          "#other-properties-container",
        ) as HTMLElement;
        const nextBtn = document.querySelector("#next-btn") as HTMLElement;
        const showAnswersBtn = document.querySelector(
          "#show-answers-btn",
        ) as HTMLElement;
        const catalogBtn = document.querySelector(
          "#catalog-btn",
        ) as HTMLElement;
        if (otherContainer) otherContainer.style.display = "flex";
        if (nextBtn) nextBtn.style.display = "inline-flex";
        if (showAnswersBtn) showAnswersBtn.style.display = "inline-flex";
        if (catalogBtn) catalogBtn.style.display = "inline-flex";
      } else {
        const row = document.querySelector(`#prop-row-${prop}`) as HTMLElement;
        if (row) {
          row.style.background = isCorrect ? "#f0fdf4" : "#fef2f2";
          row.style.border = isCorrect
            ? "2px solid #16a34a"
            : "2px solid #dc2626";
          row.classList.add(isCorrect ? "anim-correct" : "anim-incorrect");
        }
      }

      if (val) {
        target.classList.remove("btn-secondary");
        target.classList.add(isCorrect ? "btn-success" : "btn-danger");
      } else {
        target.classList.remove("btn-secondary");
        target.classList.add(isCorrect ? "btn-success" : "btn-danger");
      }
    });
  });

  document.querySelector("#catalog-btn")?.addEventListener("click", () => {
    window.open(item.url, "_blank", "noopener,noreferrer");
  });

  document.querySelector("#show-answers-btn")?.addEventListener("click", () => {
    tableProperties.slice(1).forEach((prop) => {
      if (userGuesses[prop.key] !== undefined) {
        return;
      }
      const correctVal = item.tableInfo[prop.key] === true;
      userGuesses[prop.key] = correctVal;

      const row = document.querySelector(
        `#prop-row-${prop.key}`,
      ) as HTMLElement;
      if (row) {
        row.style.background = "#f8fafc";
        row.style.border = "2px solid #e2e8f0";
        row.querySelectorAll(".guess-btn").forEach((b) => {
          const btnEl = b as HTMLButtonElement;
          btnEl.disabled = true;
          btnEl.classList.remove("btn-success", "btn-danger", "btn-secondary");
          const bVal = btnEl.getAttribute("data-val") === "true";
          if (bVal === correctVal) {
            btnEl.classList.add("btn-correct-answer");
          } else {
            btnEl.classList.add("btn-secondary");
          }
        });
      }
    });
  });

  document.querySelector("#next-btn")?.addEventListener("click", () => {
    let roundScore = 0;
    tableProperties.forEach((p) => {
      if (userGuesses[p.key] === (item.tableInfo[p.key] === true)) {
        roundScore++;
      }
    });
    totalScore += roundScore;
    currentQuestionIndex++;
    renderQuestion();
  });
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
