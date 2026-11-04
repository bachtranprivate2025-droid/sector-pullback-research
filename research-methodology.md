# Bổ sung kỳ giữ 10 và 20 phiên

Tổng 3.136 cấu hình: giữ nguyên 2.352 cấu hình cũ, thêm 784 cấu hình giữ 20 phiên. Mỗi kỳ giữ 3/5/10/20 có 784 cấu hình. Bảng tóm tắt gồm 12 công thức cố định cho mỗi kỳ 5/10/20, không chọn công thức theo kết quả kỳ mới.

Mua open phiên sau tín hiệu; phiên mua là số 1, bán close phiên số 10 hoặc 20. Chia đều vốn ba ETF, không đổi mã, không chồng rổ, phí khứ hồi 0,10%. Từng kỳ giữ chạy lịch riêng và bỏ tín hiệu khi còn vị thế; số rổ và ngày vào có thể khác nhau. Đây là so sánh các hệ thống độc lập, không phải cùng một tập ngày vào lệnh. Chỉ tính rổ đủ dữ liệu đến ngày thoát.

Nguồn OHLC CSV TradingView do người dùng cung cấp, đến 03/11/2026; không tải dữ liệu giá mới. Tất cả lịch sử đã xem, không phải kiểm định ngoài mẫu mới. Không có stop, thuế hoặc funding; điều chỉnh cổ tức/split chưa xác minh. Drawdown đóng rổ không thể hiện đầy đủ rủi ro trong thời gian giữ. Win rate cao có thể đi cùng PF thấp và một rổ thua lớn.

Đã đối chiếu toàn bộ 784 cấu hình 10 phiên với số cũ; kiểm tra 22.808 rổ 10 phiên và 18.264 rổ 20 phiên về thời điểm khớp, thời gian giữ, trọng số, lợi nhuận, PF và không chồng rổ. Các rổ từ nhiều cấu hình có thể trùng nhau, không phải các quan sát độc lập.

Chi tiết: holding_comparison.csv, holding_comparison_baskets.csv, holding_comparison_legs.csv, holding_extension_verification.json.

## Cột Top bottom hồi phục nhanh nhất

Cột mới dùng duy nhất chính sách BR3 đã có trong backtest: lấy Bottom 4 theo performance 20 phiên của ngày trước tín hiệu, chọn 3 ETF có performance 3 phiên cao nhất tính đến close ngày tín hiệu. Chia đều vốn, mua open sau tín hiệu và giữ đúng số phiên của dòng đang xem. Hồi nhanh là tương đối trong nhóm Bottom 4; không yêu cầu return dương hay vượt SPY. Không chọn biến thể theo PF cao nhất sau khi đã biết kết quả.

Mỗi dòng đối chiếu BR3 có cùng MA, độ rộng ATR, cách xác nhận, kỳ giữ và phí 0,10%. PF, win rate và lợi nhuận trung bình đều là của rổ BR3; các cột kết quả chính vẫn thuộc chính sách trong cột Chọn ngành. Bấm ô BR3 mở chi tiết của chính rổ BR3; sort cột mới theo PF. Đã kiểm tra đủ 3.136 phép ghép trên 392 nhóm setup/kỳ giữ và số rổ mỗi giai đoạn khớp nhau. Đây là đưa kết quả có sẵn vào cột đối chiếu, không chạy tìm chiến lược mới.

## Báo cáo gốc trước bổ sung (số đếm 2.352 bên dưới là phiên bản gốc)

# Tổng kết MA pullback: đủ11 ETF, Top3 chia đều, long-only

Dữ liệu đến03/11/2026; SMA Daily/Weekly10/20/50/200.2.304 cấu hình =8 MA ×4 độ rộng(0/0,25/0,5/0,75 ATR) ×3 cách xác nhận ×3 thời gian giữ(3/5/10 phiên) ×8 chính sách tài sản. SPY là benchmark; bảy chính sách còn lại luôn mua ba ETF chia đều. Không có RSI hoặc short. EMA, stop/target và các MA độ dài khác nằm ngoài phạm vi.

## Bảng đối chiếu cố định: vùng ±0,5ATR, vào vùng, giữ5 phiên

