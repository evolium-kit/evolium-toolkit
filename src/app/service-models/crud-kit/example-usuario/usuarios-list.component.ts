import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  DataTabelaGenericaActionsDirective,
  DataTabelaGenericaComponent,
  DataTabelaGenericaHeader,
} from '../../../components/data-tabela-generica/data-tabela-generica';
import { usuarioCrud } from './usuario.controller';
import { Usuario } from './usuario.types';

/** Exemplo de listagem CRUD (fluxo Modal) usando o crud-kit. */
@Component({
  selector: 'app-usuarios-list',
  imports: [DataTabelaGenericaComponent, DataTabelaGenericaActionsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './usuarios-list.component.html',
})
export class UsuariosListComponent {
  readonly crud = usuarioCrud();

  readonly tableHeaders: DataTabelaGenericaHeader<Usuario>[] = [
    { key: 'nome', label: 'Nome' },
    { key: 'idade', label: 'Idade', classes: 'text-center' },
    { key: 'perfil', label: 'Perfil', cell: (row) => (row.perfil === 'admin' ? 'Administrador' : 'Padrão') },
  ];
}
