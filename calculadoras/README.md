# Pythonzinho Calcula — MVP

Hub estático de calculadoras e simuladores online criado dentro do repositório `Pythonzinho`.

## O que está no MVP

- Busca por calculadora/assunto
- Interface responsiva para desktop e celular
- 11 ferramentas funcionais:
  - Juros compostos
  - Financiamento (Price)
  - Porcentagem
  - Desconto
  - Regra de três
  - ROI
  - Margem e markup
  - Custo de combustível
  - À vista ou parcelado?
  - Amortizar ou investir?
  - Quando atinjo minha meta de patrimônio?
- Simuladores de decisão com comparação econômica entre alternativas
- URLs por hash para abrir uma ferramenta diretamente, por exemplo: `#juros-compostos` ou `#avista-ou-parcelado`
- Zero dependência de backend: HTML + CSS + JavaScript

## Simuladores de decisão

### À vista ou parcelado?

Compara o preço à vista com o valor presente das parcelas usando uma taxa de retorno alternativa informada pelo usuário. Também exibe o total nominal parcelado e o ágio em relação ao preço à vista.

### Amortizar ou investir?

Compara, de forma simplificada, o benefício econômico de reduzir uma dívida com o valor futuro esperado de um investimento para o mesmo capital e horizonte.

### Quando atinjo minha meta?

Projeta o número de meses necessário para atingir um patrimônio-alvo a partir do patrimônio atual, aporte mensal e retorno anual esperado.

## Rodar localmente

Abra `index.html` diretamente no navegador ou use qualquer servidor HTTP simples.

Exemplo com Python:

```bash
cd calculadoras
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Deploy

### Cloudflare Pages

Use o repositório `rsucupira/Pythonzinho` e configure:

- Branch de produção: a branch escolhida para publicação
- Framework preset: None
- Build command: vazio
- Build output directory: `calculadoras`

### GitHub Pages

Uma opção simples é publicar a pasta `calculadoras` via GitHub Actions ou mover a aplicação para a raiz de uma branch dedicada de Pages.

## Próximos passos sugeridos

1. Publicar o MVP no Cloudflare Pages.
2. Conectar um domínio ou subdomínio próprio.
3. Criar páginas individuais por calculadora para SEO (`/juros-compostos/`, `/financiamento/`, `/avista-ou-parcelado/` etc.).
4. Adicionar gráficos nas simulações de longo prazo.
5. Salvar e compartilhar cenários por URL.
6. Adicionar testes automatizados das fórmulas.
7. Criar o simulador "comprar ou alugar".
8. Integrar APIs apenas para dados que realmente precisam ser atuais (CDI, inflação, cotações etc.).

## Aviso

Os resultados são estimativas educacionais. Cálculos financeiros reais podem envolver CET, impostos, tarifas, seguros, risco, liquidez, regras contratuais e outras variáveis não incluídas neste MVP.
