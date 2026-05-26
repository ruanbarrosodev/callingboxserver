const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGO_URI);

function response(statusCode, body) {
  return {
    statusCode,
    body: JSON.stringify(body)
  };
}

function getCurrentWeekRange() {
  const today = new Date();
  const day = today.getDay() || 7;

  const start = new Date(today);
  start.setDate(today.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function buildRange(params) {
  if (!params.startDate && !params.endDate) {
    return getCurrentWeekRange();
  }

  let start = null;
  let end = null;

  if (params.startDate) {
    start = new Date(`${params.startDate}T00:00:00`);
  }

  if (params.endDate) {
    end = new Date(`${params.endDate}T23:59:59.999`);
  }

  return { start, end };
}

function formatMinutes(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0min";

  const rounded = Math.round(minutes);

  if (rounded < 60) return `${rounded}min`;

  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;

  return rest > 0 ? `${hours}h ${rest}min` : `${hours}h`;
}

function diffMinutes(start, end) {
  if (!start || !end) return null;

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  return (endDate - startDate) / 60000;
}

function average(values) {
  const valid = values.filter(value => Number.isFinite(value));

  if (!valid.length) return 0;

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return response(405, {
      success: false,
      message: "Método não permitido"
    });
  }

  try {
    await client.connect();

    const db = client.db("callingboxserver");
    const collection = db.collection("calling");
    const params = event.queryStringParameters || {};
    const range = buildRange(params);

    const filter = {};

    if (range.start || range.end) {
      filter.time = {};

      if (range.start) filter.time.$gte = range.start;
      if (range.end) filter.time.$lte = range.end;
    }

    const periodCalls = await collection.find(filter).toArray();

    const tmaMinutes = average(
      periodCalls
        .filter(call => call.doneTime)
        .map(call => diffMinutes(call.time, call.doneTime))
    );

    const tmrMinutes = average(
      periodCalls
        .filter(call => call.updateTime)
        .map(call => diffMinutes(call.time, call.updateTime))
    );

    const ratedCalls = periodCalls.filter(call => Number.isFinite(Number(call.nota)));
    const satisfaction = ratedCalls.length
      ? `${((average(ratedCalls.map(call => Number(call.nota))) / 5) * 100).toFixed(2)}%`
      : "0%";

    const finishedCalls = periodCalls.filter(call => call.doneTime);
    const finishedWithinSla = finishedCalls.filter(call => {
      const minutes = diffMinutes(call.time, call.doneTime);
      return Number.isFinite(minutes) && minutes <= 2880;
    });

    const sla = finishedCalls.length
      ? `${((finishedWithinSla.length / finishedCalls.length) * 100).toFixed(2)}%`
      : "0%";

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const olderThanTwoDays = await collection.countDocuments({
      doneTime: null,
      time: {
        $lt: twoDaysAgo
      }
    });

    return response(200, {
      success: true,
      recordsUsed: periodCalls.length,
      period: {
        startDate: range.start ? range.start.toISOString().slice(0, 10) : null,
        endDate: range.end ? range.end.toISOString().slice(0, 10) : null
      },
      metrics: {
        tma: formatMinutes(tmaMinutes),
        tmr: formatMinutes(tmrMinutes),
        satisfaction,
        total: periodCalls.length,
        sla,
        olderThanTwoDays
      }
    });
  } catch (error) {
    console.error(error);

    return response(500, {
      success: false,
      message: "Erro interno no servidor"
    });
  }
};
