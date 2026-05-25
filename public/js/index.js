const API_BASE = "/.netlify/functions";
const STORAGE_KEY = "helpdesk_user_key";

const currentTime = document.querySelector("#currentTime");
const timeInput = document.querySelector("#time");
const callForm = document.querySelector("#callForm");
const callsList = document.querySelector("#callsList");

function getUserKey() {
  let userKey = localStorage.getItem(STORAGE_KEY);

  if (!userKey) {
    userKey = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, userKey);
  }

  return userKey;
}

function atualizarHorario() {
  const agora = new Date();

  const texto = agora.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium"
  });

  if (currentTime) currentTime.textContent = texto;
  if (timeInput) timeInput.value = texto;
}

async function criarChamado(event) {
  event.preventDefault();

  const form = event.target;
  const userKey = getUserKey();

  const chamado = {
    sector: form.sector.value.trim(),
    server: form.server.value.trim(),
    type: form.type.value,
    description: form.description.value.trim(),
    user_key: userKey
  };

  const response = await fetch(`${API_BASE}/calls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(chamado)
  });

  const result = await response.json();

  if (!result.success) {
    alert(result.message || "Erro ao abrir chamado");
    return;
  }

  alert("Chamado criado com sucesso!");
  form.reset();
  atualizarHorario();

  await listarMeusChamados();
}

async function listarMeusChamados() {
  const userKey = getUserKey();

  const response = await fetch(
    `${API_BASE}/calls?user_key=${encodeURIComponent(userKey)}`
  );

  const result = await response.json();

  if (!result.success) {
    console.error(result.message);
    return;
  }
  callsList.innerHTML = "";

  result.calls.forEach(call => {

    const row = document.createElement("div");

    row.className = "table-row";

    let statusColor = "#808080";

    if (call.status === "Em progresso") {
      statusColor = "#007bff";
    }

    if (call.status === "Finalizado") {
      statusColor = "#28a745";
    }

    row.innerHTML = `
      <span>
        ${new Date(call.time).toLocaleString("pt-BR")}
      </span>

      <span>
        ${call.sector}
      </span>

      <span>
        ${call.server}
      </span>

      <span style="
        display:flex;
        align-items:center;
        gap:8px;
      ">
        ${call.status}

        <div style="
          width:14px;
          height:14px;
          border-radius:50%;
          background:${statusColor};
        "></div>
      </span>
    `;

    callsList.appendChild(row);
  });
  
}

if (callForm) {
  callForm.addEventListener("submit", criarChamado);
}

atualizarHorario();
setInterval(atualizarHorario, 1000);

listarMeusChamados();