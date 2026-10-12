import "./style.css";
// @ts-expect-error markdown module
import { html as tekstWappieHtml } from "./tekstje.md";
// @ts-expect-error markdown module
import { html as tekstNormaalHtml } from "./tekstje-normaal.md";
// @ts-expect-error markdown module
import { html as zinnenWappieHtml } from "./zinnen.md";
// @ts-expect-error markdown module
import { html as zinnenNormaalHtml } from "./zinnen-normaal.md";

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
let primaryCorrect = 0;
let bonusCorrect = 0;
let bonusIncorrect = 0;
let quizQuestions: CatalogItem[] = [];
let userGuesses: Record<string, boolean> = {};
let isLoading = true;
let loadError = false;
let currentMode: "normal" | "wappie" = "normal";
let currentView: "welcome" | "quiz" | "results" = "welcome";

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

function parseZinnen(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const headings = doc.querySelectorAll("h1, h2, h3");
  const data: Record<string, string> = {};
  headings.forEach((h) => {
    const key = h.textContent?.trim() || "";
    const next = h.nextElementSibling;
    if (next) {
      data[key] = next.innerHTML;
    }
  });
  return data;
}

const zinnenWappie = parseZinnen(zinnenWappieHtml);
const zinnenNormaal = parseZinnen(zinnenNormaalHtml);

function getZinnen() {
  return currentMode === "wappie" ? zinnenWappie : zinnenNormaal;
}

function renderModeToggle() {
  const zinnen = getZinnen();
  const btnText =
    currentMode === "normal"
      ? zinnen["Toggle Button Normal"]
      : zinnen["Toggle Button Wappie"];
  return `
    <div style="text-align: center; margin: 2rem 0 1rem; padding: 1rem;">
      <button id="mode-toggle-btn" class="btn btn-secondary" style="font-size: 0.9rem; padding: 0.6rem 1.2rem;">${btnText}</button>
    </div>
  `;
}

function setupModeToggle() {
  document.querySelector("#mode-toggle-btn")?.addEventListener("click", () => {
    currentMode = currentMode === "normal" ? "wappie" : "normal";
    if (currentView === "welcome") {
      renderWelcomeReady();
    } else if (currentView === "quiz") {
      renderQuestion();
    } else if (currentView === "results") {
      renderResults();
    }
  });
}

