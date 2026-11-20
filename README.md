<div align="center">

# LIFEQUEST AI
### V77.3 — Ember & Ink

**English learning through exploration, conversation and adventure**

*Explore a world. Find your voice. Make English part of your story.*

[Chơi LifeQuest AI](https://lifequest-ai-v77.onrender.com) · [Mã nguồn V77.3](https://github.com/lehuythevinh-byte/lifequest-ai/tree/deploy/lifequest-v77/v77) · [Kiểm tra phiên bản máy chủ](https://lifequest-ai-v77.onrender.com/health)

`Educational RPG` · `2D Pixel Art` · `AI NPCs` · `CEFR A1–C1`

</div>

## Tầm nhìn

LifeQuest AI là trò chơi nhập vai giáo dục giúp học sinh thực hành tiếng Anh qua những tình huống có ý nghĩa. Thay vì chỉ học từ vựng và ngữ pháp riêng lẻ, người chơi khám phá thế giới, gặp cư dân, giải quyết vấn đề và dùng tiếng Anh để hoàn thành nhiệm vụ.

## Ember & Ink — điểm nổi bật của V77.3

| Hệ thống | Trải nghiệm |
|---|---|
| Dialogue Theatre | Sân khấu RPG, phong cảnh pixel-art, ánh sáng theo đồng hồ game, bong bóng hội thoại và các thẻ học ngôn ngữ. |
| NPC expressions | Chân dung từ sprite gốc; biểu cảm mắt, mày, miệng khi hình học khuôn mặt phù hợp; nhãn cảm xúc và nguồn xác định. |
| Contextual conversation | NPC nhận ngữ cảnh khu vực, nhiệm vụ và danh mục kinh tế. Không gán giá giả cho món hàng chưa xác định. |
| AI Teacher | Phản hồi ngữ pháp, gợi ý câu và luyện nói tiếng Anh. |
| Relationship | Điểm quan hệ thực tế từ -20 đến 100; thông tin nhiệm vụ và lượt gặp dựa trên trạng thái game. |
| Conversation Replay | Xem lại cuộc trò chuyện, lưu cụm từ hữu ích vào sổ tay. |
| Cultural Passport | Tám dấu vùng dựa trên tiến trình và hoạt động có thật trong game. |
| LifeQuest Herald | Bản tin tổng hợp các sự kiện đã ghi nhận trong thế giới. |

V77.3 giữ bản đồ, nhân vật, nhiệm vụ, cơ chế mở khóa và phong cách sprite gốc. Cảm xúc chưa xác định được hiển thị rõ; phản hồi offline không được mô tả là AI trực tuyến.

## Tám vùng đất — tám bối cảnh giao tiếp

| Vùng | CEFR | Nội dung |
|---|---|---|
| English Town | A1–A2 | Đời sống thường ngày, chào hỏi, mua sắm, hỏi đường. |
| Minerals Town | A2 | Khám phá và giao tiếp trong thị trấn khai khoáng. |
| Oriaris · 70 Years Ago | A2–B1 | Lịch sử, ký ức và kể chuyện. |
| Art District | B1 | Nghệ thuật và trải nghiệm sáng tạo. |
| Tech-Co | B1 | Giao tiếp công việc và xử lý vấn đề. |
| Old Oriaris | B1–B2 | Bí ẩn kinh đô cũ và câu chuyện quá khứ. |
| Wish Valley | B2 | Thiên nhiên, cộng đồng, điều ước và lời khuyên. |
| Vocalt · Greedy Land | B2–C1 | Thương mại, đàm phán và giao tiếp phức tạp. |

Các vùng mở theo tiến trình của trò chơi; không phải tất cả đều mở ngay khi bắt đầu.

## Cách chơi

- WASD / phím mũi tên: di chuyển.
- E: tương tác với NPC.
- Enter: gửi câu trả lời; Esc: thoát hội thoại.
- G: menu; L: Replay; P: Cultural Passport; T: Herald.
- Hãy thử giao tiếp với Sam ở bưu điện: hỏi giá tem, rồi thực hiện mục tiêu gửi thư.

## Kiến trúc và chạy cục bộ

HTML/JavaScript + pixel-art ở frontend; Node.js dùng thư viện chuẩn ở backend, chuyển tiếp yêu cầu đến Google Gemini bằng API key phía máy chủ. Nếu thiếu key hoặc AI không khả dụng, game có chế độ offline theo quy tắc.

```bash
git clone -b deploy/lifequest-v77 https://github.com/lehuythevinh-byte/lifequest-ai.git
cd lifequest-ai
sh v77/build.sh
node v77/backend/server.cjs
```

Truy cập http://localhost:10000. Không mở trực tiếp bằng file:// vì trình nạp game có thể cần HTTP.

| Đường dẫn | Vai trò |
|---|---|
| v77/ember-ink/ | 26 phần mã nguồn HTML chính xác của bản phát hành |
| v77/build.sh | Ghép game.html, xác thực SHA-256, kiểm tra backend |
| v77/game.sha256 | Mã kiểm tra tính toàn vẹn của game |
| v77/backend/server.cjs | Máy chủ game và Gemini relay |
| v77/V77_3_RELEASE.md | Ghi chú riêng của phiên bản |
| v77/living/ | Mã bản Living World Interface trước đó, không dùng khi build V77.3 |

## Triển khai Render

| Cấu hình | Giá trị |
|---|---|
| Branch | deploy/lifequest-v77 |
| Root Directory | để trống |
| Build Command | sh v77/build.sh |
| Start Command | node v77/backend/server.cjs |
| Health endpoint | /health |
| GEMINI_API_KEY | Secret trong Environment của Render |
| GEMINI_MODEL | gemini-2.5-flash (mặc định) |

Không ghi API key vào GitHub. Build và backend kiểm tra hash đã ghim trong game.sha256; biến LQ77_SHA256 cũ không cần dùng cho bản này.

## Kiểm thử và giới hạn

Bản phát hành đã có kiểm thử fixture trình duyệt với dữ liệu mô phỏng, ba kích thước màn hình, các trạng thái biểu cảm, giá danh mục và điểm quan hệ âm. Chưa xác nhận toàn bộ gameplay end-to-end với mọi NPC hoặc Gemini thật. AI có thể sai; thông tin nhiệm vụ và kinh tế cần lấy từ dữ liệu game. Kiểm tra /health để phân biệt phiên bản được triển khai với phiên bản chỉ lưu trên GitHub.

**SHA-256:** `79aa6e3c626a2c1ab5c02b7d5db2fef7a9081d5e450d91a986821bea15028ba9`

---

**LIFEQUEST AI — Learn by living the story.**
