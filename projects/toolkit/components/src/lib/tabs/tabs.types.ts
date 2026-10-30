/** Uma tab por dados, em `[tabs]` do `<evo-tab-list>`. Os painéis continuam compostos à mão. */
export interface EvoTabEntry {
  readonly value: string | number;
  readonly label: string;
  readonly disabled?: boolean;
}
