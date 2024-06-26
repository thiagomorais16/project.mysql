const { DataTypes } = require("sequelize");
const database = require("../db");

const HospitalData = database.define("HospitalData", {
  nome_hospital: { type: DataTypes.STRING, allowNull: false },
  cnpj_hospital: { type: DataTypes.STRING, allowNull: false },
  endereco_hospital: { type: DataTypes.STRING, allowNull: false },
  possui_cme: { type: DataTypes.STRING, allowNull: false },
  tipo_cme: { type: DataTypes.STRING },
  nome_contato: { type: DataTypes.STRING, allowNull: false },
  cargo_contato: { type: DataTypes.STRING, allowNull: false },
  email_contato: { type: DataTypes.STRING, allowNull: false },
  celular_contato: { type: DataTypes.STRING, allowNull: false },
  num_salas_cirurgicas: { type: DataTypes.INTEGER, allowNull: false },
  num_cirurgias_por_sala_por_dia: { type: DataTypes.INTEGER, allowNull: false },
  processamento_tecidos: { type: DataTypes.STRING, allowNull: false },
  dias_cirurgia: { type: DataTypes.INTEGER, allowNull: false },
  intervalo_pico: { type: DataTypes.STRING, allowNull: false },
  num_leitos_internacao: { type: DataTypes.INTEGER, allowNull: false },
  num_leitos_uti: { type: DataTypes.INTEGER, allowNull: false },
  num_leitos_dia: { type: DataTypes.INTEGER, allowNull: false },
  num_autoclaves: { type: DataTypes.INTEGER, allowNull: false },
  num_lavadoras: { type: DataTypes.INTEGER, allowNull: false },
});

const Lavadora = database.define("Lavadora", {
  marca: { type: DataTypes.STRING, allowNull: false },
  modelo: { type: DataTypes.STRING, allowNull: false },
  volume_total_litros: { type: DataTypes.FLOAT, allowNull: false },
  tempo_ciclo_instrumentos_minutos: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tempo_ciclo_ventilatoria_minutos: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

const Autoclave = database.define("Autoclave", {
  marca: { type: DataTypes.STRING, allowNull: false },
  modelo: { type: DataTypes.STRING, allowNull: false },
  capacidade_pico_litros: { type: DataTypes.FLOAT, allowNull: false },
  tempo_ciclo_minutos: { type: DataTypes.INTEGER, allowNull: false },
});

module.exports = { HospitalData, Lavadora, Autoclave };
