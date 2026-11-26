-- =============================================================================
-- mo_rong.sql – Phần 2B: Thống kê và báo cáo
-- Mục đích : Thêm index phục vụ lọc theo kỳ và dữ liệu mẫu trải 12 tháng.
-- Thứ tự   : Chạy SAU rikkei_lab.sql (hoặc schema.sql + seed.sql).
-- Chạy lại : An toàn, không lỗi khi chạy nhiều lần.
-- Lệnh     : mysql -u root -p --default-character-set=utf8mb4 < db/mo_rong.sql
-- =============================================================================

SET NAMES utf8mb4;
USE rikkei_lab;

-- A1. Index phục vụ lọc theo kỳ: (borrowed_at, equipment_id)
-- MySQL không hỗ trợ CREATE INDEX IF NOT EXISTS, dùng kiểm tra information_schema.
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name   = 'borrowings'
    AND index_name   = 'idx_borrowings_borrowed_at_eq'
);

SET @sql_idx = IF(@idx_exists = 0,
  'CREATE INDEX idx_borrowings_borrowed_at_eq ON borrowings (borrowed_at, equipment_id)',
  'SELECT ''Index idx_borrowings_borrowed_at_eq already exists'' AS info'
);

PREPARE stmt FROM @sql_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- A2. Dữ liệu mẫu bổ sung (id 101–199)
-- Xóa trước để chạy lại không nhân đôi.
DELETE FROM borrowings WHERE id BETWEEN 101 AND 199;

-- Tất cả phiếu đều đã trả (returned_at NOT NULL, returned_at >= borrowed_at,
-- due_date >= borrowed_at và <= borrowed_at + 14 ngày).
-- LAB-011 (id=11), LAB-012 (id=12) KHÔNG có phiếu nào -> idle chắc chắn.
-- Trải đều 12 tháng gần nhất. Tháng CURDATE() - 6 MONTH hoàn toàn không có phiếu.
-- LAB-001 (id=1) và LAB-006 (id=6) sẽ có cùng tổng quantity nhưng khác số phiếu
-- để kiểm tra tiêu chí phụ.

INSERT INTO borrowings
    (id, equipment_id, borrower_name, quantity, borrowed_at, due_date, returned_at, note)
VALUES
-- ===== Tháng CURDATE() - 11 MONTH =====
(101, 1, 'Lê Văn Toàn',       2,
  DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-05'),
  DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-15'),
  DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-14'),
  'Mượn thực hành nhóm'),
(102, 2, 'Trần Thị Hoa',      1,
  DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-08'),
  DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-18'),
  DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-17'),
  'Bài tập cuối kỳ'),
(103, 6, 'Nguyễn Minh Tuấn',  2,
  DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-10'),
  DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-20'),
  DATE_FORMAT(CURDATE() - INTERVAL 11 MONTH, '%Y-%m-19'),
  'Thực hành vi điều khiển'),

-- ===== Tháng CURDATE() - 10 MONTH =====
(104, 3, 'Phạm Thanh Tùng',   2,
  DATE_FORMAT(CURDATE() - INTERVAL 10 MONTH, '%Y-%m-03'),
  DATE_FORMAT(CURDATE() - INTERVAL 10 MONTH, '%Y-%m-13'),
  DATE_FORMAT(CURDATE() - INTERVAL 10 MONTH, '%Y-%m-12'),
  'Mượn làm đồ án'),
(105, 4, 'Vũ Thị Lan',        3,
  DATE_FORMAT(CURDATE() - INTERVAL 10 MONTH, '%Y-%m-07'),
  DATE_FORMAT(CURDATE() - INTERVAL 10 MONTH, '%Y-%m-17'),
  DATE_FORMAT(CURDATE() - INTERVAL 10 MONTH, '%Y-%m-16'),
  'Chuẩn bị demo'),
(106, 6, 'Đỗ Quang Huy',      3,
  DATE_FORMAT(CURDATE() - INTERVAL 10 MONTH, '%Y-%m-12'),
  DATE_FORMAT(CURDATE() - INTERVAL 10 MONTH, '%Y-%m-22'),
  DATE_FORMAT(CURDATE() - INTERVAL 10 MONTH, '%Y-%m-21'),
  'Thực hành Arduino'),

-- ===== Tháng CURDATE() - 9 MONTH =====
(107, 1, 'Hoàng Văn Đạt',     3,
  DATE_FORMAT(CURDATE() - INTERVAL 9 MONTH, '%Y-%m-02'),
  DATE_FORMAT(CURDATE() - INTERVAL 9 MONTH, '%Y-%m-12'),
  DATE_FORMAT(CURDATE() - INTERVAL 9 MONTH, '%Y-%m-11'),
  'Lập trình hệ thống'),
