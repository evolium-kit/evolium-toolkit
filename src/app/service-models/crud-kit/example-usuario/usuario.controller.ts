import { createCrudController } from '../create-crud-controller';
import { UsuarioFormComponent } from './usuario-form.component';
import { Usuario, UsuarioDto } from './usuario.types';

/**
 * Controller CRUD do fluxo Modal. Chame `usuarioCrud()` dentro de um contexto de
 * injeção (ex: campo de classe de um componente).
 */
export const usuarioCrud = () =>
  createCrudController<Usuario, UsuarioDto>({
    resource: '/usuarios',
    formComponent: UsuarioFormComponent,
    titulos: {
      criar: 'Novo usuário',
      editar: 'Editar usuário',
    },
    display: {
      criar: 'modal',
      editar: 'modal',
    },
  });
