(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ScenarioCodec = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const PATH_BY_ID = {
    'juros-compostos': '/juros-compostos',
    financiamento: '/financiamento',
    porcentagem: '/porcentagem',
    desconto: '/desconto',
    'regra-de-tres': '/regra-de-tres',
    roi: '/roi',
    'margem-markup': '/margem-e-markup',
    combustivel: '/custo-de-combustivel',
    'avista-ou-parcelado': '/avista-ou-parcelado',
    'amortizar-ou-investir': '/amortizar-ou-investir',
    'meta-de-patrimonio': '/meta-de-patrimonio',
    'comprar-ou-alugar': '/comprar-ou-alugar'
  };

  function cleanNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function pathFor(id) {
    return PATH_BY_ID[id] || '/';
  }

  function encode(id, fields, values) {
    const params = new URLSearchParams();
    fields.forEach((field) => {
      const value = cleanNumber(values[field.id]);
      if (value !== null) params.set(field.id, String(value));
    });
    const query = params.toString();
    return `${pathFor(id)}${query ? `?${query}` : ''}`;
  }

  function decode(search, fields) {
    const params = new URLSearchParams(search || '');
    const values = {};
    fields.forEach((field) => {
      const raw = params.get(field.id);
      if (raw === null) return;
      const value = cleanNumber(raw);
      if (value !== null) values[field.id] = value;
    });
    return values;
  }

  return { PATH_BY_ID, pathFor, cleanNumber, encode, decode };
});