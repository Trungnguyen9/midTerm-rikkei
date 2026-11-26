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
Prompt 2: Thiết lập lại ngữ cảnh (bị mất ngữ cảnh đầu do vài thay đổi)
BỐI CẢNH DỰ ÁN (đọc kỹ, đây là cuộc trò chuyện mới nên bạn chưa biết gì về dự án)

Tôi là sinh viên đang làm bài luyện tập tổng hợp "Rikkei Lab – quản lý mượn trả thiết bị phòng thực hành"
(ReactJS + Express + MySQL, 180 phút, được dùng AI). Đề gồm Phần 1 (50 điểm, chức năng cốt lõi) và
Phần 2 (50 điểm, đề tài mở, chọn MỘT hướng). Tôi chọn hướng B: Thống kê và báo cáo.

TRẠNG THÁI HIỆN TẠI
- PHẦN 1: ĐÃ HOÀN THÀNH và đã kiểm thử xong (DB, API thiết bị, API mượn/trả, giao diện React 2 trang).
  Tuyệt đối không viết lại, không đổi hành vi Phần 1.
- PHẦN 2 (hướng B): CHƯA LÀM gì. Đây là việc sắp tới.
- Dự án có sẵn README.md và prompts.md với nội dung Phần 1: chỉ được NỐI THÊM, không ghi đè, không xóa.
- Mã nguồn thực tế là sự thật. Mô tả bên dưới là những gì tôi tin là đang có; nếu code thực tế khác mô tả
  thì làm theo code thực tế (theo đúng quy ước đang dùng) và báo lại điểm khác biệt, đừng "sửa cho giống mô tả".

CẤU TRÚC DỰ ÁN
<Tên Lớp>_Fullstack_RikkeiLab/
  frontend/ (src/api, components, pages, hooks, utils, assets; Vite + React 18)
  backend/  (src/config, controllers, services, routes, middlewares, validators, utils, app.js; server.js)
  db/       (schema.sql, seed.sql, rikkei_lab.sql = bản gộp schema + seed; nếu thiếu file nào thì dựa vào file hiện có)
  giao_dien_mau/ (index.html, phieu-muon.html cho Phần 1; mo_rong/ cho Phần 2; KHÔNG sửa/xóa file gốc)
  README.md  prompts.md  .gitignore

CÔNG NGHỆ VÀ QUY ƯỚC (đang áp dụng ở Phần 1, Phần 2 phải theo đúng)
- Backend: Node.js >= 18, Express 4, CommonJS, mysql2/promise (pool, dateStrings), zod, KHÔNG ORM; cấu hình trong .env
  (có .env.example; .env và node_modules không đưa lên Git). Mọi truy vấn dùng prepared statement.
- Frontend: React 18, Vite, JavaScript, axios (một axios instance, baseURL từ VITE_API_URL), React Router, Bootstrap,
  hook tự viết; component không gọi axios trực tiếp. Giữ nguyên phong cách giao diện mẫu, không dựng dashboard mới.
- Phân tầng backend: route -> validator (zod) -> controller (mỏng, không viết SQL) -> service (SQL + nghiệp vụ).
- JSON camelCase. Lỗi: { "error": { "code": "...", "message": "<tiếng Việt có dấu>" } }, qua một error middleware + AppError;
  không trả SQL error hay stack trace.
- Ngày: DB lưu DATE; API trả chuỗi "YYYY-MM-DD"; giao diện hiển thị dd/mm/yyyy bằng hàm formatDate (tách chuỗi,
  không dùng new Date(chuỗi) để hiển thị). "Hôm nay" luôn lấy từ CURDATE() của MySQL.

DATABASE (Phần 1, không thay đổi)
- equipments(id, code UNIQUE, name, category ENUM('laptop','man_hinh','mach_dien_tu','phu_kien'), total_quantity, created_at)
- borrowings(id, equipment_id FK -> equipments.id ON DELETE RESTRICT, borrower_name, quantity, borrowed_at DATE,
  due_date DATE, returned_at DATE NULL, note)
- Không có cột status hay available_quantity; không lưu trạng thái phiếu hay số lượng còn lại trong DB.
- availableQuantity = total_quantity - COALESCE(SUM(quantity) của phiếu có returned_at IS NULL, 0), tính trong SQL.
- Trạng thái phiếu tính trong SQL: returned_at NOT NULL -> returned; returned_at NULL và due_date < CURDATE() -> overdue;
  còn lại -> borrowing.
- Seed Phần 1: 12 thiết bị (LAB-001..LAB-012; LAB-011, LAB-012 chưa có phiếu nào) và 15 phiếu đủ 3 trạng thái,
  ngày dùng CURDATE() +/- n.

