(() => {
  const routes = [
    { id: 'juros-compostos', path: '/juros-compostos', title: 'Calculadora de Juros Compostos Online', description: 'Calcule juros compostos, aportes mensais, patrimônio final e rendimento acumulado de forma rápida e gratuita.' },
    { id: 'financiamento', path: '/financiamento', title: 'Calculadora de Financiamento Price', description: 'Simule financiamento pela tabela Price e estime parcela, juros totais, custo final e taxa mensal equivalente.' },
    { id: 'porcentagem', path: '/porcentagem', title: 'Calculadora de Porcentagem Online', description: 'Calcule porcentagens, acréscimos e reduções de valores em segundos.' },
    { id: 'desconto', path: '/desconto', title: 'Calculadora de Desconto Online', description: 'Descubra o preço final, a economia e o percentual de desconto de uma compra.' },
    { id: 'regra-de-tres', path: '/regra-de-tres', title: 'Calculadora de Regra de Três', description: 'Resolva regra de três simples e proporções diretamente no navegador.' },
    { id: 'roi', path: '/roi', title: 'Calculadora de ROI', description: 'Calcule o retorno sobre investimento (ROI), lucro ou prejuízo de um projeto ou investimento.' },
    { id: 'margem-markup', path: '/margem-e-markup', title: 'Calculadora de Margem e Markup', description: 'Calcule lucro, margem sobre vendas, markup percentual e fator de markup.' },
    { id: 'combustivel', path: '/custo-de-combustivel', title: 'Calculadora de Custo de Combustível', description: 'Calcule litros necessários, custo de uma viagem e custo por quilômetro com base no consumo do veículo.' },
    { id: 'avista-ou-parcelado', path: '/avista-ou-parcelado', title: 'À Vista ou Parcelado? Simulador', description: 'Compare comprar à vista ou parcelado usando preço, parcelas e custo de oportunidade do dinheiro.' },
    { id: 'amortizar-ou-investir', path: '/amortizar-ou-investir', title: 'Amortizar ou Investir? Simulador', description: 'Compare o custo de uma dívida com o retorno esperado de um investimento e veja qual alternativa tende a ser mais vantajosa.' },
    { id: 'meta-de-patrimonio', path: '/meta-de-patrimonio', title: 'Calculadora de Meta de Patrimônio', description: 'Descubra em quanto tempo você pode alcançar uma meta de patrimônio com capital inicial, aportes e taxa de retorno.' }
  ];

  const byId = Object.fromEntries(routes.map((route) => [route.id, route]));
  const byPath = Object.fromEntries(routes.map((route) => [route.path, route]));
  const originalReplaceState = history.replaceState.bind(history);

  function normalizePath(pathname) {
    if (!pathname || pathname === '/') return '/';
    return pathname.replace(/\/+$/, '') || '/';
  }

  function setMeta(route) {
    const rootTitle = 'Pythonzinho Calcula — contas úteis em segundos';
    const rootDescription = 'Pythonzinho Calcula: hub gratuito de calculadoras e simuladores para dinheiro, finanças, compras, negócios e dia a dia.';
    const title = route ? `${route.title} | Pythonzinho Calcula` : rootTitle;
    const description = route ? route.description : rootDescription;
    const canonicalPath = route ? route.path : '/';

    document.title = title;

    let descriptionMeta = document.querySelector('meta[name="description"]');
    if (!descriptionMeta) {
      descriptionMeta = document.createElement('meta');
      descriptionMeta.name = 'description';
      document.head.appendChild(descriptionMeta);
    }
    descriptionMeta.content = description;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = new URL(canonicalPath, window.location.origin).href;

    const socialMeta = [
      ['property', 'og:title', title],
      ['property', 'og:description', description],
      ['property', 'og:url', canonical.href],
      ['property', 'og:type', 'website'],
      ['name', 'twitter:card', 'summary'],
      ['name', 'twitter:title', title],
      ['name', 'twitter:description', description]
    ];

    socialMeta.forEach(([attribute, key, value]) => {
      let tag = document.querySelector(`meta[${attribute}="${key}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, key);
        document.head.appendChild(tag);
      }
      tag.content = value;
    });

    if (route) {
      const eyebrow = document.querySelector('.hero .eyebrow');
      const heading = document.querySelector('#hero-title');
      const intro = document.querySelector('.hero > p');
      if (eyebrow) eyebrow.textContent = 'Calculadora online gratuita';
      if (heading) heading.innerHTML = `${route.title.replace(' Online', '').replace(' | Pythonzinho Calcula', '')}<br /><span>calcule agora.</span>`;
      if (intro) intro.textContent = route.description;
    }
  }

  history.replaceState = (state, unused, url) => {
    if (typeof url === 'string' && url.startsWith('#')) {
      const route = byId[url.slice(1)];
      if (route) {
        setMeta(route);
        return originalReplaceState(state, unused, route.path);
      }
    }
    return originalReplaceState(state, unused, url);
  };

  window.addEventListener('DOMContentLoaded', () => {
    const route = byPath[normalizePath(window.location.pathname)];
    const initialSearch = window.location.search;
    setMeta(route || null);

    if (route && typeof window.openCalculator === 'function') {
      window.openCalculator(route.id);
      if (initialSearch) {
        originalReplaceState(null, '', `${route.path}${initialSearch}`);
      }
      setMeta(route);
    }
  });
})();
