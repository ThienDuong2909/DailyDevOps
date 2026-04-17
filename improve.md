# 🚀 Lộ trình Tối ưu hóa Caching & Hiệu suất Blog (K3s + Next.js + Cloudflare)

Dựa trên phân tích hiện trạng dự án đang sử dụng **Next.js 15 (App Router)** và gặp vấn đề lạm dụng **Client-side Fetching**, đây là các bước cần thực hiện để tối ưu.

## 1. Tối ưu Frontend (Next.js - App Router)
Đây là ưu tiên cao nhất để tận dụng sức mạnh của ISR và Server Components.

- [ ] **Chuyển đổi Trang Chi tiết Bài viết (`blog/[slug]`) sang Hybrid:**
    - Di chuyển logic `fetch` dữ liệu từ `blog-detail-client.tsx` sang `page.tsx` (Server Component).
    - Sử dụng `fetch` với option `next: { revalidate: 3600 }`.
    - Truyền dữ liệu xuống Client Component để hiển thị.
- [ ] **Tối ưu hóa Trang chủ & Danh sách (Home/Listing):**
    - Thực hiện "Pre-fetch" danh sách bài viết mới nhất ở Server Component.
    - Truyền dữ liệu đó vào Client Component làm `initialData` để người dùng thấy nội dung ngay lập tức mà không cần loading spinner.
- [x] **Cập nhật Sitemap & RSS:** ✅
    - ~~Thay thế `export const dynamic = 'force-dynamic'` bằng `export const revalidate = 3600`.~~
    - Đã xóa `force-dynamic` + thêm `Cache-Control` header cho 6 route.
- [ ] **Triển khai `generateStaticParams`:**
    - Cấu hình cho route bài viết để Next.js tự động build sẵn các bài viết cũ/cố định thành file tĩnh khi deploy.

## 2. Tối ưu hóa Hình ảnh & Media
Giảm tải cho AZDIGI Cloud Storage và tăng tốc độ hiển thị.

- [ ] **Cấu hình Next/Image:**
    - Đảm bảo tất cả ảnh từ AZDIGI S3 đều đi qua component `<Image />` của Next.js.
    - Thêm domain của AZDIGI S3 vào `remotePatterns` trong `next.config.js`.
- [ ] **Thiết lập Cloudflare Cache Rules:**
    - Tạo Rule: Nếu URL khớp với định dạng ảnh (ví dụ: `*.png`, `*.jpg`), thiết lập "Edge Cache TTL" là 1 tháng.

## 3. Tối ưu hóa Ingress (Traefik trên K3s)
Mặc dù Cloudflare đã xử lý phần lớn, Traefik vẫn cần được cấu hình đúng để bảo vệ Backend.

- [x] **Bật Compression (Nén):** ✅
    - ~~Sử dụng Traefik Middleware `compress` để nén dữ liệu (Gzip/Brotli) trước khi gửi đi.~~
    - Đã thêm Middleware CRD `compress` + Ingress annotation. Cần `kubectl apply` sau deploy.
- [x] **Cấu hình Cache-Control Header:** ✅
    - ~~Đảm bảo Node.js/Next.js trả về header `Cache-Control` đúng.~~
    - Đã thêm `Cache-Control: public, s-maxage=3600, stale-while-revalidate=7200` cho tất cả sitemap routes.

## 4. Tối ưu hóa Backend (Node.js)
Giảm áp lực trực tiếp lên Database.

- [ ] **Implement In-memory Cache:**
    - Sử dụng `node-cache` cho các query "nặng" nhưng dữ liệu ít thay đổi như: Cấu hình hệ thống, danh mục bài viết, danh sách tag.
- [ ] **Dọn dẹp API Response:**
    - Loại bỏ các field dữ liệu thừa trong JSON trả về từ Node.js để giảm payload size.

## 5. Theo dõi & Kiểm tra (Monitoring)
- [ ] **Kiểm tra Header:** Sử dụng DevTools để kiểm tra header `X-Nextjs-Cache`. (Phải đạt trạng thái `HIT`).
- [ ] **Kiểm tra Cloudflare:** Xem bảng điều khiển Cloudflare để biết tỷ lệ % Cache Hit Ratio.