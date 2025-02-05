import { Language } from '../utils';

export class CreateEmailServerDto {
  to: string;
  subject: string;
  userName: string;
  language: Language;
}
