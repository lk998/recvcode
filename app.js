const imap = require("imap");
const express = require("express");
const app = express();

/**
 * 打开收件箱
 * @param {string} user
 * @param {string} password
 * @param {(err:Error,connection:imap)=>void} callback
 */
function open(user, password, callback) {
  const imapConfig = {
    user: user,
    password: password,
    host: "outlook.office365.com",
    port: 993,
    tls: true,
  };

  // 连接到 IMAP 服务器, 打开收件箱
  const imapConnection = new imap(imapConfig);
  imapConnection.once("ready", () => {
    imapConnection.openBox("INBOX", false, (err, box) => {
      callback(err, imapConnection);
    });
  });
  imapConnection.connect();

  imapConnection.on("error", () => {
    console.log("connected error");
  });
}

/**
 * 从邮件中解析获取验证码
 * @param {imap} imapConnection
 * @param {*} callback
 */
function fetch(imapConnection, callback) {
  const searchCriteria = ["UNSEEN"];
  imapConnection.search(searchCriteria, (err, results) => {
    if (err) {
      return callback(err);
    }
    console.log(results);
    const messageId = results[results.length - 1];
    const messageStream = imapConnection.fetch(messageId, { bodies: "TEXT" });
    messageStream.on("message", (msg) => {
      msg.on("body", (stream) => {
        let buffer = "";
        stream.on("data", (chunk) => {
          buffer += chunk.toString("utf8");
        });
        stream.once("end", () => {
          // console.log("收到邮件内容：",buffer)
          const content = buffer.slice(buffer.indexOf("Content-Type: text/html"), buffer.lastIndexOf(">"));
          const regex = /\d{6}/; // 假设验证码为 6 位数字
          const verificationCode = content.match(regex)?.[0];
          if (verificationCode) {
            imapConnection.end();
            callback(null, verificationCode);
          } else {
            callback(null, null);
          }
        });
      });
    });
  });
}

function recv(user, password, callback) {
  open(user, password, (err, imapConnection) => {
    if (err) {
      return callback(err);
    }
    // 解析最新的邮件，获得验证码
    fetch(imapConnection, callback);
  });
}

// API 路由
app.get("/recv/:email/:password", (req, res) => {
  const email = req.params.email;
  const password = req.params.password;

  recv(email, password, (err, verificationCode) => {
    if (verificationCode) {
      res.json({ verificationCode });
    } else {
      res.status(404).json({ error: "未找到验证码" });
    }
  });
});

// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器正在运行,端口 ${PORT}`);
});
