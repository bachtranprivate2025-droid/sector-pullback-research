# SPY pullback: backtest cửa sổ 10 năm

## Mẫu và nguồn

- Cửa sổ tín hiệu: 04/11/2016–03/11/2026, 2.512 phiên SPY. Dữ liệu trước cửa sổ từ 03/01/2012 chỉ để khởi tạo MA, ATR, ranks và swing low. Chỉ ghi nhận giao dịch có đủ ngày thoát trước hoặc bằng ngày chốt. Bắt đầu cửa sổ ở trạng thái không có vị thế.
- Một nguồn xuyên suốt: Yahoo Finance qua công cụ get_historical_stock_prices, period=max, interval=1d, adjusted=true. Toàn bộ OHLC đã điều chỉnh cổ tức/split theo nhà cung cấp. Ngày 04/11/2026 đang hình thành bị loại. Không ghép lịch sử Yahoo vào CSV TradingView.
- Giá điều chỉnh là cơ sở tính return nghiên cứu, gần cách đo tái đầu tư phân phối; không phải giá USD khớp lệnh thực tế tại ngày lịch sử. Vẫn giả định mua open/bán close và thanh khoản đủ để khớp.
- Mỗi ETF chỉ đủ điều kiện sau 200 phiên đóng cửa trước ngày tín hiệu. Có 10 ETF trong 606 phiên đầu của cửa sổ và 11 ETF trong 1.906 phiên còn lại. XLC có giá từ 19/06/2018, được thêm từ 05/04/2019 sau đủ 200 phiên trước tín hiệu. Không tạo giá giả hoặc thay XLC bằng ETF khác trước khi mã tồn tại.
- Nguồn ngày thành lập XLC: https://www.ssga.com/library-content/products/factsheets/etfs/us/factsheet-us-en-xlc.pdf (18/06/2018). XLRE có giá từ 08/10/2015, đủ khởi tạo Daily MA200 trước đầu cửa sổ 10 năm.
- Bản CSV gốc (~7,5 năm giao dịch, 11 ETF) vẫn giữ nguyên tại ?sample=original. Hai bản có khác biệt nguồn, thời gian và cách xử lý ETF mới; không quy toàn bộ thay đổi PF cho việc thêm năm dữ liệu.

## Các cấu hình giữ nguyên

3.136 cấu hình, giữ nguyên ID và tham số từ báo cáo trước: SMA Daily/Weekly 10/20/50/200; độ rộng 0/0,25/0,5/0,75 ATR; chạm/giữ/lấy lại MA; giữ 3/5/10/20 phiên; 8 cách chọn tài sản. Sweep swing low giữ nguyên quy tắc 2 nến trái/2 nến phải, pivot đã biết trước tín hiệu, tuổi tối đa 40 phiên và xác nhận ngay phiên sau nếu áp dụng. Đây là chạy lại các cấu hình cố định, không tìm tham số tốt hơn trên mẫu mới.

MA Daily lấy close phiên trước; MA Weekly chỉ dùng tuần đã đóng trước tuần tín hiệu. ATR14 Wilder dùng phiên trước. MA pullback được re-arm sau 3 phiên low trên đường/vùng đã biết. Gap xuyên được tính. Reclaim chờ lần đầu close lấy lại tâm MA trong ngày chạm hoặc tối đa 5 phiên sau. Sweep là setup riêng, không đồng nghĩa sweet spot.

Chốt mã tại close tín hiệu, mua open phiên sau. Chia đều 1/3 vốn cho ba ETF; SPY benchmark chỉ một mã. Phiên mua là số 1; bán close phiên số 3/5/10/20. Không đổi mã/cân bằng lại giữa kỳ, không chồng rổ, không stop. Mỗi kỳ giữ có lịch riêng và bỏ tín hiệu khi còn vị thế. Không nhân số quan sát với số ETF trong rổ.

## Chọn leader và bottom

- L20/L60: Top 3 performance 20/60 phiên trong số ETF đủ điều kiện tại ngày tín hiệu.
- B3: Bottom 3 performance 20 phiên của hôm trước.
- BR3 (cột Top bottom hồi nhanh): trong Bottom 4 hôm trước, chọn 3 mã có performance 3 phiên cao nhất tại close tín hiệu. Hồi tương đối vẫn có thể âm.
- Rmix: trong Bottom 3 hôm trước, ưu tiên mã có return 3 phiên dương và vượt SPY 3 phiên, đồng thời return ngày dương và vượt SPY cùng ngày; thiếu thì điền leader20.
- Cmix: trong Bottom 4 hôm trước, ưu tiên mã hiện thuộc Top 3 performance 3 phiên toàn nhóm và return 3 phiên dương, vượt SPY; thiếu thì điền leader20.
- B3switch: chuyển cả rổ sang Bottom 3 chỉ khi return bình quân rổ dương và vượt SPY ở cả 1D lẫn 3D; còn lại giữ leader20.

## Chỉ số và giới hạn

Phí khứ hồi cơ sở 0,10% trên vốn đầu tư; stress 0,30%. PF là tổng lợi nhuận rổ dương / trị tuyệt đối tổng lợi nhuận rổ âm trên cùng vốn cơ sở. TB/rổ là trung bình số học return rổ sau phí. PF không ước lượng được (ví dụ không có rổ lỗ) để N/A, không coi là vô hạn. Đánh dấu ít mẫu nếu dưới 20 rổ. Drawdown trong kết quả chỉ tại lúc đóng rổ, chưa là mark-to-market trong thời gian giữ.

Giai đoạn đầu mẫu–2022, 2023–2024 và 2025–2026 phân nhóm theo ngày tín hiệu nên bao phủ đầy đủ các rổ. Không gọi các giai đoạn đó là holdout độc lập. Ngày vào/thoát đầu cuối và số rổ theo năm được hiển thị theo từng cấu hình. Nhiều cấu hình có giao dịch chồng nhau; 118.200 lượt kiểm tra rổ không phải 118.200 quan sát thị trường độc lập.

Không có stop, thuế, funding, tác động thị trường hoặc mô hình giá intraday. Số liệu đã được khảo sát, nhiều cấu hình tạo rủi ro lựa chọn sau kết quả. Một cửa sổ 10 năm không bảo đảm đủ số mẫu cho setup hiếm hay hiệu quả tương lai.

## Kiểm tra và tải dữ liệu

- Bộ tính mới đối chiếu khớp toàn bộ chỉ số của 3.136 cấu hình trên CSV TradingView gốc, trước khi chạy nguồn mới.
- Kiểm tra dữ liệu OHLC hợp lệ, không trùng ngày, không thiếu phiên SPY sau ngày có giá đầu tiên; kiểm tra ETF đủ lịch sử trước tín hiệu, thời gian khớp và giữ, chia đều vốn, không chồng rổ, pivot đã xác nhận, giá trị return/PF và số rổ đối chiếu BR3.
- source-audit-10y.json: phạm vi nguồn, thời điểm lấy dữ liệu, SHA256 của snapshot, mốc XLC và số phiên theo nhóm đủ điều kiện.
- verification-10y.json: kết quả kiểm tra.
- daily-ohlc-adjusted-10y.csv: OHLC điều chỉnh dùng tính toán, gồm dữ liệu khởi tạo.
- research-results-10y.csv: toàn bộ cấu hình và chỉ số.
- holding-baskets-10y.csv và holding-legs-10y.csv: các rổ tóm tắt và đối chiếu BR3, kèm ngày, tên mã và giá điều chỉnh từng ETF.
