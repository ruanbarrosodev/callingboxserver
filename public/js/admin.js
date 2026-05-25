const ADMIN_PASSWORD = "freedom";
const AUTH_KEY = "helpdesk_admin_auth";

const loginScreen = document.getElementById("loginScreen");
const adminPanel = document.getElementById("adminPanel");
const loginForm = document.getElementById("loginForm");
const logoutForm = document.getElementById("logoutForm");
const loginError = document.getElementById("loginError");

const mockMetrics = {
  tma: "18 min",
  tmr: "2h 35m",
  satisfaction: "92%",
  total: "37",
  sla: "86%",
  olderThanTwoDays: "4"
};

function showPanel() {
  loginScreen.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  loadMetrics();
}

function showLogin() {
  adminPanel.classList.add("hidden");
  loginScreen.classList.remove("hidden");
}

function isLoggedIn() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const password = document.getElementById("password").value.trim();

  // Temporário: valida localmente.
  // Depois dá pra trocar por fetch("/.netlify/functions/admin-login").
  if (password.toLowerCase() === ADMIN_PASSWORD) {
    localStorage.setItem(AUTH_KEY, "true");
    loginError.classList.add("hidden");
    showPanel();
    return;
  }

  loginError.classList.remove("hidden");
});

logoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  localStorage.removeItem(AUTH_KEY);
  showLogin();
});

async function loadMetrics() {
  try {
    // Futuro:
    // const response = await fetch("/.netlify/functions/admin-metrics");
    // const metrics = await response.json();

    const metrics = mockMetrics;

    document.querySelectorAll("[data-metric]").forEach((element) => {
      const key = element.dataset.metric;
      element.textContent = metrics[key] ?? "--";
    });
  } catch (error) {
    console.error("Erro ao carregar métricas:", error);
  }
}

document.getElementById("downloadForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(event.currentTarget);
  const params = new URLSearchParams(data);

  // Futuro real:
  // window.location.href = `/.netlify/functions/generate-excel?${params.toString()}`;

  alert(`Download simulado. Filtros: ${params.toString() || "nenhum"}`);
});

document.querySelectorAll("input[name='filterTime'], #dateControl").forEach((control) => {
  control.addEventListener("change", loadMetrics);
});

if (isLoggedIn()) {
  showPanel();
} else {
  showLogin();
}
