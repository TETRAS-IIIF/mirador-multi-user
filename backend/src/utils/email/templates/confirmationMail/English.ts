export const confirmationEmailTemplateEnglish = (data: {
  url: string;
  name: string;
}) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Confirm your email</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6;">
    <div style="max-width: 600px; margin: auto;">
      <p>
        Welcome to <strong>${process.env.INSTANCE_NAME}</strong>, ${data.name}!
      </p>
      <p>
        To confirm your email address and accept the terms, please click the link below:
      </p>
      <p>
        <a href="${data.url}" style="color: #1a73e8;">${data.url}</a>
      </p>
      <p>
        If the link doesn’t work, please copy and paste the URL into your browser’s address bar.
      </p>
      <br/>
      <p>
        Thanks,<br/>
        The ${process.env.INSTANCE_NAME} Team
      </p>
    </div>
  </body>
</html>
`;
