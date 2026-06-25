# =============================================================
# Script test chức năng TẠO CA THI
# API: POST /api/giangvien/exams
# =============================================================
# Hướng dẫn:
#   1. Đổi TOKEN bên dưới = JWT token của tài khoản giảng viên (lấy từ DevTools sau khi đăng nhập)
#   2. Đổi MAPHANCONG = mã phân công thực tế trong DB của bạn
#   3. Chạy script: .\test_tao_ca_thi.ps1
# =============================================================

# ===== CẤU HÌNH =====
$BASE_URL    = "http://localhost:3000"                   # Đổi nếu chạy port khác
$TOKEN       = "PASTE_TOKEN_GIANGVIEN_HERE"              # ⚠️  Paste JWT token vào đây
$MAPHANCONG  = 1                                         # ⚠️  Đổi thành mã phân công thực tế
$FILE_PATH   = "$PSScriptRoot\bai_kiem_tra_mau.txt"     # File đề thi mẫu đi kèm

# Thời gian thi (bắt đầu sau 5 phút, kết thúc sau 2 giờ)
$NOW             = [System.DateTimeOffset]::UtcNow.AddHours(7)   # Giờ VN (UTC+7)
$BATDAU          = $NOW.AddMinutes(5).ToString("yyyy-MM-ddTHH:mm:ss")
$KETTHUC         = $NOW.AddHours(2).ToString("yyyy-MM-ddTHH:mm:ss")

# =============================================================
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   TEST TẠO CA THI - POST /api/giangvien/exams" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra file đề thi
if (-not (Test-Path $FILE_PATH)) {
    Write-Host "[LỖI] Không tìm thấy file đề thi: $FILE_PATH" -ForegroundColor Red
    exit 1
}

# Kiểm tra token
if ($TOKEN -eq "PASTE_TOKEN_GIANGVIEN_HERE") {
    Write-Host "[LỖI] Bạn chưa điền JWT Token!" -ForegroundColor Red
    Write-Host "  --> Hãy đăng nhập vào ứng dụng, mở DevTools > Application > Cookies hoặc" -ForegroundColor Yellow
    Write-Host "  --> Local Storage, tìm key 'token' và paste vào biến TOKEN trong script." -ForegroundColor Yellow
    exit 1
}

Write-Host "File đề thi : $FILE_PATH" -ForegroundColor Gray
Write-Host "Phân công   : $MAPHANCONG" -ForegroundColor Gray
Write-Host "Bắt đầu     : $BATDAU" -ForegroundColor Gray
Write-Host "Kết thúc    : $KETTHUC" -ForegroundColor Gray
Write-Host ""
Write-Host "Đang gửi request tạo ca thi..." -ForegroundColor Yellow
Write-Host ""

# Tạo multipart/form-data bằng cách dùng Invoke-RestMethod với -Form
$headers = @{
    "Authorization" = "Bearer $TOKEN"
}

$form = @{
    maphancong       = $MAPHANCONG.ToString()
    tieude           = "Kiểm tra Giữa Kỳ - Cơ Sở Dữ Liệu"
    mota             = "Bài kiểm tra 50 câu trắc nghiệm về Cơ Sở Dữ Liệu - HK1 2025-2026"
    thoigianlam      = "45"
    thoigianbatdau   = $BATDAU
    thoigianketthuc  = $KETTHUC
    matkhau          = "qlsv2025"
    file             = Get-Item $FILE_PATH
}

try {
    $response = Invoke-RestMethod `
        -Uri "$BASE_URL/api/giangvien/exams" `
        -Method POST `
        -Headers $headers `
        -Form $form `
        -ContentType "multipart/form-data" `
        -ErrorAction Stop

    Write-Host "✅ TẠO CA THI THÀNH CÔNG!" -ForegroundColor Green
    Write-Host ""
    Write-Host "--- Kết quả trả về ---" -ForegroundColor Cyan
    Write-Host "  success  : $($response.success)" -ForegroundColor White
    Write-Host "  message  : $($response.message)" -ForegroundColor White
    Write-Host "  madethi  : $($response.data.madethi)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Bạn có thể kiểm tra đề thi vừa tạo trong ứng dụng!" -ForegroundColor Yellow

} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ TẠO CA THI THẤT BẠI!" -ForegroundColor Red
    Write-Host ""
    Write-Host "  HTTP Status : $statusCode" -ForegroundColor Red

    # Đọc body lỗi
    try {
        $errBody = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "  Lỗi        : $($errBody.error)" -ForegroundColor Red
    } catch {
        Write-Host "  Chi tiết   : $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "--- Gợi ý xử lý lỗi ---" -ForegroundColor Yellow
    switch ($statusCode) {
        401 { Write-Host "  Token hết hạn hoặc sai. Hãy đăng nhập lại và lấy token mới." -ForegroundColor Yellow }
        403 { Write-Host "  Tài khoản không có quyền GiangVien." -ForegroundColor Yellow }
        400 { Write-Host "  Thiếu thông tin bắt buộc. Kiểm tra maphancong, tieude, file, thoigian..." -ForegroundColor Yellow }
        404 { Write-Host "  Không tìm thấy giảng viên tương ứng." -ForegroundColor Yellow }
        500 { Write-Host "  Lỗi server. Kiểm tra GEMINI_API_KEY trong .env.local hoặc log server." -ForegroundColor Yellow }
        default { Write-Host "  Kiểm tra log server tại terminal chạy 'npm run dev'." -ForegroundColor Yellow }
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
