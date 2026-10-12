# Recursos migrados para a toolkit

Registo dos componentes e serviços trazidos de outros projectos (modelos em
`src/app/component-models/` e `src/app/service-models/`) e padronizados para a
evolium-toolkit.

Cada migração faz-se com o comando `/migrar-recurso` (skill em
`.claude/skills/migrar-recurso/SKILL.md`):

```
/migrar-recurso c <componente-original> [nome-na-toolkit]
/migrar-recurso s <servico-original>    [nome-na-toolkit]
```

O comando actualiza este ficheiro no fim de cada migração.

**Estados:** `concluído` (build, testes e playground verificados) · `parcial`
(criado, mas falta algo; as notas dizem o quê) · `adiado` (decidido não migrar
por agora).

---

## Migrados

| Data       | Tipo       | Original                                           | Na toolkit                          | Caminho                          | Estado    | Notas                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ---------- | -------------------------------------------------- | ----------------------------------- | -------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| —          | componente | `SwitchButtonComponent` (`<app-switch-button>`)    | `EvoSwitch`                         | `components/src/lib/switch/`     | concluído | Migrado antes deste registo. Cores fixas passaram a tokens; `setDisabledState` implementado.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 2026-10-12 | componente | `FormFieldInputComponentV2` (`<form-input-field>`) | `EvoTextField` (`<evo-text-field>`) | `components/src/lib/text-field/` | concluído | **Sobreposição resolvida por composição:** usa `EvoField` + a classe `evo-input`, herda `--evo-input-*`/`--evo-field-*` (sem tokens de caixa próprios). Acrescentados: `hint`, `size`, `required` automático, `autocomplete`/`inputmode`/`maxlength`/`readonly`, `hideLabel`, erro automático do `NgControl` + `provideEvoTextFieldMessages()`, mostrar/ocultar senha, `[(value)]`, `showCount`, `clearable`, `autoResize`. 11 tokens `--evo-text-field-*` escolhidos por inquérito (inclui `ring-width`/`ring-offset` pedidos pelo utilizador). Corrigidos 6 bugs do original (ver README, "Migração"). Removidos `inline` e `bgTransparent`. **Por confirmar à vista:** o anel de foco só foi verificado pelos testes (o separador do browser estava oculto). |

## Por migrar

| Tipo       | Original                                                | Observações                                                                                                            |
| ---------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| componente | `component-models/input-field/whapper-auth-background/` | É um wrapper de ecrã inteiro (fundo de login com animações): provavelmente pertence a `layouts/`, não a `components/`. |
| serviço    | `service-models/Validacao.service.ts`                   | Sem HTTP: plugin utilitário (validadores puros + mensagens configuráveis). Nome sugerido: `validation`.                |