(108, 5, 'Lý Thị Mai',        1,
  DATE_FORMAT(CURDATE() - INTERVAL 9 MONTH, '%Y-%m-06'),
  DATE_FORMAT(CURDATE() - INTERVAL 9 MONTH, '%Y-%m-16'),
  DATE_FORMAT(CURDATE() - INTERVAL 9 MONTH, '%Y-%m-15'),
  'Thiết kế giao diện'),
(109, 7, 'Trương Quốc Bảo',   2,
  DATE_FORMAT(CURDATE() - INTERVAL 9 MONTH, '%Y-%m-15'),
  DATE_FORMAT(CURDATE() - INTERVAL 9 MONTH, '%Y-%m-25'),
  DATE_FORMAT(CURDATE() - INTERVAL 9 MONTH, '%Y-%m-24'),
  'Dự án IoT'),

-- ===== Tháng CURDATE() - 8 MONTH =====
(110, 1, 'Ngô Thị Yến',       2,
  DATE_FORMAT(CURDATE() - INTERVAL 8 MONTH, '%Y-%m-04'),
  DATE_FORMAT(CURDATE() - INTERVAL 8 MONTH, '%Y-%m-14'),
  DATE_FORMAT(CURDATE() - INTERVAL 8 MONTH, '%Y-%m-13'),
  'Thực tập doanh nghiệp'),
(111, 8, 'Bùi Văn Khôi',      4,
  DATE_FORMAT(CURDATE() - INTERVAL 8 MONTH, '%Y-%m-10'),
  DATE_FORMAT(CURDATE() - INTERVAL 8 MONTH, '%Y-%m-20'),
  DATE_FORMAT(CURDATE() - INTERVAL 8 MONTH, '%Y-%m-19'),
  'Lớp học IoT nâng cao'),
(112, 9, 'Đinh Thị Phương',   2,
  DATE_FORMAT(CURDATE() - INTERVAL 8 MONTH, '%Y-%m-18'),
  DATE_FORMAT(CURDATE() - INTERVAL 8 MONTH, '%Y-%m-28'),
  DATE_FORMAT(CURDATE() - INTERVAL 8 MONTH, '%Y-%m-27'),
  'Dùng cho phòng họp'),

-- ===== Tháng CURDATE() - 7 MONTH =====
(113, 2, 'Lê Hoàng Sơn',      2,
  DATE_FORMAT(CURDATE() - INTERVAL 7 MONTH, '%Y-%m-01'),
  DATE_FORMAT(CURDATE() - INTERVAL 7 MONTH, '%Y-%m-11'),
  DATE_FORMAT(CURDATE() - INTERVAL 7 MONTH, '%Y-%m-10'),
  'Nghiên cứu khoa học'),
(114, 6, 'Phan Thị Ngọc',     3,
  DATE_FORMAT(CURDATE() - INTERVAL 7 MONTH, '%Y-%m-09'),
  DATE_FORMAT(CURDATE() - INTERVAL 7 MONTH, '%Y-%m-19'),
  DATE_FORMAT(CURDATE() - INTERVAL 7 MONTH, '%Y-%m-18'),
  'Workshop Arduino'),

-- ===== Tháng CURDATE() - 6 MONTH: KHÔNG CÓ PHIẾU NÀO =====
-- (tháng trống để kiểm tra đệm 0)

-- ===== Tháng CURDATE() - 5 MONTH =====
(115, 1, 'Trần Đức Anh',      2,
  DATE_FORMAT(CURDATE() - INTERVAL 5 MONTH, '%Y-%m-05'),
  DATE_FORMAT(CURDATE() - INTERVAL 5 MONTH, '%Y-%m-15'),
  DATE_FORMAT(CURDATE() - INTERVAL 5 MONTH, '%Y-%m-14'),
  'Làm bài tập nhóm'),
(116, 3, 'Nguyễn Thị Hằng',   1,
  DATE_FORMAT(CURDATE() - INTERVAL 5 MONTH, '%Y-%m-12'),
  DATE_FORMAT(CURDATE() - INTERVAL 5 MONTH, '%Y-%m-22'),
  DATE_FORMAT(CURDATE() - INTERVAL 5 MONTH, '%Y-%m-21'),
  'Mượn test phần mềm'),
(117, 10, 'Võ Minh Quân',     3,
  DATE_FORMAT(CURDATE() - INTERVAL 5 MONTH, '%Y-%m-20'),
  DATE_FORMAT(CURDATE() - INTERVAL 5 MONTH, '%Y-%m-28'),
  DATE_FORMAT(CURDATE() - INTERVAL 5 MONTH, '%Y-%m-27'),
  'Dùng cho lab nghiên cứu'),

-- ===== Tháng CURDATE() - 4 MONTH =====
(118, 4, 'Đặng Minh Hiếu',    2,
  DATE_FORMAT(CURDATE() - INTERVAL 4 MONTH, '%Y-%m-03'),
  DATE_FORMAT(CURDATE() - INTERVAL 4 MONTH, '%Y-%m-13'),
  DATE_FORMAT(CURDATE() - INTERVAL 4 MONTH, '%Y-%m-12'),
  'Trình bày đồ án'),
