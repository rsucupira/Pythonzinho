# Pythonzinho
Aulas de python

## Alunos:
#### https://github.com/joaquimsucupira/pythonzinho/
#### https://github.com/pedrosucupira/pythonzinho/

## Pythonzinho Calcula — MVP

Foi adicionado um MVP de hub de calculadoras e simuladores online na pasta [`calculadoras/`](./calculadoras/).

O MVP inclui busca, layout responsivo, 12 ferramentas funcionais, simuladores de decisão, URLs amigáveis, cenários compartilháveis, gráficos SVG e testes automatizados.

Entre os simuladores estão `à vista ou parcelado`, `amortizar ou investir`, `meta de patrimônio` e `comprar imóvel ou alugar e investir`.

Para testar localmente:

```bash
cd calculadoras
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

Os testes podem ser executados com:

```bash
node --test calculadoras/tests/*.test.js
```
