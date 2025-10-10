import React from "react";
import "../../CSS/PointMenu.css";

const PointMenu = ({ x, y, onMoveClick, onClose }) => {
  return (
    <div className="context-menu" style={{ top: y, left: x }}>
      <ul>
        <li onClick={onMoveClick}>Di chuyển điểm</li>
        {/* Bạn có thể thêm các mục menu khác ở đây */}
      </ul>
    </div>
  );
};

export default PointMenu;
