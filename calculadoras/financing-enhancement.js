(() => {
  const calc = calculators.find((item) => item.id === 'financiamento');
  if (!calc || calc.fields.some((field) => field.id === 'targetPayment')) return;

  calc.fields.push({
    id: 'targetPayment',
    label: 'Parcela-alvo',
    prefix: 'R$',
    suffix: '/mês',
    value: 2500,
    step: 50,
    min: 1
  });
  calc.tags += ' parcela alvo entrada necessária prazo taxa máxima capacidade pagamento';
  calc.note += ' A parcela-alvo é usada apenas na análise de sensibilidade para estimar taxa máxima, principal compatível e prazo necessário; não altera o cálculo Price principal.';

  renderList();
  if (state.activeId === calc.id) renderPanel();
})();