const { MongoClient, ObjectId } = require("mongodb");

const client = new MongoClient(process.env.MONGO_URI);

function response(statusCode, body) {
  return {
    statusCode,
    body: JSON.stringify(body)
  };
}

function getDateRange(startDate, endDate) {
  if (!startDate && !endDate) return null;

  const range = {};

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00`);
    range.$gte = start;
  }

  if (endDate) {
    const end = new Date(`${endDate}T23:59:59.999`);
    range.$lte = end;
  }

  return range;
}

exports.handler = async (event) => {
  try {
    await client.connect();

    const db = client.db("callingboxserver");
    const collection = db.collection("calling");

    if (event.httpMethod === "GET") {
      const params = event.queryStringParameters || {};

      const page = Math.max(Number(params.page) || 1, 1);
      const limit = Math.min(Math.max(Number(params.limit) || 10, 1), 50);

      const filter = {};

      if (params.status) {
        filter.status = params.status;
      }

      if (params.type) {
        filter.type = params.type;
      }

      const range = getDateRange(params.startDate, params.endDate);

      if (range) {
        filter.time = range;
      }

      
      const latestOnly = params.latestOnly === "true";
      const total = await collection.countDocuments(filter);

      const query = collection
        .find(filter)
        .sort({ time: -1 });

      if (latestOnly) {
        query.limit(10);
      } else {
        query
          .skip((page - 1) * limit)
          .limit(limit);
      }

      const calls = await query.toArray();

      return response(200, {
        success: true,
        calls,
        total: latestOnly ? calls.length : total,
        page,
        totalPages: latestOnly ? 1 : Math.max(Math.ceil(total / limit), 1)
      });
    }

    if (event.httpMethod === "PUT") {
      const body = JSON.parse(event.body || "{}");

      if (!body._id || !body.status) {
        return response(400, {
          success: false,
          message: "ID e status são obrigatórios"
        });
      }

      if (!["Em progresso", "Finalizado"].includes(body.status)) {
        return response(400, {
          success: false,
          message: "Status inválido"
        });
      }

      const current = await collection.findOne({
        _id: new ObjectId(body._id)
      });

      if (!current) {
        return response(404, {
          success: false,
          message: "Chamado não encontrado"
        });
      }

      if (current.status === "Finalizado") {
        return response(400, {
          success: false,
          message: "Chamado já está finalizado"
        });
      }

      if (current.status === "Em espera" && body.status !== "Em progresso") {
        return response(400, {
          success: false,
          message: "Primeiro mova o chamado para Em progresso"
        });
      }

      if (current.status === "Em progresso" && body.status !== "Finalizado") {
        return response(400, {
          success: false,
          message: "Chamado em progresso só pode ser finalizado"
        });
      }

      const now = new Date();

      const update = {
        status: body.status
      };

      if (body.status === "Em progresso") {
        update.updateTime = now;
      }

      if (body.status === "Finalizado") {
        update.doneTime = now;
      }

      await collection.updateOne(
        {
          _id: new ObjectId(body._id)
        },
        {
          $set: update
        }
      );

      return response(200, {
        success: true
      });
    }

    return response(405, {
      success: false,
      message: "Método não permitido"
    });

  } catch (error) {
    console.error(error);

    return response(500, {
      success: false,
      message: "Erro interno no servidor"
    });
  }
};
