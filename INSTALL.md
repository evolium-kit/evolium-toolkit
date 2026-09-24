# Instalar a @evolium-kit/toolkit num projecto

Guia completo, do zero até teres a toolkit a funcionar. Lê-o pela ordem — cada
passo assume que o anterior está feito.

Se já instalaste a toolkit antes e só precisas de recuperar o token, salta
para [Obter o token no GitHub](#obter-o-token-no-github).

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Obter o token no GitHub](#obter-o-token-no-github)
3. [Configurar o npm na tua máquina](#3-configurar-o-npm-na-tua-máquina)
4. [Dizer ao projecto onde procurar o pacote](#4-dizer-ao-projecto-onde-procurar-o-pacote)
5. [Instalar e configurar](#5-instalar-e-configurar)
6. [Rever o `styles.css`](#6-rever-o-stylescss)
7. [`withComponentInputBinding()` — passo manual](#7-withcomponentinputbinding--passo-manual)
8. [Theme Studio](#8-theme-studio)
9. [Confirmar que funciona](#9-confirmar-que-funciona)
10. [Ligar ao teu backend](#10-ligar-ao-teu-backend)
11. [Resolução de problemas](#11-resolução-de-problemas)

---

## 1. Pré-requisitos

| Requisito    | Versão                                 |
| ------------ | -------------------------------------- |
| Node.js      | 20.19+, 22.12+ ou 24+                  |
| Angular      | 21.2+                                  |
| Conta GitHub | com acesso à organização `evolium-kit` |

Confirma a tua versão do Node antes de continuares:

```bash
node --version
```

Se o teu projecto ainda não existir, cria-o primeiro com `ng new` — a toolkit
instala-se sobre uma aplicação Angular já criada, não substitui o `ng new`.

---

## 2. Obter o token no GitHub

A `@evolium-kit/toolkit` é publicada no **GitHub Packages**, não no npm
público. Para instalar precisas de um **Personal Access Token (PAT)** — é a
tua credencial pessoal para o npm conseguir autenticar-se junto do GitHub.

> **Se és novo na equipa:** pede a alguém que já tenha acesso para confirmar
> que a tua conta GitHub está na organização `evolium-kit` antes de começares.
> Sem isso, o token que crias não vai servir para nada.

### 2.1 Criar o token

1. Abre **[github.com](https://github.com)** e inicia sessão com a tua conta.
2. Clica no teu avatar, no canto superior direito, e escolhe **Settings**.
3. No menu da esquerda, desce até ao fim e abre **Developer settings**.
4. Vai a **Personal access tokens** → **Tokens (classic)**.

   > **Tem de ser "classic".** Os tokens _fine-grained_ (a opção acima) ainda
   > não funcionam de forma fiável com o registry npm do GitHub Packages. Se
   > escolheres o tipo errado, a instalação falha com `401 Unauthorized` e não
   > é óbvio porquê.

5. Clica em **Generate new token** → **Generate new token (classic)**.
6. Pode ser-te pedido para confirmares a password ou um código 2FA.
7. Preenche o formulário:

   | Campo             | O que pôr                                                                                        |
   | ----------------- | ------------------------------------------------------------------------------------------------ |
   | **Note**          | algo que te lembre o motivo, ex.: `npm — evolium-kit packages`                                   |
   | **Expiration**    | 90 dias. Evita "No expiration" — um token que nunca expira é um risco de segurança desnecessário |
   | **Select scopes** | ver tabela abaixo                                                                                |

8. Marca **apenas** estes scopes:

   | Scope              | Quando marcar                                                |
   | ------------------ | ------------------------------------------------------------ |
   | ☑ `read:packages`  | **sempre** — é o que permite instalar pacotes                |
   | ☑ `repo`           | só se o repositório `evolium-toolkit` for **privado**        |
   | ☐ `write:packages` | **nunca precisas** — quem publica é o GitHub Actions, não tu |

   Não marques mais nada. Um token com menos scopes do que precisa dá erro
   óbvio; um token com scopes a mais é um risco que não traz benefício nenhum.

9. Desce até ao fim e clica **Generate token**.

### 2.2 Copiar o token — só tens esta oportunidade

O GitHub mostra o token **uma única vez**, numa caixa verde a começar por
`ghp_`. Copia-o imediatamente para um local seguro (o passo seguinte já o usa).

> Se saíres desta página sem copiar, não há forma de o recuperar — tens de
> gerar um token novo e apagar o antigo.

**Nunca faças isto com o token:**

- ❌ colar num ficheiro do repositório (`.npmrc`, `.env` committado, um
  commit, um comentário de código)
- ❌ colar num chat, num Slack, num email
- ❌ guardar num ficheiro de texto sem encriptação no ambiente de trabalho

Um token exposto tem de ser **revogado imediatamente** em
Settings → Developer settings → Personal access tokens, mesmo que tenhas a
certeza de que ninguém o viu.

### 2.3 Autorizar a organização (SSO)

Se a organização `evolium-kit` usar SSO (Single Sign-On), aparece um botão
**Configure SSO** ao lado do token recém-criado, na lista de tokens. Clica
nele, escolhe `evolium-kit` e autoriza. Sem este passo, o token está criado
mas o GitHub recusa-o sempre que tentares aceder a algo da organização — o
erro típico é `403 Forbidden`, não `401`.

Se o botão não aparecer, a organização não usa SSO e podes ignorar este passo.

---

## 3. Configurar o npm na tua máquina

Este passo faz-se **uma vez por máquina**, não por projecto.

### 3.1 Guardar o token numa variável de ambiente

Guarda o token na variável `GITHUB_PACKAGES_TOKEN` — nunca em `GITHUB_TOKEN`
(explico porquê mais abaixo).

**Windows — PowerShell** (o token não aparece no ecrã nem fica no histórico):

```powershell
$t = Read-Host 'Cola o token' -AsSecureString
[Environment]::SetEnvironmentVariable('GITHUB_PACKAGES_TOKEN', [System.Net.NetworkCredential]::new('', $t).Password, 'User')
```

Cola o token quando o terminal pedir e carrega Enter.

**macOS / Linux — bash ou zsh:**

```bash
read -rs GITHUB_PACKAGES_TOKEN
echo "export GITHUB_PACKAGES_TOKEN=$GITHUB_PACKAGES_TOKEN" >> ~/.bashrc   # ou ~/.zshrc
unset GITHUB_PACKAGES_TOKEN
```

Cola o token quando o terminal pedir (não aparece no ecrã) e carrega Enter.

> **Porquê `GITHUB_PACKAGES_TOKEN` e não `GITHUB_TOKEN`?** O GitHub CLI (`gh`)
> e muitas ferramentas de CI lêem `GITHUB_TOKEN` automaticamente. Se puseres o
> teu PAT de `read:packages` nessa variável, essas ferramentas passam a
> tentar usá-lo para tudo — incluindo operações que ele não tem permissão
> para fazer — e os comandos falham de forma confusa.

### 3.2 Dizer ao npm para usar essa variável

Abre (ou cria) o `.npmrc` da tua conta de utilizador:

- Windows: `C:\Users\<o-teu-utilizador>\.npmrc`
- macOS/Linux: `~/.npmrc`

**Nunca o projecto** — é sempre este ficheiro pessoal, fora de qualquer
repositório. Acrescenta a linha:

```ini
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

Podes fazer isto de uma vez pelo terminal:

```powershell
# PowerShell
Add-Content -Path "$HOME\.npmrc" -Value '//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}'
```

```bash
# bash/zsh
echo '//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}' >> ~/.npmrc
```

As **aspas simples** são importantes: é o npm que tem de ler
`${GITHUB_PACKAGES_TOKEN}` quando precisar dele, e não a tua shell a expandir
o valor agora. Desta forma, o ficheiro guarda só o _nome_ da variável — nunca
o token em si — mesmo que alguém abra este ficheiro.

### 3.3 Reiniciar o terminal

Fecha **todos** os terminais e editores abertos (incluindo o VS Code) e
volta a abri-los. As variáveis de ambiente só são lidas quando o processo
arranca — sem isto, o passo seguinte falha com um erro confuso.

### 3.4 Confirmar que a autenticação funciona

```bash
npm whoami --registry=https://npm.pkg.github.com
```

Tem de devolver o teu nome de utilizador do GitHub. Se não devolver, ver
[Resolução de problemas](#11-resolução-de-problemas) antes de continuares —
nenhum passo seguinte funciona sem isto.

---

## 4. Dizer ao projecto onde procurar o pacote

Este passo é **por projecto** (ao contrário do anterior, que é por máquina).

Na raiz do teu projecto Angular, cria um ficheiro `.npmrc`:

```ini
@evolium-kit:registry=https://npm.pkg.github.com
always-auth=true
```

Este ficheiro **não tem nenhum token** — só diz ao npm que qualquer pacote do
scope `@evolium-kit` vem do GitHub Packages, e não do registry público. Por
isso é seguro fazer commit dele; a equipa toda o partilha.

---

## 5. Instalar e configurar

Com os passos 2 a 4 feitos, instala:

```bash
ng add @evolium-kit/toolkit
```

> **Se aparecer o aviso "The package does not provide any `ng add`
> actions"**, o pacote instalou-se na mesma — só o passo seguinte falhou.
> Corre imediatamente:
>
> ```bash
> ng generate @evolium-kit/toolkit:ng-add
> ```
>
> **Porquê isto acontece:** o `ng add` consulta os metadados do pacote no
> registry _antes_ de instalar, para decidir se avança. O GitHub Packages
> devolve aqui uma versão abreviada desses metadados, sem campos
> personalizados como `schematics` — por isso o Angular CLI conclui (por
> engano) que o pacote não tem nada para configurar. É uma limitação do
> GitHub Packages como registry, não um problema do pacote: o
> `ng generate` lê o `package.json` já instalado em disco, onde o campo
> `schematics` está correcto, e funciona sempre.

O schematic faz-te perguntas para configurar a tua aplicação.

| Pergunta                           | O que significa                     | Resposta típica           |
| ---------------------------------- | ----------------------------------- | ------------------------- |
| `baseUrl` da API                   | onde vive o teu backend             | `/api`, ou o URL completo |
| Registar o plugin de autenticação? | login, registo, recuperar senha     | sim                       |
| Acrescentar as rotas `/auth/*`?    | páginas de login prontas a usar     | sim                       |
| Registar o Theme Studio?           | ferramenta visual de personalização | sim                       |

A seguir, altera três ficheiros por ti, sem que precises de fazer nada:

- **`src/app/app.config.ts`** — acrescenta `provideHttpClient` (com o
  interceptor do kernel), `provideEvoServices`, `provideEvoTheme` e
  `provideEvoComponents`.
- **`src/styles.css`** — acrescenta a declaração `@layer` como primeira
  linha, e os `@import` das três folhas de estilo da toolkit.
- **`src/app/app.routes.ts`** — acrescenta `...evoAuthRoutes()`.

Podes correr `ng add @evolium-kit/toolkit` (ou `ng generate @evolium-kit/toolkit:ng-add`,
se foi esse o que usaste) outra vez mais tarde sem problemas: não duplica
providers, estilos nem rotas.

---

## 6. Rever o `styles.css`

Confirma que o `src/styles.css` começa exactamente assim:

```css
@layer theme, base, evo.tokens, evo.base, evo.components, evo.variants, evo.overrides,
  components, utilities;

@import 'tailwindcss'; /* só se já usares Tailwind no projecto */
@import '@evolium-kit/toolkit/styles/evolium-theme.css';
@import '@evolium-kit/toolkit/styles/evolium-components.css';
@import '@evolium-kit/toolkit/styles/evolium-layouts.css';
```

A linha `@layer` **tem de ser a primeira regra do ficheiro**, antes de
qualquer `@import`. Se ficar depois, as classes utilitárias do Tailwind
deixam de ganhar às regras da toolkit — e o sintoma é confuso: uma classe
`class="evo-button p-6"` parece não fazer nada.

---

## 7. `withComponentInputBinding()` — passo manual

> O `ng add` só te avisa deste passo na consola; ainda não o faz sozinho.

As páginas de login, registo e recuperação de senha recebem as suas opções
(por exemplo, para onde redireccionar depois de entrar) através do `data` da
rota. É o `withComponentInputBinding()` que liga esses dados aos componentes.

Abre `src/app/app.config.ts` e confirma que o `provideRouter` tem esta
feature:

```ts
import { provideRouter, withComponentInputBinding } from '@angular/router';

// …
providers: [
  provideRouter(routes, withComponentInputBinding()),
  // …
];
```

Sem isto, as páginas de autenticação abrem à mesma, mas ignoram
silenciosamente as opções que lhes tentes passar — não há erro nem aviso.

---

## 8. Theme Studio

**A partir da versão 0.1.1, isto é automático.** Se respondeste "sim" à
pergunta "Registar o Theme Studio?" no passo 5, o `ng-add` já acrescentou
`provideEvoThemeStudio()` como a primeira entrada de `providers`, guardado
por `isDevMode()` — não precisas de fazer nada aqui.

> **Instalaste com a versão 0.1.0?** Essa versão perguntava, mas não
> registava nada — `/_evo/theme` dava sempre 404, mesmo respondendo "sim".
> Corrige com:
>
> ```bash
> npm install @evolium-kit/toolkit@latest
> ng generate @evolium-kit/toolkit:ng-add
> ```
>
> Ou, à mão, em `src/app/app.config.ts`:
>
> ```ts
> import { isDevMode } from '@angular/core';
> import { provideEvoThemeStudio } from '@evolium-kit/toolkit/pages';
>
> providers: [
>   ...(isDevMode() ? [provideEvoThemeStudio()] : []),
>   provideRouter(routes, withComponentInputBinding()),
>   // …
> ];
> ```
>
> **A ordem importa.** Se `provideEvoThemeStudio()` vier depois do
> `provideRouter`, uma rota `**` (catch-all) da tua aplicação intercepta
> `/_evo/theme` antes de o Studio a conseguir usar — aparece um aviso
> explícito na consola do browser, em desenvolvimento, se isto acontecer.

---

## 9. Confirmar que funciona

```bash
ng serve
```

Verifica:

- **`http://localhost:4200/auth/login`** mostra a página de login da toolkit.
- **`http://localhost:4200/_evo/theme`** abre o Theme Studio (só existe em
  desenvolvimento — desaparece automaticamente numa build de produção).
- Um componente da toolkit funciona num ficheiro teu:

  ```ts
  import { Component } from '@angular/core';
  import { EvoButton } from '@evolium-kit/toolkit/components';

  @Component({
    selector: 'app-exemplo',
    imports: [EvoButton],
    template: `<button evoButton>Funciona</button>`,
  })
  export class Exemplo {}
  ```

Se tudo isto funcionar, a instalação está completa.

> **A raiz (`/`) também dá 404?** Isso é esperado, não é a toolkit — o
> `ng add` só acrescenta rotas para `/auth/*`. Um projecto novo não tem
> nenhuma rota para o caminho vazio (`''`) enquanto não a criares tu:
>
> ```ts
> // app.routes.ts
> export const routes: Routes = [
>   { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
>   ...evoAuthRoutes(),
> ];
> ```
>
> Confirma também que `app.html` ainda tem `<router-outlet />` — se o
> substituíste por conteúdo teu (por exemplo para testar um componente),
> o router deixa de ter onde mostrar o que for encontrado.

---

## 10. Ligar ao teu backend

O plugin de autenticação já vem com a lógica de login, registo, renovação de
sessão e recuperação de senha — só precisa que o teu backend responda a
estes endpoints, relativos ao `baseUrl` que indicaste no passo 5:

| Método | Caminho                  | Corpo da resposta                                                     |
| ------ | ------------------------ | --------------------------------------------------------------------- |
| `POST` | `/auth/login`            | `{ access_token, expires_in, user: { id, email, full_name, roles } }` |
| `POST` | `/auth/register`         | igual ao login                                                        |
| `POST` | `/auth/refresh`          | igual ao login                                                        |
| `POST` | `/auth/password/recover` | vazia                                                                 |
| `POST` | `/auth/logout`           | vazia                                                                 |

Para os recursos próprios da tua aplicação (facturas, clientes, o que for), a
toolkit gera o esqueleto todo por ti:

```bash
ng g @evolium-kit/toolkit:resource-plugin facturas
```

Ver [`docs/plugins.md`](docs/plugins.md) para o guia completo de como um
plugin de serviço funciona por dentro.

---

## 11. Resolução de problemas

| Sintoma                                                          | Causa provável                                                              | Como resolver                                                                                  |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm whoami` dá `401 Unauthorized`                               | token errado, expirado, ou o terminal não foi reiniciado                    | gera um token novo (passo 2) e confirma que reiniciaste **todos** os terminais                 |
| `npm whoami` dá `403 Forbidden`                                  | falta autorizar o SSO da organização                                        | passo [2.3](#23-autorizar-a-organização-sso)                                                   |
| `npm install` dá `404 Not Found` para `@evolium-kit/toolkit`     | o `.npmrc` do projecto não existe ou está mal escrito                       | confere o passo 4 — o scope tem de ser exactamente `@evolium-kit:registry=…`                   |
| `npm install` dá `ENEEDAUTH`                                     | a linha no `~/.npmrc` da máquina está em falta ou mal escrita               | confere o passo 3.2; confirma que o ficheiro é o da tua conta de utilizador, não o do projecto |
| As classes da toolkit "não fazem nada"                           | a declaração `@layer` não é a primeira linha do `styles.css`                | passo 6                                                                                        |
| Uma página de login ignora `redirectTo`                          | falta `withComponentInputBinding()`                                         | passo 7                                                                                        |
| `/_evo/theme` dá 404, ou mostra a página errada                  | `provideEvoThemeStudio()` está depois do `provideRouter`, ou está em falta  | passo 8 — olha também à consola do browser, o aviso diz exactamente isto                       |
| `ng add` corre mas nada muda no `app.config.ts`                  | o símbolo já existia (o `ng add` não duplica)                               | confere manualmente se já está lá; se não estiver, corre `ng add` outra vez                    |
| `ng add` diz "The package does not provide any `ng add` actions" | limitação do GitHub Packages nos metadados do registry — não é um erro real | corre `ng generate @evolium-kit/toolkit:ng-add` — ver o aviso no passo 5                       |

Se nada disto resolver, confirma primeiro com `npm whoami` (passo 3.4) — a
maior parte dos problemas de instalação vêm de aí, não do projecto.
