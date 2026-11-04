# Sub-sector pullback: nghiên cứu 3 năm

## Phạm vi và nguồn

Cửa sổ tín hiệu 04/11/2023–03/11/2026. Ngày giao dịch đầu mẫu thực tế là 06/11/2023. Phiên 04/11/2026 còn hình thành tại lúc chốt dữ liệu, được loại. Tải từ 01/01/2018 để khởi tạo SMA200 Weekly, ATR14, performance và lịch sử thanh khoản. Không tính lợi nhuận của phần khởi tạo vào kết quả.

Nguồn duy nhất: TradingView MCP get_ohlcv, interval 1D, regular session. Điều chỉnh split, CHƯA cộng cổ tức; đây là price return, không phải total return. Dữ liệu Yahoo trong báo cáo 10 năm không được ghép vào bản này. Rổ 11 sector cũng được tính lại từ cùng nguồn TradingView và cùng cửa sổ ba năm. CSV được ghi lại từ kết nối TradingView, không phải thao tác xuất file bằng nút Download chart data.

## Bộ 20 ETF

SMH, IGV, SKYY, CIBR, XBI, IHI, IHF, PJP, KRE, IAI, XAR, IYT, JETS, XOP, OIH, XME, PBJ, ONLN, PEJ, IYZ.

Chọn trước khi chạy từ watchlist https://www.tradingview.com/watchlists/344485717/ theo nhánh ngành và hạn chế ETF tương tự. Không đưa ETF đòn bẩy, inverse, single-stock, chỉ số rộng, quốc gia, trái phiếu hoặc tài sản commodity/crypto vào cùng bảng xếp hạng ngành. Đây không phải toàn bộ sub-sector và không chứng minh các ETF ngoài danh sách kém hơn. Bộ quỹ hiện tại có rủi ro selection/survivorship bias.

IGV/SKYY cùng nhóm software-cloud; IYT/JETS cùng nhóm transport. Các mã còn lại mỗi mã một nhóm. Rổ sub-sector có tối đa một mã mỗi nhóm, tức 20 ETF đại diện cho 18 nhóm nghiên cứu; các nhóm khác vẫn có thể tương quan và trùng holdings. Không coi ba ticker là ba rủi ro độc lập.

Điều kiện chọn tại mỗi tín hiệu: đã có ít nhất 200 phiên trước tín hiệu; bình quân close × volume của 20 phiên trước tín hiệu ≥ 1 triệu USD/ngày. Chỉ dùng thông tin đã biết tại thời điểm đó. Ngưỡng thanh khoản là quy tắc nghiên cứu cố định, không được chọn lại theo PF. PBJ/ONLN có thể bị loại ở nhiều ngày dù vẫn nằm trong bộ 20.

Parent sector chỉ là tham chiếu ngành nghiên cứu, không khẳng định mọi holdings đều nằm trong quỹ XL tương ứng. Chưa có nhánh con cho XLU và XLRE trong bộ gọn này. Danh sách chi tiết, số phiên đủ điều kiện, nguồn và SHA256 có trong gói CSV nguồn.

## Setup SPY

SMA10/20/50/200 Daily và Weekly. Daily dùng close phiên trước; Weekly chỉ dùng tuần đã đóng. Độ rộng 0/0,25/0,5/0,75 ATR14 Wilder phiên trước. Chạm vùng, giữ MA cuối ngày hoặc lấy lại MA trong tối đa năm phiên sau chạm. Re-arm sau ba phiên low chưa chạm vùng. Gap xuyên cũng được tính.

Sweep swing low riêng biệt: pivot 2 nến trái/2 nến phải, chỉ dùng sau khi đã xác nhận trước ngày sweep; tuổi tối đa 40 phiên. SPY xuyên đáy rồi đóng lại trên đáy. Bản xác nhận cần ngay phiên kế tiếp close vượt high nến sweep.

98 setup × 3 kỳ giữ 5/10/20 × 10 cách chọn = 2.940 cấu hình. Tham số setup lấy từ nghiên cứu cũ, không tối ưu theo kết quả sub-sector mới. Tóm tắt hiển thị preset cố định: Daily chạm đúng đường + giữ MA, Weekly ±0,5 ATR + giữ MA, hai cách sweep. Không chọn preset theo PF cao nhất.

## Cách chọn tài sản

