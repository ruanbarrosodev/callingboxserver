const demoCallings = [
  {
    idCalling: 101,
    description: "Computador não liga após queda de energia.",
    time: "2026-05-25T09:14:00",
    sector: "Recepção",
    server: "maria.souza",
    type: "Hardware",
    status: "Em espera"
  },
  {
    idCalling: 100,
    description: "Instalação de sistema interno.",
    time: "2026-05-25T08:30:00",
    sector: "Financeiro",
    server: "joao.silva",
    type: "Software",
    status: "Em progresso"
  }
];

export async function handler(event) {
  if (event.httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(demoCallings)
    };
  }

  if (event.httpMethod === "PATCH") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: true })
    };
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Método não permitido" })
  };
}
