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

async function calRecomendacoes() {
  try {
    await sequelize.authenticate();
    console.log("Conexão com o banco de dados estabelecida com sucesso.");

    let numCirurgiasPorSalaPorDia = 1;
    let processamentoTecidos = 0;
    let diasCirurgias = 1;
    let intervaloPicoCME = 8;
    let numLeitosUTI = 1;
    let numLeitosInternacao = 1;
    let numSalasCirurgicas = 1;

    const frontendData = {
      numSalasCirurgicas: 12,
      numCirurgiasPorSalaPorDia: 6,
      processamentoTecidos: 1,
      diasCirurgias: 7,
      intervaloPicoCME: 12,
      numLeitosUTI: 30,
      numLeitosInternacao: 149,
    };

    // Atualizando os valores com dados do frontend
    if (frontendData.numSalasCirurgicas !== undefined) {
      numSalasCirurgicas = frontendData.numSalasCirurgicas;
    }
    if (frontendData.numCirurgiasPorSalaPorDia !== undefined) {
      numCirurgiasPorSalaPorDia = frontendData.numCirurgiasPorSalaPorDia;
    }
    if (frontendData.processamentoTecidos !== undefined) {
      processamentoTecidos = frontendData.processamentoTecidos;
    }
    if (frontendData.diasCirurgias !== undefined) {
      diasCirurgias = frontendData.diasCirurgias;
    }
    if (frontendData.intervaloPicoCME !== undefined) {
      intervaloPicoCME = frontendData.intervaloPicoCME;
    }
    if (frontendData.numLeitosUTI !== undefined) {
      numLeitosUTI = frontendData.numLeitosUTI;
    }
    if (frontendData.numLeitosInternacao !== undefined) {
      numLeitosInternacao = frontendData.numLeitosInternacao;
    }

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
      numAutoclaves: Math.max(2, 0), // O valor de 0 deve ser substituído pelo valor real obtido
      numLavadoras: Math.max(1, 0), // O valor de 0 deve ser substituído pelo valor real obtido
    };

    const recomendacoes = calcularRecomendacoes(data);
    console.log(recomendacoes);
    return recomendacoes;
  } catch (error) {
    console.error("Erro ao calcular recomendações:", error);
  }
}

function askQuestion(question) {
  return new Promise((resolve, reject) => {
    rl.question(question, (answer) => {
      resolve(parseInt(answer) || 0);
    });
  });
}

async function getNumberOfSurgeriesPerRoomPerDay() {
  return new Promise((resolve, reject) => {
    rl.question("Número de cirurgias por sala por dia: ", (answer) => {
      const numCirurgiasPorSalaPorDia = parseInt(answer) || 0;
      resolve(numCirurgiasPorSalaPorDia);
    });
  });
}

async function getNumberOfOperatingRooms() {
  const hospitalData = await HospitalData.findOne({
    where: { nome_hospital: "Nome do Hospital" },
  });
  return hospitalData ? hospitalData.num_salas_cirurgicas : 0;
}

