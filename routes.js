const express = require("express");
const router = express.Router();
const { HospitalData, Autoclave, Lavadora } = require("./models/model");
const { calcularRecomendacoes } = require("./calculadora");

router.post("/", async (req, res) => {
  try {
    const data = req.body;
    const newHospitalData = await HospitalData.create(data);

    const recommendations = calcularRecomendacoes(data);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.post("/autoclaves", async (req, res) => {
  const { marca, modelo } = req.body;

  try {
    const autoclave = await Autoclave.create({
      marca,
      modelo,
      capacidade_pico_litros,
      tempo_ciclo_minutos,

      // Adicione mais campos conforme necessário
    });
    res.status(201).json(autoclave);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar autoclave." });
  }
});

// Rota para capturar dados de uma nova lavadora
router.post("/lavadoras", async (req, res) => {
  const { marca, modelo } = req.body;

  try {
    const lavadora = await Lavadora.create({
      marca,
      modelo,
      volume_total_litros,
      tempo_ciclo_instrumentos_minutos,
      tempo_ciclo_ventilatoria_minutos,
      // Adicione mais campos conforme necessário
    });
    res.status(201).json(lavadora);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar lavadora." });
  }
});
module.exports = router;