| MA SPY | Rổ | PF Top3 20D | PF Bottom3 20D | PF bottom xác nhận + leader | PF đổi cả rổ khi bottom đột biến |
|---|---:|---:|---:|---:|---:|
| D10 | 77 | 1.63 | 0.97 | 1.52 | 1.63 |
| D20 | 65 | 0.87 | 0.68 | 0.87 | 0.95 |
| D50 | 47 | 1.88 | 1.32 | 1.64 | 1.90 |
| D200 | 14 | 2.20 | 1.27 | 2.43 | 2.29 |
| W10 | 48 | 2.04 | 0.88 | 1.63 | 1.99 |
| W20 | 29 | 2.86 | 1.57 | 3.31 | 2.91 |
| W50 | 11 | 1.57 | 2.56 | 2.06 | 1.57 |
| W200 | 3 | 7.77 | 3.80 | 7.77 | 7.77 |

W50 chỉ11 rổ, W200 chỉ3 rổ: mọi PF ở hai hàng này đều phải xem là chưa đủ mẫu. Các hàng là chiến lược riêng với nhiều ngày chồng nhau; không cộng số lệnh/lợi nhuận thành một danh mục.

## Bottom recover mạnh được định nghĩa thế nào?

- Bottom3: ba ngành cuối return20 phiên của ngày trước ngày tín hiệu. Không chọn bottom bằng kết quả sau điểm mua.
- BR3: bottom4 hôm trước, chọn ba mã có return3 phiên đến ngày tín hiệu tốt nhất; vẫn có thể giảm giá.
- Rmix: trong Bottom3, chỉ ưu tiên mã có return3D>0 và>SPY3D, đồng thời return ngày tín hiệu>0 và>SPY ngày đó. Điền vị trí còn thiếu bằng leader20 không trùng; vẫn luôn đủ ba mã1/3 vốn.
- Cmix: trong bottom4 hôm trước, ưu tiên mã hiện vào Top3 return3D và return3D>0 và>SPY3D; điền phần còn thiếu bằng leader20.
- B3switch: chỉ chuyển toàn rổ sang Bottom3 nếu trung bình return3D của rổ>0 và>SPY3D, trung bình return ngày tín hiệu>0 và>SPY ngày đó; còn lại vẫn mua Top3 leader20.
- Mọi thông tin dùng đến close ngày tín hiệu, trước khi mua open ngày tiếp theo. Không giả định biết sector sẽ bật lên sau lệnh.

## Ví dụ MA20W: nên chuyển từ Top3 sang Bottom3 không?

Cùng29 nhịp, cùng giữ5: Top3 PF2,86; Bottom3 PF1,57; BR3 PF2,05; Rmix PF3,31; B3switch PF2,91. Rmix có can thiệp bottom tại4 nhịp. B3switch chỉ chuyển sang bottom tại1 nhịp(24/02/2023); đây không phải bằng chứng đủ lớn để kết luận đột biến bottom dự báo được lãi. Khi ấy Top3 XLK/XLI/XLP lãi1,02%, Bottom3 XLU/XLB/XLE lãi1,69% sau phí; đây chỉ là một ví dụ lịch sử.

## Đối chiếu chạm đúng đường MA với vào vùng

SMA50D chạm đúng đường, Top3 leader20, giữ5:42 rổ, win rate76,2%, PF3,41; khi phí0,30% PF2,70; bỏ ba rổ thắng lớn nhất PF2,48. Con số PF3,70 trước đó là Top1, không phải Top3. Mở rộng điểm vào thành vùng SMA50D±0,5ATR thay đổi timing:47 rổ, PF Top3 chỉ1,88. Không trộn hai công thức.

## Các ứng viên được chọn bằng giai đoạn cũ

Lọc ít nhất12 rổ đầu mẫu–2022 và6 rổ2023–2024, xếp theo PF thấp hơn của hai giai đoạn. Giai đoạn2025–2026 chỉ để xem lại sau chọn. Tất cả lịch sử đã xem ở các lượt trước nên không gọi đây là holdout độc lập.

| MA | Công thức | Rổ | PF tổng | PF 2025–2026 | Rổ gần đây |
|---|---|---:|---:|---:|---:|
| D10 | ±0.75ATR · Giữ MA cuối ngày · giữ5 · Bottom3 đột biến thì đổi cả rổ | 57 | 2.33 | 2.06 | 11 |
| D20 | ±0.75ATR · Chạm / vào vùng · giữ3 · Top3 mạnh 20D | 66 | 1.51 | 0.48 | 14 |
| D50 | ±0ATR · Lấy lại MA trong 5 phiên · giữ5 · Bottom hồi giá & RS + leader | 36 | 4.85 | 3.11 | 12 |
| D200 | Chưa đủ mẫu để chọn | — | — | — | — |
| W10 | ±0ATR · Lấy lại MA trong 5 phiên · giữ10 · Bottom Top3 RS3 + leader | 34 | 3.35 | 4.72 | 10 |
| W20 | ±0.5ATR · Lấy lại MA trong 5 phiên · giữ5 · Bottom Top3 RS3 + leader | 27 | 10.36 | 13.04 | 8 |
| W50 | Chưa đủ mẫu để chọn | — | — | — | — |
| W200 | Chưa đủ mẫu để chọn | — | — | — | — |

