<div align="center">

# LIFEQUEST AI
### English learning through exploration, conversation and adventure

**Educational RPG · Pixel Art 2D · AI NPCs · CEFR A1–C1**

*Học tiếng Anh không chỉ qua bài tập, mà qua những tình huống trong một thế giới sống động.*

[Phiên bản V77](https://github.com/lehuythevinh-byte/lifequest-ai/tree/deploy/lifequest-v77/v77) · [Các phiên bản V75–V76](https://github.com/lehuythevinh-byte/lifequest-ai/tree/deploy/lifequest-v70-apikey-20261116) · [V70](https://github.com/lehuythevinh-byte/lifequest-ai/tree/deploy/lifequest-v70-20261116)

</div>

## Giới thiệu

LIFEQUEST AI là dự án game nhập vai giáo dục hỗ trợ học sinh luyện tiếng Anh qua khám phá thế giới, tương tác với nhân vật (NPC) và hoàn thành nhiệm vụ bằng ngôn ngữ. Người chơi thực hành giao tiếp trong những bối cảnh như mua sắm, hỏi đường, làm việc, nghệ thuật và tìm hiểu văn hóa.

Dự án kết hợp đồ họa pixel-art 2D, nhiệm vụ theo ngữ cảnh, luyện từ vựng, phản hồi ngôn ngữ và hội thoại AI. Mục tiêu là tạo môi trường thực hành tiếng Anh có ý nghĩa, phù hợp với trình độ người học.

## Tính năng chính

- Thế giới nhiều khu vực, NPC có tính cách và nhiệm vụ riêng.
- Hội thoại tiếng Anh theo ngữ cảnh, mục tiêu giao tiếp và độ khó CEFR.
- Hệ thống nhiệm vụ, tiến trình khám phá và nội dung văn hóa.
- Luyện từ vựng, nghe và phản hồi ngôn ngữ.
- Tích hợp Google Gemini qua backend; chế độ offline dựa trên quy tắc khi AI không khả dụng.
- Khi gặp cư dân, ba thẻ Dialogue, Language và Memory cho phép trò chuyện, tra từ và xem lại câu đã học. Trong Memory, chọn Replay để mở lịch sử và sổ cụm từ của cư dân đó.

Tính năng cụ thể phụ thuộc vào phiên bản. Nhánh main chứa nền tảng English Town cũ; các phiên bản mở rộng được lưu trong những nhánh riêng.

## Thế giới của LIFEQUEST AI (V77)

| Khu vực | CEFR | Bối cảnh luyện tập |
| --- | --- | --- |
| English Town | A1–A2 | Chào hỏi, mua sắm, hỏi đường |
| Minerals Town | A2 | Khám phá, mô tả và trao đổi thông tin |
| Oriaris — 70 Years Ago | A2–B1 | Lịch sử và kể chuyện |
| Art District | B1 | Nghệ thuật, sáng tạo và trình bày ý kiến |
| Tech-Co | B1 | Giao tiếp công sở, cuộc họp, báo sự cố |
| Old Oriaris | B1–B2 | Bí ẩn hoàng gia và kể chuyện quá khứ |
| Wish Valley | B2 | Thiên nhiên, lời khuyên, ước và giả định |
| Vocalt — Greedy Land | B2–C1 | Thương mại, đàm phán và giao tiếp nâng cao |

## Các phiên bản

| Phiên bản | Nội dung | Mã nguồn |
| --- | --- | --- |
| English Town | Nền tảng React/Phaser | [main](https://github.com/lehuythevinh-byte/lifequest-ai/tree/main) |
| V70 | Dream Gate và bản HTML độc lập | [V70](https://github.com/lehuythevinh-byte/lifequest-ai/tree/deploy/lifequest-v70-20261116) |
| V75 | Hội thoại NPC nhận biết chủ đề và ngữ cảnh | [V75](https://github.com/lehuythevinh-byte/lifequest-ai/tree/deploy/lifequest-v70-apikey-20261116/v75) |
| V76 | Hội thoại tự nhiên, cách nói ẩn ý và cá tính NPC | [V76](https://github.com/lehuythevinh-byte/lifequest-ai/tree/deploy/lifequest-v70-apikey-20261116/v76) |
| V77 | Living World Interface — chân dung cư dân, tra từ, Replay, Passport và Herald | [V77](https://github.com/lehuythevinh-byte/lifequest-ai/tree/deploy/lifequest-v77/v77) |

V77 là bản mới nhất xác định được trong repository này; không đồng nghĩa với việc mọi tính năng dự kiến đã hoàn thành.

## Điều khiển (V77)

| Phím | Chức năng |
| --- | --- |
| WASD / phím mũi tên | Di chuyển |
| E | Tương tác / hội thoại NPC |
| G | Menu |
| B | Kinh tế |
| L | Lịch sử hội thoại |
| P | Hộ chiếu văn hóa |
| T | Bản tin LifeQuest Herald |
| Esc | Đóng bảng đang mở |

## Chạy V77 trên máy

Yêu cầu Node.js 22, Git, shell hỗ trợ `sh` và `sha256sum` (Linux/WSL hoặc môi trường tương đương).

```bash
git clone --branch deploy/lifequest-v77 https://github.com/lehuythevinh-byte/lifequest-ai.git
cd lifequest-ai
sh v77/build.sh
node v77/backend/server.cjs
```

Mở http://localhost:10000. Bước build xác minh 53 phần mã nguồn Beyond Conversation, ghép giao diện Living World và đối chiếu tệp `v77/game.html` với `v77/game.sha256`.

## Triển khai V77 lên Render

| Thiết lập | Giá trị |
| --- | --- |
| Branch | `deploy/lifequest-v77` |
| Root Directory | Để trống |
| Runtime | Node |
| Build Command | `sh v77/build.sh` |
| Start Command | `node v77/backend/server.cjs` |
| Health Check Path | `/health` |

Trong Environment của backend, đặt `GEMINI_API_KEY` nếu cần AI trực tuyến. Không đưa giá trị thật vào GitHub, HTML hay JavaScript. Không có key thì game sử dụng chế độ offline (rules).

Tài liệu: [V77 README](https://github.com/lehuythevinh-byte/lifequest-ai/blob/deploy/lifequest-v77/v77/README.md) · [Kiến trúc](https://github.com/lehuythevinh-byte/lifequest-ai/blob/deploy/lifequest-v77/v77/ARCHITECTURE.md) · [AI system](https://github.com/lehuythevinh-byte/lifequest-ai/blob/deploy/lifequest-v77/v77/AI_SYSTEM.md) · [Render setup](https://github.com/lehuythevinh-byte/lifequest-ai/blob/deploy/lifequest-v77/v77/RENDER_SETUP.md) · [Test report](https://github.com/lehuythevinh-byte/lifequest-ai/blob/deploy/lifequest-v77/v77/TEST_REPORT.md).

## Bảo mật và phát triển

- API key chỉ được cấu hình ở môi trường backend, không commit bí mật.
- Chế độ offline không phải là AI trực tuyến; kết quả AI có thể sai và cần được kiểm tra.
- Giữ nguyên phong cách sprite NPC, tiến trình nhiệm vụ và dữ liệu lưu khi nâng cấp.
- Không đưa mã nguồn của dự án khác vào repository này.

**Trạng thái:** Dự án đang phát triển. Tài liệu mô tả cấu trúc và tính năng đã ghi nhận trong mã nguồn; trạng thái dịch vụ trực tuyến và kết nối Gemini cần được kiểm tra sau khi triển khai.
