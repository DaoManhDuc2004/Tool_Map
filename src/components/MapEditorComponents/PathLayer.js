import React from "react";
import { Line, Arrow, Path, Circle } from "react-konva";

const PathLayer = ({
  paths,
  points,
  selectedId,
  stage,
  contentHeight,
  handleObjectClick,
  handleControlPointDrag,
  setIsStageDraggable,
}) => {
  return (
    <>
      {paths.map((path) => {
        const isSelected = path.id === selectedId;

        // --- Logic vẽ đường thẳng ---
        if (path.pathType === "straight") {
          const fromPoint = points.find((p) => p.id === path.from);
          const toPoint = points.find((p) => p.id === path.to);
          if (!fromPoint || !toPoint) return null;

          const fromY = contentHeight - fromPoint.y;
          const toY = contentHeight - toPoint.y;

          const arrowLength = 20 / stage.scale; // Chiều dài của mũi tên
          const midX = (fromPoint.x + toPoint.x) / 2;
          const midY = (fromY + toY) / 2;

          const dx = toPoint.x - fromPoint.x;
          const dy = toY - fromY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Tránh chia cho 0 nếu 2 điểm trùng nhau
          if (dist === 0) return null;

          // Vector đơn vị (chỉ hướng)
          const ux = dx / dist;
          const uy = dy / dist;

          // Tọa độ bắt đầu và kết thúc của đoạn thẳng nhỏ làm mũi tên
          const arrowStartX = midX - ux * (arrowLength / 2);
          const arrowStartY = midY - uy * (arrowLength / 2);
          const arrowEndX = midX + ux * (arrowLength / 2);
          const arrowEndY = midY + uy * (arrowLength / 2);

          return (
            <React.Fragment key={path.id}>
              {/* Logic sẽ kiểm tra hướng đi TRƯỚC KHI vẽ */}
              {path.direction === "one-way" ? (
                // --- PHẦN NÀY ĐƯỢC GIỮ NGUYÊN ---
                <>
                  <Line
                    points={[fromPoint.x, fromY, toPoint.x, toY]}
                    stroke={isSelected ? "#00e6e6" : "red"}
                    strokeWidth={3 / stage.scale}
                    hitStrokeWidth={15 / stage.scale}
                    onClick={(e) => handleObjectClick(e, path)}
                  />
                  <Arrow
                    points={[arrowStartX, arrowStartY, arrowEndX, arrowEndY]}
                    fill={isSelected ? "#00e6e6" : "red"}
                    strokeWidth={0}
                    pointerLength={15 / stage.scale}
                    pointerWidth={15 / stage.scale}
                    listening={false}
                  />
                </>
              ) : (
                // --- PHẦN NÀY ĐÃ ĐƯỢC CẬP NHẬT LOGIC MỚI ---
                // Vẽ 2 đường song song và biểu tượng mũi tên ở giữa
                <>
                  {(() => {
                    // --- Phần 1: Thông số cho 2 đường thẳng song song ---
                    const lineOffset = 4 / stage.scale; // Khoảng cách giữa 2 đường
                    const perpX = -uy;
                    const perpY = ux;
                    const offsetX = perpX * lineOffset;
                    const offsetY = perpY * lineOffset;

                    // --- Phần 2: Thông số cho biểu tượng mũi tên ở giữa ---
                    const arrowLength = 15 / stage.scale; // Chiều dài mỗi mũi tên nhỏ
                    const arrowOffset = 4 / stage.scale; // Khoảng cách lệch của 2 mũi tên nhỏ

                    // Vị trí tâm của mũi tên nhỏ thứ nhất
                    const mid1X = midX + perpX * arrowOffset;
                    const mid1Y = midY + perpY * arrowOffset;

                    // Vị trí tâm của mũi tên nhỏ thứ hai
                    const mid2X = midX - perpX * arrowOffset;
                    const mid2Y = midY - perpY * arrowOffset;

                    return (
                      <React.Fragment>
                        {/* Vẽ 2 ĐƯỜNG THẲNG song song (không có đầu mũi tên) */}
                        <Line
                          points={[
                            fromPoint.x + offsetX,
                            fromY + offsetY,
                            toPoint.x + offsetX,
                            toY + offsetY,
                          ]}
                          stroke={isSelected ? "#00e6e6" : "red"}
                          strokeWidth={2 / stage.scale}
                          hitStrokeWidth={15 / stage.scale}
                          onClick={(e) => handleObjectClick(e, path)}
                        />
                        <Line
                          points={[
                            fromPoint.x - offsetX,
                            fromY - offsetY,
                            toPoint.x - offsetX,
                            toY - offsetY,
                          ]}
                          stroke={isSelected ? "#00e6e6" : "red"}
                          hitStrokeWidth={15 / stage.scale}
                          strokeWidth={2 / stage.scale}
                          listening={false}
                        />

                        {/* Vẽ BIỂU TƯỢNG mũi tên ở giữa */}
                        <Arrow
                          points={[
                            mid1X - ux * (arrowLength / 2),
                            mid1Y - uy * (arrowLength / 2),
                            mid1X + ux * (arrowLength / 2),
                            mid1Y + uy * (arrowLength / 2),
                          ]}
                          fill={isSelected ? "#00e6e6" : "red"}
                          strokeWidth={0}
                          pointerLength={10 / stage.scale}
                          pointerWidth={10 / stage.scale}
                          listening={false}
                        />
                        <Arrow
                          points={[
                            mid2X + ux * (arrowLength / 2),
                            mid2Y + uy * (arrowLength / 2),
                            mid2X - ux * (arrowLength / 2),
                            mid2Y - uy * (arrowLength / 2),
                          ]}
                          fill={isSelected ? "#00e6e6" : "red"}
                          strokeWidth={0}
                          pointerLength={10 / stage.scale}
                          pointerWidth={10 / stage.scale}
                          listening={false}
                        />
                      </React.Fragment>
                    );
                  })()}
                </>
              )}
            </React.Fragment>
          );
        }

        if (path.pathType === "curved") {
          const pathNodes = path.pointIds
            .map((id) => points.find((p) => p.id === id))
            .filter(Boolean);
          if (pathNodes.length < 2) return null;

          const flippedPathNodes = pathNodes.map((p) => ({
            ...p,
            y: contentHeight - p.y,
          }));
          const flippedControlPoints = path.controlPoints.map((cp) => ({
            ...cp,
            y: contentHeight - cp.y,
          }));

          let svgPathData = `M ${flippedPathNodes[0].x} ${flippedPathNodes[0].y}`;
          for (let i = 0; i < flippedPathNodes.length - 1; i++) {
            const controlPoint = flippedControlPoints[i];
            const endPoint = flippedPathNodes[i + 1];
            if (controlPoint && endPoint) {
              svgPathData += ` Q ${controlPoint.x} ${controlPoint.y} ${endPoint.x} ${endPoint.y}`;
            }
          }

          return (
            <React.Fragment key={path.id}>
              <Path
                data={svgPathData}
                stroke={isSelected ? "#00e6e6" : "red"}
                strokeWidth={3 / stage.scale}
                hitStrokeWidth={15 / stage.scale}
                onClick={(e) => handleObjectClick(e, path)}
              />

              {/* SỬA LẠI: Dùng flippedControlPoints để vẽ Circle */}
              {isSelected &&
                flippedControlPoints.map((cp, index) => (
                  <Circle
                    key={`cp_${path.id}_${index}`}
                    x={cp.x}
                    y={cp.y} // Dùng tọa độ y đã lật để hiển thị
                    radius={6 / stage.scale}
                    fill="#FFF"
                    stroke="#007bff"
                    strokeWidth={2 / stage.scale}
                    draggable
                    onDragMove={(e) =>
                      handleControlPointDrag(e, path.id, index)
                    }
                    onDragStart={() => setIsStageDraggable(false)}
                    onDragEnd={() => setIsStageDraggable(true)}
                  />
                ))}

              {(() => {
                // SỬA LẠI: Dùng các điểm đã lật để tính toán hướng mũi tên
                const startPoint = flippedPathNodes[0];
                const endPoint = flippedPathNodes[flippedPathNodes.length - 1];
                const firstControlPoint = flippedControlPoints[0];
                const lastControlPoint =
                  flippedControlPoints[flippedControlPoints.length - 1];

                if (
                  !startPoint ||
                  !endPoint ||
                  !firstControlPoint ||
                  !lastControlPoint
                ) {
                  return null;
                }

                if (path.direction === "one-way") {
                  const dx = endPoint.x - lastControlPoint.x;
                  const dy = endPoint.y - lastControlPoint.y; // Tính dy trên hệ tọa độ hiển thị
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist === 0) return null;
                  const ux = dx / dist;
                  const uy = dy / dist;

                  return (
                    <Arrow
                      points={[
                        endPoint.x - ux * 20,
                        endPoint.y - uy * 20,
                        endPoint.x,
                        endPoint.y,
                      ]}
                      fill={isSelected ? "#00e6e6" : "red"}
                      stroke={isSelected ? "#00e6e6" : "red"}
                      strokeWidth={0}
                      pointerLength={15 / stage.scale}
                      pointerWidth={15 / stage.scale}
                      listening={false}
                    />
                  );
                } else {
                  const dx_end = endPoint.x - lastControlPoint.x;
                  const dy_end = endPoint.y - lastControlPoint.y;
                  const dist_end = Math.sqrt(dx_end * dx_end + dy_end * dy_end);
                  const ux_end = dist_end === 0 ? 0 : dx_end / dist_end;
                  const uy_end = dist_end === 0 ? 0 : dy_end / dist_end;

                  const dx_start = firstControlPoint.x - startPoint.x;
                  const dy_start = firstControlPoint.y - startPoint.y;
                  const dist_start = Math.sqrt(
                    dx_start * dx_start + dy_start * dy_start
                  );
                  const ux_start = dist_start === 0 ? 0 : dx_start / dist_start;
                  const uy_start = dist_start === 0 ? 0 : dy_start / dist_start;

                  return (
                    <>
                      <Arrow
                        points={[
                          endPoint.x - ux_end * 20,
                          endPoint.y - uy_end * 20,
                          endPoint.x,
                          endPoint.y,
                        ]}
                        fill={isSelected ? "#00e6e6" : "red"}
                        stroke={isSelected ? "#00e6e6" : "red"}
                        strokeWidth={0}
                        pointerLength={15 / stage.scale}
                        pointerWidth={15 / stage.scale}
                        listening={false}
                      />
                      <Arrow
                        points={[
                          startPoint.x + ux_start * 20,
                          startPoint.y + uy_start * 20,
                          startPoint.x,
                          startPoint.y,
                        ]}
                        fill={isSelected ? "#00e6e6" : "red"}
                        stroke={isSelected ? "#00e6e6" : "red"}
                        strokeWidth={0}
                        pointerLength={15 / stage.scale}
                        pointerWidth={15 / stage.scale}
                        listening={false}
                      />
                    </>
                  );
                }
              })()}
            </React.Fragment>
          );
        }
        return null;
      })}
    </>
  );
};

export default PathLayer;
