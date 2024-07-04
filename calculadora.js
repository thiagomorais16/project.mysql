const { HospitalData, Lavadora, Autoclave } = require("./models/model");
const EventEmitter = require("events");
const readline = require("readline");
const Sequelize = require("sequelize");

EventEmitter.defaultMaxListeners = 20;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const sequelize = new Sequelize("eq_calculator", "root", "Th1@g0123", {
  host: "localhost",
  dialect: "mysql",
  port: 3306,
});

async function calRecomendacoes(frontendData) {
  try {
    await sequelize.authenticate();
    console.log("Conexão com o banco de dados estabelecida com sucesso.");

    // Dados do frontend
    const {
      numSalasCirurgicas,
      numCirurgiasPorSalaPorDia,
      processamentoTecidos,
      diasCirurgias,
      intervaloPicoCME,
      numLeitosUTI,
      numLeitosInternacao,
    } = frontendData;

    // Obtenha os dados de lavadoras e autoclaves do banco de dados
    const lavadoras = await Lavadora.findAll();
    const autoclaves = await Autoclave.findAll();

    // Verifique os valores obtidos
    console.log({
      numSalasCirurgicas,
      numCirurgiasPorSalaPorDia,
      numLeitosUTI,
      numLeitosInternacao,
    });

    // Defina os dados de entrada para os cálculos
    const data = {
      ...frontendData,
      volumePorCirurgiaUE: 1.5,
      volumePorLeitoUTIUE: 0.5,
      volumePorLeitoInternacaoUE: 0.1,
      capacidadeUELitros: 54,
      numAutoclaves: Math.max(autoclaves.length, 1),
      numLavadoras: Math.max(lavadoras.length, 1),
    };

    const recomendacoes = calcularRecomendacoes(data, lavadoras, autoclaves);
    console.log(recomendacoes);
    return recomendacoes;
  } catch (error) {
    console.error("Erro ao calcular recomendações:", error);
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
      .slice();

    if (recomendacoesProximas90.length > 0) {
      return recomendacoesProximas90;
    }
    // Adicionar uma recomendação se o percentual for menor que 90%
    const recomendacoesMenor90 = percentuaisUtilizacao
      .filter(({ percentual }) => percentual < 90)
      .sort((a, b) => a.percentual - b.percentual);

    return recomendacoesMenor90.length > 0 ? recomendacoesMenor90[0] : null;
  };

  const recomendacoesAutoclaves = obterRecomendacoes(
    percentuaisUtilizacaoAutoclaves
  );
  const recomendacoesLavadoras = obterRecomendacoes(
    percentuaisUtilizacaoLavadoras
  );

  return {
    recomendacoesAutoclaves,
    recomendacoesLavadoras,
  };
};

// Simula dados do frontend para teste
const frontendData = {
  numSalasCirurgicas: 12,
  numCirurgiasPorSalaPorDia: 6,
  processamentoTecidos: 1,
  diasCirurgias: 7,
  intervaloPicoCME: 12,
  numLeitosUTI: 30,
  numLeitosInternacao: 149,
};

calRecomendacoes(frontendData)
  .then((recomendacoes) => {
    console.log("Recomendações calculadas com sucesso:");
    console.log(recomendacoes);
  })
  .catch((error) => {
    console.error("Erro ao calcular recomendações:", error);
  })
  .finally(() => {
    rl.close(); // Coloque rl.close() aqui
  });