async function loadData() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}verpakkingen.json`);
    items = await res.json();
    isLoading = false;
  } catch {
    loadError = true;
    isLoading = false;
  }
}

async function handleStart() {
  const zinnen = getZinnen();
  if (loadError) {
    app.innerHTML = `
      <header style="cursor: pointer;" id="header-home">
        <h1>${logoSvg}Verpakkingsquiz</h1>
        <p>${zinnen["Subtitle"]}</p>
      </header>
      <main>
        <div class="card">
          <h2>Fout bij het laden</h2>
          <p>Kon de verpakkingscatalogus niet laden. Zorg ervoor dat <code>verpakkingen.json</code> aanwezig is.</p>
        </div>
        ${renderModeToggle()}
      </main>
    `;
    document.querySelector("#header-home")?.addEventListener("click", () => {
      renderWelcomeReady();
      loadData();
    });
    setupModeToggle();
    return;
  }
  if (isLoading) {
    renderWelcomeLoading();
    while (isLoading) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  startQuiz();
}

function renderWelcomeLoading() {
  const zinnen = getZinnen();
  app.innerHTML = `
    <header style="cursor: pointer;" id="header-home">
      <h1>${logoSvg}Verpakkingsquiz</h1>
      <p>${zinnen["Subtitle"]}</p>
    </header>
    <main>
      <div class="card" style="text-align: center;">
        <h2 style="margin-bottom: 1rem;">Catalogus laden...</h2>
        <p style="margin-bottom: 1.5rem; color: var(--text-muted);">Even geduld terwijl de officiële Verpact data wordt geladen.</p>
      </div>
      ${renderModeToggle()}
    </main>
  `;
  setupModeToggle();
}

function renderWelcomeReady() {
  currentView = "welcome";
  const zinnen = getZinnen();
  const tekstHtml =
    currentMode === "wappie" ? tekstWappieHtml : tekstNormaalHtml;

  app.innerHTML = `
    <header style="cursor: pointer;" id="header-home">
      <h1>${logoSvg}Verpakkingsquiz</h1>
      <p>${zinnen["Subtitle"]}</p>
    </header>
    <main style="max-width: 900px; width: 100%; margin: 2rem auto; padding: 0 1rem;">
      <div class="card" style="text-align: center; margin-bottom: 2rem;">
        <h2 style="margin-bottom: 1.5rem;">${zinnen["Welcome Title"]}</h2>
        <button id="start-btn" class="btn" style="font-size: 1.1rem; padding: 1rem 2rem; width: 100%;">Start de Quiz</button>
      </div>

      <div class="card tekst-card" style="background: #f8fafc;">
        ${tekstHtml}
      </div>

      ${renderModeToggle()}
    </main>
  `;

  document.querySelector("#header-home")?.addEventListener("click", () => {
    renderWelcomeReady();
    loadData();
  });
  document.querySelector("#start-btn")?.addEventListener("click", handleStart);
  setupModeToggle();
}

function startQuiz() {
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  quizQuestions = shuffled.slice(0, 15);
  currentQuestionIndex = 0;
  primaryCorrect = 0;
  bonusCorrect = 0;
  bonusIncorrect = 0;
  renderQuestion();
}

function renderQuestion() {
  currentView = "quiz";
  if (currentQuestionIndex >= quizQuestions.length) {
    renderResults();
    return;
  }

  const item = quizQuestions[currentQuestionIndex];
  userGuesses = {};
  const zinnen = getZinnen();

  const progress = (currentQuestionIndex / quizQuestions.length) * 100;
  const rawImg = item.localImageUrl || item.imageUrl;
  const imgSrc = rawImg.startsWith("/")
    ? `${import.meta.env.BASE_URL}${rawImg.slice(1)}`
    : rawImg;

  app.innerHTML = `
    <header style="cursor: pointer;" id="header-home">
      <h1>${logoSvg}Verpakkingsquiz</h1>
      <p>${zinnen["Subtitle"]}</p>
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

        <div style="margin-bottom: 0.75rem; text-align: left;">
          <h2 style="color: var(--primary-dark); font-size: 1.8rem; line-height: 1.3;">
            ${item.title}
            ${item.subtitle ? `<span style="font-style: italic; color: var(--text-muted); font-size: 1.1rem; font-weight: normal; margin-left: 0.5rem;">(${item.subtitle})</span>` : ""}
          </h2>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(390px, 1fr)); gap: 2rem; align-items: start;">
          
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${
              imgSrc
                ? `<div style="width: 100%; max-height: 380px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 0.5rem;">
                     <img src="${imgSrc}" alt="${item.title}" style="max-width: 100%; max-height: 360px; object-fit: contain; border-radius: 4px;" />
                   </div>`
                : ""
            }

            <div style="font-size: 0.95rem; color: var(--text-color); line-height: 1.5; background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0;">
              ${item.description || "Geen beschrijving beschikbaar."}
            </div>

            ${
              item.materials && item.materials.length > 0
                ? `<div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                     ${item.materials.map((m) => `<span style="background: #e2e8f0; color: var(--text-color); font-size: 0.8rem; padding: 0.2rem 0.6rem; border-radius: 4px; font-weight: 500;">${m}</span>`).join("")}
                   </div>`
                : ""
            }
          </div>

          <div style="display: flex; flex-direction: column; gap: 1rem;">
            
            <div id="verpakking-box" style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; transition: all 0.3s ease;">
              <h3 style="margin-bottom: 0.75rem; font-size: 1.1rem; color: var(--primary-dark);">Is dit een verpakking?</h3>
              <div style="display: flex; gap: 1rem;">
                <button class="btn guess-primary-btn" data-prop="verpakking" data-val="true" style="flex: 1; background: #ffffff; color: var(--text-color); border: 2px solid #cbd5e1;">Ja</button>
                <button class="btn guess-primary-btn" data-prop="verpakking" data-val="false" style="flex: 1; background: #ffffff; color: var(--text-color); border: 2px solid #cbd5e1;">Nee</button>
              </div>
              <div id="verpakking-immediate-feedback"></div>
            </div>

            <div id="other-properties-container" style="opacity: 0.4; pointer-events: none; transition: opacity 0.3s ease; display: flex; flex-direction: column; gap: 0.75rem;">
              <h4 style="font-size: 1rem; color: var(--text-muted); margin-bottom: -0.25rem;">Overige eigenschappen (optioneel):</h4>
              ${tableProperties
                .slice(1)
                .map(
                  (p) => `
                <div id="prop-row-${p.key}" style="background: #f8fafc; border: 2px solid transparent; border-radius: 8px; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s ease;">
                  <span style="font-size: 0.95rem; font-weight: 500; color: var(--text-color);">${p.label}</span>
                  <div style="display: flex; gap: 0.5rem;">
                    <button class="btn guess-btn" data-prop="${p.key}" data-val="true" style="padding: 0.3rem 0.8rem; font-size: 0.85rem; background: #ffffff; color: var(--text-color); border: 2px solid #cbd5e1;">Ja</button>
                    <button class="btn guess-btn" data-prop="${p.key}" data-val="false" style="padding: 0.3rem 0.8rem; font-size: 0.85rem; background: #ffffff; color: var(--text-color); border: 2px solid #cbd5e1;">Nee</button>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>

            <div style="display: flex; gap: 0.75rem; margin-top: 0.5rem; flex-wrap: wrap;">
              <button id="catalog-btn" class="btn catalog-btn" style="display: none; align-items: center; justify-content: center; gap: 0; background: #ffffff; color: var(--text-color); border: 2px solid #cbd5e1;">Catalogus</button>
              <button id="show-answers-btn" class="btn btn-secondary" style="display: none; align-items: center; justify-content: center;">Antwoorden</button>
              <button id="next-btn" class="btn" style="display: none; flex: 1; align-items: center; justify-content: center;">Volgend product</button>
            </div>

          </div>

        </div>

      </div>
      ${renderModeToggle()}
    </main>
  `;

  document.querySelector("#header-home")?.addEventListener("click", () => {
    renderWelcomeReady();
    loadData();
  });
  setupModeToggle();

  document.querySelectorAll(".guess-primary-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const val = target.getAttribute("data-val") === "true";
      const correctVal = item.tableInfo["verpakking"] === true;
      const isCorrect = val === correctVal;

      userGuesses["verpakking"] = val;

      document.querySelectorAll(".guess-primary-btn").forEach((b) => {
        const bEl = b as HTMLButtonElement;
        bEl.disabled = true;
        bEl.classList.remove("btn-success", "btn-danger", "btn-secondary");
        const bVal = bEl.getAttribute("data-val") === "true";
        if (bVal === correctVal) {
          bEl.classList.add("btn-correct-answer");
        } else if (bEl === target) {
          bEl.classList.add(isCorrect ? "btn-success" : "btn-danger");
        } else {
          bEl.classList.add("btn-secondary");
        }
      });

      const feedbackDiv = document.querySelector(
        "#verpakking-immediate-feedback",
      )!;
      feedbackDiv.innerHTML = `
        <div style="font-size: 0.95rem; font-weight: 600; color: ${isCorrect ? "#166534" : "#991b1b"}; margin-top: 0.5rem;">
          ${isCorrect ? "✅ Correct! Dit 'is' " + (item.tableInfo["verpakking"] ? "wel" : "geen") + " verpakking." : "❌ Helaas, dit 'is' " + (item.tableInfo["verpakking"] ? "wel" : "geen") + " verpakking."}
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
      const catalogBtn = document.querySelector("#catalog-btn") as HTMLElement;

      if (otherContainer) {
        otherContainer.style.opacity = "1";
        otherContainer.style.pointerEvents = "auto";
      }
      if (nextBtn) nextBtn.style.display = "inline-flex";
      if (showAnswersBtn) showAnswersBtn.style.display = "inline-flex";
      if (catalogBtn) catalogBtn.style.display = "inline-flex";
    });
  });

  document.querySelectorAll(".guess-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const prop = target.getAttribute("data-prop")!;
      const val = target.getAttribute("data-val") === "true";
      const correctVal = item.tableInfo[prop] === true;
      const isCorrect = val === correctVal;

      userGuesses[prop] = val;

      const row = document.querySelector(`#prop-row-${prop}`) as HTMLElement;
      if (row) {
        row.style.background = isCorrect ? "#f0fdf4" : "#fef2f2";
        row.style.border = isCorrect
          ? "2px solid #16a34a"
          : "2px solid #dc2626";
      }

      const parentGroup = target.parentElement!;
      parentGroup.querySelectorAll("button").forEach((b) => {
        const bEl = b as HTMLButtonElement;
        bEl.disabled = true;
        bEl.classList.remove("btn-success", "btn-danger", "btn-secondary");
        const bVal = bEl.getAttribute("data-val") === "true";
        if (bVal === correctVal) {
          bEl.classList.add("btn-correct-answer");
        } else if (bEl === target) {
          bEl.classList.add(isCorrect ? "btn-success" : "btn-danger");
        } else {
          bEl.classList.add("btn-secondary");
        }
      });
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
    if (userGuesses["verpakking"] === (item.tableInfo["verpakking"] === true)) {
      primaryCorrect++;
    }

    tableProperties.slice(1).forEach((p) => {
      if (userGuesses[p.key] !== undefined) {
        if (userGuesses[p.key] === (item.tableInfo[p.key] === true)) {
          bonusCorrect++;
        } else {
          bonusIncorrect++;
        }
      }
    });

    currentQuestionIndex++;
    renderQuestion();
  });
}

