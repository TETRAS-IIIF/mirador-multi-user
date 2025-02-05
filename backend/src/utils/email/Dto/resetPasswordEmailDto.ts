import { Language } from '../utils';

export class ResetPasswordEmailDto {
  to: string;
  userName: string;
  token: string;
  language: Language;
}
