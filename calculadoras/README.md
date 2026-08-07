# Pythonzinho Calcula — MVP

Hub estático de calculadoras e simuladores online criado dentro do repositório `Pythonzinho`.

## O que está no MVP

- busca por calculadora/assunto;
- interface responsiva para desktop e celular;
- 12 ferramentas funcionais;
- simuladores de decisão;
- URLs amigáveis para SEO;
- cenários compartilháveis pela query string;
- comparação Cenário A × Cenário B nas simulações de longo prazo;
- análise de sensibilidade e pontos de equilíbrio em Comprar × Alugar;
- custos imobiliários detalhados opcionais com presets;
- botão `Copiar link`;
- gráficos SVG responsivos;
- metadados específicos por ferramenta;
- `robots.txt`, `404.html`, `_redirects` e `_headers` para Cloudflare Pages;
- testes automatizados no GitHub Actions;
- zero backend e zero dependência JavaScript externa.

## Ferramentas

1. Juros compostos
2. Financiamento Price
3. Porcentagem
4. Desconto
5. Regra de três
6. ROI
7. Margem e markup
8. Custo de combustível
9. À vista ou parcelado?
10. Amortizar ou investir?
11. Quando atinjo minha meta de patrimônio?
12. Comprar imóvel ou alugar e investir?

## Comparação Cenário A × Cenário B

`compare.js` adiciona um segundo conjunto de premissas em:

- Juros compostos;
- Financiamento Price;
- Meta de patrimônio;
- Comprar ou alugar.

O Cenário B começa com os valores do A, pode ser alterado campo a campo e pode ter horizonte diferente. Os gráficos passam automaticamente para o modo comparativo.

### Compartilhamento da comparação

O link completo preserva os dois cenários. O A usa os parâmetros normais e o B usa prefixo `b_`, além de `compare=1`.

Exemplo:

```text
/juros-compostos?initial=10000&monthly=500&annualRate=10&years=15&compare=1&b_initial=20000&b_monthly=800&b_annualRate=12&b_years=20
```

Abrir esse endereço reconstrói a comparação. Alterações no Cenário A preservam os parâmetros do B, e `Copiar link` copia o estado completo.

## Comprar ou alugar

A rota `/comprar-ou-alugar` compara o patrimônio líquido das duas estratégias no horizonte informado.

Premissas centrais:

- entrada disponível;
- financiamento Price;
- aluguel e reajuste;
- valorização do imóvel;
- retorno dos investimentos;
- custo anual consolidado do proprietário;
- horizonte da análise;
- orçamento habitacional mensal equivalente.

A cada mês, a alternativa com menor custo habitacional investe a diferença. Isso evita favorecer artificialmente uma estratégia apenas porque sua saída mensal começa menor.

## Custos imobiliários detalhados

Os custos detalhados começam em **zero** para preservar a compatibilidade de cenários antigos e ficam recolhidos em um bloco opcional no formulário.

O usuário pode informar:

- ITBI + cartório + registro como percentual do imóvel;
- corretagem/custos de venda;
- IPTU anual;
- manutenção anual;
- seguro mensal do proprietário;
- condomínio extraordinário mensal;
- imposto simplificado sobre ganhos positivos da carteira.

### Tratamento econômico

- custos iniciais de compra são considerados caixa efetivamente consumido pelo comprador;
- o cenário de aluguel recebe esse mesmo caixa como investimento inicial, mantendo igualdade de recursos;
- custos de venda reduzem o valor líquido do imóvel no horizonte analisado;
- custos recorrentes entram no orçamento mensal do proprietário;
- a tributação simplificada incide somente sobre ganho positivo estimado da carteira na hipótese de liquidação.

### Presets

`housing-costs.js` adiciona dois atalhos:

- **Aplicar referência detalhada**: exemplo editável com 4,5% de aquisição, 5% de venda, IPTU 0,6%, manutenção 0,8%, seguro R$100/mês, condomínio extraordinário R$150/mês e imposto simplificado de 15%;
- **Usar consolidado 1,5%**: mantém apenas o custo anual consolidado e zera os componentes detalhados.

Esses valores são apenas uma referência de modelagem, não uma tabela oficial de impostos, taxas ou custos imobiliários.

Como os componentes fazem parte de `calc.fields`, eles funcionam automaticamente com:

- Cenário A;
- Cenário B;
- `Copiar link`;
- restauração pela URL;
- gráficos;
- análise de sensibilidade.

## Sensibilidade e pontos de equilíbrio

