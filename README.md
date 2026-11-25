# Rikkei Lab – Quản lý mượn trả thiết bị phòng thực hành (Phần 1)

Ứng dụng Fullstack (React + Node.js/Express + MySQL) cho phép quản lý danh mục thiết bị phòng thực hành và theo dõi phiếu mượn/trả thiết bị.

## Cấu trúc thư mục

```text
RikkeiLab_Fullstack_3h/
├── backend/          # Node.js >= 18, Express 4, CommonJS, mysql2/promise, zod
├── frontend/         # React 18, Vite, JavaScript, axios, React Router, Bootstrap 5.3.3
├── db/               # rikkei_lab.sql, seed.sql (không chỉnh sửa ở Phần 1)
├── giao_dien_mau/    # Giao diện HTML mẫu gốc (giữ nguyên)
├── .gitignore
├── prompts.md
└── README.md
```

## Yêu cầu môi trường

- Node.js >= 18
- MySQL 8.0+

## Hướng dẫn cài đặt và chạy

### 1. Khởi tạo cơ sở dữ liệu

Chạy lần lượt 2 file SQL trong thư mục `db/` trên MySQL:

1. `db/rikkei_lab.sql` (tạo database `rikkei_lab` và các bảng `equipments`, `borrowings`)
2. `db/seed.sql` (nạp dữ liệu mẫu)

### 2. Chạy Backend

```bash
cd backend
cp .env.example .env   # Cập nhật DB_USER, DB_PASSWORD nếu cần
npm install
npm run dev            # nodemon (hoặc npm start)
```

Mặc định API chạy tại `http://localhost:3000/api`.

Kiểm thử backend:
- `npm test` (`node --test tests/*.test.js`): unit/API test với mock DB pool.
- `tests/api.http`: bộ HTTP request kiểm thử đầy đủ các ca thiết bị và mượn/trả (dùng với VS Code REST Client khi đã bật MySQL + server).
- `node tests/concurrency.js`: kiểm thử đồng thời (`Promise.all`) để chứng minh `FOR UPDATE` ngăn mượn vượt `total_quantity` (cần MySQL + server đang chạy).

### 3. Chạy Frontend

```bash
cd frontend
cp .env.example .env   # Mặc định VITE_API_URL=http://localhost:3000/api
npm install
npm run dev
```

Mặc định giao diện chạy tại `http://localhost:5173`.

## API chính (`/api`)

- `GET /api/health`
- `GET /api/equipments?search=&category=&page=1&limit=10`
- `GET /api/equipments/:id`
- `POST /api/equipments`
- `PUT /api/equipments/:id`
- `DELETE /api/equipments/:id`
- `GET /api/borrowings?status=borrowing|returned|overdue&page=1&limit=10`
- `POST /api/borrowings`
- `PATCH /api/borrowings/:id/return`

## Giả định

1. **Menu điều hướng (AppNavbar)**: Giao diện mẫu có dropdown "Mở rộng (Phần 2)" trỏ tới `mo_rong/...`. Vì phạm vi hiện tại chỉ làm Phần 1, `AppNavbar` chỉ hiển thị 2 liên kết hoạt động là `Thiết bị` (`/`) và `Phiếu mượn` (`/phieu-muon`), không tạo link chết.
2. **Dropdown chọn thiết bị ở form Tạo phiếu mượn**: Gọi `GET /api/equipments?page=1&limit=100` để lấy danh sách thiết bị kèm `availableQuantity` hiển thị trong `<select>` và tự động làm mới sau khi mượn/trả thành công.
3. **Định dạng mã phiếu mượn trên giao diện**: Bảng `borrowings` trong DB chỉ có cột `id` (INT), nên frontend hiển thị mã phiếu dạng `PM-001`, `PM-002`... từ `id` bằng `padStart(3, '0')` cho khớp giao diện mẫu.
4. **Cơ sở dữ liệu**: Thư mục `db/` hiện có `rikkei_lab.sql` (schema) và `seed.sql` (dữ liệu mẫu), không có file `schema.sql` tách riêng; toàn bộ bảng và cột giữ nguyên theo `db/rikkei_lab.sql`.
5. **Xem chi tiết thiết bị**: `giao_dien_mau/index.html` chỉ có nút `Sửa` và `Xóa`, nên đã bổ sung nút `Chi tiết` mở modal gọi `GET /api/equipments/:id` mà không thay đổi bố cục bảng chính.