Các PF cao trong bảng ứng viên là sản phẩm tìm kiếm nhiều cấu hình, không phải mức lợi nhuận kỳ vọng. Không tự đổi chiến lược đang theo chỉ vì một hàng có PF lớn. Các hàng vùng0/confirmation/reclaim có số ngày vào khác, không phải so sánh basket policy trên cùng ngày.

## Cách đọc và cách khớp lệnh

D=Daily; W=Weekly. Width0=chạm đúng MA; width0,5=MA±0,5ATR14 Wilder của ngày trước. Daily MA dùng close phiên trước; Weekly MA chỉ lấy các tuần hoàn tất trước tuần tín hiệu. Tuần đang hình thành không được dùng. Re-arm sau ba phiên low trên mức/vùng đã biết tại từng phiên. Gap xuyên cũng tính.

Touch: sau ngày giá đi vào mép trên từ phía trên, mua open ngày kế tiếp. Hold: ngày đi vào phải đóng>=tâm MA; chưa giữ MA thì không tạo tín hiệu cho biến thể này. Reclaim: đợi lần đầu close>=tâm MA trong ngày chạm hoặc tối đa năm phiên tiếp theo, rồi mua open ngày sau. Tất cả chỉ mua khi tín hiệu riêng của biến thể hợp lệ.

Đóng toàn rổ cuối phiên giữ số3/5/10, không đổi mã hoặc cân bằng lại giữa chừng. Chỉ một rổ cho mỗi cấu hình; nhịp mới khi đang giữ bị bỏ qua. PF trên cùng notional mỗi rổ; tổng chi phí khứ hồi0,10% theo trọng số, không nhân ba. Các rổ mới thiếu tương lai bị loại, không giả định exit.

## Giới hạn

2.304 phép thử làm tăng nguy cơ tìm thấy kết quả đẹp do ngẫu nhiên. Chưa có xác nhận trên dữ liệu hoàn toàn mới. Chưa có stop-loss, thuế, funding hoặc khớp lệnh ngoài giả định; price return trên CSV cung cấp chưa xác minh dividend/split settings. closed_dd là drawdown tại lúc đóng rổ, không phải mark-to-market hoặc lỗ tối đa trong thời gian giữ. Rổ có ba mã nhưng vẫn chỉ một quan sát, không nhân ba số mẫu.

Bảng HTML hỗ trợ lọc/sort tất cả cấu hình; mặc định yêu cầu tối thiểu20 rổ để hạn chế đọc nhầm PF mẫu cực nhỏ. CSV và JSON có toàn bộ kết quả, gồm stress phí0,30%, bỏ ba rổ thắng lớn nhất và các giai đoạn. Báo cáo không cập nhật website công khai.

## Bổ sung SPY sweep swing low reversal

Thêm48 cấu hình:2 cách vào ×3 thời gian giữ ×8 cách chọn tài sản; tổng2.352 cấu hình. Swing low strict2 nến trái/2 nến phải, được xác nhận trước ngày sweep, không quá40 phiên tuổi. Ngày trước close trên đáy; ngày sweep low xuyên đáy và close trở lại trên đáy. Một sự kiện cho mỗi đáy. Đây là setup bổ sung riêng, không thay đổi nghĩa sweet spot.

Vào sớm: mua open ngày sau nến sweep. Xác nhận: chỉ khi close của ngay phiên tiếp theo vượt high nến sweep, mua open ngày sau phiên xác nhận. Không lấy các phiên xác nhận muộn hơn, không giả định mua tại giá high intraday. Chọn ETF theo hạng tại ngày tín hiệu mua đã xác nhận.

| Cách vào, giữ5 | Rổ | PF Top3 mạnh20D | PF Bottom3 | PF bottom hồi + leader |
|---|---:|---:|---:|---:|
| Sweep đóng lại trên đáy | 47 | 0.91 | 1.12 | 1.03 |
| Sweep + phiên sau vượt đỉnh | 22 | 0.50 | 0.73 | 0.65 |

Các kết quả này chưa cho thấy lợi thế tốt ở bản giữ5. Chúng là backtest định nghĩa trên OHLC, không chứng minh hoạt động săn thanh khoản hoặc một reversal bền vững. Không cộng số mẫu sweep với mẫu MA vì có nhiều ngày trùng.
