export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return new Response(JSON.stringify({ error: "Usuário e senha são obrigatórios" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Consulta no banco de dados D1
    const { results } = await env.DB.prepare(
      "SELECT username, nome FROM usuarios WHERE username = ? AND password = ?"
    )
    .bind(username, password)
    .all();

    if (results.length > 0) {
      return new Response(JSON.stringify({ success: true, user: results[0] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: "Usuário ou senha inválidos" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
