const { HospitalData, Lavadora, Autoclave } = require("./models/model");
const express = require("express");
const Sequelize = require("sequelize");

const app = express();
const port = 3000;

app.use(express.json());

// Conexão com o banco de dados
const sequelize = new Sequelize("eq_calculator", "root", "Th1@g0123", {
  host: "localhost",
  dialect: "mysql",
  port: 3306,
});

// Função principal
async function calRecomendacoes(frontendData) {
  try {
    await sequelize.authenticate();
    console.log("Conexão com o banco de dados estabelecida com sucesso.");

    // Dados do frontend
    const {
      numeroSalasCirurgicas,
      numeroCirurgiaSalaDia,
      tipoProcessamento,
      diasSemanaCirurgia,
      intervaloPicoCME,
      numeroLeitoUTI,
      numeroLeitoInternacao,
      numeroLeitoRPA,
      numeroLeitoOObs,
    } = frontendData;

    // Obtenha os dados de lavadoras e autoclaves do banco de dados
    const lavadoras = await Lavadora.findAll();
    const autoclaves = await Autoclave.findAll();

    // Defina os dados de entrada para os cálculos
    const data = {
      numSalasCirurgicas: numeroSalasCirurgicas,
      numCirurgiasPorSalaPorDia: numeroCirurgiaSalaDia,
      tipoProcessamento: tipoProcessamento,
      diasSemanaCirurgia: diasSemanaCirurgia,
      intervaloPicoCME: intervaloPicoCME,
      numLeitosUTI: numeroLeitoUTI,
      numLeitosInternacao: numeroLeitoInternacao,
      numLeitoRPA: numeroLeitoRPA,
      numLeitoOObs: numeroLeitoOObs,
      volumePorCirurgiaUE: 1.5,
      volumePorLeitoUTIUE: 0.5,
      volumePorLeitoInternacaoUE: 0.1,
      capacidadeUELitros: 54,
      numAutoclaves: Math.max(autoclaves.length, 1),
      numLavadoras: Math.max(lavadoras.length, 1),
    };

    // Calcular recomendações
    const recomendacoes = calcularRecomendacoes(data, lavadoras, autoclaves);

    return recomendacoes;
  } catch (error) {
    console.error("Erro ao calcular recomendações:", error);
    throw error;
  }
}

const calcularVolumeDiarioTotal = ({
  numSalasCirurgicas,
  numCirurgiasPorSalaPorDia,
  numLeitosUTI,
  numLeitosInternacao,
  volumePorCirurgiaUE,
  volumePorLeitoUTIUE,
  volumePorLeitoInternacaoUE,
}) => {
  const numCirurgiasPorDia = numSalasCirurgicas * numCirurgiasPorSalaPorDia;
  const volumeDiarioCirurgiasUE = numCirurgiasPorDia * volumePorCirurgiaUE;
  const volumeDiarioUTIsUE = numLeitosUTI * volumePorLeitoUTIUE;
  const volumeDiarioInternacaoUE =
    numLeitosInternacao * volumePorLeitoInternacaoUE;
  const volumeTotalDiarioUE =
    volumeDiarioCirurgiasUE + volumeDiarioUTIsUE + volumeDiarioInternacaoUE;
  return volumeTotalDiarioUE;
};

const calcularVolumeEmLitros = (volumeTotalDiarioUE, capacidadeUELitros) => {
  const volumeTotalDiarioLitros = volumeTotalDiarioUE * capacidadeUELitros;
  const volumePicoLitros = volumeTotalDiarioLitros * 0.9;
  return { volumeTotalDiarioLitros, volumePicoLitros };
};

