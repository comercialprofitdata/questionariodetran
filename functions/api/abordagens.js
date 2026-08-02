export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Listar todas as abordagens ordenadas por data/hora decrescente
    const { results } = await env.DB.prepare(
      `SELECT a.*, 
              pol.nome as policial_nome, 
              det.nome as agente_nome,
              (SELECT GROUP_CONCAT(i.desc, ', ') 
               FROM abordagem_infracoes ai 
               JOIN infracoes i ON ai.infracao_cod = i.cod 
               WHERE ai.abordagem_id = a.id) as infracoes_detalhes
       FROM abordagens a
       LEFT JOIN agentes pol ON a.policial_id = pol.id
       LEFT JOIN agentes det ON a.agente_id = det.id
       ORDER BY a.data_hora DESC`
    ).all();

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
    const data = await request.json();

    const {
      policial_id,
      agente_id,
      cpf_condutor,
      nome_condutor,
      sexo,
      placa_veiculo,
      tipo_veiculo,
      veiculo_marca_modelo,
      veiculo_cor,
      veiculo_ano,
      veiculo_situacao,
      etilometro_resultado,
      tem_infracao,
      infracoes, // array de códigos de infração
      destino,
      crr,
      observacoes
    } = data;

    if (!cpf_condutor || !nome_condutor || !placa_veiculo || !etilometro_resultado || !destino || !crr) {
      return new Response(JSON.stringify({ error: "Faltam campos obrigatórios" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const abordagemId = "ab_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const cleanCpf = cpf_condutor.replace(/\D/g, "");
    const cleanPlaca = placa_veiculo.toUpperCase().replace(/[^A-Z0-9]/g, "");

    const queries = [];

    // 1. Inserir na tabela de abordagens
    queries.push(
      env.DB.prepare(
        `INSERT INTO abordagens (
          id, policial_id, agente_id, cpf_condutor, nome_condutor, sexo, 
          placa_veiculo, tipo_veiculo, etilometro_resultado, tem_infracao, 
          destino, crr, observacoes, data_hora
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`
      ).bind(
        abordagemId,
        policial_id || null,
        agente_id || null,
        cleanCpf,
        nome_condutor.toUpperCase(),
        sexo,
        cleanPlaca,
        tipo_veiculo,
        etilometro_resultado,
        tem_infracao === "sim" ? 1 : 0,
        destino,
        crr,
        observacoes || null
      )
    );

    // 2. Inserir infrações associadas se houver
    if (tem_infracao === "sim" && Array.isArray(infracoes)) {
      for (const cod of infracoes) {
        queries.push(
          env.DB.prepare(
            "INSERT INTO abordagem_infracoes (abordagem_id, infracao_cod) VALUES (?, ?)"
          ).bind(abordagemId, cod)
        );
      }
    }

    // 3. Registrar/Atualizar condutor no cache
    queries.push(
      env.DB.prepare(
        "INSERT OR REPLACE INTO condutores (cpf, nome, sexo) VALUES (?, ?, ?)"
      ).bind(cleanCpf, nome_condutor.toUpperCase(), sexo)
    );

    // 4. Registrar/Atualizar veículo no cache
    if (veiculo_marca_modelo && veiculo_cor && veiculo_ano && veiculo_situacao) {
      queries.push(
        env.DB.prepare(
          "INSERT OR REPLACE INTO veiculos (placa, marca_modelo, cor, ano, situacao) VALUES (?, ?, ?, ?, ?)"
        ).bind(
          cleanPlaca,
          veiculo_marca_modelo.toUpperCase(),
          veiculo_cor.toUpperCase(),
          veiculo_ano,
          veiculo_situacao.toUpperCase()
        )
      );
    }

    // Ejecuta em batch (transacionalmente)
    await env.DB.batch(queries);

    return new Response(JSON.stringify({ success: true, abordagemId }), {
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
