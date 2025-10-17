import React from "react";
import { Rect } from "react-konva";

const PointLayer = ({
  points,
  selectedId,
  selectedObjectIds = [], // Luôn có giá trị mặc định để tránh lỗi
  pathStartPointId,
  stage,
  contentHeight,
  handleObjectClick,
  handlePointContextMenu,
  // --- NHẬN 2 HÀM MỚI TỪ PROPS ---
  onPointMouseOver,
  onPointMouseOut,
}) => {
  return (
    <>
      {points.map((point) => {
        const isSelected =
          point.id === selectedId || selectedObjectIds.includes(point.id);
        const isStartPoint = point.id === pathStartPointId;

        let fillColor = "#007bff";
        if (isStartPoint) {
          fillColor = "#ff7f50";
        } else if (point.nodeType === "charging point") {
          fillColor = "#28a745";
        }

        const visualSize = 15 / stage.scale;

        return (
          <Rect
            key={point.id}
            x={point.x - visualSize / 2}
            y={contentHeight - point.y - visualSize / 2}
            width={visualSize}
            height={visualSize}
            fill={fillColor}
            stroke={isSelected ? "#00e6e6" : "white"}
            strokeWidth={isSelected ? 2 / stage.scale : 1 / stage.scale}
            onClick={(e) => handleObjectClick(e, point)}
            onContextMenu={(e) => handlePointContextMenu(e, point)}
            // --- THÊM CÁC SỰ KIỆN CHUỘT MỚI ---
            onMouseOver={(e) => onPointMouseOver(e, point)}
            onMouseOut={onPointMouseOut}
            onMouseEnter={(e) => {
              // Đổi con trỏ thành hình bàn tay khi di chuột vào
              const container = e.target.getStage().container();
              container.style.cursor = "pointer";
            }}
            onMouseLeave={(e) => {
              // Trả con trỏ về mặc định khi di chuột ra
              const container = e.target.getStage().container();
              container.style.cursor = "default";
            }}
          />
        );
      })}
    </>
  );
};

export default PointLayer;
