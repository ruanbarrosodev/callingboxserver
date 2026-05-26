const API_BASE = "/.netlify/functions";

const loginScreen = document.querySelector("#loginScreen");
const adminPanel = document.querySelector("#adminPanel");
const loginForm = document.querySelector("#loginForm");
const loginError = document.querySelector("#loginError");
const logoutButton = document.querySelector("#logoutButton");

const startDateInput = document.querySelector("#startDate");
const endDateInput = document.querySelector("#endDate");
const applyFilterButton = document.querySelector("#applyFilter");
const resetWeekButton = document.querySelector("#resetWeek");
const recordsUsed = document.querySelector("#recordsUsed");
const periodText = document.querySelector("#periodText");

const metricEls = {
  tma: document.querySelector("[data-metric='tma']"),
  tmr: document.querySelector("[data-metric='tmr']"),
  satisfaction: document.querySelector("[data-metric='satisfaction']"),
  total: document.querySelector("[data-metric='total']"),
  sla: document.querySelector("[data-metric='sla']"),
  olderThanTwoDays: document.querySelector("[data-metric='olderThanTwoDays']")
};

function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function setCurrentWeek() {
  const today = new Date();
  const day = today.getDay() || 7;

  const start = new Date(today);
  start.setDate(today.getDate() - day + 1);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  startDateInput.value = toInputDate(start);
  endDateInput.value = toInputDate(end);
}

function showApp() {
  loginScreen.classList.add("hidden");
  adminPanel.classList.remove("hidden");
}

function showLogin() {
  adminPanel.classList.add("hidden");
  loginScreen.classList.remove("hidden");
}

function formatDateBr(value) {
  if (!value) return "--";
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR");
}

function setLoading() {
  Object.values(metricEls).forEach(el => {
    if (el) el.textContent = "...";
  });

  recordsUsed.textContent = "...";
  periodText.textContent = "Carregando período...";
}

function setError() {
  Object.values(metricEls).forEach(el => {
    if (el) el.textContent = "Erro";
  });

  recordsUsed.textContent = "Erro";
  periodText.textContent = "Não foi possível carregar as métricas.";
}

async function fazerLogin(event) {
  event.preventDefault();

  const password = document.querySelector("#password").value;

  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ password })
  });

  const result = await response.json();

  if (!result.success) {
    loginError.classList.remove("hidden");
    return;
  }

  localStorage.setItem("admin_logged", "true");
  loginError.classList.add("hidden");

  showApp();
  carregarMetricas();
}

function logout() {
  localStorage.removeItem("admin_logged");
  loginForm.reset();
  showLogin();
}

async function carregarMetricas() {
  setLoading();

  const params = new URLSearchParams();

  if (startDateInput.value) {
    params.set("startDate", startDateInput.value);
  }

  if (endDateInput.value) {
    params.set("endDate", endDateInput.value);
  }

  try {
    const response = await fetch(`${API_BASE}/admin-metrics?${params.toString()}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Erro ao carregar métricas");
    }

    metricEls.tma.textContent = result.metrics.tma ?? "--";
    metricEls.tmr.textContent = result.metrics.tmr ?? "--";
    metricEls.satisfaction.textContent = result.metrics.satisfaction ?? "--";
    metricEls.total.textContent = result.metrics.total ?? "--";
    metricEls.sla.textContent = result.metrics.sla ?? "--";
    metricEls.olderThanTwoDays.textContent = result.metrics.olderThanTwoDays ?? "--";

    recordsUsed.textContent = result.recordsUsed ?? 0;
    periodText.textContent = `Período: ${formatDateBr(result.period.startDate)} até ${formatDateBr(result.period.endDate)}`;
  } catch (error) {
    console.error(error);
    setError();
  }
}

loginForm.addEventListener("submit", fazerLogin);
logoutButton.addEventListener("click", logout);
applyFilterButton.addEventListener("click", carregarMetricas);

resetWeekButton.addEventListener("click", () => {
  setCurrentWeek();
  carregarMetricas();
});

startDateInput.addEventListener("change", carregarMetricas);
endDateInput.addEventListener("change", carregarMetricas);

setCurrentWeek();

if (localStorage.getItem("admin_logged") === "true") {
  showApp();
  carregarMetricas();
} else {
  showLogin();
}
