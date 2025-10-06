// src/pcd-worker.js - PHIÊN BẢN MỚI CÓ TÔ MÀU THEO CƯỜNG ĐỘ

/* eslint-disable no-restricted-globals */

import { PCDLoader } from "three/examples/jsm/loaders/PCDLoader.js";

const MAX_POINTS_LIMIT = 350000; // Giữ nguyên giới hạn điểm

// --- HÀM TÔ MÀU DỰA TRÊN CƯỜNG ĐỘ ---
// Hàm này nhận một giá trị cường độ (thường từ 0 đến 1)
// và trả về một bộ màu { r, g, b }
function getColorFromIntensity(intensity) {
  // Tạo gradient từ Xanh dương (Blue) -> Xanh lá (Green)
  const blue = { r: 0, g: 0, b: 1 };
  const green = { r: 0, g: 1, b: 0 };

  // Nội suy tuyến tính giữa hai màu
  const r = blue.r + intensity * (green.r - blue.r);
  const g = blue.g + intensity * (green.g - blue.g);
  const b = blue.b + intensity * (green.b - blue.b);

  return { r, g, b };
}

self.onmessage = (event) => {
  const { fileBuffer } = event.data;

  if (!fileBuffer) {
    self.postMessage({
      type: "error",
      message: "Không nhận được dữ liệu file.",
    });
    return;
  }

  try {
    const loader = new PCDLoader();
    const points = loader.parse(fileBuffer);

    let originalPositions = points.geometry.attributes.position.array;
    // LẤY DỮ LIỆU CƯỜNG ĐỘ (INTENSITY) THAY VÌ MÀU
    let originalIntensities = points.geometry.attributes.intensity?.array;

    const pointCount = originalPositions.length / 3;
    const processCount = Math.min(pointCount, MAX_POINTS_LIMIT);

    // Cắt mảng position để chỉ lấy số điểm tối đa
    const newPositions = originalPositions.subarray(0, processCount * 3);
    const newColors = new Float32Array(processCount * 3);

    // --- LOGIC TÔ MÀU MỚI ---
    if (originalIntensities) {
      // Tìm giá trị intensity min/max để chuẩn hóa về khoảng [0, 1]
      let minIntensity = Infinity;
      let maxIntensity = -Infinity;
      for (let i = 0; i < processCount; i++) {
        const intensity = originalIntensities[i];
        if (intensity < minIntensity) minIntensity = intensity;
        if (intensity > maxIntensity) maxIntensity = intensity;
      }

      const range = maxIntensity - minIntensity;

      // Lặp qua các điểm và gán màu dựa trên intensity
      for (let i = 0; i < processCount; i++) {
        // Chuẩn hóa intensity về khoảng 0.0 -> 1.0
        const normalizedIntensity =
          range > 0 ? (originalIntensities[i] - minIntensity) / range : 0;

        const color = getColorFromIntensity(normalizedIntensity);

        newColors[i * 3] = color.r; // R
        newColors[i * 3 + 1] = color.g; // G
        newColors[i * 3 + 2] = color.b; // B
      }
    } else {
      // Nếu file không có cả intensity, tô màu trắng mặc định
      newColors.fill(1.0);
    }

    // Gửi dữ liệu position và MÀU MỚI TẠO RA về luồng chính
    self.postMessage(
      { type: "done", positions: newPositions, colors: newColors },
      [newPositions.buffer, newColors.buffer].filter(Boolean)
    );
  } catch (error) {
    self.postMessage({
      type: "error",
      message: `Lỗi trong worker: ${error.message}`,
    });
  }
};