async function getNumberOfICUBeds() {
  const hospitalData = await HospitalData.findOne({
    where: { nome_hospital: "Nome do Hospital" },
  });
  return hospitalData ? hospitalData.num_leitos_uti : 0;
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

const calcularRecomendacoes = (data) => {
  const volumeTotalDiarioUE = calcularVolumeDiarioTotal(data);
  const { volumeTotalDiarioLitros, volumePicoLitros } = calcularVolumeEmLitros(
    volumeTotalDiarioUE,
    data.capacidadeUELitros
  );

  console.log("Volume total diário (litros):", volumeTotalDiarioLitros);
  console.log("Volume de pico (litros):", volumePicoLitros);

  const autoclaves = [
    {
      marca: "Marca A",
      modelo: ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"],
      capacidadePicoLitros: [
        2714, 3063, 4594, 6126, 6578, 9867, 13156, 15962, 19420,
      ],
      tempoCicloMinutos: [60, 63, 63, 63, 66, 66, 66, 68, 65],
    },
    {
      marca: "Marca B",
      modelo: ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"],
      capacidadePicoLitros: [
        2848, 5025, 4523, 10854, 11442, 13359, 16482, 18894,
      ],
      tempoCicloMinutos: [60, 60, 60, 60, 65, 65, 70, 90],
    },
    {
      marca: "Marca C",
      modelo: ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"],
      capacidadePicoLitros: [
        3350, 6868, 10050, 11055, 15745, 20402, 25058, 30217,
      ],
      tempoCicloMinutos: [60, 60, 60, 60, 60, 60, 60, 60],
    },
    {
      marca: "Marca D",
      modelo: ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"],
      capacidadePicoLitros: [4476, 6754, 7236, 8603, 9303, 12405, 15506, 18607],
      tempoCicloMinutos: [60, 60, 60, 60, 70, 70, 70, 70],
    },
    {
      marca: "Marca E",
      modelo: [
        "E1",
        "E2",
        "E3",
        "E4",
        "E5",
        "E6",
        "E7",
        "E8",
        "E9",
        "E10",
        "E11",
        "E12",
        "E13",
      ],
      capacidadePicoLitros: [
        4342, 8683, 11841, 14472, 16698, 4342, 6512, 10854, 13359, 15506, 11841,
        14645, 16083,
      ],
      tempoCicloMinutos: [50, 50, 55, 60, 65, 50, 50, 60, 65, 70, 55, 60, 69],
    },
    {
      marca: "Marca F",
      modelo: ["F1", "F2", "F3", "F4"],
      capacidadePicoLitros: [
        4294, 6512, 10854, 14472, 16698, 6512, 10854, 13359, 16083,
      ],
      tempoCicloMinutos: [40, 50, 50, 60, 60, 40, 50, 60, 60],
    },
  ];

  const lavadoras = [
    {
      marca: "Marca A",
      modelo: ["A1", "A2"],
      volumeTotalLitros: [220, 300],
      tempoCicloInstrumentosMinutos: [45, 45],
      tempoCicloVentilatoriaMinutos: [50, 50],
    },
    {
      marca: "Marca B",
      modelo: ["B1", "B2"],
      volumeTotalLitros: [250, 350],
      tempoCicloInstrumentosMinutos: [50, 50],
      tempoCicloVentilatoriaMinutos: [55, 55],
    },
    {
      marca: "Marca C",
      modelo: ["C1", "C2"],
      volumeTotalLitros: [270, 400],
      tempoCicloInstrumentosMinutos: [55, 55],
      tempoCicloVentilatoriaMinutos: [60, 60],
    },
    {
      marca: "Marca D",
      modelo: ["D1", "D2"],
      volumeTotalLitros: [300, 450],
      tempoCicloInstrumentosMinutos: [60, 60],
      tempoCicloVentilatoriaMinutos: [65, 65],
    },
    {
      marca: "Marca E",
      modelo: ["E1", "E2"],
      volumeTotalLitros: [350, 500],
      tempoCicloInstrumentosMinutos: [65, 65],
      tempoCicloVentilatoriaMinutos: [70, 70],
    },
  ];

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
      .slice(0, 2);

    if (recomendacoesProximas90.length > 0) {
      return recomendacoesProximas90;
    }

    const recomendacoesEntre20e90 = percentuaisUtilizacao
      .filter(({ percentual }) => percentual >= 20 && percentual < 90)
      .sort((a, b) => b.percentual - a.percentual)
      .slice(0, 2);

    if (recomendacoesEntre20e90.length > 0) {
      return recomendacoesEntre20e90;
    }

    const recomendacoesAleatorias = percentuaisUtilizacao
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);
    return recomendacoesAleatorias;
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

rl.close();

//calRecomendacoes()
//.then((recomendacoes) => {
//console.log("Recomendações calculadas com sucesso:");
//console.log(recomendacoes);
//})
//.catch((error) => {
//console.error("Erro ao calcular recomendações:", error);
//});
