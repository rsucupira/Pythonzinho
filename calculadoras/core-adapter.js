(() => {
  if (typeof CalculadoraMath === 'undefined') return;

  const byId = Object.fromEntries(calculators.map((calc) => [calc.id, calc]));

  byId['juros-compostos'].calculate = (values) => {
    const r = CalculadoraMath.compoundProjection(values);
    return {
      label: 'Patrimônio estimado',
      main: BRL.format(r.balance),
      subtitle: `Em ${NUMBER.format(values.years)} anos, com taxa de ${NUMBER.format(values.annualRate)}% ao ano.`,
      metrics: [
        ['Total investido', BRL.format(r.invested)],
        ['Rendimento', BRL.format(r.earnings)],
        ['Taxa mensal equivalente', `${NUMBER.format(r.monthlyRate * 100)}%`]
      ]
    };
  };

  byId.financiamento.calculate = (values) => {
    const r = CalculadoraMath.priceFinancing(values);
    return {
      label: 'Parcela estimada',
      main: BRL.format(r.payment),
      subtitle: `${r.months} parcelas mensais pela tabela Price.`,
      metrics: [
        ['Total pago', BRL.format(r.total)],
        ['Juros totais', BRL.format(r.interest)],
        ['Taxa mensal equivalente', `${NUMBER.format(r.monthlyRate * 100)}%`]
      ]
    };
  };

  byId.porcentagem.calculate = (values) => {
    const r = CalculadoraMath.percentage(values);
    return {
      label: `${NUMBER.format(values.percent)}% de ${BRL.format(values.base)}`,
      main: BRL.format(r.part),
      subtitle: 'Resultado direto da porcentagem informada.',
      metrics: [
        ['Com acréscimo', BRL.format(r.increased)],
        ['Com redução', BRL.format(r.reduced)],
        ['Valor original', BRL.format(values.base)]
      ]
    };
  };

  byId.desconto.calculate = (values) => {
    const r = CalculadoraMath.discount(values);
    return {
      label: 'Preço com desconto',
      main: BRL.format(r.finalPrice),
      subtitle: `Você economiza ${BRL.format(r.saved)} nesta compra.`,
      metrics: [
        ['Preço original', BRL.format(values.price)],
        ['Economia', BRL.format(r.saved)],
        ['Desconto', `${NUMBER.format(values.discount)}%`]
      ]
    };
  };

  byId['regra-de-tres'].calculate = (values) => {
    const r = CalculadoraMath.ruleOfThree(values);
    return {
      label: 'Valor de X',
      main: NUMBER.format(r.x),
      subtitle: `${NUMBER.format(values.a)} / ${NUMBER.format(values.b)} = ${NUMBER.format(values.c)} / X`,
      metrics: [['A', NUMBER.format(values.a)], ['B', NUMBER.format(values.b)], ['C', NUMBER.format(values.c)]]
    };
  };

  byId.roi.calculate = (values) => {
    const r = CalculadoraMath.roi(values);
    return {
      label: 'ROI estimado',
      main: `${NUMBER.format(r.roi)}%`,
      subtitle: r.roi >= 0 ? `Ganho de ${BRL.format(r.profit)} sobre o capital investido.` : `Perda de ${BRL.format(Math.abs(r.profit))} sobre o capital investido.`,
      metrics: [['Investimento', BRL.format(values.investment)], ['Retorno', BRL.format(values.returned)], ['Resultado', BRL.format(r.profit)]]
    };
  };

  byId['margem-markup'].calculate = (values) => {
    const r = CalculadoraMath.marginMarkup(values);
    return {
      label: 'Margem sobre a venda',
      main: `${NUMBER.format(r.margin)}%`,
      subtitle: `Lucro unitário estimado de ${BRL.format(r.profit)}.`,
      metrics: [['Markup', `${NUMBER.format(r.markup)}%`], ['Fator de markup', `${NUMBER.format(r.factor)}×`], ['Lucro unitário', BRL.format(r.profit)]]
    };
  };

  byId.combustivel.calculate = (values) => {
    const r = CalculadoraMath.fuelCost(values);
    return {
      label: 'Custo estimado da viagem',
      main: BRL.format(r.cost),
      subtitle: `Aproximadamente ${NUMBER.format(r.liters)} litros para ${NUMBER.format(values.distance)} km.`,
      metrics: [['Litros necessários', `${NUMBER.format(r.liters)} L`], ['Custo por km', BRL.format(r.perKm)], ['Consumo médio', `${NUMBER.format(values.consumption)} km/L`]]
    };
  };

  if (byId['avista-ou-parcelado']) {
    byId['avista-ou-parcelado'].calculate = (values) => {
      const r = CalculadoraMath.cashVsInstallments(values);
      const cashWins = r.recommendation === 'cash';
      const installmentWins = r.recommendation === 'installments';
      const recommendation = cashWins ? 'À vista tende a ser melhor' : installmentWins ? 'Parcelado tende a ser melhor' : 'As opções são praticamente equivalentes';
      return {
        label: 'Comparação econômica',
        main: recommendation,
        subtitle: cashWins
          ? `O custo presente das parcelas fica ${BRL.format(Math.abs(r.difference))} acima do preço à vista.`
          : installmentWins
            ? `O custo presente das parcelas fica ${BRL.format(Math.abs(r.difference))} abaixo do preço à vista.`
            : 'Com as premissas informadas, a diferença econômica é muito pequena.',
        metrics: [
          ['Total nominal parcelado', BRL.format(r.nominalTotal)],
          ['Valor presente das parcelas', BRL.format(r.presentValue)],
          ['Ágio nominal vs. à vista', `${NUMBER.format(r.nominalPremium)}%`],
          ['Retorno mensal equivalente', `${NUMBER.format(r.monthlyRate * 100)}%`]
        ]
      };
    };
  }

  if (byId['amortizar-ou-investir']) {
    byId['amortizar-ou-investir'].calculate = (values) => {
      const r = CalculadoraMath.amortizeVsInvest(values);
      const amortizeWins = r.recommendation === 'amortize';
      const investWins = r.recommendation === 'invest';
      const recommendation = amortizeWins ? 'Amortizar tende a ser melhor' : investWins ? 'Investir tende a ser melhor' : 'As alternativas ficam muito próximas';
      return {
        label: 'Comparação das taxas',
        main: recommendation,
        subtitle: amortizeWins
          ? `No horizonte informado, o benefício equivalente de amortizar supera o investimento em ${BRL.format(Math.abs(r.difference))}.`
          : investWins
            ? `No horizonte informado, o investimento supera o benefício equivalente de amortizar em ${BRL.format(Math.abs(r.difference))}.`
            : 'As taxas informadas produzem resultados equivalentes neste horizonte.',
        metrics: [
          ['Equivalente ao amortizar', BRL.format(r.amortizeEquivalent)],
          ['Valor futuro investindo', BRL.format(r.investmentFuture)],
          ['Diferença entre taxas', `${NUMBER.format(values.debtRate - values.investmentRate)} p.p. a.a.`],
          ['Horizonte', `${NUMBER.format(values.years)} anos`]
        ]
      };
    };
  }

  if (byId['meta-de-patrimonio']) {
    byId['meta-de-patrimonio'].calculate = (values) => {
      const r = CalculadoraMath.targetProjection(values);
      if (r.alreadyReached) {
        return {
          label: 'Meta alcançada',
          main: 'Você já atingiu a meta',
          subtitle: `O patrimônio atual é ${BRL.format(values.current)} para uma meta de ${BRL.format(values.target)}.`,
          metrics: [['Meta', BRL.format(values.target)], ['Patrimônio atual', BRL.format(values.current)], ['Excedente', BRL.format(values.current - values.target)]]
        };
      }
      if (!r.reached) {
        return {
          label: 'Horizonte muito longo',
          main: 'Mais de 100 anos',
          subtitle: 'Com as premissas atuais, a meta não é atingida dentro do limite de projeção do simulador.',
          metrics: [['Saldo após 100 anos', BRL.format(r.balance)], ['Meta', BRL.format(values.target)], ['Aporte mensal', BRL.format(values.monthly)]]
        };
      }
      const years = Math.floor(r.months / 12);
      const remainingMonths = r.months % 12;
      const duration = `${years ? `${years} ${years === 1 ? 'ano' : 'anos'}` : ''}${years && remainingMonths ? ' e ' : ''}${remainingMonths ? `${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}` : ''}`;
      return {
        label: 'Tempo estimado para a meta',
        main: duration,
        subtitle: `Patrimônio projetado de ${BRL.format(r.balance)} ao atingir ou ultrapassar a meta.`,
        metrics: [
          ['Meses totais', NUMBER.format(r.months)],
          ['Capital aportado', BRL.format(r.contributed)],
          ['Rendimento acumulado', BRL.format(r.earnings)],
          ['Taxa mensal equivalente', `${NUMBER.format(r.monthlyRate * 100)}%`]
        ]
      };
    };
  }

  renderPanel();
})();