function renderResults() {
  currentView = "results";
  const zinnen = getZinnen();
  const primaryPct = Math.round((primaryCorrect / quizQuestions.length) * 100);
  let feedbackText = zinnen["High Score Feedback"];
  if (primaryPct < 50) {
    feedbackText = zinnen["Low Score Feedback"];
  } else if (primaryPct < 80) {
    feedbackText = zinnen["Medium Score Feedback"];
  }

  app.innerHTML = `
    <header style="cursor: pointer;" id="header-home">
      <h1>${logoSvg}Verpakkingsquiz</h1>
      <p>${zinnen["Subtitle"]}</p>
    </header>
    <main>
      <div class="card" style="text-align: center;">
        <h2 style="font-size: 2rem; color: var(--primary-color); margin-bottom: 1rem;">Resultaten</h2>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; text-align: left; max-width: 480px; margin-left: auto; margin-right: auto; display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: flex; justify-content: space-between; font-size: 1.05rem;">
            <span>📦 Verpakkingen goed:</span>
            <strong>${primaryCorrect} / ${quizQuestions.length}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 1.05rem;">
            <span>✅ Bonusvragen goed:</span>
            <strong style="color: #166534;">${bonusCorrect}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 1.05rem;">
            <span>❌ Bonusvragen fout:</span>
            <strong style="color: #991b1b;">${bonusIncorrect}</strong>
          </div>
        </div>

        <p style="margin-bottom: 2rem; color: var(--text-muted);">${feedbackText}</p>
        
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button id="restart-btn" class="btn">Speel opnieuw</button>
          <button id="home-btn" class="btn btn-secondary">Terug naar start</button>
        </div>
      </div>
      ${renderModeToggle()}
    </main>
  `;

  document.querySelector("#header-home")?.addEventListener("click", () => {
    renderWelcomeReady();
    loadData();
  });
  document.querySelector("#restart-btn")?.addEventListener("click", startQuiz);
  document.querySelector("#home-btn")?.addEventListener("click", () => {
    renderWelcomeReady();
    loadData();
  });
  setupModeToggle();
}

renderWelcomeReady();
loadData();
