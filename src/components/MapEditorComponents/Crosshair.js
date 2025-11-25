import React from "react";
import { Line, Text } from "react-konva";

// File này là định vị chuột khi đang chọn vẽ Node
const Crosshair = ({
  tool,
  crosshair,
  stage,
  contentHeight,
  contentWidth,
  movingPointId,
  // THÊM 2 PROPS MỚI
  originOffset,
  pixelsPerMeter,
}) => {
  if ((tool !== "place_point" && !movingPointId) || !crosshair.visible) {
    return null;
  }

  // --- THÊM TÍNH TOÁN MỚI ---
  // crosshair.x và .y là tọa độ "thế giới" (so với Gốc Ảnh)

  // 1. Tính tọa độ pixel TƯƠNG ĐỐI (so với Mốc A)
  const relativeX_pixels = crosshair.x - originOffset.x;
  const relativeY_pixels = crosshair.y - originOffset.y;

  // 2. Chuyển sang mét
  const relativeX_meters = relativeX_pixels / pixelsPerMeter;
  const relativeY_meters = relativeY_pixels / pixelsPerMeter;
  // --- KẾT THÚC TÍNH TOÁN MỚI ---

  return (
    <React.Fragment>
      {/* Đường dọc (vẫn vẽ theo tọa độ "thế giới") */}
      <Line
        points={[crosshair.x, 0, crosshair.x, contentHeight]}
        stroke="rgba(255, 87, 0, 1)"
        strokeWidth={2 / stage.scale}
        listening={false}
      />
      {/* Đường ngang (vẫn vẽ theo tọa độ "thế giới") */}
      <Line
        points={[
          0,
          contentHeight - crosshair.y,
          contentWidth,
          contentHeight - crosshair.y,
        ]}
        stroke="rgba(255, 87, 0, 1)"
        strokeWidth={2 / stage.scale}
        listening={false}
      />
      {/* Text hiển thị (vẫn đặt theo tọa độ "thế giới") */}
      <Text
        x={crosshair.x + 15 / stage.scale}
        y={contentHeight - crosshair.y + 15 / stage.scale}
        // --- THAY ĐỔI HIỂN THỊ ---
        // Hiển thị tọa độ mét (so với Mốc A) và có 2 số thập phân
        text={`X(m): ${relativeX_meters.toFixed(
          2
        )}\nY(m): ${relativeY_meters.toFixed(2)}`}
        // --- KẾT THÚC THAY ĐỔI ---

        fontSize={14 / stage.scale}
        fill="#20232a"
        padding={5 / stage.scale}
        background="rgba(255, 111, 0, 0.8)"
        cornerRadius={4 / stage.scale}
        listening={false}
      />
    </React.Fragment>
  );
};

export default Crosshair;
