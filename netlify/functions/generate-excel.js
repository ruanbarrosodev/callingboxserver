export async function handler(event) {
  return {
    statusCode: 501,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Aqui depois entra a geração real do Excel com MongoDB." })
  };
}
