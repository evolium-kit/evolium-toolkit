import { Injectable } from "@angular/core";
import { AbstractControl, FormGroup, ValidationErrors } from "@angular/forms";

/**
 * `nome@dominio.tld`. Mais exigente que o `Validators.email` do Angular, que aceita
 * `a@b` — um endereço sem domínio de topo nunca é o que o utilizador queria escrever.
 */
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

@Injectable({ providedIn: "root" })
export class ValidacaoService {
  messages = {
    email: "Email inválido",
    emailInvalido: "Email inválido",
    required: "Campo é obrigatório",
    menorDeIdade: "Usuário menor de idade",
    minlength: "Caracteres insuficiente",
    senhasDiferentes: "As senha não coincidem",
    telefoneInvalido: "Numéro de telefone inválido",
    biInvalido: "Bilhete de indentidade inválido",
    nifInvalido: "NIF inválido",
    imeiInvalido: "IMEI inválido",
    anoInvalido: "Ano inválido",
  } as const;
  // getErro(form: FormGroup, campo: string) {
  //   const erros = form.get(campo)?.errors;
  //   const firstKey = erros ? Object.keys(erros)[0] as keyof typeof this.messages : null;
  //   const message = firstKey ? this.messages[firstKey] : null;
  //   return message
  // }
  getErro(campo: string): string | null;
  getErro(form: FormGroup, campo: string): string | null;

  // 2. Implementação Única (A lógica real)
  getErro(formOuCampo: FormGroup | string, campoOpcional?: string): any {
    // Caso 1: Recebeu apenas o campo (string) -> Retorna a função que aguarda o FormGroup
    if (typeof formOuCampo === 'string') {
      const campo = formOuCampo;
      return (form: FormGroup) => this.extrairErro(form, campo);
    }
    // Caso 2: Recebeu o FormGroup e o campo -> Executa e retorna direto
    const form = formOuCampo as FormGroup;
    const campo = campoOpcional!;
    return this.extrairErro(form, campo);
  }
  private extrairErro(form: FormGroup, campo: string): string | null {
    const control = form.get(campo);
    if (control && !control.touched) return null;


    const erros = form.get(campo)?.errors;
    if (!erros) return null;
    const firstKey = Object.keys(erros)[0] as keyof typeof this.messages;
    const valor = erros[firstKey];
    // Se o erro já vem com a mensagem pronta (ex: erro de API), usa direto
    if (typeof valor === 'string' && valor.trim() !== '') return valor;

    return this.messages[firstKey] || null;
  }
  /** Valida se o utilizador tem pelo menos 18 anos */
  maiorDeIdadeValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const nascimento = new Date(control.value);
    const hoje = new Date();
    const idade = hoje.getFullYear() - nascimento.getFullYear();
    const aniversarioPassou =
      hoje.getMonth() > nascimento.getMonth() ||
      (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() >= nascimento.getDate());

    return idade > 18 || (idade === 18 && aniversarioPassou) ? null : { menorDeIdade: true };
  }

  validarNif(control: AbstractControl): ValidationErrors | null{
   if (!control.value) return null;
    const nif = control.value;


    const cleaned = nif.trim();
    // Pessoa Singular: 9N 2L 3N (ex: 003093887BE036)
    const regexSingular = /^\d{9}[A-Za-z]{2}\d{3}$/;
    // Pessoa Coletiva: 10N (ex: 5419011735)
    const regexColetiva = /^\d{10}$/;
    return (regexSingular.test(cleaned) || regexColetiva.test(cleaned)) ? null : { nifInvalido: true };
  }

  /**
   * Valida o email. Usar em vez do `Validators.email`: dá o erro `emailInvalido`, com
   * mensagem própria, e recusa endereços sem domínio de topo.
   */
  validarEmail(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const cleaned = control.value.toString().trim();
    return REGEX_EMAIL.test(cleaned) ? null : { emailInvalido: true };
  }

  // Validar numero de telefone
  validarTelefone(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    //Validators.pattern(/^\+?(244\s|)?\d{3}\s?\d{3}\s?\d{3}$/)
    const cleaned = control.value.trim();
    const regex = /^\d{9}$/;
    return regex.test(cleaned) ? null : { telefoneInvalido: true };
  }
  /**
   * IMEI do rastreador — só dígitos. O IMEI tem 15, mas o campo do formulário também
   * recebe números de série mais curtos, por isso aceita de 9 a 15.
   */
  validarImei(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const cleaned = control.value.toString().trim();
    return /^\d{9,15}$/.test(cleaned) ? null : { imeiInvalido: true };
  }

  /**
   * Ano de 4 dígitos entre 1950 e o ano seguinte ao actual — os modelos do ano que vem
   * já são matriculados, mas um ano mais à frente do que isso é engano de escrita.
   */
  validarAno(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const cleaned = control.value.toString().trim();
    if (!/^\d{4}$/.test(cleaned)) return { anoInvalido: true };

    const ano = Number(cleaned);
    return ano >= 1950 && ano <= new Date().getFullYear() + 1 ? null : { anoInvalido: true };
  }

  validarBilheteIdentidade(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    //Validators.pattern(/^\+?(244\s|)?\d{3}\s?\d{3}\s?\d{3}$/)
    const cleaned = control.value.trim();
    const regex = /^\d{9}[A-Z-a-z]{2}\d{3}$/;
    return regex.test(cleaned) ? null : { biInvalido: true };
  }
  /** Valida se senha e confirmar_senha são iguais (validator a nível do grupo) */
  senhasIguaisValidator(campoSenha: string, campoConfirmar: string) {
    return (group: AbstractControl): ValidationErrors | null => {
      const senha = group.get(campoSenha)?.value;
      const confirmar = group.get(campoConfirmar);

      if (!confirmar) return null;

      if (senha !== confirmar.value) {
        confirmar.setErrors({ ...confirmar.errors, senhasDiferentes: true });
        return { senhasDiferentes: true };
      }

      const errosRestantes = { ...confirmar.errors };
      delete errosRestantes['senhasDiferentes'];
      confirmar.setErrors(Object.keys(errosRestantes).length ? errosRestantes : null);

      return null;
    };
  }

  degubarCamposInvalido(form: FormGroup) {
    Object.keys(form.controls).forEach(campo => {
      const control = form.get(campo);
      if (control?.invalid) {
        console.log(`${campo}:`, control.errors);
      }
    });
    console.log('Erros do grupo:', form.errors);
  }
  // Máscara simplificada de validação para Endereço MAC (XX:XX:XX:XX:XX:XX)
  macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
}