API PHẦN 1 (đã có, base /api, thành công trả { data, pagination? }, tạo mới 201, xóa 204)
- GET/POST /equipments, GET/PUT/DELETE /equipments/:id (search, category, page, limit)
- GET/POST /borrowings (lọc status=borrowing|returned|overdue), PATCH /borrowings/:id/return
- Mã lỗi đang có: VALIDATION_ERROR 400, INVALID_DUE_DATE 400, NOT_FOUND 404, DUPLICATE_CODE 409,
  INSUFFICIENT_QUANTITY 409, EQUIPMENT_HAS_BORROWINGS 409, ALREADY_RETURNED 409, INTERNAL_SERVER_ERROR 500.
- Phân trang trả { page, limit, total, totalPages }.

CÁCH LÀM VIỆC
- Không giả vờ hoàn thành: chưa chạy thử thì nói rõ "chưa chạy thử" và đưa lệnh để tôi tự chạy.
- Gặp chỗ chưa rõ: chọn phương án đơn giản, hợp lý và ghi vào mục "Giả định" của README.md.
- Các phần việc tôi phải tự làm (không làm thay): chụp ảnh Postman/giao diện, điền lỗi thật sự phát hiện vào prompts.md,
  ghi chú 3–5 câu về lỗi khó nhất, commit (tiền tố feat:/fix:, mô tả tiếng Việt có dấu).

=== PHẦN 2 – HƯỚNG B: THỐNG KÊ VÀ BÁO CÁO ===
Phần 1 đã hoàn thành và kiểm thử xong. Từ giờ được phép đọc và dùng giao_dien_mau/mo_rong/.
Yêu cầu khách hàng: "Ban quản lý muốn biết thiết bị nào được mượn nhiều, thiết bị nào nằm kho,
và xu hướng mượn theo tháng."

NGUYÊN TẮC
- Chỉ THÊM, không sửa hành vi Phần 1: API, giao diện và dữ liệu Phần 1 phải chạy y như cũ.
  Chỉ được sửa file Phần 1 ở mức tối thiểu để gắn thêm (mount route trong app.js, thêm link menu, thêm Route).
- Báo cáo CHỈ ĐỌC: mọi endpoint của Phần 2 là GET, không INSERT/UPDATE/DELETE.
- Không thêm bảng, không thêm cột. Mọi số liệu suy ra từ borrowings JOIN equipments.
  Phần thiết kế dữ liệu bổ sung nằm trong db/mo_rong.sql (chỉ index + dữ liệu mẫu trải nhiều tháng).
- Vẫn theo quy ước Phần 1: CommonJS, mysql2/promise + prepared statement, zod, phân tầng
  route -> validator -> controller -> service, JSON camelCase, lỗi { error: { code, message } } tiếng Việt có dấu.

GIẢ ĐỊNH NGHIỆP VỤ (nguồn chuẩn, ghi nguyên vào mục "Phân tích" của README)
1. Một "lượt mượn" là một dòng trong borrowings, tính theo borrowed_at, KHÔNG phụ thuộc đã trả hay chưa
   (phiếu đã trả, đang mượn, quá hạn đều được tính vì lượt mượn đã phát sinh).
2. Khoảng thống kê [from, to] tính cả hai đầu mút (borrowed_at BETWEEN from AND to).
   Mặc định: to = hôm nay (CURDATE() của MySQL); from = ngày mùng 1 của tháng cách tháng của `to` 11 tháng
   (tức 12 tháng lịch gần nhất, gồm tháng hiện tại). Chỉ truyền một đầu thì đầu còn lại lấy mặc định theo quy tắc này.
3. Thiết bị được mượn nhiều: xếp theo SUM(quantity) trong kỳ giảm dần; hòa thì theo số phiếu COUNT(*) giảm dần;
   vẫn hòa thì theo equipments.id tăng dần (để kết quả ổn định). Chỉ liệt kê thiết bị có >= 1 lượt mượn trong kỳ.
4. Thiết bị nằm kho (idle): total_quantity > 0 và KHÔNG có phiếu nào có borrowed_at trong kỳ.
   Luôn hiển thị availableQuantity hiện tại (tính cùng công thức Phần 1): thiết bị đã mượn hết thì bằng 0,
   không được coi là "còn hàng". Hiển thị thêm lastBorrowedAt (lần mượn gần nhất trong TOÀN BỘ lịch sử,
   null nếu chưa từng được mượn). Sắp xếp: chưa từng mượn lên đầu, sau đó lastBorrowedAt cũ nhất trước, rồi id tăng dần.
   Giới hạn đã biết: "nằm kho" chỉ xét 0 lượt trong kỳ, chưa xét "ít được mượn" (ghi vào README).
5. Xu hướng theo tháng: với mỗi tháng lịch trong kỳ, borrowingCount = số phiếu, totalQuantity = tổng quantity.
   LUÔN trả đủ mọi tháng từ tháng của `from` đến tháng của `to`, tháng không có lượt mượn trả 0.
   Tháng đầu/cuối có thể là tháng thiếu ngày nếu kỳ không tròn tháng (ghi vào README).
