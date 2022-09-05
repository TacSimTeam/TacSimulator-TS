export interface IRegister {
  read(num: number): number;

  write(num: number, val: number): void;
}
