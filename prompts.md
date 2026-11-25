Prompt 0: Miêu tả ngữ cảnh, yêu cầu 
"VAI TRÒ
Bạn là Senior Fullstack Developer (React, Node.js, Express, MySQL), hỗ trợ tôi làm bài luyện tập
"Rikkei Lab – quản lý mượn trả thiết bị phòng thực hành". Hiện chỉ làm PHẦN 1 (chức năng cốt lõi).
Ưu tiên: đúng đề, đúng nghiệp vụ, code dễ đọc, chạy được, kiểm thử được.

PHẠM VI
- Chỉ làm Phần 1. KHÔNG đọc, KHÔNG làm giao_dien_mau/mo_rong/ và Phần 2.
- Nhưng thiết kế sao cho Phần 2 có thể thêm vào sau mà không phải viết lại (phân tầng rõ ràng).
  Phần 2 sẽ cần thêm bảng/cột trong file riêng db/mo_rong.sql – không phải việc của giai đoạn này.
- Không giả vờ hoàn thành: chưa chạy thử thì nói rõ "chưa chạy thử", không báo "xong".
- Không sửa/xóa/ghi đè giao_dien_mau/index.html và giao_dien_mau/phieu-muon.html.

NGUỒN CHUẨN
- Database: db/schema.sql (cấu trúc) + db/seed.sql (dữ liệu mẫu); db/rikkei_lab.sql là bản gộp của hai file này.
  Đọc kỹ trước khi viết SQL. Không đổi tên/kiểu cột, ENUM; không thêm cột status, available_quantity;
  không thêm bảng ở Phần 1; không lưu trạng thái phiếu hay số lượng còn lại trong DB.
- Giao diện: giao_dien_mau/index.html (thiết bị) và giao_dien_mau/phieu-muon.html (phiếu mượn).
  Giữ nguyên bố cục, màu, font, bảng, modal, form, nút. Chuyển HTML -> JSX, class -> className,
  chia component, tái dùng CSS + Bootstrap (copy CSS sang frontend/src/assets, không sửa file gốc).
  Không dựng dashboard mới, không đổi sang thư viện UI khác, không hardcode dữ liệu giả.

CÔNG NGHỆ (bắt buộc)
- Backend: Node.js >= 18, Express 4, CommonJS, mysql2/promise (pool), zod, KHÔNG ORM, dotenv, cors.
- Frontend: React 18, Vite, JavaScript, axios, React Hooks + hook tự viết, React Router (2 màn hình), Bootstrap.
- JSON camelCase; mọi truy vấn dùng prepared statement (placeholder ?), không nối chuỗi dữ liệu người dùng vào SQL.
- Cấu hình trong .env (+ .env.example); .env và node_modules phải nằm trong .gitignore.

CẤU TRÚC
<Tên Lớp>_Fullstack_RikkeiLab/
  frontend/ (src/api, components, pages, hooks, utils, assets)
  backend/  (src/config, controllers, services, routes, middlewares, validators, utils, app.js; server.js)
  db/       (schema.sql, seed.sql, rikkei_lab.sql)
  giao_dien_mau/ (giữ nguyên)  README.md  prompts.md  .gitignore
Phân tầng: route -> validator (zod) -> controller (mỏng) -> service (SQL + nghiệp vụ). Controller không viết SQL.

NGHIỆP VỤ
- availableQuantity = total_quantity - COALESCE(SUM(quantity) của phiếu có returned_at IS NULL, 0). Tính trong SQL mỗi lần truy vấn.
- Trạng thái phiếu tính trong SQL (CASE), kiểm tra theo thứ tự:
  returned_at IS NOT NULL -> 'returned'; returned_at IS NULL AND due_date < CURDATE() -> 'overdue'; còn lại -> 'borrowing'.
  Nhãn tiếng Việt do frontend ánh xạ: borrowing = "Đang mượn", returned = "Đã trả", overdue = "Quá hạn".
- "Hôm nay" luôn lấy từ SQL (CURDATE()), không lấy từ new Date() của Node, để tránh lệch múi giờ.
- Tạo phiếu: thiết bị phải tồn tại; borrowerName không rỗng sau trim; quantity là số nguyên > 0 và <= availableQuantity;
  borrowed_at = CURDATE(); borrowedAt <= dueDate <= borrowedAt + 14 ngày (ngày hạn trả bằng ngày mượn được chấp nhận).
  Chạy trong transaction: BEGIN -> SELECT ... FROM equipments WHERE id = ? FOR UPDATE -> tính đang mượn
  -> kiểm tra -> INSERT -> COMMIT; lỗi thì ROLLBACK; luôn release connection trong finally.
