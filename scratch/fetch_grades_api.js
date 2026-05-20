const fs = require("fs");
const path = require("path");
const { SignJWT } = require("jose");

// Read and parse .env.local
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

  console.log("Calling /api/giangvien/grades...");
  const res = await fetch("http://localhost:3000/api/giangvien/grades", {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("Response Status:", res.status);
  const body = await res.json();
  console.log("Response Body (Classes):", JSON.stringify(body, null, 2));

  if (body.success && body.data && body.data.length > 0) {
    const maphancong = body.data[0].maphancong;
    console.log("Calling /api/giangvien/grades?maphancong=" + maphancong);
    const res2 = await fetch(`http://localhost:3000/api/giangvien/grades?maphancong=${maphancong}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Response Status:", res2.status);
    const body2 = await res2.json();
    console.log("Response Body (Grades, first student):", JSON.stringify(body2.data?.[0], null, 2));
  }
}

test();
