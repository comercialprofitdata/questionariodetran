export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const includeInactive = url.searchParams.get("admin") === "true";

  try {
    let query = "SELECT * FROM agentes";
    if (!includeInactive) {
      query += " WHERE ativo = 1 AND aprovado = 1";
    }
    query += " ORDER BY nome ASC";

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
    const { nome, matricula, tipo, aprovado } = await request.json();

    if (!nome || !matricula || !tipo) {
      return new Response(JSON.stringify({ error: "Nome, matrícula e tipo são obrigatórios" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const id = "ag_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const isApproved = aprovado === 1 ? 1 : 0; // se enviado pelo admin, aprova direto

    await env.DB.prepare(
      "INSERT INTO agentes (id, nome, matricula, tipo, ativo, aprovado) VALUES (?, ?, ?, ?, 1, ?)"
    )
    .bind(id, nome.toUpperCase(), matricula, tipo, isApproved)
    .run();

    return new Response(JSON.stringify({ success: true, agent: { id, nome, matricula, tipo } }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;

  try {
    const { id, action } = await request.json();

    if (!id || !action) {
      return new Response(JSON.stringify({ error: "ID e ação são obrigatórios" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (action === "aprovar") {
      await env.DB.prepare("UPDATE agentes SET aprovado = 1 WHERE id = ?").bind(id).run();
    } else if (action === "rejeitar") {
      await env.DB.prepare("DELETE FROM agentes WHERE id = ?").bind(id).run();
    } else if (action === "toggle_ativo") {
      // Inverte o estado de ativo
      await env.DB.prepare("UPDATE agentes SET ativo = 1 - ativo WHERE id = ?").bind(id).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
