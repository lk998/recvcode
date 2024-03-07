
# 安装 nodejs

https://nodejs.org/en/download/

现在 windows installer 安装包进行安装


# 初始化

npm install


# 运行服务器：

node app.js


# 收取验证码

在收到邮件后通过 http 的 get 请求查询收到的验证码

http://localhost:3000/recv/xxxx@hotmail.com/hotmailpasswd


xxxx@hotmail.com为要查询的邮箱地址

hotmailpasswd为该邮箱地址的密码
