const fs = require("fs");
const path = require("path");
const { SignJWT } = require("jose");

const envPath = path.join(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
      process.env[key] = val;
    }
  });
}

async function test() {
  const secretStr = process.env.JWT_SECRET || "super-secret-key-1234567890-abcdef";
  const key = new TextEncoder().encode(secretStr);
  const token = await new SignJWT({ mataikhoan: "gv2005", email: "gv2005@gmail.com", vaitro: "GiangVien" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(key);

  const types = ["Bai_Tap", "Bai tap", "Bài tập", "ThuongXuyen", "Thường xuyên"];

  for (const t of types) {
    const bodyPayload = {
      maphancong: 5,
      masv: "687644",
      grades: [
        { loaidiem: t, giatri: 8, heso: 0.2 }
      ]
    };

    const res = await fetch("http://localhost:3000/api/giangvien/grades", {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyPayload)
    });
    
    console.log(`Test '${t}': Status ${res.status}`);
  }
}

test();
