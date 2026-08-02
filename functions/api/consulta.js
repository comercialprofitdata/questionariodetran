export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const cpf = url.searchParams.get("cpf");
  const placa = url.searchParams.get("placa");

  try {
    // 1. CONSULTA DE CPF
    if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, "");
      if (cleanCpf.length !== 11) {
        return new Response(JSON.stringify({ error: "CPF inválido" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Procura no banco de dados local
      const { results } = await env.DB.prepare(
        "SELECT * FROM condutores WHERE cpf = ?"
      )
      .bind(cleanCpf)
      .all();

      if (results.length > 0) {
        return new Response(JSON.stringify({ found: true, source: "database", data: results[0] }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      // Se não achar, simula e gera um novo condutor de forma realista para teste e salva no cache local
      const nomes = [
        "FRANCISCO ALVES DE SOUZA", "MARIA HELENA DA SILVA", "JOÃO BATISTA DE OLIVEIRA", 
        "JOSÉ GOMES DOS SANTOS", "ANTONIO CARLOS DE MELO", "SEBASTIÃO PEREIRA LIMA",
        "RAIMUNDO NONATO COSTA", "ANA LUCIA RODRIGUES", "MARCOS AURELIO ALMEIDA",
        "TEREZINHA DE JESUS CARVALHO", "CARLOS ALBERTO BARBOSA", "LUIZ GONZAGA PINTO"
      ];
      const nomeGerado = nomes[Math.floor(Math.random() * nomes.length)];
      const sexoGerado = Math.random() > 0.5 ? "M" : "F";

      await env.DB.prepare(
        "INSERT INTO condutores (cpf, nome, sexo) VALUES (?, ?, ?)"
      )
      .bind(cleanCpf, nomeGerado, sexoGerado)
      .run();

      return new Response(JSON.stringify({
        found: true,
        source: "simulated_api",
        data: { cpf: cleanCpf, nome: nomeGerado, sexo: sexoGerado }
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // 2. CONSULTA DE PLACA
    if (placa) {
      const cleanPlaca = placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (cleanPlaca.length !== 7) {
        return new Response(JSON.stringify({ error: "Placa inválida" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Procura no banco de dados local
      const { results } = await env.DB.prepare(
        "SELECT * FROM veiculos WHERE placa = ?"
      )
      .bind(cleanPlaca)
      .all();

      if (results.length > 0) {
        return new Response(JSON.stringify({ found: true, source: "database", data: results[0] }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      // Se não achar, simula e gera um novo veículo de forma realista
      const marcasModelos = [
        "VW/GOL 1.0", "FIAT/UNO 1.0", "CHEVROLET/ONIX 1.0LT", "HYUNDAI/HB20 1.0",
        "TOYOTA/COROLLA XEI", "HONDA/CIVIC EXR", "FORD/KA SE 1.0", "JEEP/COMPASS LONGITUDE",
        "HONDA/CG 160 START", "YAMAHA/FAZER 250"
      ];
      const cores = ["BRANCA", "PRETA", "PRATA", "CINZA", "VERMELHA", "AZUL"];
      const anos = ["2018/2019", "2019/2020", "2020/2021", "2021/2022", "2022/2023", "2023/2024"];
      
      const marcaModeloGerado = marcasModelos[Math.floor(Math.random() * marcasModelos.length)];
      const corGerada = cores[Math.floor(Math.random() * cores.length)];
      const anoGerado = anos[Math.floor(Math.random() * anos.length)];
      
      // Simula uma situação de ROUBO/FURTO com 10% de probabilidade ou se tiver a letra 'R' no final
      const situacaoGerada = (Math.random() < 0.1 || cleanPlaca.endsWith("R")) ? "ROUBO/FURTO" : "LEGAL";

      await env.DB.prepare(
        "INSERT INTO veiculos (placa, marca_modelo, cor, ano, situacao) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(cleanPlaca, marcaModeloGerado, corGerada, anoGerado, situacaoGerada)
      .run();

      return new Response(JSON.stringify({
        found: true,
        source: "simulated_api",
        data: { placa: cleanPlaca, marca_modelo: marcaModeloGerado, cor: corGerada, ano: anoGerado, situacao: situacaoGerada }
      }), {
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
