import React from "react";
import { Line, Text } from "react-konva";
// File này là định vị chuột khi đang chọn vẽ Node
const Crosshair = ({ tool, crosshair, stage, contentHeight, contentWidth }) => {
  if (tool !== "place_point" || !crosshair.visible) {
    return null;
  }

  return (
    <React.Fragment>
      <Line
        points={[crosshair.x, 0, crosshair.x, contentHeight]}
        stroke="rgba(255, 87, 0, 1)"
        strokeWidth={2 / stage.scale}
        listening={false}
      />
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
      <Text
        x={crosshair.x + 15 / stage.scale}
        y={contentHeight - crosshair.y + 15 / stage.scale}
        text={`X: ${Math.round(crosshair.x)}\nY: ${Math.round(crosshair.y)}`}
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
