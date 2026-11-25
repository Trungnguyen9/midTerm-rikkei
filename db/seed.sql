SET NAMES utf8mb4;
USE rikkei_lab;

INSERT INTO equipments (id, code, name, category, total_quantity) VALUES
 (1,  'LAB-001', 'Laptop Dell Latitude 5420',          'laptop',       10),
 (2,  'LAB-002', 'Laptop Lenovo ThinkPad E14',         'laptop',        8),
 (3,  'LAB-003', 'Laptop HP ProBook 450 G8',           'laptop',        6),
 (4,  'LAB-004', 'Màn hình Dell 24 inch P2422H',       'man_hinh',     12),
 (5,  'LAB-005', 'Màn hình LG UltraWide 29 inch',      'man_hinh',      4),
 (6,  'LAB-006', 'Bo mạch Arduino Uno R3',             'mach_dien_tu', 20),
 (7,  'LAB-007', 'Bo mạch Raspberry Pi 4 Model B',     'mach_dien_tu',  6),
 (8,  'LAB-008', 'Kit ESP32 DevKit V1',                'mach_dien_tu', 15),
 (9,  'LAB-009', 'Bàn phím cơ Logitech K845',          'phu_kien',     10),
 (10, 'LAB-010', 'Chuột không dây Logitech M331',      'phu_kien',     15),
 (11, 'LAB-011', 'Cáp HDMI 2 mét',                     'phu_kien',     25),
 (12, 'LAB-012', 'Bộ chuyển đổi USB-C sang HDMI',      'phu_kien',      5);

-- LAB-011, LAB-012 cố ý KHÔNG có phiếu mượn -> dùng để kiểm thử xóa thiết bị thành công.
-- Trạng thái: returned = 4 | overdue = 5 | borrowing = 6
INSERT INTO borrowings
    (id, equipment_id, borrower_name, quantity, borrowed_at, due_date, returned_at, note) VALUES
 -- Đang mượn (returned_at NULL, due_date >= hôm nay)
 (1,  1, 'Nguyễn Văn An',     2, CURDATE() - INTERVAL 3 DAY,  CURDATE() + INTERVAL 4 DAY,  NULL, 'Mượn làm bài tập lớn'),
 (4,  2, 'Phạm Minh Đức',     3, CURDATE() - INTERVAL 5 DAY,  CURDATE() + INTERVAL 2 DAY,  NULL, 'Dùng cho buổi thực hành nhóm'),
 (7,  4, 'Bùi Thu Giang',     4, CURDATE() - INTERVAL 2 DAY,  CURDATE() + INTERVAL 5 DAY,  NULL, 'Chuẩn bị buổi demo'),
 (10, 6, 'Dương Văn Khoa',    5, CURDATE() - INTERVAL 1 DAY,  CURDATE() + INTERVAL 6 DAY,  NULL, 'Thực hành vi điều khiển'),
 (12, 7, 'Trịnh Quang Nam',   2, CURDATE() - INTERVAL 6 DAY,  CURDATE() + INTERVAL 8 DAY,  NULL, 'Đề tài IoT, hạn 14 ngày'),
 (14, 9, 'Mai Văn Phúc',      3, CURDATE() - INTERVAL 4 DAY,  CURDATE() + INTERVAL 3 DAY,  NULL, NULL),
 -- Quá hạn (returned_at NULL, due_date < hôm nay)
 (2,  1, 'Trần Thị Bích',     1, CURDATE() - INTERVAL 10 DAY, CURDATE() - INTERVAL 3 DAY,  NULL, 'Chưa mang trả'),
 (6,  3, 'Đặng Quốc Phong',   2, CURDATE() - INTERVAL 14 DAY, CURDATE() - INTERVAL 1 DAY,  NULL, 'Đã nhắc trả'),
 (8,  4, 'Hồ Anh Huy',        2, CURDATE() - INTERVAL 9 DAY,  CURDATE() - INTERVAL 2 DAY,  NULL, NULL),
 (11, 6, 'Lý Thanh Mai',      3, CURDATE() - INTERVAL 8 DAY,  CURDATE() - INTERVAL 1 DAY,  NULL, 'Hỏng cáp nguồn, chờ xử lý'),
 (15, 10,'Đỗ Ngọc Quỳnh',     4, CURDATE() - INTERVAL 7 DAY,  CURDATE() - INTERVAL 4 DAY,  NULL, NULL),
 -- Đã trả
 (3,  1, 'Lê Hoàng Cường',    2, CURDATE() - INTERVAL 20 DAY, CURDATE() - INTERVAL 10 DAY, CURDATE() - INTERVAL 11 DAY, 'Trả đúng hạn'),
 (5,  2, 'Võ Thị Em',         1, CURDATE() - INTERVAL 12 DAY, CURDATE() - INTERVAL 2 DAY,  CURDATE() - INTERVAL 1 DAY,  'Trả muộn 1 ngày'),
 (9,  5, 'Ngô Khánh Linh',    1, CURDATE() - INTERVAL 30 DAY, CURDATE() - INTERVAL 20 DAY, CURDATE() - INTERVAL 21 DAY, NULL),
 (13, 8, 'Phan Thị Oanh',     5, CURDATE() - INTERVAL 15 DAY, CURDATE() - INTERVAL 5 DAY,  CURDATE() - INTERVAL 6 DAY,  'Đã kiểm tra đủ bộ');