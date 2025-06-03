export const confirmationEmailTemplateFrench = (data: {
  url: string;
  name: string;
}) => `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Confirmez votre adresse e-mail</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6;">
    <div style="max-width: 600px; margin: auto;">
      <p>
        Bienvenue sur <strong>${process.env.INSTANCE_NAME}</strong>, ${data.name} !
      </p>
      <p>
        Pour confirmer votre adresse e-mail et accepter les conditions d'utilisation, veuillez cliquer sur le lien ci-dessous :
      </p>
      <p>
        <a href="${data.url}" style="color: #1a73e8;">${data.url}</a>
      </p>
      <p>
        Si le lien ne fonctionne pas, copiez-collez l'URL dans la barre d'adresse de votre navigateur.
      </p>
      <br/>
      <p>
        Merci,<br/>
        L'équipe ${process.env.INSTANCE_NAME}
      </p>
    </div>
  </body>
</html>
`;
