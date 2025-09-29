import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService as MailerMain } from '@nestjs-modules/mailer';
import { MailService } from './IMailService';
import { CustomLogger } from '../Logger/CustomLogger.service';
import { ConfirmationEmailDto } from './Dto/ConfirmationEmailDto';
import { confirmationEmailTemplateEnglish } from './templates/confirmationMail/English';
import { JwtService } from '@nestjs/jwt';
import { resetPasswordEnglish } from './templates/resetPassword/ResetPasswordEnglish';
import { ResetPasswordEmailDto } from './Dto/resetPasswordEmailDto';
import { confirmationEmailTemplateFrench } from './templates/confirmationMail/French';
import { Language } from './utils';
import { resetPasswordFrench } from './templates/resetPassword/French';

@Injectable()
export class EmailServerService implements MailService {
  private readonly logger = new CustomLogger();

  constructor(
    private readonly mailerMain: MailerMain,
    private readonly jwtService: JwtService,
  ) {}

  private _confirmMailTemplate(
    url: string,
    name: string,
    language: string,
  ): string {
    switch (language) {
      case Language.ENGLISH:
        return confirmationEmailTemplateEnglish({ url, name });
      case Language.FRENCH:
        return confirmationEmailTemplateFrench({ url, name });
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  private _passwordResetTemplate(
    url: string,
    name: string,
    language: Language,
  ): string {
    switch (language) {
      case Language.ENGLISH:
        return resetPasswordEnglish({ url, name });
      case Language.FRENCH:
        return resetPasswordFrench({ url, name });
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }

  async sendTestMail() {
    try {
      const subject = 'Test Mail';
      const mailBody = `
      <h2>📬 Test Email</h2>
      <p>This is a test email sent from your NestJS backend.</p>
      <p>If you're seeing this, then your mail service is working properly ✅</p>
      <hr />
      <p style="font-size: 12px; color: gray;">This is an automated message. No action is required.</p>
    `;

      const textBody = `
Test Email

This is a test email sent from your NestJS backend.

If you're seeing this, then your mail service is working properly ✅

(This is an automated message. No action is required.)
    `;
      await this.sendMail({
        to: process.env.ADMIN_MAIL,
        subject: subject,
        body: mailBody,
        text: textBody,
      });
    } catch (error) {
      this.logger.error('An error occured', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  //UNCOMMENT FOR TESTS
  async sendMailSandBox() // email: CreateEmailServerDto
  : Promise<void> {
    //   // Generate the template directly using the data
    //   const renderedTemplate = this._bodyTemplate();
    //
    //   // Send the email with the rendered HTML
    //   await this._processSendEmail(
    //     email.to,
    //     email.subject,
    //     email.text,
    //     renderedTemplate,
    //   );
    // }
    //
    // /**
    //  * Generate the HTML email body from the given data using a template.
    //  *
    //  * @param {Object} data - The data object to be passed to the template.
    //  * @return {string} The rendered HTML template.
    //  */
    // _bodyTemplate(): string {
    //   // Use the template function to generate the HTML content
    //   return accountCreationTemplate({
    //     userName: 'Antoine',
    //   });
  }

  async sendInternalServerErrorNotification(details: {
    message: string;
    url: string;
    method: string;
    timestamp: string;
    body: any;
    user: {
      id: number;
      email: string;
      name: string;
    };
    stack: string;
  }) {
    if (!process.env.SMTP_DOMAIN) {
      return;
    }

    // Hide sensitive fields
    if (details.body?.password) {
      details.body.password = 'HIDDEN_USER_PASSWORD_TRY';
    }

    console.log('Send mail internal server error');

    const subject = `🚨 Internal Server Error: ${details.url}`;

    // Format JSON fields for readability
    const formattedBody = JSON.stringify(details.body, null, 2)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const formattedStack = details.stack
      ? `<pre style="background: #fee; padding: 10px; border-radius: 5px; white-space: pre-wrap; color: darkred;">${details.stack.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`
      : '<p>No stack trace available</p>';

    const mailBody = `
    <h2 style="color: red;">🚨 Internal Server Error</h2>
    <p><strong>Host:</strong> ${process.env.HOST}</p>
    <p><strong>URL:</strong> ${details.url}</p>
    <p><strong>Method:</strong> ${details.method}</p>
    <p><strong>Message:</strong> ${details.message}</p>
    <h3>User Details</h3>
    <p><strong>ID:</strong> ${details.user.id}</p>
    <p><strong>Email:</strong> ${details.user.email}</p>
    <p><strong>Name:</strong> ${details.user.name}</p>
    <h3>Request Body</h3>
    <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px; white-space: pre-wrap;">${formattedBody}</pre>
    <p><strong>Timestamp:</strong> ${details.timestamp}</p>
    <h3>Stack Trace</h3>
    ${formattedStack}
  `;

    await this.sendMail({
      to: process.env.ADMIN_MAIL,
      subject: subject,
      body: mailBody,
      text: mailBody,
    });
  }

  async sendConfirmationEmail(email: ConfirmationEmailDto): Promise<string> {
    try {
      if (!Boolean(process.env.SMTP_DOMAIN)) {
        return;
      }
      const token = this.jwtService.sign(
        { email: email.to },
        {
          secret: process.env.JWT_EMAIL_VERIFICATION_TOKEN_SECRET,
          expiresIn: '2100s',
        },
      );

      const url = `${process.env.FRONTEND_URL}/token/${token}`;

      const renderedTemplate = this._confirmMailTemplate(
        url,
        email.userName,
        email.language,
      );
      const plainText = `Welcome to ${process.env.INSTANCE_NAME}. To confirm the email address, click here: ${url}`;
      await this.sendMail({
        to: email.to,
        subject: email.subject,
        text: plainText,
        body: renderedTemplate,
      });

      return url;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException('an error occurred', error);
    }
  }

  async sendMail(content: {
    subject: string;
    to: string;
    text: string;
    body: string;
  }): Promise<void> {
    try {
      await this.mailerMain.sendMail({
        to: content.to,
        subject: `[${process.env.INSTANCE_NAME}] ${content.subject}`,
        text: content.text,
        html: content.body,
      });
      this.logger.log(
        `email sent to : ${content.to} with subject ${content.subject}`,
      );
    } catch (error) {
      this.logger.error('Error sending email', error);
      throw new InternalServerErrorException('Failed to send email', error);
    }
  }

  async sendResetPasswordLink(email: ResetPasswordEmailDto): Promise<void> {
    const url = `${process.env.FRONTEND_URL}/reset-password/${email.token}`;

    const renderedTemplate = this._passwordResetTemplate(
      url,
      email.userName,
      email.language,
    );
    const plainText = `Hi, \\nTo reset your password, click here: ${url}`;

    return await this.sendMail({
      to: email.to,
      subject: 'Reset password',
      text: plainText,
      body: renderedTemplate,
    });
  }
}
