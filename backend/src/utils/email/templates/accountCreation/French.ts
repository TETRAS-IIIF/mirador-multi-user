export const accountCreationTemplateFrench = (data: { userName: string }) => `
<!DOCTYPE html>
<html>
<div>
<p>Compte créé sur ${process.env.INSTANCE_NAME} !<br/><br/>
${data.userName}, votre compte a été créé avec succès. Vous pouvez vous connecter à <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a> en utilisant votre adresse e-mail et votre mot de passe.</p>
<br/><br/>
Merci,<br/>
L'équipe ${process.env.INSTANCE_NAME}
</div>
</body>
</html>
`;
