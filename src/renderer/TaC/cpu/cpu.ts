import { Register } from './register';

export class Cpu {
  private register: Register;

  constructor() {
    this.register = new Register();
  }
}
