import open3d as o3d
import numpy as np
from PIL import Image
from tqdm import tqdm
import os
import cv2  

# ==== Cấu hình ====
# 👉 Bạn có thể nhập đường dẫn file PCD ở đây (hoặc để trống sẽ hỏi)
PCD_FILE = r"D:\Viettel_Post\ToolMap\Map3D\GlobalMap.pcd"  # ví dụ: "D:\\data\\map3d.pcd"
if not os.path.exists(PCD_FILE):
    PCD_FILE = input("Nhập đường dẫn tới file .pcd: ").strip('"')

# Đặt các thông số
RES = 0.05               # mét / pixel (nhỏ hơn = chi tiết hơn, ảnh to hơn)
Z_MIN, Z_MAX = -0.5, 2.0 # chỉ lấy điểm có độ cao trong khoảng này

# ==== Đọc file .pcd ====
print("📥 Đang đọc file PCD:", PCD_FILE)
pcd = o3d.io.read_point_cloud(PCD_FILE)
points = np.asarray(pcd.points)
print(f"Đọc được {len(points):,} điểm")

# ==== Lọc theo chiều cao Z ====
mask = (points[:, 2] >= Z_MIN) & (points[:, 2] <= Z_MAX)
points = points[mask]
print(f"Giữ lại {len(points):,} điểm sau khi lọc Z")

# ==== Tính toán kích thước bản đồ ====
x_min, y_min = points[:, 0].min(), points[:, 1].min()
x_max, y_max = points[:, 0].max(), points[:, 1].max()

width  = int((x_max - x_min) / RES) + 1
height = int((y_max - y_min) / RES) + 1

print(f"Kích thước ảnh: {width} x {height} pixel (res={RES} m/pixel)")

# ==== Tạo ảnh đen trắng ====
# img là ảnh thưa thớt ban đầu
img = np.zeros((height, width), dtype=np.uint8)

# ==== Điền điểm ====
for x, y, z in tqdm(points, desc="Vẽ điểm"):
    ix = int((x - x_min) / RES)
    iy = int((y - y_min) / RES)
    if 0 <= ix < width and 0 <= iy < height:
        img[iy, ix] = 255  # trắng = có vật thể

# ==== (MỚI) Làm dày các điểm để lấp đầy khoảng trống ====
print("🖌️ Đang làm dày (dilate) các điểm ảnh...")
# Tạo kernel 3x3. Bạn có thể tăng kích thước (5, 5) để làm dày hơn
kernel_size = 3 # (MỚI)
kernel = np.ones((kernel_size, kernel_size), np.uint8) 

# Chạy phép Dilation 1 lần. Tăng iterations=2 để dày hơn nữa
iterations = 1 # (MỚI)
img_dilated = cv2.dilate(img, kernel, iterations=iterations) 

# ==== Lật ngược trục Y để nhìn từ trên xuống ====
img_dilated = img_dilated[::-1, :] # (MỚI) Lật ảnh đã được làm dày

# ==== Lưu ảnh ====
output_dir = os.path.dirname(PCD_FILE)
# (MỚI) Đổi tên file output để không ghi đè
out_file = os.path.join(output_dir, "map2d_filled.png") 
Image.fromarray(img_dilated).save(out_file)
print("✅ Đã lưu:", out_file)

# ==== (Tuỳ chọn) hiển thị ====
try:
    import matplotlib.pyplot as plt
    plt.imshow(img_dilated, cmap='gray') # (MỚI) Hiển thị ảnh đã làm dày
    plt.title("Bản đồ 2D (Đã làm dày)")
    plt.show()
except ImportError:
    print("Không có matplotlib, bỏ qua hiển thị.")