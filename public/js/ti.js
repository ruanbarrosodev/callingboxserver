const API_BASE = "/.netlify/functions";
const TEMP_PASSWORD = "freedom";

const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const logoutButton = document.getElementById("logoutButton");

const filterStatus = document.getElementById("filterStatus");
const filterType = document.getElementById("filterType");
const callingList = document.getElementById("callingList");
const counter = document.getElementById("counter");

const fallbackCallings = [
  {
    idCalling: 101,
    description: "Computador não liga após queda de energia.",
    time: "2026-05-25T09:14:00",
    sector: "Recepção",
    server: "maria.souza",
    type: "Hardware",
    status: "Em espera",
  },
  {
    idCalling: 100,
    description: "Instalação de sistema interno.",
    time: "2026-05-25T08:30:00",
    sector: "Financeiro",
    server: "joao.silva",
    type: "Software",
    status: "Em progresso",
  },
  {
    idCalling: 99,
    description: "Liberação de acesso ao sistema.",
    time: "2026-05-24T16:02:00",
    sector: "RH",
    server: "ana.lima",
    type: "Acesso",
    status: "Finalizado",
  },
];

let callings = [];

function isLogged() {
  return localStorage.getItem(SESSION_KEY) === "1";
}

function showApp() {
  loginScreen.hidden = true;
  appScreen.hidden = false;
  loadCallings();
}

function showLogin() {
  loginScreen.hidden = false;
  appScreen.hidden = true;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "-";

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function statusClass(status) {
  if (status === "Em progresso") return "status-progress";
  if (status === "Finalizado") return "status-done";
  return "status-waiting";
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}

async function fetchCallings() {
  try {
    const response = await fetch(`${API_BASE}/ti-calls`);

    if (!response.ok) {
      throw new Error("Function ainda não configurada.");
    }

    return await response.json();
  } catch {
    return fallbackCallings;
  }
}

async function updateStatus(idCalling, status) {
  try {
    const response = await fetch(`${API_BASE}/ti-calls`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idCalling, status }),
    });

    if (!response.ok) {
      throw new Error("Function ainda não configurada.");
    }
  } catch {
    callings = callings.map((calling) => {
      if (String(calling.idCalling) !== String(idCalling)) return calling;
      return { ...calling, status };
    });
  }

  renderCallings();
}

function getVisibleCallings() {
  const status = filterStatus.value;
  const type = filterType.value;

  return callings.filter((calling) => {
    const matchStatus = status === "all" || calling.status === status;
    const matchType = type === "all" || calling.type === type;
    return matchStatus && matchType;
  });
}

function renderStatusForm(calling) {
  if (calling.status === "Finalizado") {
    return `<span class="status-pill">Sem ação</span>`;
  }

  const options = [];

  if (calling.status !== "Em progresso") {
    options.push(`<option value="Em progresso">Em progresso</option>`);
  }

  options.push(`<option value="Finalizado">Finalizado</option>`);

  return `
    <form class="status-form" data-id="${escapeHTML(calling.idCalling)}">
      <select name="status">${options.join("")}</select>
      <button type="submit">Salvar</button>
    </form>
  `;
}

function renderCallings() {
  const visible = getVisibleCallings();

  counter.textContent = `${visible.length} registro${visible.length === 1 ? "" : "s"}`;

  if (!visible.length) {
    callingList.innerHTML = `<div class="empty">Nenhum chamado encontrado com esses filtros.</div>`;
    return;
  }

  callingList.innerHTML = visible
    .map((calling) => `
      <div class="calling-row calling-card">
        <section>${escapeHTML(calling.description)}</section>
        <section>${formatDate(calling.time)}</section>
        <section>${escapeHTML(calling.sector)}</section>
        <section>${escapeHTML(calling.server)}</section>
        <section>${escapeHTML(calling.type)}</section>
        <section>
          <span class="status-pill">
            ${escapeHTML(calling.status)}
            <span class="colorBlock ${statusClass(calling.status)}"></span>
          </span>
        </section>
        <section>${renderStatusForm(calling)}</section>
      </div>
    `)
    .join("");
}

async function loadCallings() {
  callings = await fetchCallings();
  renderCallings();
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const password = new FormData(loginForm).get("password");

  if (String(password).toLowerCase() !== TEMP_PASSWORD) {
    loginError.classList.add("show");
    return;
  }

  localStorage.setItem(SESSION_KEY, "1");
  loginError.classList.remove("show");
  loginForm.reset();
  showApp();
});

logoutButton.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  showLogin();
});

filterStatus.addEventListener("change", renderCallings);
filterType.addEventListener("change", renderCallings);

callingList.addEventListener("submit", async (event) => {
  const form = event.target.closest(".status-form");
  if (!form) return;

  event.preventDefault();

  const idCalling = form.dataset.id;
  const status = new FormData(form).get("status");

  await updateStatus(idCalling, status);
});

if (isLogged()) {
  showApp();
} else {
  showLogin();
}
