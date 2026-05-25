const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.MONGO_URI);

exports.handler = async (event) => {
  try {
    await client.connect();

    const db = client.db("callingboxserver");
    const collection = db.collection("calling");

    // GET - listar últimos 5 chamados do user_key
    if (event.httpMethod === "GET") {
      const userKey = event.queryStringParameters?.user_key;

      if (!userKey) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            message: "user_key obrigatório"
          })
        };
      }

      const calls = await collection
        .find({ user_key: userKey })
        .sort({ time: -1 })
        .limit(5)
        .toArray();

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          calls
        })
      };
    }

    // POST - criar chamado
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body);

      if (!body.sector || !body.server || !body.type || !body.user_key) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            message: "Campos obrigatórios ausentes"
          })
        };
      }

      const novoChamado = {
        time: new Date(),
        updateTime: null,
        doneTime: null,

        sector: body.sector,
        server: body.server,
        type: body.type,
        status: "Em espera",
        description: body.description || "",

        user_key: body.user_key,
        nota: null
      };

      const result = await collection.insertOne(novoChamado);

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          call: {
            _id: result.insertedId,
            ...novoChamado
          }
        })
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({
        success: false,
        message: "Método não permitido"
      })
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Erro interno no servidor"
      })
    };
  }
};