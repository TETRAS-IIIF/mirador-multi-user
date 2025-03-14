export const confirmationEmailTemplateFrench = (data: {
  url: string;
  name: string;
}) => `
<!DOCTYPE html>
<html>
<div>
<p>Bienvenue sur ${process.env.INSTANCE_NAME} ${data.name} !<br/><br/> 
Pour confirmer votre adresse e-mail et valider les termes, cliquez ici : <a href="${data.url}">${data.url}</a></p>
<br/><br/>
Merci <br/>
L'équipe de ${process.env.INSTANCE_NAME}
</div>
</body>
</html>
`;
