const { MongoClient, ObjectId } = require("mongodb");

const client = new MongoClient(process.env.MONGO_URI);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        success: false,
        message: "Método não permitido"
      })
    };
  }

  try {
    const body = JSON.parse(event.body);

    const nota = Number(body.nota);

    if (!body._id || !nota || nota < 1 || nota > 5) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Dados inválidos"
        })
      };
    }

    await client.connect();

    const db = client.db("callingboxserver");
    const collection = db.collection("calling");

    await collection.updateOne(
      {
        _id: new ObjectId(body._id),
        user_key: body.user_key,
        status: "Finalizado"
      },
      {
        $set: {
          nota,
          ratingDescription: body.ratingDescription || ""
        }
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true
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