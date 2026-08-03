export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { results } = await env.DB.prepare(
      `SELECT a.id, 
              a.data_hora,
              pol.nome as policial_responsavel, 
              det.nome as agente_detran,
              a.cpf_condutor, 
              a.nome_condutor, 
              a.sexo, 
              a.placa_veiculo, 
              a.tipo_veiculo, 
              a.etilometro_resultado, 
              a.tem_infracao, 
              a.destino, 
              a.crr, 
              a.observacoes,
              (SELECT GROUP_CONCAT(i.desc, '; ') 
               FROM abordagem_infracoes ai 
               JOIN infracoes i ON ai.infracao_cod = i.cod 
               WHERE ai.abordagem_id = a.id) as infracoes
       FROM abordagens a
       LEFT JOIN agentes pol ON a.policial_id = pol.id
       LEFT JOIN agentes det ON a.agente_id = det.id
       ORDER BY a.data_hora DESC`
    ).all();

    // Cabeçalho do CSV
    const headers = [
      "ID Abordagem",
      "Data/Hora",
      "Policial Responsável",
      "Agente DETRAN",
      "CPF Condutor",
      "Nome Condutor",
      "Sexo",
      "Placa",
      "Tipo Veículo",
      "Resultado Etilômetro",
      "Tem Infração",
      "Destino do Veículo",
      "CRR Lavrada",
      "Observações",
      "Infrações Registradas"
    ];

    let csvContent = "\ufeff"; // UTF-8 BOM para o Excel abrir acentos corretamente
    csvContent += headers.join(";") + "\n";

    for (const row of results) {
      const line = [
        row.id,
        row.data_hora,
        row.policial_responsavel || "Não cadastrado",
        row.agente_detran || "Não cadastrado",
        `"${row.cpf_condutor}"`,
        `"${row.nome_condutor.replace(/"/g, '""')}"`,
        row.sexo,
        row.placa_veiculo,
        row.tipo_veiculo,
        row.etilometro_resultado,
        row.tem_infracao === 1 ? "SIM" : "NÃO",
        row.destino,
        row.crr === "sim" ? "SIM" : "NÃO",
        `"${(row.observacoes || "").replace(/\[FOTO_CNH_BASE64:[^\]]+\]/g, "[FOTO CNH SALVA]").replace(/"/g, '""')}"`,
        `"${(row.infracoes || "").replace(/"/g, '""')}"`
      ];
      csvContent += line.join(";") + "\n";
    }

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=Respostas_Operacao.csv"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
