(() => {
  const decisionCalculators = [
    {
      id: 'avista-ou-parcelado',
      icon: '⇄',
      title: 'À vista ou parcelado?',
      category: 'Decisão',
      description: 'Compare o preço à vista com parcelas considerando também o custo de oportunidade do dinheiro.',
      tags: 'à vista parcelado parcelas compra desconto juros custo oportunidade cartão decisão',
      note: 'O valor presente das parcelas é calculado descontando os pagamentos mensais pela taxa de retorno alternativa informada. Assume parcelas no fim de cada mês e não inclui tarifas, cashback, milhas ou risco.',
      fields: [
        { id: 'cashPrice', label: 'Preço à vista', prefix: 'R$', value: 4500, step: 10, min: 0 },
        { id: 'installmentValue', label: 'Valor da parcela', prefix: 'R$', value: 450, step: 10, min: 0 },
        { id: 'installments', label: 'Número de parcelas', suffix: 'x', value: 12, step: 1, min: 1 },
        { id: 'annualReturn', label: 'Retorno alternativo', suffix: '% a.a.', value: 10, step: 0.1, min: -99 }
      ],
      validate(values) {
        if (values.cashPrice <= 0) return 'O preço à vista precisa ser maior que zero.';
        if (values.installmentValue <= 0) return 'O valor da parcela precisa ser maior que zero.';
        return null;
      },
      calculate(values) {
        const n = Math.round(values.installments);
        const monthlyRate = Math.pow(1 + values.annualReturn / 100, 1 / 12) - 1;
        const nominalTotal = values.installmentValue * n;
        const presentValue = Math.abs(monthlyRate) < 1e-12
          ? nominalTotal
          : values.installmentValue * (1 - Math.pow(1 + monthlyRate, -n)) / monthlyRate;
        const difference = presentValue - values.cashPrice;
        const cashWins = difference > 0.005;
        const installmentWins = difference < -0.005;
        const recommendation = cashWins
          ? 'À vista tende a ser melhor'
          : installmentWins
            ? 'Parcelado tende a ser melhor'
            : 'As opções são praticamente equivalentes';
        const nominalPremium = (nominalTotal / values.cashPrice - 1) * 100;

        return {
          label: 'Comparação econômica',
          main: recommendation,
          subtitle: cashWins
            ? `O custo presente das parcelas fica ${BRL.format(Math.abs(difference))} acima do preço à vista.`
            : installmentWins
              ? `O custo presente das parcelas fica ${BRL.format(Math.abs(difference))} abaixo do preço à vista.`
              : 'Com as premissas informadas, a diferença econômica é muito pequena.',
          metrics: [
            ['Total nominal parcelado', BRL.format(nominalTotal)],
            ['Valor presente das parcelas', BRL.format(presentValue)],
            ['Ágio nominal vs. à vista', `${NUMBER.format(nominalPremium)}%`],
            ['Retorno mensal equivalente', `${NUMBER.format(monthlyRate * 100)}%`]
          ]
        };
      }
    },
    {
      id: 'amortizar-ou-investir',
      icon: '⚖',
      title: 'Amortizar ou investir?',
      category: 'Decisão',
      description: 'Compare o custo da dívida com o retorno esperado de um investimento para um capital disponível hoje.',
      tags: 'amortizar investir dívida financiamento investimento juros retorno capital decisão',
      note: 'Comparação simplificada por taxas efetivas anuais: amortizar é tratado como evitar o custo da dívida; investir usa o retorno esperado informado. Não considera impostos, liquidez, risco, CET detalhado ou regras específicas de amortização.',
      fields: [
        { id: 'capital', label: 'Capital disponível', prefix: 'R$', value: 20000, step: 100, min: 0 },
        { id: 'debtRate', label: 'Custo efetivo da dívida', suffix: '% a.a.', value: 14, step: 0.1, min: -99 },
        { id: 'investmentRate', label: 'Retorno esperado', suffix: '% a.a.', value: 10, step: 0.1, min: -99 },
        { id: 'years', label: 'Horizonte', suffix: 'anos', value: 5, step: 0.5, min: 0.1 }
      ],
      validate(values) {
        if (values.capital <= 0) return 'O capital disponível precisa ser maior que zero.';
        return null;
      },
      calculate(values) {
        const amortizeEquivalent = values.capital * Math.pow(1 + values.debtRate / 100, values.years);
        const investmentFuture = values.capital * Math.pow(1 + values.investmentRate / 100, values.years);
        const difference = amortizeEquivalent - investmentFuture;
        const amortizeWins = difference > 0.005;
        const investWins = difference < -0.005;
        const recommendation = amortizeWins
          ? 'Amortizar tende a ser melhor'
          : investWins
            ? 'Investir tende a ser melhor'
            : 'As alternativas ficam muito próximas';

        return {
          label: 'Comparação das taxas',
          main: recommendation,
          subtitle: amortizeWins
            ? `No horizonte informado, o benefício equivalente de amortizar supera o investimento em ${BRL.format(Math.abs(difference))}.`
            : investWins
              ? `No horizonte informado, o investimento supera o benefício equivalente de amortizar em ${BRL.format(Math.abs(difference))}.`
              : 'As taxas informadas produzem resultados equivalentes neste horizonte.',
          metrics: [
            ['Equivalente ao amortizar', BRL.format(amortizeEquivalent)],
            ['Valor futuro investindo', BRL.format(investmentFuture)],
            ['Diferença entre taxas', `${NUMBER.format(values.debtRate - values.investmentRate)} p.p. a.a.`],
            ['Horizonte', `${NUMBER.format(values.years)} anos`]
          ]
        };
      }
    },
    {
      id: 'meta-de-patrimonio',
      icon: '🎯',
      title: 'Quando atinjo minha meta?',
      category: 'Investimentos',
      description: 'Estime quanto tempo leva para alcançar um patrimônio com saldo atual, aportes e uma taxa de retorno.',
      tags: 'meta patrimônio milhão objetivo investimento aporte mensal tempo independência financeira',
      note: 'A projeção usa uma taxa mensal equivalente à taxa anual e considera aportes no fim de cada mês. Rentabilidade real pode variar e impostos ou taxas não estão incluídos.',
      fields: [
        { id: 'target', label: 'Meta de patrimônio', prefix: 'R$', value: 1000000, step: 10000, min: 0 },
        { id: 'current', label: 'Patrimônio atual', prefix: 'R$', value: 100000, step: 1000, min: 0 },
        { id: 'monthly', label: 'Aporte mensal', prefix: 'R$', value: 3000, step: 100, min: 0 },
        { id: 'annualRate', label: 'Retorno anual', suffix: '% a.a.', value: 10, step: 0.1, min: -99 }
      ],
      validate(values) {
        if (values.target <= 0) return 'A meta de patrimônio precisa ser maior que zero.';
        if (values.current >= values.target) return null;
        if (values.monthly <= 0 && values.annualRate <= 0) return 'Com aporte zero e retorno não positivo, a meta não será alcançada.';
        return null;
      },
      calculate(values) {
        if (values.current >= values.target) {
          return {
            label: 'Meta alcançada',
            main: 'Você já atingiu a meta',
            subtitle: `O patrimônio atual é ${BRL.format(values.current)} para uma meta de ${BRL.format(values.target)}.`,
            metrics: [
              ['Meta', BRL.format(values.target)],
              ['Patrimônio atual', BRL.format(values.current)],
              ['Excedente', BRL.format(values.current - values.target)]
            ]
          };
        }

        const monthlyRate = Math.pow(1 + values.annualRate / 100, 1 / 12) - 1;
        let balance = values.current;
        let months = 0;
        const maxMonths = 1200;
        while (balance < values.target && months < maxMonths) {
          balance = balance * (1 + monthlyRate) + values.monthly;
          months += 1;
        }

        if (balance < values.target) {
          return {
            label: 'Horizonte muito longo',
            main: 'Mais de 100 anos',
            subtitle: 'Com as premissas atuais, a meta não é atingida dentro do limite de projeção do simulador.',
            metrics: [
              ['Saldo após 100 anos', BRL.format(balance)],
              ['Meta', BRL.format(values.target)],
              ['Aporte mensal', BRL.format(values.monthly)]
            ]
          };
        }

        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        const totalContributed = values.current + values.monthly * months;
        const earnings = balance - totalContributed;
        const duration = `${years ? `${years} ${years === 1 ? 'ano' : 'anos'}` : ''}${years && remainingMonths ? ' e ' : ''}${remainingMonths ? `${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}` : ''}`;

        return {
          label: 'Tempo estimado para a meta',
          main: duration,
          subtitle: `Patrimônio projetado de ${BRL.format(balance)} ao atingir ou ultrapassar a meta.`,
          metrics: [
            ['Meses totais', NUMBER.format(months)],
            ['Capital aportado', BRL.format(totalContributed)],
            ['Rendimento acumulado', BRL.format(earnings)],
            ['Taxa mensal equivalente', `${NUMBER.format(monthlyRate * 100)}%`]
          ]
        };
      }
    }
  ];

  calculators.push(...decisionCalculators);

  const hashId = window.location.hash.replace('#', '');
  if (decisionCalculators.some((calc) => calc.id === hashId)) {
    state.activeId = hashId;
  }

  renderList();
  renderPanel();
})();
