# VN-Index pullback → mua ngành ICB: backtest mẫu 10 năm (04/11/2016–03/11/2026)

## Mẫu và nguồn

- Cửa sổ tín hiệu: 2016-11-04 → 2026-11-03, 2,494 phiên VN-Index. Dữ liệu trước cửa sổ chỉ dùng để khởi tạo MA, ATR, xếp hạng và swing low. Chỉ ghi nhận rổ có ngày thoát trước hoặc bằng ngày chốt.
- Một nguồn xuyên suốt: chart Finlens (finlens.vn, tài khoản của người dùng), nến ngày OHLC của VNINDEX và 19 chỉ số ngành ICB cấp 2. Phiên 04/11/2026 (đang giao dịch khi tải) đã bị loại.
- Giá là chỉ số ngành do Finlens tính. Chưa xác minh chỉ số có cộng cổ tức hay không. Chỉ số ngành không mua trực tiếp được; khi giao dịch thật cần chọn cổ phiếu dẫn dắt hoặc ETF của ngành, kết quả sẽ dao động hơn.
- Mỗi ngành chỉ đủ điều kiện sau 200 phiên đóng cửa trước ngày tín hiệu. Số ngành đủ điều kiện trong mẫu: 19 → 19. Không tạo giá giả cho phiên thiếu.
- Lịch giao dịch theo VNINDEX.

## Cấu hình

13.176 cấu hình:
- MA Daily/Weekly 10/20/50/100/200, độ rộng vùng 0/0,25/0,5/0,75 ATR, xác nhận chạm/giữ/lấy lại MA.
- Sweep swing low: 2 nến trái và 2 nến phải, pivot đã xác nhận trước tín hiệu, tuổi tối đa 40 phiên; bản xác nhận chờ phiên sau close vượt high nến sweep.
- Xu hướng: không lọc, hoặc MA dốc lên (MA tại tín hiệu cao hơn 10 phiên trước với Daily, 20 phiên trước với Weekly; sweep dùng VNI > MA200 Daily).
- Giữ 3/5/10/20/40/60 phiên; 9 cách chọn ngành (gồm VNI đối chiếu).

MA Daily lấy close đến phiên trước; MA Weekly chỉ dùng tuần đã đóng trước tuần tín hiệu. ATR14 Wilder lấy giá trị phiên trước. Nhịp pullback mới khi low đi vào vùng sau 3 phiên low nằm trên vùng; gap xuyên được tính. "Lấy lại MA" chờ lần đầu close ≥ tâm MA trong ngày chạm hoặc tối đa 5 phiên sau.

Chốt ngành tại close tín hiệu, mua open phiên sau, chia đều 1/3 vốn cho ba ngành. Phiên mua là số 1; bán close phiên số H. Không đổi ngành giữa kỳ, không chồng rổ, không stop. Mỗi kỳ giữ có lịch riêng và bỏ tín hiệu khi còn vị thế.

## Cách chọn ngành

- L4K (Top 3 RS 4 khung): cộng thứ hạng performance 5, 21, 63, 126 phiên; chọn 3 ngành tổng hạng cao nhất trong số ngành còn trên MA50 của ngành, thiếu thì điền theo tổng hạng. Xếp hạng theo performance tương đương xếp hạng RS so với cùng một chỉ số.
- L20/L60: Top 3 performance 20/60 phiên tại ngày tín hiệu.
- B3: Bottom 3 performance 20 phiên của hôm trước.
- BR3: trong Bottom 4 hôm trước, chọn 3 ngành có performance 3 phiên cao nhất tại close tín hiệu.
- Rmix: trong Bottom 3 hôm trước, ưu tiên ngành có return 3 phiên dương và vượt VNI, đồng thời return ngày dương và vượt VNI; thiếu thì điền leader20.
- Cmix: trong Bottom 4 hôm trước, ưu tiên ngành thuộc Top 3 performance 3 phiên toàn nhóm, return 3 phiên dương và vượt VNI; thiếu thì điền leader20.
- B3switch: chuyển cả rổ sang Bottom 3 chỉ khi return bình quân rổ dương và vượt VNI ở cả 1 phiên lẫn 3 phiên; còn lại giữ leader20.
- VNI: mua riêng VN-Index để đối chiếu.

## Chỉ số và giới hạn

Phí khứ hồi cơ sở 0,40% trên vốn rổ (mua 0,15%, bán 0,15% + thuế 0,1%); stress 1,0%. PF = tổng lợi nhuận rổ dương / trị tuyệt đối tổng lợi nhuận rổ âm. PF không ước lượng được (không có rổ lỗ) để trống. Dưới 20 rổ là ít mẫu. Drawdown chỉ tại lúc đóng rổ. Giai đoạn đầu mẫu–2022, 2023–2024, 2025–2026 phân theo ngày tín hiệu, không phải holdout độc lập.

13.176 cấu hình trên cùng một bộ dữ liệu tạo rủi ro chọn lọc sau kết quả: PF cao nhất không phải mức kỳ vọng. Chưa có stop, tác động thị trường hay mô hình giá trong phiên.

## Tổng kết nhanh

- Giữ 3–10 phiên: PF trung vị dưới 1 ở hầu hết cách chọn; phí 0,40% ăn gần hết lợi nhuận nhịp ngắn.
- Giữ 20–60 phiên: Top 3 RS 4 khung có PF trung vị cao nhất ở mẫu 2008–2026 (khoảng 1,8).
- Nhóm nổi bật mẫu 10 năm: MA20 Daily ±0,75 ATR, lấy lại MA, MA dốc lên, giữ 20 phiên: L4K PF 4,89 (43 rổ), L60 5,74. Trên mẫu 2008–2026 còn khoảng 2,2 (79 rổ); 2025–2026 chỉ 1,0–1,8.
- Ngành yếu (B3, BR3) chỉ ngang leader khi giữ dài trên mẫu 10 năm; trên mẫu 2008–2026 PF khoảng 1,0.

## Tệp dữ liệu

- research-results-10y.csv: toàn bộ cấu hình và chỉ số.
- holding-baskets-10y.csv, holding-legs-10y.csv: các rổ của bảng tóm tắt, kèm ngày, ngành và giá khớp.
- daily-ohlc-finlens.csv: OHLC dùng tính toán (gồm dữ liệu khởi tạo).
- source-audit.json: phạm vi nguồn, SHA256, ngày đủ điều kiện từng ngành.
- verification-10y.json: kết quả kiểm tra (khớp lệnh open phiên sau, đúng số phiên giữ, không chồng rổ, giá khớp đúng OHLC, PF tính lại, tín hiệu MA đối chiếu bản tính độc lập).
