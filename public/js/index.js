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

  const openCallMessage = document.querySelector("#openCallMessage");
  const formWrapper = document.querySelector("#formWrapper");
  const chamadoAberto = result.calls.find(call =>
    call.status === "Em espera" ||
    call.status === "Em progresso"
  );
  if (chamadoAberto) {
    formWrapper.classList.add("hidden");
    openCallMessage.classList.remove("hidden");

    openCallMessage.innerHTML = `
      <h3>Você já possui um chamado aberto</h3>
      <p>Seu último chamado ainda está em atendimento. Aguarde a finalização antes de abrir outro.</p>
      <p><strong>Setor:</strong> ${chamadoAberto.sector}</p>
      <p><strong>Usuário:</strong> ${chamadoAberto.server}</p>
      <p><strong>Tipo:</strong> ${chamadoAberto.type}</p>
      <p><strong>Status:</strong> ${chamadoAberto.status}</p>
      <p><strong>Aberto em:</strong> ${new Date(chamadoAberto.time).toLocaleString("pt-BR")}</p>
    `;
  } else {
    formWrapper.classList.remove("hidden");
    openCallMessage.classList.add("hidden");
    openCallMessage.innerHTML = "";
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

  if (result.pendingRating) {

    document.querySelector("#ratingCallId").value =
      result.pendingRating._id;

    document.querySelector("#ratingCallInfo").textContent =
      `Referente ao chamado aberto em ${new Date(result.pendingRating.time).toLocaleString("pt-BR")}`;

    document.querySelector("#ratingModal")
      .classList.remove("hidden");
  }

}

document.querySelectorAll(".close-btn").forEach(button => {
  button.addEventListener("click", () => {

    const modal =
      button.closest(".modal");

    if (modal) {
      modal.classList.add("hidden");
    }

  });
});

if (callForm) {
  callForm.addEventListener("submit", criarChamado);
}

atualizarHorario();
setInterval(atualizarHorario, 1000);

listarMeusChamados();

const starLabels = document.querySelectorAll(".star-rating label");
const starInputs = document.querySelectorAll(".star-rating input");

function pintarEstrelas(qtd, classe) {
  starLabels.forEach((label, index) => {
    label.classList.toggle(classe, index < qtd);
  });
}

starLabels.forEach((label, index) => {
  label.addEventListener("mouseenter", () => {
    pintarEstrelas(index + 1, "hovered");
  });

  label.addEventListener("click", () => {
    pintarEstrelas(index + 1, "active");
    starInputs[index].checked = true;
  });
});

document.querySelector(".star-rating").addEventListener("mouseleave", () => {
  starLabels.forEach(label => label.classList.remove("hovered"));
});

async function enviarRating(event) {
  event.preventDefault();

  const notaSelecionada =
    document.querySelector("input[name='nota']:checked");

  if (!notaSelecionada) {
    alert("Escolha uma nota.");
    return;
  }

  const payload = {
    _id: document.querySelector("#ratingCallId").value,
    nota: Number(notaSelecionada.value),
    ratingDescription:
      document.querySelector("#ratingDescription").value.trim(),
    user_key: getUserKey()
  };

  const response = await fetch("/.netlify/functions/rating", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();

  if (!result.success) {
    alert(result.message || "Erro ao enviar avaliação.");
    return;
  }

  document.querySelector("#ratingModal").classList.add("hidden");

  await listarMeusChamados();
}

document
  .querySelector("#ratingForm")
  .addEventListener("submit", enviarRating);

const refreshBtn = document.querySelector("#refreshBtn");
if (refreshBtn) {
  refreshBtn.addEventListener("click", listarMeusChamados);
}