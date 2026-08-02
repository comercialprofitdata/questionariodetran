export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 1. Total de Abordagens
    const totalResult = await env.DB.prepare("SELECT COUNT(*) as count FROM abordagens").first("count");

    // 2. Total de Crimes (etilometro_resultado = 'crime')
    const crimesResult = await env.DB.prepare("SELECT COUNT(*) as count FROM abordagens WHERE etilometro_resultado = 'crime'").first("count");

    // 3. Total de Recusas
    const recusasResult = await env.DB.prepare("SELECT COUNT(*) as count FROM abordagens WHERE etilometro_resultado IN ('recusa_detido', 'recusa_liberado')").first("count");

    // 4. Total de Outras Infrações (abordagens que tiveram alguma infração constatada)
    const outrasInfracoesResult = await env.DB.prepare("SELECT COUNT(*) as count FROM abordagens WHERE tem_infracao = 1").first("count");

    // 5. Dados para o gráfico de Etilômetro (Regular, Infração, Crime, Recusa)
    const etilometroStats = await env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN etilometro_resultado = 'regular' THEN 1 ELSE 0 END) as regular,
        SUM(CASE WHEN etilometro_resultado = 'infracao' THEN 1 ELSE 0 END) as infracao,
        SUM(CASE WHEN etilometro_resultado = 'crime' THEN 1 ELSE 0 END) as crime,
        SUM(CASE WHEN etilometro_resultado IN ('recusa_detido', 'recusa_liberado') THEN 1 ELSE 0 END) as recusa
      FROM abordagens
    `).first();

    // 6. Dados para o gráfico de Veículos (Auto, Moto, Outro)
    const veiculosStats = await env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN tipo_veiculo = 'auto' THEN 1 ELSE 0 END) as auto,
        SUM(CASE WHEN tipo_veiculo = 'moto' THEN 1 ELSE 0 END) as moto,
        SUM(CASE WHEN tipo_veiculo = 'outro' THEN 1 ELSE 0 END) as outro
      FROM abordagens
    `).first();

    // 7. Volume de Abordagens por Hora (agrupado pelas últimas 6 horas com registros)
    // Se não houver registros, usamos horários fictícios padrão ou agrupamento simples por hora
    const { results: evolucaoStats } = await env.DB.prepare(`
      SELECT 
        strftime('%H', data_hora) as hora, 
        COUNT(*) as count 
      FROM abordagens 
      GROUP BY strftime('%H', data_hora)
      ORDER BY hora ASC
      LIMIT 10
    `).all();

    return new Response(JSON.stringify({
      kpis: {
        total: totalResult || 0,
        crimes: crimesResult || 0,
        recusas: recusasResult || 0,
        outras: outrasInfracoesResult || 0
      },
      graficos: {
        etilometro: [
          etilometroStats?.regular || 0,
          etilometroStats?.infracao || 0,
          etilometroStats?.crime || 0,
          etilometroStats?.recusa || 0
        ],
        veiculos: [
          veiculosStats?.auto || 0,
          veiculosStats?.moto || 0,
          veiculosStats?.outro || 0
        ],
        evolucao: {
          labels: evolucaoStats.length > 0 ? evolucaoStats.map(r => r.hora + "h") : ["20h", "21h", "22h", "23h", "00h", "01h"],
          data: evolucaoStats.length > 0 ? evolucaoStats.map(r => r.count) : [0, 0, 0, 0, 0, 0]
        }
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
