// Placeholder para a próxima etapa.
// Aqui depois entra MongoDB: salvar nota de satisfação.

export async function handler(event) {
  return {
    statusCode: 501,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      error: "Function /rating ainda não configurada. O frontend está usando localStorage como fallback."
    }),
  };
}