(119, 6, 'Lê Thanh Nhàn',     2,
  DATE_FORMAT(CURDATE() - INTERVAL 4 MONTH, '%Y-%m-11'),
  DATE_FORMAT(CURDATE() - INTERVAL 4 MONTH, '%Y-%m-21'),
  DATE_FORMAT(CURDATE() - INTERVAL 4 MONTH, '%Y-%m-20'),
  'Thực hành mạch số'),
(120, 7, 'Hồ Quang Vinh',     1,
  DATE_FORMAT(CURDATE() - INTERVAL 4 MONTH, '%Y-%m-19'),
  DATE_FORMAT(CURDATE() - INTERVAL 4 MONTH, '%Y-%m-28'),
  DATE_FORMAT(CURDATE() - INTERVAL 4 MONTH, '%Y-%m-27'),
  'Dự án Raspberry Pi'),

-- ===== Tháng CURDATE() - 3 MONTH =====
(121, 1, 'Phạm Thị Hạnh',     1,
  DATE_FORMAT(CURDATE() - INTERVAL 3 MONTH, '%Y-%m-02'),
  DATE_FORMAT(CURDATE() - INTERVAL 3 MONTH, '%Y-%m-12'),
  DATE_FORMAT(CURDATE() - INTERVAL 3 MONTH, '%Y-%m-11'),
  'Mượn ôn thi'),
(122, 5, 'Trịnh Văn Long',    2,
  DATE_FORMAT(CURDATE() - INTERVAL 3 MONTH, '%Y-%m-08'),
  DATE_FORMAT(CURDATE() - INTERVAL 3 MONTH, '%Y-%m-18'),
  DATE_FORMAT(CURDATE() - INTERVAL 3 MONTH, '%Y-%m-17'),
  'Thiết kế UX'),
(123, 8, 'Nguyễn Hữu Tài',   3,
  DATE_FORMAT(CURDATE() - INTERVAL 3 MONTH, '%Y-%m-16'),
  DATE_FORMAT(CURDATE() - INTERVAL 3 MONTH, '%Y-%m-26'),
  DATE_FORMAT(CURDATE() - INTERVAL 3 MONTH, '%Y-%m-25'),
  'Lab ESP32 cơ bản'),

-- ===== Tháng CURDATE() - 2 MONTH =====
(124, 1, 'Vũ Đức Thắng',      2,
  DATE_FORMAT(CURDATE() - INTERVAL 2 MONTH, '%Y-%m-04'),
  DATE_FORMAT(CURDATE() - INTERVAL 2 MONTH, '%Y-%m-14'),
  DATE_FORMAT(CURDATE() - INTERVAL 2 MONTH, '%Y-%m-13'),
  'Lập trình web'),
(125, 2, 'Lý Văn Phát',       1,
  DATE_FORMAT(CURDATE() - INTERVAL 2 MONTH, '%Y-%m-10'),
  DATE_FORMAT(CURDATE() - INTERVAL 2 MONTH, '%Y-%m-20'),
  DATE_FORMAT(CURDATE() - INTERVAL 2 MONTH, '%Y-%m-19'),
  'Bài tập lớn'),
(126, 6, 'Đỗ Thị Trâm',      2,
  DATE_FORMAT(CURDATE() - INTERVAL 2 MONTH, '%Y-%m-18'),
  DATE_FORMAT(CURDATE() - INTERVAL 2 MONTH, '%Y-%m-28'),
  DATE_FORMAT(CURDATE() - INTERVAL 2 MONTH, '%Y-%m-27'),
  'Workshop điện tử'),

-- ===== Tháng CURDATE() - 1 MONTH =====
(127, 3, 'Bùi Minh Châu',     2,
  DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-03'),
  DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-13'),
  DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-12'),
  'Thực hành hệ điều hành'),
(128, 9, 'Hoàng Thị Liên',    1,
  DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-09'),
  DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-19'),
  DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m-18'),
  'Phòng thí nghiệm'),

-- ===== Tháng hiện tại (đã trả, không ảnh hưởng availableQuantity) =====
-- Phiếu tháng này dùng ngày đầu tháng để chắc chắn đã qua
(129, 4, 'Lê Quốc Hưng',      1,
  DATE_FORMAT(CURDATE(), '%Y-%m-01'),
  DATE_FORMAT(CURDATE(), '%Y-%m-10'),
  DATE_FORMAT(CURDATE(), '%Y-%m-02'),
  'Mượn thử nghiệm ngắn');

-- Kiểm tra: LAB-001 (id=1) có các phiếu 101,107,110,115,121,124 -> quantity: 2+3+2+2+1+2=12, count=6
-- LAB-006 (id=6) có các phiếu 103,106,114,119,126 -> quantity: 2+3+3+2+2=12, count=5
-- Cùng totalBorrowedQuantity=12 nhưng khác borrowingCount (6 vs 5) -> kiểm tra tiêu chí phụ.

