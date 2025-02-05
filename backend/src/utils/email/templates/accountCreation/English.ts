export const accountCreationTemplateEnglish = (data: { userName: string }) => `
<!DOCTYPE html>
<html>
<div>
<p>Account created on ${process.env.INSTANCE_NAME} !<br/><br/>
${data.userName}, your account was successffuly created. You can log in at <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a> using your email and password.</p>
<br/><br/>
Thanks <br/>
The ${process.env.INSTANCE_NAME} team
</div>
</body>
</html>
`;
