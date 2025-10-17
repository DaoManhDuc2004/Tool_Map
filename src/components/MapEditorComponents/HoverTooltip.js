import React from "react";
import "../../CSS/HoverTooltip.css";
const HoverTooltip = ({ x, y, content }) => {
  if (!content) return null;

  const style = {
    // Thêm một khoảng nhỏ để tooltip không che mất con trỏ
    top: `${y + 15}px`,
    left: `${x + 15}px`,
  };

  return (
    <div className="hover-tooltip" style={style}>
      <p>
        <strong>ID:</strong> {content.id}
      </p>
      <p>
        <strong>Name:</strong> {content.nodeName}
      </p>
      <p>
        <strong>Tọa độ (m):</strong>
      </p>
      <p style={{ paddingLeft: "10px" }}>X: {content.x_m}</p>
      <p style={{ paddingLeft: "10px" }}>Y: {content.y_m}</p>
    </div>
  );
};

export default HoverTooltip;