6. Giới hạn kỳ: from <= to; khoảng tối đa 60 tháng (tránh trả mảng quá lớn). Vi phạm -> INVALID_DATE_RANGE (HTTP 400).

HỢP ĐỒNG API (base /api/reports, tất cả GET; mọi response kèm "range": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD" }
là kỳ THỰC TẾ đã áp dụng, để giao diện hiển thị đúng khi dùng mặc định)
- /summary?from=&to=
    -> 200 { "data": { "totalBorrowings", "totalBorrowedQuantity", "idleEquipmentCount" }, "range" }
- /top-equipments?from=&to=&limit=10
    -> 200 { "data": [ { "rank", "equipmentId", "code", "name", "category", "totalBorrowedQuantity",
                          "borrowingCount", "availableQuantity" } ], "range" }     limit 1..50, mặc định 10
- /idle-equipments?from=&to=&page=1&limit=10
    -> 200 { "data": [ { "equipmentId", "code", "name", "category", "totalQuantity", "availableQuantity",
                          "lastBorrowedAt" } ], "pagination": { page, limit, total, totalPages }, "range" }
- /monthly-trend?from=&to=
    -> 200 { "data": [ { "month": "YYYY-MM", "borrowingCount", "totalQuantity" } ], "range" }   sắp xếp tháng tăng dần
- Mọi số trả về phải là kiểu number (SUM/COUNT của MySQL có thể về chuỗi/DECIMAL -> ép Number, dùng COALESCE(..., 0)).
- Lỗi: from/to sai định dạng hoặc ngày không tồn tại (2026-02-31), limit/page không hợp lệ -> VALIDATION_ERROR 400;
  from > to hoặc kỳ > 60 tháng -> INVALID_DATE_RANGE 400.

BẪY PHẢI TRÁNH
- Không JOIN borrowings hai lần trong cùng truy vấn (SUM bị nhân đôi). availableQuantity tính bằng subquery tương quan
  hoặc tái sử dụng đúng đoạn SQL/hàm của Phần 1; lastBorrowedAt dùng subquery MAX riêng.
- Số "thiết bị nằm kho" trong /summary và tổng trong /idle-equipments phải lấy từ CÙNG một điều kiện/hàm (không viết hai lần).
- Không tính ngày bằng new Date() ở Node; "hôm nay" lấy từ CURDATE(); tháng đệm số 0 tính bằng phép cộng chuỗi YYYY-MM
  hoặc CTE đệ quy, không dùng Date (tránh lệch múi giờ).

FRONTEND PHẦN 2
- Chuyển giao diện từ giao_dien_mau/mo_rong/ sang React, giữ nguyên phong cách như Phần 1 (không dựng dashboard mới,
  không đổi thư viện UI). Thêm trang /reports và mục menu tương ứng.
- Biểu đồ: dùng đúng cách giao diện mẫu đang dùng (thư viện nào thì cài đúng thư viện đó); nếu mẫu không dùng thư viện,
  vẽ bằng CSS/SVG, không thêm thư viện nặng nếu không cần. Ghi quyết định vào README.
- Mỗi khối (tổng quan, top, nằm kho, xu hướng) có loading / empty / error ĐỘC LẬP: một API lỗi không làm trắng cả trang;
  có nút thử lại. Không có dữ liệu -> trạng thái rỗng, không vẽ biểu đồ sai. Tháng bằng 0 vẫn hiển thị.
- Bộ lọc kỳ (từ ngày – đến ngày): kiểm tra from <= to ở client nhưng vẫn hiển thị lỗi API khi server từ chối.
  Ngày hiển thị dd/mm/yyyy bằng hàm formatDate của Phần 1; tháng hiển thị mm/yyyy.
- Dữ liệu 100% từ API, không hardcode. Gọi API qua axios instance + hook (useReports hoặc nhiều hook nhỏ), không gọi rải rác.