- S20/S60: xếp performance 20/60 phiên, chọn ba ETF mạnh nhất khác nhóm.
- B3: ba ETF yếu nhất theo performance 20 phiên hôm trước, khác nhóm, chưa yêu cầu hồi.
- BR3: Bottom 4 hôm trước, khác nhóm, chọn ba mã có performance cộng dồn 3 phiên cao nhất tại ngày tín hiệu. Vẫn có thể âm hoặc kém SPY.
- Rmix: trong Bottom 3, ưu tiên mã performance dương và vượt SPY ở cả 1D lẫn cộng dồn 3D. Thiếu thì điền leader S20, giữ khác nhóm.
- Cmix: trong Bottom 4, ưu tiên mã hiện thuộc Top 3 performance 3D toàn nhóm và có performance 3D dương, vượt SPY. Thiếu thì điền S20.
- R3each: trong Bottom 4, ưu tiên mã vượt SPY TỪNG NGÀY trong cả ba phiên gần nhất, đồng thời performance cộng dồn 3D dương. Thiếu thì điền S20. Đây là phép thử khác với Rmix.
- Parent: xếp Top 3 sector 20D trước; với mỗi sector, chọn sub-sector có performance 20D cao nhất nếu vượt sector đó, còn lại giữ ETF sector. Rổ có thể kết hợp XL và sub-sector, không phải rổ sub-sector thuần.
- XL20: Top 3 trong 11 Select Sector SPDR ETF theo performance 20D.
- SPY: một mã đối chiếu cùng thời điểm.

Bottom được xếp từ yếu nhất lên, lấy tối đa một ETF mỗi nhóm. Bottom hôm trước phải còn đủ điều kiện thanh khoản ngày tín hiệu. Số “rổ có bottom” chỉ tính rổ có ít nhất một mã thực sự đạt điều kiện; những rổ fallback leader không được gọi là bottom thành công.

## Giao dịch và thước đo

Chốt mã sau close tín hiệu, mua open phiên sau. Chia đều ⅓ vốn rổ, giữ nguyên ticker và số lượng, bán close phiên 5/10/20 (phiên mua là số 1). SPY đối chiếu chỉ một mã. Không chồng rổ, không tái cân bằng giữa kỳ, không stop. Mỗi kỳ giữ có lịch riêng; bỏ tín hiệu khi còn vị thế. Các cách chọn tài sản trên cùng setup/kỳ giữ có ngày vào/thoát giống nhau.

Phí khứ hồi cơ sở 0,10% vốn đầu tư; stress 0,30%. Chưa có thuế, funding, tác động thị trường, bid/ask theo từng mã hoặc mô hình intraday. Thời gian ngoài thị trường là tiền mặt không sinh lãi. Giá lịch sử split-adjusted không phải giá USD gốc tại ngày giao dịch.

PF = tổng return rổ dương / trị tuyệt đối tổng return rổ âm, trên cùng vốn cơ sở. Không có rổ lỗ thì PF=N/A. Win rate tính trên rổ, không nhân số mẫu với ba ticker. TB/rổ là trung bình số học sau phí. “Hơn sector/rổ” là trung bình chênh lệch return với XL20 trên cùng lịch, đơn vị điểm phần trăm; không phải chênh lệch PF.

Đường equity và drawdown chỉ đo khi đóng rổ, chưa phản ánh sụt giảm intraday hoặc mark-to-market trong thời gian giữ. Khoảng Wilson 95% của win rate chưa điều chỉnh phụ thuộc giao dịch hay việc thử nhiều cấu hình. Năm 2023/2026 chỉ có một phần năm; các phân đoạn không phải holdout độc lập. So sánh price return không điều chỉnh beta/rủi ro khác nhau giữa ngành.

## Cách đọc

Không coi PF đẹp với dưới 20 rổ là mức kỳ vọng đáng tin. Xem số rổ, TB/rổ, PF khi tăng phí, PF bỏ ba rổ tốt nhất, kết quả theo năm và nhật ký thực tế. Một vài giao dịch có thể đảo kết luận trong mẫu ba năm. Các cấu hình có nhiều ngày trùng nhau; không cộng chúng thành một danh mục và không coi tổng lượt kiểm tra là quan sát độc lập.

Đây là nghiên cứu thăm dò lịch sử, chưa có bằng chứng rằng thay sector bằng sub-sector luôn cải thiện lợi nhuận. Không tự cập nhật hay thực thi lệnh.

## Các file

Gói nguồn: 32 CSV Daily (SPY + 11 sector + 20 sub-sector), source-audit.json và universe.csv. Gói backtest: results.csv, trades.csv, paired.csv, universe.csv, source-audit.json, verification.json và bản phương pháp này. Kiểm tra gồm lịch phiên, OHLC, dữ liệu khởi tạo, thanh khoản quá khứ, quy tắc khác nhóm, ngày khớp, thời gian giữ, không chồng rổ, sweep đã xác nhận, ranking leader độc lập và đối chiếu lợi nhuận/PF.
