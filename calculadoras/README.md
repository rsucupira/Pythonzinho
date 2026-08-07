# Pythonzinho Calcula — MVP

Hub estático de calculadoras e simuladores online criado dentro do repositório `Pythonzinho`.

## O que está no MVP

- busca por calculadora/assunto;
- interface responsiva para desktop e celular;
- 11 ferramentas funcionais;
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

## Arquitetura do cálculo

As fórmulas foram centralizadas em `formulas.js`. Esse módulo não depende do DOM e funciona tanto no navegador quanto no Node.js.

A interface continua definida em `app.js` e `decisions.js`, enquanto `core-adapter.js` faz os resultados visuais consumirem o mesmo núcleo matemático usado pelos testes.

Os gráficos também usam as séries geradas pelo núcleo:

- `compoundSeries()` para juros compostos;
- `priceSchedule()` para financiamento;
- `targetSeries()` para meta de patrimônio.

Isso reduz o risco de o número exibido e o gráfico utilizarem premissas diferentes.

## Testes automatizados

A suíte está em:

```text
calculadoras/tests/core.test.js
```

Ela cobre, entre outros pontos:

- conversão de taxa anual para mensal;
- juros compostos;
- financiamento Price e saldo final zero;
- porcentagem;
- desconto;
- regra de três;
- ROI;
- margem e markup;
- custo de combustível;
- à vista vs. parcelado;
- amortizar vs. investir;
- meta de patrimônio;
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

## Cenários compartilháveis

`scenario.js` concentra a codificação e leitura dos parâmetros. `share.js` cuida apenas da integração com o formulário e a área de transferência.

Exemplo:

```text
/juros-compostos?initial=10000&monthly=500&annualRate=10&years=15
```

Ao abrir esse endereço, a ferramenta é preenchida e recalculada. Alterar os campos atualiza a URL; `Copiar link` copia o cenário atual; `Limpar` restaura o padrão.

O canonical continua apontando para a rota limpa, sem parâmetros.

## Gráficos

`charts.js` gera SVG diretamente no navegador, sem Chart.js ou D3.

### Juros compostos

- patrimônio projetado;
- capital aportado.

### Financiamento Price

- saldo devedor;
- amortização acumulada;
- juros acumulados.

### Meta de patrimônio

- patrimônio projetado;
- capital aportado;
- linha da meta.

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

`routing.js` adapta por rota:

- `<title>`;
- meta description;
- canonical;
- Open Graph;
- Twitter metadata;
- título e introdução visual.

Existe `sitemap.template.xml` com home + 11 ferramentas. Quando o domínio final estiver definido, substitua `{{BASE_URL}}`, publique como `sitemap.xml`, referencie no `robots.txt` e envie ao Google Search Console/Bing Webmaster Tools.

## Próximos passos sugeridos

1. Publicar o primeiro preview no Cloudflare Pages.
2. Conectar domínio/subdomínio e ativar `sitemap.xml`.
3. Criar o simulador `comprar ou alugar`.
4. Criar comparação lado a lado entre cenários.
5. Integrar APIs apenas para dados realmente atuais, como CDI e inflação.

## Aviso

Os resultados são estimativas educacionais. Cálculos financeiros reais podem envolver CET, impostos, tarifas, seguros, risco, liquidez, regras contratuais e outras variáveis não incluídas neste MVP.
