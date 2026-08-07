(() => {
  if (typeof CalculadoraMath === 'undefined') return;

  const calculator = {
    id: 'comprar-ou-alugar',
    icon: '⌂⇄',
    title: 'Comprar ou alugar?',
    category: 'Decisão',
    description: 'Compare o patrimônio líquido de comprar um imóvel com alugar e investir o capital e as diferenças mensais.',
    tags: 'comprar alugar imóvel financiamento aluguel investir casa apartamento patrimônio entrada decisão',
    note: 'A comparação usa orçamento mensal equivalente: a entrada vira patrimônio no imóvel para quem compra e carteira inicial para quem aluga; em cada mês, a alternativa com menor custo habitacional investe a diferença. O financiamento usa Price. Custos de compra/venda, cartório, corretagem, impostos sobre investimentos, CET detalhado e efeitos tributários não estão incluídos.',
    fields: [
      { id: 'propertyPrice', label: 'Preço do imóvel', prefix: 'R$', value: 500000, step: 5000, min: 1 },
      { id: 'downPayment', label: 'Entrada disponível', prefix: 'R$', value: 100000, step: 5000, min: 0 },
      { id: 'mortgageRate', label: 'Taxa do financiamento', suffix: '% a.a.', value: 11, step: 0.1, min: 0 },
      { id: 'mortgageYears', label: 'Prazo do financiamento', suffix: 'anos', value: 30, step: 1, min: 1 },
      { id: 'rentMonthly', label: 'Aluguel atual', prefix: 'R$', suffix: '/mês', value: 2500, step: 100, min: 0 },
      { id: 'rentGrowthRate', label: 'Reajuste do aluguel', suffix: '% a.a.', value: 4, step: 0.1, min: -99 },
      { id: 'propertyAppreciation', label: 'Valorização do imóvel', suffix: '% a.a.', value: 4, step: 0.1, min: -99 },
      { id: 'investmentReturn', label: 'Retorno dos investimentos', suffix: '% a.a.', value: 10, step: 0.1, min: -99 },
      { id: 'ownerCostRate', label: 'Custos anuais do proprietário', suffix: '% do imóvel', value: 1.5, step: 0.1, min: 0 },
      { id: 'horizonYears', label: 'Horizonte da comparação', suffix: 'anos', value: 10, step: 1, min: 1 }
    ],
    validate(values) {
      if (values.downPayment > values.propertyPrice) return 'A entrada não pode ser maior que o preço do imóvel.';
      return null;
    },
    calculate(values) {
      const r = CalculadoraMath.buyVsRentProjection(values);
      const buyWins = r.recommendation === 'buy';
      const rentWins = r.recommendation === 'rent';
      const recommendation = buyWins
        ? 'Comprar termina com maior patrimônio'
        : rentWins
          ? 'Alugar e investir termina com maior patrimônio'
          : 'As alternativas terminam praticamente empatadas';

      return {
        label: `Comparação após ${NUMBER.format(values.horizonYears)} anos`,
        main: recommendation,
        subtitle: buyWins
          ? `O patrimônio líquido do cenário de compra fica ${BRL.format(Math.abs(r.difference))} acima do cenário de aluguel.`
          : rentWins
            ? `A carteira do cenário de aluguel fica ${BRL.format(Math.abs(r.difference))} acima do patrimônio do cenário de compra.`
            : 'Com as premissas informadas, a diferença final de patrimônio é pequena.',
        metrics: [
          ['Patrimônio comprando', BRL.format(r.buyerNetWorth)],
          ['Patrimônio alugando', BRL.format(r.renterNetWorth)],
          ['Valor projetado do imóvel', BRL.format(r.propertyValue)],
          ['Saldo devedor final', BRL.format(r.remainingDebt)],
          ['Parcela Price inicial', BRL.format(r.mortgagePayment)],
          ['Aluguel projetado no fim', BRL.format(r.finalRent)]
        ]
      };
    }
  };

  calculators.push(calculator);

  const hashId = window.location.hash.replace('#', '');
  if (hashId === calculator.id) state.activeId = calculator.id;

  renderList();
  renderPanel();
})();