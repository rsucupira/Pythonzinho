# Pythonzinho Calcula — MVP

Hub estático de calculadoras e simuladores online criado dentro do repositório `Pythonzinho`.

## O que está no MVP

- busca por calculadora/assunto;
- interface responsiva para desktop e celular;
- 12 ferramentas funcionais;
- simuladores de decisão;
- URLs amigáveis para SEO;
- cenários compartilháveis pela query string;
- comparação Cenário A × Cenário B;
- gráficos SVG responsivos;
- análise de sensibilidade em Comprar × Alugar e Amortizar × Investir;
- custos imobiliários detalhados opcionais;
- presets ilustrativos Conservador / Base / Otimista;
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
- Amortizar ou investir;
- Meta de patrimônio;
- Comprar ou alugar.

O Cenário B começa com os valores do A e pode ser alterado campo a campo. Quando há gráfico temporal compatível, as curvas são sobrepostas automaticamente. O B é preservado na URL com prefixo `b_` e `compare=1`.

Exemplo:

```text
/juros-compostos?initial=10000&monthly=500&annualRate=10&years=15&compare=1&b_initial=20000&b_monthly=800&b_annualRate=12&b_years=20
```

## Presets ilustrativos de cenário

`presets-core.js` concentra três perfis reutilizáveis e testáveis. `presets.js` os aplica aos formulários A e B.

### Conservador

- juros compostos / meta / retorno alternativo / amortizar: retorno de 6% a.a.;
- comprar × alugar: valorização do imóvel de 2% a.a., investimento de 6% a.a. e reajuste do aluguel de 4% a.a.

### Base

- juros compostos / meta / retorno alternativo / amortizar: retorno de 10% a.a.;
- comprar × alugar: valorização do imóvel de 4% a.a., investimento de 10% a.a. e reajuste do aluguel de 4% a.a.

### Otimista

- juros compostos / meta / retorno alternativo / amortizar: retorno de 12% a.a.;
- comprar × alugar: valorização do imóvel de 6% a.a., investimento de 12% a.a. e reajuste do aluguel de 4% a.a.

Esses perfis são **cenários ilustrativos**, não previsões de mercado. Eles não alteram automaticamente taxas contratuais como `mortgageRate` ou `debtRate`.

Como os presets escrevem diretamente nos campos existentes e disparam o mesmo fluxo da calculadora, resultado, gráfico, sensibilidade e URL são atualizados juntos.

## Amortizar ou investir — sensibilidade

`amortization-sensitivity-core.js` usa o mesmo `amortizeVsInvest()` do núcleo matemático.

O painel mostra:

- retorno mínimo do investimento para empatar com a amortização;
- custo da dívida em que investir e amortizar empatam;
- diferença atual em pontos percentuais;
- matriz 5 × 5 de custo da dívida × retorno esperado.

No modelo simplificado atual, o equilíbrio ocorre quando as taxas efetivas anuais se igualam. Exemplo: dívida a 14% a.a. exige retorno de 14% a.a. para o investimento empatar antes de impostos, risco e liquidez.

## Comprar ou alugar

A rota `/comprar-ou-alugar` compara patrimônio líquido da compra com aluguel + investimento usando orçamento habitacional mensal equivalente.

Premissas centrais:

- entrada disponível;
- financiamento Price;
- aluguel e reajuste;
- valorização do imóvel;
- retorno dos investimentos;
- custos recorrentes do proprietário;
- horizonte da análise.

## Custos imobiliários detalhados

Os componentes começam em zero para preservar compatibilidade com cenários antigos. O usuário pode informar:

- ITBI + cartório + registro;
- corretagem/custos de venda;
- IPTU anual;
- manutenção anual;
- seguro mensal do proprietário;
- condomínio extraordinário mensal;
- imposto simplificado sobre ganhos positivos da carteira.

`housing-costs.js` oferece dois atalhos editáveis:

- **Aplicar referência detalhada**: 4,5% aquisição, 5% venda, IPTU 0,6%, manutenção 0,8%, seguro R$100/mês, condomínio extraordinário R$150/mês e imposto simplificado 15%;
- **Usar consolidado 1,5%**: mantém apenas o custo anual consolidado.

Os números são referências de modelagem, não tabela oficial de custos.

## Comprar ou alugar — sensibilidade

`sensitivity-core.js` calcula com o mesmo `buyVsRentProjection()`:

- valorização anual de equilíbrio do imóvel;
- aluguel inicial de equilíbrio;
- matriz 5 × 5 de valorização × retorno de investimentos;
- threshold equivalente sem custos detalhados, quando esses custos estão ativos.

O solver faz varredura + bisseção e informa `fora da faixa` quando não encontra cruzamento.

No cenário padrão sem custos detalhados adicionais, os testes encontram aproximadamente:

- valorização de equilíbrio: **6,38% a.a.**;
- aluguel inicial de equilíbrio: **R$ 3.225/mês**.

## Arquitetura

Principais módulos:

- `formulas.js`: fórmulas e séries temporais;
- `app.js`: interface base;
- `decisions.js`: simuladores de decisão;
- `housing.js`: Comprar × Alugar;
- `housing-costs.js`: custos imobiliários opcionais;
- `core-adapter.js`: integração do núcleo testável;
- `compare.js`: Cenário B;
- `charts.js`: gráficos SVG;
- `sensitivity-core.js` / `sensitivity.js`: sensibilidade imobiliária;
- `amortization-sensitivity-core.js` / `amortization-sensitivity.js`: sensibilidade de amortização;
- `presets-core.js` / `presets.js`: cenários ilustrativos;
- `scenario.js` + `share.js`: serialização e compartilhamento.

## Testes automatizados

As suítes em `calculadoras/tests/` cobrem:

- fórmulas principais e séries;
- URLs e Cenário A/B;
- Comprar × Alugar;
- custos imobiliários;
- sensibilidade e pontos de equilíbrio;
- Amortizar × Investir e sua matriz;
- presets e garantia de não alterar taxas contratuais.

Para rodar localmente:

```bash
node --test calculadoras/tests/*.test.js
```

Para verificar sintaxe:

```bash
for file in calculadoras/*.js; do node --check "$file"; done
```

O workflow `.github/workflows/calculadoras-tests.yml` executa automaticamente essas verificações.

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

## Rodar localmente

```bash
cd calculadoras
python -m http.server 8000
```

Acesse `http://localhost:8000`.

Um servidor HTTP simples não interpreta `_redirects`; as rotas amigáveis completas devem ser validadas no Cloudflare Pages.

## Deploy no Cloudflare Pages

- repositório: `rsucupira/Pythonzinho`;
- branch de produção: `master` após merge;
- Framework preset: `None`;
- Build command: vazio;
- Build output directory: `calculadoras`.

## SEO

`routing.js` adapta `<title>`, description, canonical, Open Graph, Twitter metadata e conteúdo principal por rota. `sitemap.template.xml` contém home + 12 ferramentas e permanece como template até o domínio final ser definido.

## Próximos passos sugeridos

1. Publicar o primeiro preview no Cloudflare Pages.
2. Conectar domínio/subdomínio e ativar `sitemap.xml`.
3. Criar análise de sensibilidade para À Vista × Parcelado.
4. Criar um painel-resumo de premissas e decisões para impressão/PDF.
5. Integrar APIs somente para dados realmente atuais, como CDI e inflação.

## Aviso

Os resultados são estimativas educacionais. Valores reais podem envolver CET, impostos, tarifas, risco, liquidez, regras contratuais, custos regionais e outras variáveis não modeladas.
