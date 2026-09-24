# Evolium Toolkit

A **`@evolium-kit/toolkit`** é a biblioteca Angular partilhada por todos os
projectos da Evolium: componentes de UI temáveis por CSS custom properties,
layouts prontos, páginas de autenticação completas, e um kernel de serviços
100% baseado em plugins.

Um projecto novo deixa de recomeçar do zero o login, o shell da aplicação, os
componentes visuais e a comunicação com a API.

```ts
import { EvoButton, EvoCard } from '@evolium-kit/toolkit/components';
```

Este repositório é o **workspace** onde a toolkit é desenvolvida: contém a
library publicável em `projects/toolkit/`, e uma aplicação em `src/` que serve
de playground, onde tudo é exercitado antes de qualquer alteração ser dada por
terminada.

---

## Instalar num projecto

Guia completo, do token do GitHub ao primeiro componente a funcionar:

**➡️ [`INSTALL.md`](INSTALL.md)**

## Documentação

O índice completo, incluindo a referência de cada módulo, vive em
**[`docs/README.md`](docs/README.md)**. Atalhos directos:

| Se precisas de...                               | Lê                                                   |
| ----------------------------------------------- | ---------------------------------------------------- |
| Instalar a toolkit num projecto                 | [`INSTALL.md`](INSTALL.md)                           |
| Os primeiros passos depois de instalar          | [`docs/getting-started.md`](docs/getting-started.md) |
| Perceber porque a toolkit está organizada assim | [`docs/architecture.md`](docs/architecture.md)       |
| Personalizar o tema                             | [`docs/theming.md`](docs/theming.md)                 |
| Criar um recurso ligado à tua API               | [`docs/plugins.md`](docs/plugins.md)                 |
| Contribuir código para a toolkit                | [`docs/contributing.md`](docs/contributing.md)       |

## Desenvolver este repositório

```bash
npm ci

# dois terminais
npm run watch:lib     # reconstrói a library
npm start             # serve o playground em :4200
```

Guia completo de desenvolvimento, testes e publicação em
[`docs/contributing.md`](docs/contributing.md).

## Estrutura

```
projects/toolkit/   a library publicada (o que o consumidor instala)
src/                 playground — nunca publicado, sempre exercitado
docs/                documentação conceptual
tools/               verificação do artefacto e da instalação
```
