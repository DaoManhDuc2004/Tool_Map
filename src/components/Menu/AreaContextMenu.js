import React from "react";
import "../../CSS/PointMenu.css";

const AreaContextMenu = ({
  x,
  y,
  onMove,
  onDeletePaths,
  onDeletePoints,
  onEraseBackground,
  onClose,
}) => {
  const menuStyle = {
    top: `${y}px`,
    left: `${x}px`,
  };

  // Ngăn sự kiện click lan ra ngoài menu và đóng nó ngay lập tức
  const handleMouseDown = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="context-menu"
      style={menuStyle}
      onMouseDown={handleMouseDown}
    >
      <ul>
        <li onClick={onDeletePaths}>Xóa Đường trong Vùng</li>
        <li onClick={onDeletePoints}>Xóa Điểm trong Vùng</li>
        <li onClick={onEraseBackground}>Xóa Nền Đen (Trắng)</li>
        <li onClick={onClose}>Đóng</li>
      </ul>
    </div>
  );
};

export default AreaContextMenu;
