-- Tabela de Usuários Admin
CREATE TABLE IF NOT EXISTS usuarios (
    username TEXT PRIMARY KEY,
    password TEXT NOT NULL,
    nome TEXT NOT NULL
);

-- Tabela de Agentes
CREATE TABLE IF NOT EXISTS agentes (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    matricula TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'policial' ou 'detran'
    ativo INTEGER DEFAULT 1, -- 0 = Inativo, 1 = Ativo
    aprovado INTEGER DEFAULT 1 -- 0 = Pendente, 1 = Aprovado
);

-- Tabela de Infrações Cadastradas
CREATE TABLE IF NOT EXISTS infracoes (
    cod TEXT PRIMARY KEY,
    art TEXT NOT NULL,
    desc TEXT NOT NULL,
    ativa INTEGER DEFAULT 1 -- 0 = Desativada, 1 = Ativa
);

-- Tabela de Abordagens
CREATE TABLE IF NOT EXISTS abordagens (
    id TEXT PRIMARY KEY,
    policial_id TEXT,
    agente_id TEXT,
    cpf_condutor TEXT NOT NULL,
    nome_condutor TEXT NOT NULL,
    sexo TEXT NOT NULL,
    placa_veiculo TEXT NOT NULL,
    tipo_veiculo TEXT NOT NULL,
    etilometro_resultado TEXT NOT NULL, -- 'regular', 'infracao', 'crime', 'recusa_detido', 'recusa_liberado'
    tem_infracao INTEGER DEFAULT 0, -- 0 = Não, 1 = Sim
    destino TEXT NOT NULL, -- 'liberado', 'removido', 'entregue'
    crr TEXT NOT NULL, -- 'sim', 'nao'
    observacoes TEXT,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Junção Abordagem -> Infrações
CREATE TABLE IF NOT EXISTS abordagem_infracoes (
    abordagem_id TEXT NOT NULL,
    infracao_cod TEXT NOT NULL,
    PRIMARY KEY (abordagem_id, infracao_cod),
    FOREIGN KEY (abordagem_id) REFERENCES abordagens(id) ON DELETE CASCADE,
    FOREIGN KEY (infracao_cod) REFERENCES infracoes(cod)
);

-- Tabela de Cache/Cadastro de Condutores
CREATE TABLE IF NOT EXISTS condutores (
    cpf TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    sexo TEXT NOT NULL
);

-- Tabela de Cache/Cadastro de Veículos
CREATE TABLE IF NOT EXISTS veiculos (
    placa TEXT PRIMARY KEY,
    marca_modelo TEXT NOT NULL,
    cor TEXT NOT NULL,
    ano TEXT NOT NULL,
    situacao TEXT NOT NULL -- 'LEGAL' ou 'ROUBO/FURTO'
);

-- SEED DATA
-- Cadastrar o administrador inicial
INSERT OR REPLACE INTO usuarios (username, password, nome) VALUES ('francisco.xavier', 'abc123', 'Francisco Xavier Vieira');

-- Cadastrar agentes padrão
INSERT OR REPLACE INTO agentes (id, nome, matricula, tipo, ativo, aprovado) VALUES ('1', 'SD SANTOS', '111', 'policial', 1, 1);
INSERT OR REPLACE INTO agentes (id, nome, matricula, tipo, ativo, aprovado) VALUES ('2', 'SGT CARVALHO', '222', 'policial', 1, 1);
INSERT OR REPLACE INTO agentes (id, nome, matricula, tipo, ativo, aprovado) VALUES ('3', 'TEN ROCHA', '333', 'policial', 1, 1);
INSERT OR REPLACE INTO agentes (id, nome, matricula, tipo, ativo, aprovado) VALUES ('4', 'CB FERREIRA', '444', 'policial', 1, 1);
INSERT OR REPLACE INTO agentes (id, nome, matricula, tipo, ativo, aprovado) VALUES ('5', 'AG SILVA (DETRAN)', '555', 'detran', 1, 1);
INSERT OR REPLACE INTO agentes (id, nome, matricula, tipo, ativo, aprovado) VALUES ('6', 'AG OLIVEIRA (DETRAN)', '666', 'detran', 1, 1);

-- Cadastrar infrações padrão
INSERT OR REPLACE INTO infracoes (cod, art, desc, ativa) VALUES ('5010-0', '162 I', 'Dirigir sem CNH/PPD', 1);
INSERT OR REPLACE INTO infracoes (cod, art, desc, ativa) VALUES ('5045-0', '162 V', 'Dirigir com CNH vencida', 1);
INSERT OR REPLACE INTO infracoes (cod, art, desc, ativa) VALUES ('5169-1', '165', 'Dirigir sob influência de álcool', 1);
INSERT OR REPLACE INTO infracoes (cod, art, desc, ativa) VALUES ('7579-0', '165-A', 'Recusar-se ao teste do bafômetro', 1);
INSERT OR REPLACE INTO infracoes (cod, art, desc, ativa) VALUES ('5185-2', '167', 'Sem cinto de segurança (condutor/passageiro)', 1);
INSERT OR REPLACE INTO infracoes (cod, art, desc, ativa) VALUES ('6599-2', '230 V', 'Veículo não licenciado', 1);
INSERT OR REPLACE INTO infracoes (cod, art, desc, ativa) VALUES ('6726-1', '230 XVIII', 'Mau estado de conservação (pneus, etc)', 1);
INSERT OR REPLACE INTO infracoes (cod, art, desc, ativa) VALUES ('7048-1', '244 II', 'Moto: transportar passageiro sem capacete', 1);
INSERT OR REPLACE INTO infracoes (cod, art, desc, ativa) VALUES ('7633-2', '252 §ún.', 'Manusear telefone celular', 1);

-- Cadastrar condutores padrão para teste e consulta
INSERT OR REPLACE INTO condutores (cpf, nome, sexo) VALUES ('12345678909', 'MÁRIO SÉRGIO CORTELLA', 'M');
INSERT OR REPLACE INTO condutores (cpf, nome, sexo) VALUES ('98765432100', 'ANA MARIA BRAGA', 'F');

-- Cadastrar veículos padrão para teste e consulta
INSERT OR REPLACE INTO veiculos (placa, marca_modelo, cor, ano, situacao) VALUES ('ABC1D23', 'VW/GOL 1.0', 'BRANCA', '2020/2021', 'LEGAL');
INSERT OR REPLACE INTO veiculos (placa, marca_modelo, cor, ano, situacao) VALUES ('ROU1B23', 'FIAT/UNO 1.0', 'PRETA', '2015/2016', 'ROUBO/FURTO');