`sensitivity-core.js` usa o mesmo `buyVsRentProjection()` para procurar mudanças de decisão sem duplicar a lógica do simulador.

O painel calcula automaticamente:

- **valorização anual de equilíbrio do imóvel**;
- **aluguel mensal inicial de equilíbrio**;
- **matriz 5 × 5** de valorização do imóvel × retorno dos investimentos.

O solver faz varredura da faixa e depois bisseção no cruzamento encontrado. Se não houver cruzamento, informa `fora da faixa` em vez de extrapolar um número artificial.

Quando custos detalhados estão ativos, os cards mostram também o threshold equivalente **sem custos detalhados**, permitindo visualizar quanto os custos de transação/posse deslocam a decisão.

Com o cenário padrão sem custos detalhados adicionais, os testes de regressão encontram aproximadamente:

- valorização do imóvel de equilíbrio: **6,38% a.a.**;
- aluguel inicial de equilíbrio: **R$ 3.225/mês**.

Esses números mudam com qualquer premissa do Cenário A, inclusive os novos custos.

## Arquitetura do cálculo

As fórmulas ficam em `formulas.js`, sem dependência do DOM e reutilizáveis no navegador e no Node.js.

Outros módulos principais:

- `app.js`: interface base;
- `decisions.js`: simuladores de decisão;
- `housing.js`: registro do simulador imobiliário;
- `housing-costs.js`: painel e presets de custos;
- `core-adapter.js`: integração das calculadoras originais com o núcleo;
- `compare.js`: Cenário B;
- `charts.js`: gráficos SVG;
- `sensitivity-core.js`: solver puro;
- `sensitivity.js`: apresentação da sensibilidade;
- `scenario.js` + `share.js`: serialização e compartilhamento.

## Testes automatizados

As suítes ficam em `calculadoras/tests/`:

- `core.test.js`: cálculos, séries temporais, links compartilháveis e Cenário A/B;
- `sensitivity.test.js`: pontos de equilíbrio, matriz e impacto dos custos;
- `housing-costs.test.js`: aquisição, venda, IPTU, tributação simplificada, compatibilidade e URL.

Para rodar localmente, com Node.js 18+:

```bash
node --test calculadoras/tests/*.test.js
```

Para verificar sintaxe:

```bash
for file in calculadoras/*.js; do node --check "$file"; done
```

O workflow `.github/workflows/calculadoras-tests.yml` executa essas verificações automaticamente em pushes e pull requests que alterem o MVP.

## URLs disponíveis

- `/juros-compostos`
- `/financiamento`
- `/porcentagem`
- `/desconto`
- `/regra-de-tres`
- `/roi`
- `/margem-e-markup`
- `/custo-de-combustivel`
- `/avista-ou-parcelado`
- `/amortizar-ou-investir`
- `/meta-de-patrimonio`
- `/comprar-ou-alugar`

## Gráficos

`charts.js` gera SVG diretamente no navegador, sem Chart.js ou D3, e também desenha comparações A × B.

## Rodar localmente

```bash
cd calculadoras
python -m http.server 8000
```

Acesse `http://localhost:8000`.

Um servidor HTTP simples não interpreta `_redirects`; as URLs amigáveis completas devem ser validadas no preview/deploy do Cloudflare Pages.

## Deploy no Cloudflare Pages

Use o repositório `rsucupira/Pythonzinho` com:

- Branch de produção: `master` depois do merge do PR;
- Framework preset: `None`;
- Build command: vazio;
- Build output directory: `calculadoras`.

## SEO

`routing.js` adapta por rota `<title>`, description, canonical, Open Graph, Twitter metadata e conteúdo principal.

Existe `sitemap.template.xml` com home + 12 ferramentas. Quando o domínio final estiver definido, substitua `{{BASE_URL}}`, publique como `sitemap.xml`, referencie no `robots.txt` e envie ao Google Search Console/Bing Webmaster Tools.

## Próximos passos sugeridos

1. Publicar o primeiro preview no Cloudflare Pages.
2. Conectar domínio/subdomínio e ativar `sitemap.xml`.
3. Expandir sensibilidade para Amortizar × Investir.
4. Criar presets de premissas macroeconômicas (conservador/base/agressivo).
5. Integrar APIs apenas para dados realmente atuais, como CDI e inflação.

## Aviso

Os resultados são estimativas educacionais. Valores reais podem envolver CET, regras contratuais, tributação específica, custos regionais, liquidez, risco e outras variáveis não modeladas.