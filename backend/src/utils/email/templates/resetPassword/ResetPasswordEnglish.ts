export const resetPasswordEnglish = (data: { url: string; name: string }) => `
<!DOCTYPE html>
<html>
<div>
<p>Hello ${data.name},<br/><br/>To reset your password, click here: <a href="${data.url}">${data.url}</a></p>
<br/><br/>
Thanks <br/>
The ${process.env.INSTANCE_NAME} team
</div>
</body>
</html>
`;
