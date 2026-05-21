const fs = require('fs');
const path = require('path');
const { SignJWT } = require('jose');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    envVars[key] = value;
  }
});

const secretKey = new TextEncoder().encode(envVars.JWT_SECRET);

async function run() {
  // Sign a mock teacher token
  const token = await new SignJWT({
    mataikhoan: "gv01",
    email: "gv01@vnua.edu.vn",
    vaitro: "GiangVien",
    hoten: "Nguyễn Văn A"
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secretKey);

  console.log('Generated Token:', token);

  const res = await fetch('http://127.0.0.1:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      message: "có",
      history: [
        {
          role: "model",
          text: "Chào Thầy/Cô! Tôi là Trợ lý AI hỗ trợ giảng dạy. Thầy/Cô có câu hỏi nào về quy chế đào tạo, lập đề thi hoặc phân tích kết quả học tập không?",
        }
      ],
      userName: "Nguyễn Văn A"
    })
  });

  console.log('Status:', res.status);
  const body = await res.text();
  console.log('Body:', body);
}

run().catch(console.error);