VIỆC CẦN LÀM NGAY BÂY GIỜ (chưa sửa/tạo file nào):
1. Đọc nhanh dự án: cấu trúc thư mục, db/*.sql, backend (app.js, một bộ route/controller/service/validator mẫu,
   middleware lỗi, cấu hình pool), frontend (App/Router, axios instance, hooks, formatDate, layout/menu),
   và toàn bộ giao_dien_mau/mo_rong/.
2. Trả lời NGẮN (tối đa khoảng 15 dòng):
   - Xác nhận đã hiểu bối cảnh và nhiệm vụ Phần 2 hướng B.
   - Liệt kê điểm khác biệt giữa mô tả ở trên và code thực tế (nếu có).
   - Liệt kê điểm giao diện mẫu mo_rong KHÔNG khớp hợp đồng API Phần 2 (nếu có).
3. Dừng lại và chờ tôi gửi prompt tiếp theo.

=====================================================================
Prompt 3: triển khai phần 2

Triển khai Phần 2 hướng B theo phần "PHẦN 2" trong ngữ cảnh dự án đã gửi ở đầu cuộc trò chuyện, làm liền một mạch.

BƯỚC 0 – Đọc trước khi code (không cần báo cáo dài):
 db/rikkei_lab.sql, db/seed.sql, toàn bộ giao_dien_mau/mo_rong/, và code Phần 1 (app.js, một service + controller + route
 mẫu, axios instance, hooks, formatDate, layout/menu) để làm đúng theo quy ước đang có.
 Điểm giao diện mẫu không khớp hợp đồng API: ghi vào mục "Giả định" của README, chọn phương án đơn giản, hợp lý, không dừng lại hỏi.

PHẦN A – DATABASE: tạo db/mo_rong.sql (chạy được SAU schema.sql + seed.sql, chạy lại nhiều lần không lỗi)
 A1. Không thêm bảng/cột. Thêm index phục vụ lọc theo kỳ: (borrowed_at, equipment_id) trên borrowings.
     MySQL không có CREATE INDEX IF NOT EXISTS: kiểm tra information_schema.statistics rồi PREPARE/EXECUTE,
     hoặc cách tương đương.
 A2. Dữ liệu mẫu bổ sung (id từ 101 trở lên; đầu phần này DELETE FROM borrowings WHERE id BETWEEN 101 AND 199
để chạy lại không nhân đôi). Yêu cầu: tiếng Việt có dấu; ngày tương đối bằng CURDATE() - INTERVAL n MONTH/DAY;
     trải đều 12 tháng gần nhất với ít nhất 25 phiếu; ít nhất MỘT tháng trong 12 tháng đó hoàn toàn không có lượt mượn;
     ít nhất hai thiết bị cùng tổng quantity nhưng khác số phiếu (để kiểm tra tiêu chí phụ); LAB-011 và LAB-012 vẫn
     KHÔNG có phiếu nào (idle chắc chắn). TẤT CẢ phiếu thêm đều đã trả (returned_at NOT NULL, returned_at >= borrowed_at,
     due_date >= borrowed_at và <= borrowed_at + 14 ngày) để không làm đổi availableQuantity hiện tại của Phần 1.
 A3. Chú thích đầu file: mục đích, thứ tự chạy, lệnh chạy:
     mysql -u root -p --default-character-set=utf8mb4 < db/mo_rong.sql

PHẦN B – BACKEND
 B1. validators/reports.validator.js (zod): from, to (YYYY-MM-DD, ngày thật), limit, page; quy tắc from<=to và <= 60 tháng
     -> INVALID_DATE_RANGE; áp dụng mặc định kỳ theo giả định số 2.
 B2. services/reports.service.js: 4 hàm tương ứng 4 endpoint; summary dùng chung logic idle với idle-equipments;
     monthly-trend gom theo DATE_FORMAT(borrowed_at,'%Y-%m') rồi đệm các tháng thiếu bằng 0, theo đúng thứ tự tăng dần.
 B3. controllers/reports.controller.js, routes/reports.routes.js, mount /api/reports trong app.js. Chỉ GET.
 B4. backend/tests/reports.http (hoặc Postman JSON) gồm các ca ở Prompt 3, mục 1 (BACKEND).

PHẦN C – FRONTEND (làm sau khi backend chạy được)
 C1. api/reportApi.js + hook(s) tải 4 khối độc lập (Promise.allSettled hoặc hook riêng từng khối).
 C2. pages/ReportsPage chuyển từ giao diện mẫu mo_rong (giao_dien_mau/mo_rong/b-thong-ke.html): thẻ tổng quan, bảng/biểu đồ top thiết bị,
     bảng thiết bị nằm kho (có phân trang, hiển thị availableQuantity và lastBorrowedAt dạng dd/mm/yyyy hoặc "Chưa từng mượn"),
     biểu đồ xu hướng theo tháng (đủ mọi tháng), bộ lọc kỳ, loading/empty/error từng khối.
 C3. Thêm Route /reports và link menu; không làm đổi giao diện hai trang Phần 1.

BÁO CÁO CUỐI (bắt buộc, trung thực):
 - File đã tạo/sửa (nêu rõ file Phần 1 nào bị sửa và sửa gì, nếu có).
 - Lệnh đã chạy + kết quả thật của từng ca kiểm thử; ca nào chưa chạy thì ghi "chưa chạy thử" kèm lệnh để tôi chạy.
 - Cách kiểm tra giao diện /reports trên trình duyệt.
Không sửa hành vi Phần 1. Không đánh dấu "xong" nếu chưa chạy thử.