# LIFEQUEST AI V78.1 — Listening World

*Meet a world that listens, reacts and remembers.*

[Chơi trên Render](https://lifequest-ai-v77.onrender.com) · [Mã nguồn](https://github.com/lehuythevinh-byte/lifequest-ai/tree/deploy/lifequest-v77/v77) · [Kiểm tra phiên bản](https://lifequest-ai-v77.onrender.com/health)

LifeQuest AI là game nhập vai giáo dục tiếng Anh 2D pixel-art. V78.1 xây dựng trực tiếp trên V78 Living Encounters, bảo toàn sprite di chuyển, tám vùng đất, cốt truyện và dữ liệu nhiệm vụ gốc; nâng cấp giao tiếp, trình diễn chân dung và trải nghiệm người dùng.

## Những thay đổi trong V78.1

- Phân biệt hành động với câu hỏi tìm hiểu, phát ngôn ví dụ, câu giả định, yêu cầu hủy và sửa ý sau từ actually/instead. Chấp nhận một số dạng số nhiều, yêu cầu lịch sự và lượng hàng. Câu mơ hồ được hỏi lại; câu phủ định hoặc ví dụ không tự hoàn thành nhiệm vụ.
- Quy tắc local sửa đáp lời không nhất quán ở một số tình huống giao dịch; câu hỏi giá chưa có dữ liệu hiển thị giới hạn danh mục. Các bước nhiệm vụ từ khóa được lọc thận trọng hơn. Không lưu tên từ câu "I am tired" hoặc trích dẫn thông thường.
- Tạo hình tuổi cho cả NPC vùng chưa có hồ sơ tuổi. Animation giữ pha chớp mắt khi đổi cảm xúc; dừng chuyển miệng khi kết thúc hoặc reveal chữ; đạo cụ cọ vẽ/đá quý xuất hiện nếu hoạt động tương ứng được mô tả.
- Trạng thái Ready/Thinking/Try again, khóa nút Send khi đang chờ, ngăn kết quả từ điển cũ xuất hiện trong phiên NPC mới. Tab trở lại điều hướng bàn phím; Alt+M bật mic. Dễ đọc trên màn hình nhỏ.

## Những thay đổi được giữ từ V78

- **Meaning Engine:** phân biệt yêu cầu thật, phủ định, giả định, lời thuật lại, câu hỏi giá, mỉa mai có dấu hiệu rõ, lạc đề và yêu cầu thay đổi luật chơi. Câu mơ hồ cần được làm rõ, không tự động hoàn thành nhiệm vụ chỉ vì chứa một từ khóa. Điều kiện nhiệm vụ hỏi giá đá quý và bài tập cấu trúc ở Art District được xét riêng.
- **Grounded dialogue:** dùng danh mục giá thực tế, không tự động cộng điểm quan hệ ở mọi lượt, không lưu thông tin do AI tự bịa. Nguồn phản hồi được hiển thị theo từng lượt: AI, offline rules, local meaning rule hoặc verified shop catalog.
- **English practice:** duy trì Teacher, gợi ý câu, phát âm, sổ tay và lịch sử. Prompt Gemini yêu cầu đánh giá ý nghĩa và sắc thái của chính NPC, không gán cảm xúc cho người học.
- **Generations:** giữ 59 hồ sơ hình thái riêng và 40 trạng thái biểu cảm của V77.5. Bổ sung 5 nhóm tạo hình (child, young, adult, mature, elder), thay đổi tỷ lệ khuôn mặt, tóc hoa râm, nếp nhăn và sắc độ vùng mặt. Tuổi ở đây là thiết kế đồ họa, không khẳng định tuổi chính thức trong lore.
- **Living Portraits:** chân dung 128 × 128 pixel với frame chớp mắt, hướng nhìn, chuyển miệng theo nhịp hiển thị chữ, nhịp thở/gật đầu; cử chỉ có đạo cụ thư, sách, cốc, tài liệu khi hoạt động mô phỏng tương ứng. Đây không phải hệ lip-sync âm vị hay video. Motion có thể tắt và tôn trọng prefers-reduced-motion. Khung không còn hiển thị sẽ được dừng animation.
- **Clean UI:** bố cục hai vùng, nhiệm vụ/quan hệ trong hồ sơ, hội thoại và thao tác học ở bên phải; thu gọn các yếu tố trang trí, tối ưu khung nhập trên màn hình nhỏ. Minh họa bối cảnh nghề nghiệp không phải bản đồ chính xác. Màn hình chào không yêu cầu nhập key; backend quản lý AI khi được cấu hình.

## Chạy local

Node.js 20+. Từ GitHub, tái dựng game trước khi khởi động:

```sh
git clone -b deploy/lifequest-v77 https://github.com/lehuythevinh-byte/lifequest-ai.git
cd lifequest-ai
sh v77/build.sh
node v77/backend/server.cjs
```

Mở http://localhost:10000. Nếu dùng gói ZIP chính thức (đã có game.html), có thể chạy backend ngay. Không đưa API key lên GitHub.

## Render

| Thiết lập | Giá trị |
|---|---|
| Nhánh | deploy/lifequest-v77 |
| Build Command | `sh v77/build.sh` |
| Start Command | `node v77/backend/server.cjs` |
| Health endpoint | `/health` |
| GEMINI_API_KEY | Secret trong Render Environment |
| GEMINI_MODEL | gemini-2.5-flash (mặc định) |

Render dùng dịch vụ cũ và tự động triển khai khi nhánh được cập nhật. Tên thư mục v77 được giữ để tương thích cấu hình cũ. Không cần tạo thêm dịch vụ.

## Mã nguồn

- `v77/game.html`: HTML tự chứa được tạo khi build.
- `v77/ember-ink/`: 26 phần mã nguồn gốc.
- `v77/atelier-portraits.patch.json`: thay đổi V77.4.
- `v77/faces-of-life.patch.json`: thay đổi V77.5.
- `v77/listening-world-release.patch.json`: 17 nhóm chỉnh sửa tái dựng chính xác V78.1 từ V77.5; bao gồm Meaning Engine, animation, UI và thiết kế độ tuổi đã nhúng.
- `v77/build-listening.cjs`: tái dựng và kiểm tra SHA-256 các phiên bản.
- `v77/backend/server.cjs`: Node.js server và Gemini relay.
- `v77/TEST_REPORT.md`: kết quả kiểm thử và giới hạn.

## Giới hạn

Bộ quy tắc offline không phải mô hình ngôn ngữ tổng quát; các câu mới, đa nghĩa hoặc phản ứng tinh tế vẫn cần Gemini và có thể được hỏi lại. Không cam kết AI hiểu hoàn hảo mọi câu. Cấu trúc nhiệm vụ ngôn ngữ kiểm tra theo dấu hiệu, không thay thế đánh giá ngữ pháp chuyên sâu. Chưa chạy hết tám bản đồ: trình duyệt chặn mở HTML gốc, kiểm thử tích hợp ở màn hình chào bằng nội dung nhúng và fixture hội thoại tách riêng. Chưa kiểm thử Gemini thật hoặc toàn bộ gameplay trực tuyến; xem /health để xác nhận phiên bản đang chạy.

**SHA-256 của V78.1:** `8c9ce6e06eea9bb4931b0d5e50c2a4e0741e7be816c49d7dc165b7aea726ff45`
