import React from "react";
import { Line, Rect } from "react-konva";

const ZoneLayer = ({
  walls,
  zones,
  selectedId,
  stage,
  contentHeight,
  handleObjectClick,
}) => {
  return (
    <>
      {/* Vẽ Tường */}
      {walls.map((wall) => {
        const isSelected = wall.id === selectedId;
        return (
          <Line
            key={wall.id}
            points={[
              wall.points[0],
              contentHeight - wall.points[1], // Lật y1
              wall.points[2],
              contentHeight - wall.points[3], // Lật y2
            ]}
            stroke={isSelected ? "#00e6e6" : "#df4b26"}
            strokeWidth={5 / stage.scale}
            lineCap="round"
            onClick={(e) => handleObjectClick(e, wall)}
          />
        );
      })}

      {/* Vẽ Vùng */}
      {zones.map((zone) => {
        const isSelected = zone.id === selectedId;

        // === LOGIC SỬA LẠI: Xử lý width/height âm ===

        // Xử lý tọa độ X và Width
        const rectX = zone.width < 0 ? zone.x + zone.width : zone.x;
        const rectWidth = Math.abs(zone.width);

        // Xử lý tọa độ Y và Height
        // 1. Xác định cạnh trên của hình chữ nhật trong hệ tọa độ bottom-left
        const topEdgeInBottomLeft =
          zone.height < 0
            ? zone.y - zone.height // (zone.y + Math.abs(zone.height))
            : zone.y;

        // 2. Chuyển tọa độ Y của cạnh trên đó sang hệ top-left của canvas
        const displayY = contentHeight - topEdgeInBottomLeft;
        const displayHeight = Math.abs(zone.height);

        // === KẾT THÚC LOGIC SỬA LẠI ===

        return (
          <Rect
            key={zone.id}
            x={rectX}
            y={displayY}
            width={rectWidth}
            height={displayHeight}
            fill={zone.fill}
            stroke={isSelected ? "#00e6e6" : "white"}
            strokeWidth={isSelected ? 3 / stage.scale : 1 / stage.scale}
            onClick={(e) => handleObjectClick(e, zone)}
          />
        );
      })}
    </>
  );
};

export default ZoneLayer;
