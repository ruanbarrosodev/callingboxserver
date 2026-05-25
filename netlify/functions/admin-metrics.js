export async function handler(event) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tma: "18 min",
      tmr: "2h 35m",
      satisfaction: "92%",
      total: 37,
      sla: "86%",
      olderThanTwoDays: 4
    })
  };
}
