// Definindo as variáveis de entrada
const numSalasCirurgicas = 12;
const numCirurgiasPorSalaPorDia = 6;
const numLeitosUTI = 30;
const numLeitosInternacao = 149;
const volumePorCirurgiaUE = 1.5;
const volumePorLeitoUTIUE = 0.5;
const volumePorLeitoInternacaoUE = 0.1;
const capacidadeUELitros = 54;
const numAutoclaves = Math.max(2, 3); // Mínimo 2 autoclaves
const numLavadoras = Math.max(1, 2); // Mínimo 1 lavadora

// Função para calcular volumes diários
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

// Função para calcular volumes em litros
const calcularVolumeEmLitros = (volumeTotalDiarioUE, capacidadeUELitros) => {
  const volumeTotalDiarioLitros = volumeTotalDiarioUE * capacidadeUELitros;
  const volumePicoLitros = volumeTotalDiarioLitros * 0.9;
  return { volumeTotalDiarioLitros, volumePicoLitros };
};

// Função para calcular percentuais de utilização de autoclaves
const calcularPercentuaisUtilizacaoAutoclaves = (
  volumePicoLitros,
  autoclaves,
  minutosDisponiveis
) => {
  const percentuaisUtilizacao = {};

  for (const [marca, dados] of Object.entries(autoclaves)) {
    const percentualUtilizacao = dados.capacidadePicoLitros.map(
      (capacidade, index) => {
        const ciclosDiarios = Math.ceil(volumePicoLitros / capacidade);
        const tempoTotalDiario = ciclosDiarios * dados.tempoCicloMinutos[index];
        const percentual = (tempoTotalDiario / minutosDisponiveis) * 100;
        return percentual;
      }
    );
    percentuaisUtilizacao[marca] = percentualUtilizacao;
    if (percentualUtilizacao.some((percentual) => percentual < 90)) {
      autoclaves[marca].recomendado = true;
    }
  }

  return percentuaisUtilizacao;
};

// Função para calcular percentuais de utilização de lavadoras
const calcularPercentuaisUtilizacaoLavadoras = (
  volumePicoLitros,
  lavadoras,
  minutosDisponiveis
) => {
  const percentuaisUtilizacao = {};

  for (const [marca, dados] of Object.entries(lavadoras)) {
    const percentualUtilizacao = dados.volumeTotalLitros.map(
      (volume, index) => {
        const ciclosDiarios = Math.ceil(volumePicoLitros / volume);
        const tempoTotalDiarioInstrumentos =
          ciclosDiarios * dados.tempoCicloInstrumentosMinutos[index];
        const tempoTotalDiarioVentilatoria =
          ciclosDiarios * dados.tempoCicloVentilatoriaMinutos[index];
        const percentualInstrumentos =
          (tempoTotalDiarioInstrumentos / minutosDisponiveis) * 100;
        const percentualVentilatoria =
          (tempoTotalDiarioVentilatoria / minutosDisponiveis) * 100;
        return Math.max(percentualInstrumentos, percentualVentilatoria);
      }
    );
    percentuaisUtilizacao[marca] = percentualUtilizacao;
    if (percentualUtilizacao.some((percentual) => percentual < 90)) {
      lavadoras[marca].recomendado = true;
    }
  }

  return percentuaisUtilizacao;
};

