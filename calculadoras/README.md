# Pythonzinho Calcula — MVP

Hub estático de calculadoras e simuladores online criado dentro do repositório `Pythonzinho`.

## O que está no MVP

- busca por calculadora/assunto;
- interface responsiva para desktop e celular;
- 12 ferramentas funcionais;
- simuladores de decisão;
- URLs amigáveis para SEO;
- cenários compartilháveis pela query string;
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

## Comprar ou alugar

O simulador `/comprar-ou-alugar` compara o patrimônio líquido das duas estratégias no horizonte informado.

Premissas principais:

- a entrada disponível é usada na compra ou investida por quem aluga;
- o financiamento usa tabela Price;
- imóvel e aluguel podem crescer por taxas anuais diferentes;
- a carteira usa o retorno anual informado;
- custos recorrentes do proprietário são informados como percentual anual do valor do imóvel;
- a cada mês, as duas alternativas usam o mesmo orçamento habitacional e a opção com menor custo investe a diferença.

O resultado mostra patrimônio final em cada alternativa, valor do imóvel, saldo devedor, parcela inicial e aluguel final. O gráfico mostra a evolução de `Comprar` versus `Alugar + investir`.

Não estão incluídos no MVP custos de compra/venda, cartório, corretagem, impostos sobre investimentos, CET detalhado, tributação ou particularidades contratuais.

## Arquitetura do cálculo

As fórmulas foram centralizadas em `formulas.js`. Esse módulo não depende do DOM e funciona tanto no navegador quanto no Node.js.

A interface base está em `app.js` e `decisions.js`; `housing.js` registra o simulador imobiliário; `core-adapter.js` faz as calculadoras originais consumirem o núcleo testado.

Os gráficos usam séries geradas pelo mesmo núcleo:

- `compoundSeries()` para juros compostos;
- `priceSchedule()` para financiamento;
- `targetSeries()` para meta de patrimônio;
- `buyVsRentSeries()` para comprar vs. alugar.

## Testes automatizados

A suíte está em:

```text
calculadoras/tests/core.test.js
```

Ela cobre, entre outros pontos:

- conversão de taxa anual para mensal;
- juros compostos;
- financiamento Price e saldo final zero;
- porcentagem, desconto e regra de três;
- ROI, margem/markup e combustível;
- à vista vs. parcelado;
- amortizar vs. investir;
- meta de patrimônio;
- comprar vs. alugar;
- séries temporais usadas pelos gráficos;
- serialização e restauração de cenários pela URL.

Para rodar localmente, com Node.js 18+:

```bash
node --test calculadoras/tests/*.test.js
```

Para verificar apenas sintaxe:

```bash
for file in calculadoras/*.js; do node --check "$file"; done
```

O workflow `.github/workflows/calculadoras-tests.yml` executa automaticamente essas verificações em pushes e pull requests que alterem o MVP.

## URLs disponíveis

Após o deploy no Cloudflare Pages:

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

## Cenários compartilháveis

`scenario.js` concentra a codificação e leitura dos parâmetros. `share.js` cuida da integração com o formulário e a área de transferência.

Exemplo:

```text
/juros-compostos?initial=10000&monthly=500&annualRate=10&years=15
```

Ao abrir um endereço compartilhado, a ferramenta é preenchida e recalculada. Alterar os campos atualiza a URL; `Copiar link` copia o cenário atual; `Limpar` restaura o padrão.

O canonical continua apontando para a rota limpa, sem parâmetros.

## Gráficos

`charts.js` gera SVG diretamente no navegador, sem Chart.js ou D3.

- Juros compostos: patrimônio projetado × capital aportado.
- Financiamento Price: saldo devedor × amortização × juros.
- Meta de patrimônio: patrimônio × capital aportado × meta.
- Comprar vs. alugar: patrimônio líquido da compra × carteira de aluguel + investimento.

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

`routing.js` adapta por rota `<title>`, description, canonical, Open Graph, Twitter metadata e o conteúdo principal.

Existe `sitemap.template.xml` com home + 12 ferramentas. Quando o domínio final estiver definido, substitua `{{BASE_URL}}`, publique como `sitemap.xml`, referencie no `robots.txt` e envie ao Google Search Console/Bing Webmaster Tools.

## Próximos passos sugeridos

1. Publicar o primeiro preview no Cloudflare Pages.
2. Conectar domínio/subdomínio e ativar `sitemap.xml`.
3. Criar comparação lado a lado entre cenários.
4. Adicionar custos opcionais mais detalhados ao simulador imobiliário.
5. Integrar APIs apenas para dados realmente atuais, como CDI e inflação.

## Aviso

Os resultados são estimativas educacionais. Cálculos financeiros reais podem envolver CET, impostos, tarifas, seguros, risco, liquidez, regras contratuais e outras variáveis não incluídas neste MVP.
