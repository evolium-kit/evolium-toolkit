export interface Usuario {
  id: number;
  nome: string;
  idade: number;
  perfil: 'admin' | 'padrao';
}

export interface UsuarioDto {
  nome: string;
  idade: number;
  perfil: 'admin' | 'padrao';
}
