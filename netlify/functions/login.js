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
    const body = JSON.parse(event.body || "{}");

    if (body.password === process.env.APP_PASSWORD) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true
        })
      };
    }

    return {
      statusCode: 401,
      body: JSON.stringify({
        success: false,
        message: "Senha inválida"
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Erro interno"
      })
    };
  }
};