// Função principal para calcular as recomendações
const calcularRecomendacoes = (data) => {
  const volumeTotalDiarioUE = calcularVolumeDiarioTotal(data);
  const { volumeTotalDiarioLitros, volumePicoLitros } = calcularVolumeEmLitros(
    volumeTotalDiarioUE,
    data.capacidadeUELitros
  );

  console.log("Volume total diário (litros):", volumeTotalDiarioLitros);
  console.log("Volume de pico (litros):", volumePicoLitros);

  const autoclaves = {
    "Marca A": {
      modelo: ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"],
      volumeUtilLitros: [81, 96, 144, 192, 216, 324, 432, 540, 628],
      tempoCicloMinutos: [60, 63, 63, 63, 66, 66, 66, 68, 65],
      capacidadePicoLitros: [
        2714, 3063, 4594, 6126, 6578, 9867, 13156, 15962, 19420,
      ],
      preco: null,
      recomendado: false,
    },
    "Marca B": {
      modelo: ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"],
      volumeUtilLitros: [85, 150, 135, 324, 370, 432, 574, 846],
      tempoCicloMinutos: [60, 60, 60, 60, 65, 65, 70, 90],
      capacidadePicoLitros: [
        2848, 5025, 4523, 10854, 11442, 13359, 16482, 18894,
      ],
      preco: null,
      recomendado: false,
    },
    "Marca C": {
      modelo: ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"],
      volumeUtilLitros: [100, 205, 300, 330, 470, 609, 748, 902],
      tempoCicloMinutos: [60, 60, 60, 60, 60, 60, 60, 60],
      capacidadePicoLitros: [
        3350, 6868, 10050, 11055, 15745, 20402, 25058, 30217,
      ],
      preco: null,
      recomendado: false,
    },
    "Marca D": {
      modelo: ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"],
      volumeUtilLitros: [133.6, 201.6, 216, 256.8, 324, 432, 540, 648],
      tempoCicloMinutos: [60, 60, 60, 60, 70, 70, 70, 70],
      capacidadePicoLitros: [4476, 6754, 7236, 8603, 9303, 12405, 15506, 18607],
      preco: null,
      recomendado: false,
    },
    "Marca E": {
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
      volumeUtilLitros: [
        108, 216, 324, 432, 540, 324, 432, 540, 324, 432, 540, 648,
      ],
      tempoCicloMinutos: [50, 50, 55, 60, 65, 50, 50, 60, 65, 70, 55, 60, 69],
      capacidadePicoLitros: [
        4342, 8683, 11841, 14472, 16698, 4342, 6512, 10854, 13359, 15506, 11841,
        14645, 16083,
      ],
      preco: null,
      recomendado: false,
    },
    "Marca F": {
      modelo: ["F1", "F2", "F3", "F4"],
      volumeUtilLitros: [108, 162, 324, 432, 540, 324, 432, 540, 648],
      tempoCicloMinutos: [40, 50, 50, 60, 60, 40, 50, 60, 60],
      capacidadePicoLitros: [
        4294, 6512, 10854, 14472, 16698, 6512, 10854, 13359, 16083,
      ],
      preco: null,
      recomendado: false,
    },
  };

  const lavadoras = {
    "Marca A": {
      modelo: ["A1", "A2"],
      volumeTotalLitros: [220, 300],
      capacidadeBandejas: [10, 15],
      capacidadeTraqueias: [15, 30],
      tempoCicloInstrumentosMinutos: [45, 45],
      tempoCicloVentilatoriaMinutos: [50, 50],
      preco: null,
      recomendado: false,
    },
    "Marca B": {
      modelo: ["B1", "B2"],
      volumeTotalLitros: [250, 350],
      capacidadeBandejas: [12, 18],
      capacidadeTraqueias: [20, 35],
      tempoCicloInstrumentosMinutos: [50, 50],
      tempoCicloVentilatoriaMinutos: [55, 55],
      preco: null,
      recomendado: false,
    },
    "Marca C": {
      modelo: ["C1", "C2"],
      volumeTotalLitros: [250, 350],
      capacidadeBandejas: [11, 16],
      capacidadeTraqueias: [17, 30],
      tempoCicloInstrumentosMinutos: [60, 60],
      tempoCicloVentilatoriaMinutos: [60, 60],
      preco: null,
      recomendado: false,
    },
    "Marca D": {
      modelo: ["D1", "D2"],
      volumeTotalLitros: [255, 335],
      capacidadeBandejas: [10, 15],
      capacidadeTraqueias: [16, 30],
      tempoCicloInstrumentosMinutos: [50, 50],
      tempoCicloVentilatoriaMinutos: [55, 55],
      preco: null,
      recomendado: false,
    },
    "Marca E": {
      modelo: ["E1", "E2"],
      volumeTotalLitros: [260, 360],
      capacidadeBandejas: [11, 16],
      capacidadeTraqueias: [17, 30],
      tempoCicloInstrumentosMinutos: [55, 55],
      tempoCicloVentilatoriaMinutos: [60, 60],
      preco: null,
      recomendado: false,
    },
  };

  const minutosDisponiveisAutoclaves = data.numAutoclaves * 1440; // 24 horas em minutos
  const minutosDisponiveisLavadoras = data.numLavadoras * 1440; // 24 horas em minutos

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

  const recomendacoesAutoclaves = Object.entries(autoclaves)
    .filter(([marca, dados]) => dados.recomendado)
    .map(([marca, dados]) => ({ marca, preco: dados.preco }));

  const recomendacoesLavadoras = Object.entries(lavadoras)
    .filter(([marca, dados]) => dados.recomendado)
    .map(([marca, dados]) => ({ marca, preco: dados.preco }));

  return {
    recomendacoesAutoclaves,
    recomendacoesLavadoras,
  };
};

// Função para exibir recomendações
const exibirRecomendacoes = (recomendacoes) => {
  const { recomendacoesAutoclaves, recomendacoesLavadoras } = recomendacoes;

  console.log("Recomendações de Autoclaves:");
  recomendacoesAutoclaves.forEach((recomendacao) => {
    console.log(`Marca: ${recomendacao.marca}, Preço: ${recomendacao.preco}`);
  });

  console.log("\nRecomendações de Lavadoras:");
  recomendacoesLavadoras.forEach((recomendacao) => {
    console.log(`Marca: ${recomendacao.marca}, Preço: ${recomendacao.preco}`);
  });
};

module.exports = { calcularRecomendacoes, exibirRecomendacoes };

// Chamada de exemplo
const data = {
  numSalasCirurgicas,
  numCirurgiasPorSalaPorDia,
  numLeitosUTI,
  numLeitosInternacao,
  volumePorCirurgiaUE,
  volumePorLeitoUTIUE,
  volumePorLeitoInternacaoUE,
  capacidadeUELitros,
  numAutoclaves,
  numLavadoras,
};

const recomendacoes = calcularRecomendacoes(data);
exibirRecomendacoes(recomendacoes);
