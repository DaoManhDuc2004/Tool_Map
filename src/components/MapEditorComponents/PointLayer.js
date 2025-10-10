import React from "react";
import { Rect } from "react-konva";

const PointLayer = ({
  points,
  selectedId,
  pathStartPointId,
  drawingPathPoints,
  stage,
  contentHeight,
  handleObjectClick,
  handlePointContextMenu,
}) => {
  return (
    <>
      {points.map((point) => {
        const isSelected = point.id === selectedId;
        const isStartPoint = point.id === pathStartPointId;
        const isInDrawingPath = drawingPathPoints.some(
          (p) => p.id === point.id
        );

        let fillColor = "#007bff";
        if (isStartPoint || isInDrawingPath) {
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
          />
        );
      })}
    </>
  );
};

export default PointLayer;