- Trả thiết bị: một câu UPDATE nguyên tử
  `UPDATE borrowings SET returned_at = CURDATE() WHERE id = ? AND returned_at IS NULL`;
  affectedRows = 0 thì phân biệt NOT_FOUND và ALREADY_RETURNED. Không đổi quantity.
- Sửa thiết bị: transaction + FOR UPDATE; totalQuantity mới không được nhỏ hơn tổng đang mượn (INSUFFICIENT_QUANTITY, HTTP 409).
- Xóa thiết bị: không cho xóa nếu có bất kỳ phiếu nào (kể cả đã trả) tham chiếu -> EQUIPMENT_HAS_BORROWINGS.
  Đồng thời bắt lỗi MySQL ER_ROW_IS_REFERENCED_2 làm lớp bảo vệ thứ hai.
- Mã thiết bị: trim + viết hoa trước khi lưu, định dạng /^[A-Z0-9-]{1,20}$/; trùng -> DUPLICATE_CODE
  (kiểm tra trước và bắt thêm ER_DUP_ENTRY vì có race). Collation _ci nên LAB-001 và lab-001 coi là trùng.
- Tìm kiếm: LIKE trên name HOẶC code; escape ký tự % _ \ trong từ khóa người dùng.

HỢP ĐỒNG API (base /api)
- GET    /equipments?search=&category=&page=1&limit=10
    -> 200 { "data": [ {id, code, name, category, totalQuantity, availableQuantity, createdAt} ],
             "pagination": { "page", "limit", "total", "totalPages" } }
    page >= 1, limit 1..100 (mặc định 10), sắp xếp id DESC; category chỉ nhận 4 giá trị ENUM.
- GET    /equipments/:id -> 200 { "data": {...} }
- POST   /equipments  (code, name, category, totalQuantity) -> 201 { "data": {...} }
- PUT    /equipments/:id (cùng trường) -> 200 { "data": {...} }
- DELETE /equipments/:id -> 204
- GET    /borrowings?status=borrowing|returned|overdue&page=&limit=
    -> 200 { "data": [ {id, equipmentId, equipmentCode, equipmentName, borrowerName, quantity,
             borrowedAt, dueDate, returnedAt, note, status} ], "pagination": {...} }
    sắp xếp borrowed_at DESC, id DESC; lọc status thực hiện trong SQL.
- POST   /borrowings (equipmentId, borrowerName, quantity, dueDate "YYYY-MM-DD", note?) -> 201 { "data": {...} }
- PATCH  /borrowings/:id/return -> 200 { "data": {...} }
- Ngày trả ra dạng chuỗi "YYYY-MM-DD" (cấu hình mysql2 dateStrings để không bị Date/UTC làm lệch ngày).
- zod phải từ chối ngày không tồn tại (ví dụ 2026-02-31), id không phải số nguyên dương, body thừa kiểu sai.

LỖI: { "error": { "code": "...", "message": "<tiếng Việt có dấu>" } }
  VALIDATION_ERROR 400 | INVALID_DUE_DATE 400 | NOT_FOUND 404 | DUPLICATE_CODE 409 |
  INSUFFICIENT_QUANTITY 409 | EQUIPMENT_HAS_BORROWINGS 409 | ALREADY_RETURNED 409 | INTERNAL_SERVER_ERROR 500
  Dùng một error middleware + class AppError. Route không tồn tại -> NOT_FOUND. Không bao giờ trả SQL error hay stack trace.

FRONTEND
- Một axios instance (baseURL từ VITE_API_URL), interceptor chuyển lỗi API thành message tiếng Việt;
  component không gọi axios trực tiếp mà qua hook (useEquipments, useBorrowings, ...).
- Mỗi màn hình đủ: loading, empty, error (có nút thử lại), và phản hồi thành công/thất bại sau thao tác
  (toast hoặc alert Bootstrap). Sau thêm/sửa/xóa/mượn/trả phải tải lại hoặc cập nhật state ngay.
  Không để trang trắng khi API lỗi. Tìm kiếm có debounce ~300ms.
