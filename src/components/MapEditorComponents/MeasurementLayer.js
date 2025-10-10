import React from "react";
import { Line, Circle, Text } from "react-konva";
// File này là đo khoảng cách
const MeasurementLayer = ({ tool, measurement, stage, contentHeight }) => {
  if (tool !== "measure" || measurement.points.length < 2) {
    return null;
  }

  return (
    <React.Fragment>
      <Line
        points={measurement.points.flatMap((p) => [p.x, contentHeight - p.y])}
        stroke="#800080"
        strokeWidth={2 / stage.scale}
        dash={[5, 5]}
        listening={false}
      />
      <Circle
        x={measurement.points[0].x}
        y={contentHeight - measurement.points[0].y}
        radius={4 / stage.scale}
        fill="#800080"
        listening={false}
      />
      {measurement.distance > 0 && (
        <Text
          x={measurement.points[1].x + 10 / stage.scale}
          y={contentHeight - measurement.points[1].y + 10 / stage.scale}
          text={`${measurement.distance.toFixed(2)} m`}
          fontSize={14 / stage.scale}
          fill="red"
          padding={4 / stage.scale}
          background="#800080"
          cornerRadius={4 / stage.scale}
          listening={false}
        />
      )}
    </React.Fragment>
  );
};

export default MeasurementLayer;
