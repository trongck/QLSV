const fs = require("fs");
const path = require("path");

async function run() {
  // 1. Log in to get JWT token
  console.log("1. Logging in as gv2004...");
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "gv2004@qlsv.edu.vn", matkhau: "123456" }),
  });
  const loginJson = await loginRes.json();
  if (!loginJson.accessToken) {
    console.error("Login failed:", loginJson);
    return;
  }
  const token = loginJson.accessToken;
  console.log("Token acquired:", token.substring(0, 20) + "...");

  const authHeaders = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // 2. Create a test notification via HTTP POST /api/giangvien/notifications
  console.log("\n2. Creating a test notification via POST endpoint...");
  const createRes = await fetch("http://localhost:3000/api/giangvien/notifications", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      tieude: "Thông báo test gv2004 POST",
      noidung: "Nội dung tạo từ POST endpoint",
      loai: "Chung",
      doituong: "GiangVien",
      ghim: false
    })
  });
  const createJson = await createRes.json();
  console.log("POST create status:", createRes.status);
  console.log("POST create response body:", createJson);

  if (!createJson.success || !createJson.data) {
    console.error("Failed to create notification via POST API");
    return;
  }
  const tbId = createJson.data.mathongbao;
  console.log("Created notification ID:", tbId);

  // 3. Test GET notifications (should include the new one)
  console.log("\n3. Getting notifications...");
  const getRes = await fetch("http://localhost:3000/api/giangvien/notifications", {
    method: "GET",
    headers: authHeaders,
  });
  const getJson = await getRes.json();
  const found = getJson.data?.find(d => d.mathongbao === tbId);
  console.log("Found newly created notification in API GET:", found ? "YES" : "NO");

  // 4. Test PATCH edit notification
  console.log(`\n4. Editing notification ${tbId}...`);
  const editRes = await fetch(`http://localhost:3000/api/giangvien/notifications/${tbId}`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({
      tieude: "Thông báo test gv2004 POST - ĐÃ EDIT",
      noidung: "Nội dung mới đã lưu từ edit"
    }),
  });
  const editJson = await editRes.json();
  console.log("PATCH edit response status:", editRes.status);
  console.log("PATCH edit response body:", editJson);

  // 5. Test DELETE notification
  console.log(`\n5. Deleting notification ${tbId}...`);
  const deleteRes = await fetch(`http://localhost:3000/api/giangvien/notifications/${tbId}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  const deleteJson = await deleteRes.json();
  console.log("DELETE response status:", deleteRes.status);
  console.log("DELETE response body:", deleteJson);
}

run().catch(console.error);
