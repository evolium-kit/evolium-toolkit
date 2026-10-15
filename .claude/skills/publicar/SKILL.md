---
name: publicar
description: Publica uma versão nova da evolium-toolkit — valida o repositório, mostra a versão anterior e a nova, pede confirmação, corre a pipeline local do release.yml, faz commit "chore(release)", cria a tag vX.Y.Z e envia; o GitHub Actions publica. Usar quando o utilizador pedir para publicar, lançar, fazer release ou enviar uma versão nova da toolkit.
argument-hint: vX.Y.Z
---

# /publicar

Argumentos recebidos: `$ARGUMENTS`

Formato: `/publicar vX.Y.Z` (ex.: `/publicar v0.2.2`).

Este comando é um invólucro de `tools/publicar.mjs` (`npm run publicar`), que
faz o trabalho e as validações todas. **Nunca** substituir o script por
comandos git/npm à mão, e **nunca** correr `npm publish` (regra inviolável 7):
quem publica é o GitHub Actions, por causa da tag.

## 1. Versão

Se faltar a versão ou não for `vX.Y.Z`, pára e mostra o formato acima, com a
versão actual (`projects/toolkit/package.json`) e a sugestão do próximo patch,
minor e major. Não adivinhes a versão.

## 2. Pré-verificações (rápidas, sem alterar nada)

- `git status --porcelain` vazio. Se houver alterações, lista-as e pergunta se
  são para incluir num commit **antes** da release (não as incluas no commit
  `chore(release)`), ou se é para parar.
- A secção `## [Não publicado]` do `CHANGELOG.md` tem conteúdo. Se estiver
  vazia, propõe um texto (Keep a Changelog, em português, a partir de
  `git log v<anterior>..HEAD`) e só o escreve e faz commit depois de o
  utilizador aprovar.

## 3. Confirmação (PARAGEM OBRIGATÓRIA)

Mostra ao utilizador, e pergunta com `AskUserQuestion` (Publicar / Dry-run
primeiro / Cancelar):

- **Versão anterior → versão nova** (lida de `projects/toolkit/package.json`);
- as notas de `## [Não publicado]` que vão para `## [X.Y.Z] - <hoje>`;
- o que acontece a seguir: pipeline completa (alguns minutos), commit, tag,
  push, e publicação pelo GitHub Actions.

Não avances sem resposta explícita.

## 4. Correr

- **Publicar:** `npm run publicar -- --version vX.Y.Z --yes` (o `--yes` porque
  a confirmação já foi feita aqui; o script continua a validar tudo e a
  mostrar o resumo). Corre em primeiro plano com timeout longo (até 10 min).
- **Dry-run primeiro:** `npm run publicar -- --version vX.Y.Z --dry-run`;
  mostra o resultado e volta ao passo 3.

Se o script falhar, mostra a mensagem real (`✖ …`) e o passo em que parou.
Não tentes contornar a validação (ex.: `--no-verify`, apagar tags, `push
--force`); explica a causa e o que o utilizador pode fazer.

## 5. Resumo

No fim: versão publicada, commit e tag enviados, resultado do workflow (o
script acompanha-o com `gh`, se existir), e como actualizar no projecto
consumidor:

```bash
npm install @evolium-kit/toolkit@X.Y.Z
```
