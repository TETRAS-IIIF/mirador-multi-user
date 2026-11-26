export const template = (data: { userName: string }) => `
<!DOCTYPE html>
<html>
<head>
<link href="https://fonts.googleapis.com/css?family=Gotham:400,500,700" rel="stylesheet">
</head>
<body style="font-family:'Gotham', sans-serif;">
<div>
<p>hello, ${data.userName}</p>
</div>
</body>
</html>
`;