- Ngày hiển thị dd/mm/yyyy bằng cách tách chuỗi "YYYY-MM-DD" (không dùng new Date(chuỗi) để hiển thị).
- Form mượn: ô chọn thiết bị hiển thị số còn lại; chặn gửi trùng (disable nút khi đang gửi).

CÁCH LÀM VIỆC
- Gặp chỗ đề chưa rõ: chọn phương án đơn giản, hợp lý và ghi vào mục "Giả định" của README.md.
- Mỗi giai đoạn kết thúc bằng: danh sách file đã tạo/sửa, lệnh đã chạy và kết quả thật, những gì CHƯA kiểm tra."

=================================================================
Prompt 1: Thực thi dự án theo đề (Frontend và backend)
"Triển khai toàn bộ Phần 1 theo Prompt 0, làm liền một mạch.

BƯỚC 0 – Đọc trước khi code (không cần báo cáo dài):
đọc db/schema.sql, db/seed.sql, giao_dien_mau/index.html, giao_dien_mau/phieu-muon.html.
Nếu phát hiện giao diện mẫu không khớp với hợp đồng API hoặc đề bài, ghi vào mục "Giả định" của README.md
và chọn phương án đơn giản, hợp lý nhất, không dừng lại để hỏi.

PHẦN A – BACKEND
 A1. Khung dự án: package.json (script dev dùng nodemon), .env.example (PORT, DB_HOST, DB_PORT, DB_USER,
     DB_PASSWORD, DB_NAME, CORS_ORIGIN), pool mysql2 (dateStrings, charset utf8mb4), app.js, server.js,
     error middleware + AppError, 404 handler, GET /api/health.
 A2. API thiết bị: validators, service, controller, routes (7 endpoint theo hợp đồng).
 A3. API phiếu mượn: transaction + FOR UPDATE khi tạo, UPDATE nguyên tử khi trả, lọc status trong SQL.
 A4. backend/tests/api.http (hoặc collection Postman JSON) gồm đủ ca:
     thiết bị: danh sách, tìm kiếm, lọc, phân trang, thêm, mã trùng, sửa, sửa thấp hơn số đang mượn,
     xóa, xóa thiết bị có phiếu;
     mượn trả: hợp lệ, vượt số lượng, quantity 0, thiếu tên, thiết bị không tồn tại, hạn > 14 ngày,
     hạn trước ngày mượn, trả thành công, trả hai lần, lọc 3 trạng thái.
 A5. backend/tests/concurrency.js: bắn đồng thời N request mượn cùng một thiết bị (Promise.all) sao cho tổng
     vượt tồn kho; chứng minh tổng đang mượn không bao giờ vượt total_quantity.

PHẦN B – FRONTEND (làm sau khi backend xong)
 B1. Khung Vite + React 18, cài bootstrap/axios/react-router-dom, .env.example (VITE_API_URL),
     copy CSS từ giao_dien_mau sang src/assets (không sửa file gốc), Router 2 trang + thanh điều hướng giống mẫu.
 B2. src/api (axios instance, equipmentApi, borrowingApi), src/utils (formatDate dd/mm/yyyy, ánh xạ nhãn
     trạng thái/loại), hooks (useEquipments, useBorrowings, useDebounce).
 B3. Trang thiết bị chuyển từ index.html: bảng, tìm kiếm, lọc loại, phân trang, modal thêm/sửa, xác nhận xóa,
     xem chi tiết, hiển thị tổng và còn lại, loading/empty/error, hiển thị lỗi API.
 B4. Trang phiếu mượn chuyển từ phieu-muon.html: form mượn (chọn thiết bị, tên, số lượng, hạn trả có min = hôm nay
     và max = hôm nay + 14), bảng phiếu có badge trạng thái, lọc trạng thái, nút Trả (ẩn/disable với phiếu đã trả),
     loading/empty/error, cập nhật ngay sau thao tác.

BÁO CÁO CUỐI (bắt buộc, trung thực):
 - Danh sách file đã tạo/sửa.
 - Lệnh đã chạy và kết quả thật của từng ca kiểm thử A4, A5 (kể cả ca thất bại).
 - Những gì CHƯA chạy thử (ví dụ không có MySQL trong môi trường) và lệnh để tôi tự chạy.
Không tự đổi thiết kế giao diện mẫu. Không đánh dấu "xong" nếu chưa chạy thử."
====================================================================
Prompt 2: 