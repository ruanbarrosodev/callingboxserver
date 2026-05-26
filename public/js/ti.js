const API_BASE = "/.netlify/functions";
const AUTH_KEY = "ti_auth_token";
const PAGE_SIZE = 10;

const loginScreen = document.querySelector("#loginScreen");
const appScreen = document.querySelector("#appScreen");
const loginForm = document.querySelector("#loginForm");
const loginError = document.querySelector("#loginError");
const logoutButton = document.querySelector("#logoutButton");

const filterStatus = document.querySelector("#filterStatus");
const filterType = document.querySelector("#filterType");
const refreshButton = document.querySelector("#refreshButton");

const callingList = document.querySelector("#callingList");
const counter = document.querySelector("#counter");
const listMode = document.querySelector("#listMode");

const pagination = document.querySelector("#pagination");
const prevPage = document.querySelector("#prevPage");
const nextPage = document.querySelector("#nextPage");
const pageInfo = document.querySelector("#pageInfo");
const filterStartDate =
  document.querySelector("#filterStartDate");

const filterEndDate =
  document.querySelector("#filterEndDate");


let currentPage = 1;
let totalPages = 1;
let openedDescriptionId = null;

function getToken() {
  return localStorage.getItem(AUTH_KEY);
}

function setToken(token) {
  localStorage.setItem(AUTH_KEY, token);
}

function clearToken() {
  localStorage.removeItem(AUTH_KEY);
}

function isFiltered() {
  return (
    filterStatus.value !== "all" ||
    filterType.value !== "all" ||
    filterStartDate.value ||
    filterEndDate.value
  );
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusClass(status) {
  if (status === "Finalizado") return "done";
  if (status === "Em progresso") return "progress";
  return "waiting";
}

function nextStatus(status) {
  if (status === "Em espera") return "Em progresso";
  if (status === "Em progresso") return "Finalizado";
  return null;
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Erro na requisição");
  }

  return data;
}

async function fazerLogin(event) {
  event.preventDefault();

  const password = document.querySelector("#password").value;

  const response = await fetch("/.netlify/functions/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ password })
  });

  const result = await response.json();
  console.log(result);
  if (!result.success) {
    document.querySelector("#loginError").style.display = "block";
    return;
  }

  localStorage.setItem("ti_logged", "true");

  document.querySelector("#loginScreen").hidden = true;
  document.querySelector("#appScreen").hidden = false;

  carregarChamados();
}

function logout() {
  localStorage.removeItem("ti_logged");

  appScreen.hidden = true;
  loginScreen.hidden = false;
  loginForm.reset();
}

function montarQuery() {
  const params = new URLSearchParams();

  params.set("page", currentPage);
  params.set("limit", PAGE_SIZE);

  if (filterStatus.value !== "all") {
    params.set("status", filterStatus.value);
  }

  if (filterType.value !== "all") {
    params.set("type", filterType.value);
  }

  if (filterStartDate.value) {
  params.set("startDate", filterStartDate.value);
  }

  if (filterEndDate.value) {
    params.set("endDate", filterEndDate.value);
  }

  if (!isFiltered()) {
    params.set("latestOnly", "true");
  }

  return params.toString();
}

async function carregarChamados() {
  try {
    const data = await api(`/ti-calls?${montarQuery()}`);

    renderizarChamados(data.calls || []);

    counter.textContent =
      `${data.total || 0} registro${Number(data.total) === 1 ? "" : "s"}`;

    totalPages = data.totalPages || 1;

    if (isFiltered()) {
      pagination.classList.toggle("hidden", totalPages <= 1);
      listMode.textContent = "Filtro ativo: exibindo resultados paginados.";
    } else {
      pagination.classList.add("hidden");
      listMode.textContent = "Sem filtros: exibindo os 10 mais recentes.";
    }

    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    prevPage.disabled = currentPage <= 1;
    nextPage.disabled = currentPage >= totalPages;

  } catch (error) {
    callingList.innerHTML =
      `<div class="empty-state">${escapeHtml(error.message)}</div>`;
  }
}

