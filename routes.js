const express = require("express");
const router = express.Router();
const { HospitalData } = require("./models/model");
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

module.exports = router;
