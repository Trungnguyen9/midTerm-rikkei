# Giao diện mẫu Rikkei Lab

Giao diện HTML + Bootstrap 5.3.3 (nạp từ CDN, cần có mạng). Dữ liệu trong các trang là dữ liệu cứng để xem màn hình mong muốn, không phải dữ liệu thật.

| Tệp | Nội dung |
| :--- | :--- |
| `index.html` | Phần 1: quản lý thiết bị |
| `phieu-muon.html` | Phần 1: phiếu mượn |
| `mo_rong/a-tien-phat.html` | Phần 2, hướng A |
| `mo_rong/b-thong-ke.html` | Phần 2, hướng B |
| `mo_rong/c-dat-truoc.html` | Phần 2, hướng C |
| `mo_rong/d-tai-khoan.html` | Phần 2, hướng D |

Mỗi khối giao diện nằm giữa hai chú thích `Component: Tên` và `Hết: Tên`. Phần "Bảng trạng thái" cuối trang là các trạng thái khác của giao diện, không phải màn hình thật. Giao diện ở Phần 2 chỉ là gợi ý; bạn được điều chỉnh theo thiết kế của mình.

Chuyển HTML sang JSX bằng https://transform.tools/html-to-jsx, rồi tách component, thay dữ liệu cứng bằng state và props.