function renderizarChamados(calls) {
  callingList.innerHTML = "";

  if (!calls.length) {
    callingList.innerHTML =
      `<div class="empty-state">Nenhum chamado encontrado.</div>`;
    return;
  }

  calls.forEach(call => {
    const id = call._id;
    const actionStatus = nextStatus(call.status);
    const cls = statusClass(call.status);
    const descOpen = openedDescriptionId === id;

    const wrapper = document.createElement("div");

    wrapper.innerHTML = `
      <div class="calling-row calling-item">
        <section data-label="Descrição">
          <button
            class="desc-toggle"
            type="button"
            data-id="${escapeHtml(id)}"
          >
            Descrição
          </button>
        </section>

        <section data-label="Horário">${formatDate(call.time)}</section>
        <section data-label="Setor">${escapeHtml(call.sector)}</section>
        <section data-label="Usuário">${escapeHtml(call.server)}</section>
        <section data-label="Tipo">${escapeHtml(call.type)}</section>

        <section data-label="Estado">
          <span class="status-pill ${cls}">
            <span class="status-dot"></span>
            ${escapeHtml(call.status)}
          </span>
        </section>

        <section data-label="Alterar">
          ${
            actionStatus
              ? `<button
                  class="action-button ${actionStatus === "Finalizado" ? "done" : ""}"
                  type="button"
                  data-id="${escapeHtml(id)}"
                  data-status="${escapeHtml(actionStatus)}"
                >
                  ${actionStatus}
                </button>`
              : `<button class="action-button" disabled>Finalizado</button>`
          }
        </section>
      </div>

      <div class="description-box ${descOpen ? "open" : ""}" data-description-id="${escapeHtml(id)}">
        <p>${escapeHtml(call.description || "Nenhuma descrição informada.")}</p>
        <p><strong>Criado:</strong> ${formatDate(call.time)}</p>
        <p><strong>Em progresso:</strong> ${formatDate(call.updateTime)}</p>
        <p><strong>Finalizado:</strong> ${formatDate(call.doneTime)}</p>
      </div>
    `;

    callingList.appendChild(wrapper);
  });
}

async function atualizarStatus(id, status) {
  try {
    await api("/ti-calls", {
      method: "PUT",
      body: JSON.stringify({
        _id: id,
        status
      })
    });

    await carregarChamados();

  } catch (error) {
    alert(error.message || "Erro ao atualizar chamado.");
  }
}

callingList.addEventListener("click", async (event) => {
  const descButton = event.target.closest(".desc-toggle");

  if (descButton) {
    const id = descButton.dataset.id;
    openedDescriptionId = openedDescriptionId === id ? null : id;
    renderizarChamados(lastRenderedCallsFromDom());
    return;
  }

  const actionButton = event.target.closest(".action-button");

  if (actionButton && !actionButton.disabled) {
    await atualizarStatus(
      actionButton.dataset.id,
      actionButton.dataset.status
    );
  }
});

function lastRenderedCallsFromDom() {
  return window.__lastCalls || [];
}

const originalRenderizarChamados = renderizarChamados;

renderizarChamados = function(calls) {
  window.__lastCalls = calls;
  originalRenderizarChamados(calls);
};

function resetAndLoad() {
  currentPage = 1;
  openedDescriptionId = null;
  carregarChamados();
}

filterStatus.addEventListener("change", resetAndLoad);
filterType.addEventListener("change", resetAndLoad);
filterStartDate.addEventListener("change", resetAndLoad);
filterEndDate.addEventListener("change", resetAndLoad);

refreshButton.addEventListener("click", carregarChamados);

prevPage.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    openedDescriptionId = null;
    carregarChamados();
  }
});

nextPage.addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage++;
    openedDescriptionId = null;
    carregarChamados();
  }
});

loginForm.addEventListener("submit", fazerLogin);
logoutButton.addEventListener("click", logout);

if (localStorage.getItem("ti_logged") === "true") {
  loginScreen.hidden = true;
  appScreen.hidden = false;
  carregarChamados();
}
