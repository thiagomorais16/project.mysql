const express = require("express");
const router = express.Router();
const { HospitalData, Autoclave, Lavadora } = require("./models/model");
const { calcularRecomendacoes } = require("./calculadora");

router.post("/hospitals", async (req, res) => {
  try {
    const data = req.body;
    const newHospitalData = await HospitalData.create(data);

    const recommendations = calcularRecomendacoes(data);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/produtos", async (req, res) => {
  try {
    // Supondo que Autoclave e Lavadora são os modelos Sequelize para seus produtos
    const autoclaves = await Autoclave.findAll();
    const lavadoras = await Lavadora.findAll();

    // Aqui você pode transformar os dados se necessário
    const produtos = {
      autoclaves: autoclaves.map((a) => ({
        id: a.id,
        marca: a.marca,
        modelo: a.modelo,
        capacidadePicoLitros: a.capacidadePicoLitros,
        tempoCicloMinutos: a.tempoCicloMinutos,
      })),
      lavadoras: lavadoras.map((l) => ({
        id: l.id,
        marca: l.marca,
        modelo: l.modelo,
        volumeTotalLitros: l.volumeTotalLitros,
        tempoCicloInstrumentosMinutos: l.tempoCicloInstrumentosMinutos,
        tempoCicloVentilatoriaMinutos: l.tempoCicloVentilatoriaMinutos,
      })),
    };

    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para capturar dados de uma nova lavadora
router.post("/lavadoras", async (req, res) => {
  const {
    marca,
    modelo,
    volume_total_litros,
    tempo_ciclo_instrumentos_minutos,
    tempo_ciclo_ventilatoria_minutos,
  } = req.body;

  try {
    const lavadora = await Lavadora.create({
      marca,
      modelo,
      volume_total_litros,
      tempo_ciclo_instrumentos_minutos,
      tempo_ciclo_ventilatoria_minutos,
    });
    res.status(201).json(lavadora);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar lavadora." });
  }
});

router.post("/autoclaves", async (req, res) => {
  const { marca, modelo, capacidade_pico_litros, tempo_ciclo_minutos } =
    req.body;

  try {
    const autoclave = await Autoclave.create({
      marca,
      modelo,
      capacidade_pico_litros,
      tempo_ciclo_minutos,
    });
    res.status(201).json(autoclave);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar autoclave." });
  }
});

module.exports = router;
