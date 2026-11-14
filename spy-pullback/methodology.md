# Khi SPY pullback — phương pháp (1999–2026)

Cập nhật 14/11/2026. Nghiên cứu lịch sử, không phải tín hiệu giao dịch.

## Dữ liệu

- Yahoo Finance chart API, daily, giá điều chỉnh cổ tức và chia tách (OHLC nhân hệ số adjclose/close). Tải ngày 14/11/2026, phiên cuối 13/11/2026.
- 11 sector SPDR: XLB, XLC, XLE, XLF, XLI, XLK, XLP, XLRE, XLU, XLV, XLY. Cửa sổ tín hiệu 28/12/1999–13/11/2026.
- 22 sub-sector: SMH, IGV, SKYY, CIBR, XBI, IHI, IHF, PJP, KRE, IAI, XAR, IYT, JETS, XOP, OIH, XME, PBJ, ONLN, PEJ, IYZ, IDU, IYR. Cửa sổ tín hiệu 22/02/2007–13/11/2026 (khi có ít nhất 10 ETF đủ điều kiện).
- Dữ liệu Yahoo 2012–2026 khớp file daily-ohlc-adjusted-10y.csv của repo (sai lệch tối đa 1e-6).
- ETF đủ điều kiện khi có ít nhất 200 phiên trước ngày tín hiệu và giá trị giao dịch trung bình 20 phiên (giá điều chỉnh × khối lượng) ≥ 1 triệu USD. Sub-sector: tối đa 1 ETF mỗi nhóm (IGV/SKYY, IYT/JETS).

## Tín hiệu SPY

- MA ngày: SMA close tính đến phiên trước. MA tuần: SMA close tuần, chỉ dùng các tuần đã đóng.
- Vùng = MA ± w × ATR14 Wilder của phiên trước; w = 0 / 0,25 / 0,5 / 0,75.
- Kích hoạt: 3 phiên liên tiếp có low trên vùng. Lần chạm hợp lệ: low ≤ cận trên vùng và close hôm trước > cận trên vùng. Sau lần chạm phải kích hoạt lại.
- Chạm: tín hiệu ngay ngày chạm. Giữ MA: close ngày chạm ≥ MA. Lấy lại MA: close ≥ MA trong ngày chạm hoặc tối đa 5 phiên sau.
- Engine dựng lại khớp 100% số rổ của báo cáo 10 năm cũ ở kiểu chạm và giữ MA (31/32 và 32/32 cấu hình); kiểu lấy lại MA lệch 1–3 rổ ở 11/32 cấu hình.

## Chọn ETF (tại close ngày tín hiệu)

- L250T: 3 ETF có return 250 phiên cao nhất trong số đang trên SMA200 của chính nó (ít hơn 3 thì mua số đạt).
- L250: như trên, không lọc SMA200. L20 / L60: return 20 / 60 phiên. L4K: tổng thứ hạng return 5/21/63/126 phiên.
- B3: 3 ETF yếu nhất theo return 20 phiên hôm trước. SPY: chỉ mua SPY. RAND: 3 ETF ngẫu nhiên, trung vị 30 lần.

## Giao dịch

- Mua giá mở cửa phiên sau, chia đều vốn. Không mở rổ mới khi rổ cũ chưa đóng hết.
- Thoát: giữ cố định 3/5/10/20 phiên (bán close phiên thứ N, phiên mua là 1); SMA5 (bán open phiên sau lần đầu close > SMA5, tối đa 10 phiên); H5S (giữ 5 phiên, stop 2 × ATR14 dưới giá mua).
- Phí 0,10% khứ hồi trên vốn rổ; kiểm tra thêm 0,30%.

## Thước đo

- PF = tổng lãi rổ / tổng lỗ rổ. Bỏ 3 rổ tốt: PF sau khi bỏ 3 rổ lãi lớn nhất.
- Vào ngày bất kỳ: cùng cách chọn và cách thoát, mua mọi ngày trong cửa sổ (chồng lệnh).
- Ngày tín hiệu ngẫu nhiên: 1.000 lần, cùng số rổ. Bootstrap PF: 5.000 lần.
- Sụt giảm vốn: equity theo ngày, dùng toàn bộ vốn mỗi rổ, tiền mặt không sinh lãi.
- Tổng cộng 8.064 cấu hình: 8 MA × 4 độ rộng × 3 kiểu vào × 7 cách chọn × 6 cách thoát × 2 nhóm ETF.

## Hạn chế

- Kết quả chưa hiệu chỉnh cho việc thử nhiều cấu hình; PF thực tế nhiều khả năng khoảng 2–2,5.
- Chưa tính trượt giá, chênh lệch mua/bán, thuế. SMH/OIH trước 2011 là dữ liệu HOLDRS được Yahoo nối vào.
- Danh sách sub-sector chọn theo watchlist hiện tại, có thiên lệch sống sót.
