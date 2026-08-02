export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const cpf = url.searchParams.get("cpf");
  const placa = url.searchParams.get("placa");

  try {
    // 1. CONSULTA DE CPF (INTERNET API + CACHE D1)
    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, "");
      if (cleanCpf.length !== 11) {
        return new Response(JSON.stringify({ error: "CPF inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Primeiro verifica no cache do banco de dados local
      const { results } = await env.DB.prepare(
        "SELECT * FROM condutores WHERE cpf = ?"
      )
      .bind(cleanCpf)
      .all();

      if (results.length > 0) {
        return new Response(JSON.stringify({ found: true, source: "database_cache", data: results[0] }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      // Se não estiver no cache, realiza chamada para a API real do CPFHub.io na internet
      const cpfsKey = env.CPFHUB_API_KEY;
      if (cpfsKey) {
        try {
          const apiRes = await fetch(`https://api.cpfhub.io/cpf/${cleanCpf}`, {
            method: "GET",
            headers: {
              "x-api-key": cpfsKey,
              "Accept": "application/json"
            }
          });
          
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (apiData.success && apiData.data) {
              const item = apiData.data;
              const nome = item.name.toUpperCase();
              const sexo = item.gender || "M";

              // Salva no banco de dados local (cache) para futuras consultas
              await env.DB.prepare(
                "INSERT OR REPLACE INTO condutores (cpf, nome, sexo) VALUES (?, ?, ?)"
              )
              .bind(cleanCpf, nome, sexo)
              .run();

              return new Response(JSON.stringify({
                found: true,
                source: "cpfhub_api",
                data: { cpf: cleanCpf, nome, sexo }
              }), {
                headers: { "Content-Type": "application/json" }
              });
            }
          }
        } catch (apiErr) {
          console.error("Erro ao conectar à API CPFHub.io na internet:", apiErr.message);
        }
      }

      // Retorna não localizado se a chave não estiver configurada ou a busca falhar
      return new Response(JSON.stringify({ found: false }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. CONSULTA DE PLACA (INTERNET API + CACHE D1)
    if (placa) {
      const cleanPlaca = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (cleanPlaca.length !== 7) {
        return new Response(JSON.stringify({ error: "Placa inválida" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Primeiro verifica no cache do banco de dados local
      const { results } = await env.DB.prepare(
        "SELECT * FROM veiculos WHERE placa = ?"
      )
      .bind(cleanPlaca)
      .all();

      if (results.length > 0) {
        return new Response(JSON.stringify({ found: true, source: "database_cache", data: results[0] }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      // Se não estiver no cache, realiza chamada para a API real da APIBrasil na internet
      const placaToken = env.APIBRASIL_BEARER_TOKEN;
      if (placaToken) {
        try {
          const apiRes = await fetch("https://dados.apibrasil.com.br/v2/placa", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${placaToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ placa: cleanPlaca })
          });

          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (apiData.success && apiData.response) {
              const resObj = apiData.response;
              const marcaModelo = (resObj.marcaModelo || resObj.marca || "VEÍCULO").toUpperCase();
              const cor = (resObj.cor || "N/A").toUpperCase();
              const ano = resObj.ano || resObj.anoModelo || "N/A";
              const situacao = (resObj.situacao || "").toUpperCase().includes("ROUBO") ? "ROUBO/FURTO" : "LEGAL";

              // Salva no banco de dados local (cache) para futuras consultas
              await env.DB.prepare(
                "INSERT OR REPLACE INTO veiculos (placa, marca_modelo, cor, ano, situacao) VALUES (?, ?, ?, ?, ?)"
              )
              .bind(cleanPlaca, marcaModelo, cor, ano, situacao)
              .run();

              return new Response(JSON.stringify({
                found: true,
                source: "apibrasil_api",
                data: { placa: cleanPlaca, marca_modelo: marcaModelo, cor, ano, situacao }
              }), {
                headers: { "Content-Type": "application/json" }
              });
            }
          }
        } catch (apiErr) {
          console.error("Erro ao conectar à APIBrasil na internet:", apiErr.message);
        }
      }

      // Retorna não localizado se a chave não estiver configurada ou a busca falhar
      return new Response(JSON.stringify({ found: false }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Faltando parâmetros 'cpf' ou 'placa'" }), {
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