const calcularPercentuaisUtilizacaoAutoclaves = (
  volumePicoLitros,
  autoclaves,
  minutosDisponiveis
) => {
  const percentuaisUtilizacao = [];
  autoclaves.forEach(
    ({ marca, modelo, capacidadePicoLitros, tempoCicloMinutos }) => {
      const modelos = modelo.map((nome, index) => {
        const capacidade = capacidadePicoLitros[index];
        const ciclosDiarios = Math.ceil(volumePicoLitros / capacidade);
        const tempoTotalDiario = ciclosDiarios * tempoCicloMinutos[index];
        const percentual = (tempoTotalDiario / minutosDisponiveis) * 100;
        return { marca, modelo: nome, percentual };
      });
      percentuaisUtilizacao.push(...modelos);
    }
  );
  return percentuaisUtilizacao;
};

const calcularPercentuaisUtilizacaoLavadoras = (
  volumePicoLitros,
  lavadoras,
  minutosDisponiveis
) => {
  const percentuaisUtilizacao = [];
  lavadoras.forEach(
    ({
      marca,
      modelo,
      volumeTotalLitros,
      tempoCicloInstrumentosMinutos,
      tempoCicloVentilatoriaMinutos,
    }) => {
      const modelos = modelo.map((nome, index) => {
        const volume = volumeTotalLitros[index];
        const ciclosDiarios = Math.ceil(volumePicoLitros / volume);
        const tempoTotalDiarioInstrumentos =
          ciclosDiarios * tempoCicloInstrumentosMinutos[index];
        const tempoTotalDiarioVentilatoria =
          ciclosDiarios * tempoCicloVentilatoriaMinutos[index];
        const percentualInstrumentos =
          (tempoTotalDiarioInstrumentos / minutosDisponiveis) * 100;
        const percentualVentilatoria =
          (tempoTotalDiarioVentilatoria / minutosDisponiveis) * 100;
        const percentual = Math.max(
          percentualInstrumentos,
          percentualVentilatoria
        );
        return { marca, modelo: nome, percentual };
      });
      percentuaisUtilizacao.push(...modelos);
    }
  );
  return percentuaisUtilizacao;
};

const calcularRecomendacoes = (data, lavadoras, autoclaves) => {
  const volumeTotalDiarioUE = calcularVolumeDiarioTotal(data);
  const { volumeTotalDiarioLitros, volumePicoLitros } = calcularVolumeEmLitros(
    volumeTotalDiarioUE,
    data.capacidadeUELitros
  );
  console.log("Volume total diário (litros):", volumeTotalDiarioLitros);
  console.log("Volume de pico (litros):", volumePicoLitros);

  const minutosDisponiveisAutoclaves = 1440; // 24 horas * 60 minutos
  const minutosDisponiveisLavadoras = 1440; // 24 horas * 60 minutos

  const percentuaisUtilizacaoAutoclaves =
    calcularPercentuaisUtilizacaoAutoclaves(
      volumePicoLitros,
      autoclaves,
      minutosDisponiveisAutoclaves
    );

  const percentuaisUtilizacaoLavadoras = calcularPercentuaisUtilizacaoLavadoras(
    volumePicoLitros,
    lavadoras,
    minutosDisponiveisLavadoras
  );

  const obterRecomendacoes = (percentuaisUtilizacao) => {
    const recomendacoesProximas90 = percentuaisUtilizacao
      .filter(({ percentual }) => percentual >= 90 && percentual <= 100)
      .sort((a, b) => Math.abs(90 - a.percentual) - Math.abs(90 - b.percentual))
      .slice(0, 2); // Pegue até dois modelos mais próximos de 90%

    return recomendacoesProximas90;
  };

  const recomendacoesAutoclaves = obterRecomendacoes(
    percentuaisUtilizacaoAutoclaves
  );
  const recomendacoesLavadoras = obterRecomendacoes(
    percentuaisUtilizacaoLavadoras
  );

  return { recomendacoesAutoclaves, recomendacoesLavadoras };
};

app.post("/calcular", async (req, res) => {
  try {
    const recomendacoes = await calRecomendacoes(req.body);
    res.json(recomendacoes);
  } catch (error) {
    res.status(500).json({ error: "Erro ao calcular recomendações" });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
