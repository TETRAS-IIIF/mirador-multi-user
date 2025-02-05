export const resetPasswordFrench = (data: { url: string; name: string }) => `
<!DOCTYPE html>
<html>
<div>
<p>Bonjour ${data.name},<br/><br/>Pour réinitialiser votre mot de passe, cliquez ici : <a href="${data.url}">${data.url}</a></p>
<br/><br/>
Merci,<br/>
L'équipe ${process.env.INSTANCE_NAME}
</div>
</body>
</html>
`;
