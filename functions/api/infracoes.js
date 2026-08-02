export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const includeInactive = url.searchParams.get("admin") === "true";

  try {
    let query = "SELECT * FROM infracoes";
    if (!includeInactive) {
      query += " WHERE ativa = 1";
    }
    query += " ORDER BY art ASC";

    const { results } = await env.DB.prepare(query).all();
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const { cod, action } = await request.json();

    if (!cod || !action) {
      return new Response(JSON.stringify({ error: "Código e ação são obrigatórios" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (action === "toggle") {
      await env.DB.prepare("UPDATE infracoes SET ativa = 1 - ativa WHERE cod = ?").bind(cod).run();
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
