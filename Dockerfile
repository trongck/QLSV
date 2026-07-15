# 1: Cài đặt thư viện (Dependencies)
FROM node:20-alpine AS deps

# Thêm thư viện tương thích glibc cho Alpine Linux
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Sao chép file khai báo thư viện
COPY package.json package-lock.json ./

# Cài đặt thư viện 
RUN npm ci

# 2: Build ứng dụng
FROM node:20-alpine AS builder
WORKDIR /app

# Lấy thư viện đã cài từ giai đoạn 1
COPY --from=deps /app/node_modules ./node_modules

# Sao chép toàn bộ mã nguồn dự án
COPY . .

# Sao chép file biến môi trường 
COPY .env.local .env.local

# Tắt gửi dữ liệu thống kê cho Vercel
ENV NEXT_TELEMETRY_DISABLED=1

# Build ứng dụng Next.js ở chế độ standalone
RUN npm run build

# 3: Chạy ứng dụng (Production)
FROM node:20-alpine AS runner
WORKDIR /app

# Thiết lập môi trường production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Tạo user riêng (không dùng root) để tăng bảo mật
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Sao chép tài nguyên tĩnh (ảnh, model nhận diện khuôn mặt,...)
COPY --from=builder /app/public ./public

# Tạo thư mục cache cho Next.js và phân quyền
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Sao chép bản build standalone (đã bao gồm node_modules tối giản)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Chuyển sang user không phải root
USER nextjs

# Mở cổng 3000
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Khởi chạy server Next.js
CMD ["node", "server.js"]
