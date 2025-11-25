import React, { useState, useEffect } from "react";
import "../../CSS/RobotPoseModal.css";
const RobotPoseModal = ({ isOpen, onClose, onSetPose, currentPose }) => {
  // State nội bộ để người dùng gõ
  const [x, setX] = useState(currentPose.x);
  const [y, setY] = useState(currentPose.y);

  // Cập nhật state nội bộ mỗi khi modal được mở
  useEffect(() => {
    if (isOpen) {
      setX(currentPose.x);
      setY(currentPose.y);
    }
  }, [isOpen, currentPose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    // Gửi tọa độ mới (đã chuyển sang số) về App.js
    onSetPose({
      x: parseFloat(x) || 0,
      y: parseFloat(y) || 0,
    });
    onClose(); // Tự động đóng sau khi "Đặt"
  };

  return (
    <div className="robot-modal-backdrop" onClick={onClose}>
      <div className="robot-modal-content" onClick={(e) => e.stopPropagation()}>
        <h4>🤖 Đặt Vị Trí Robot (R)</h4>
        <p>Nhập tọa độ (mét) so với Mốc A:</p>
        <div className="input-group">
          <label>X (m):</label>
          <input
            type="number"
            value={x}
            onChange={(e) => setX(e.target.value)}
            autoFocus // Tự động focus vào ô đầu tiên
          />
        </div>
        <div className="input-group">
          <label>Y (m):</label>
          <input
            type="number"
            value={y}
            onChange={(e) => setY(e.target.value)}
          />
        </div>
        <div className="modal-buttons">
          <button onClick={onClose}>Hủy</button>
          <button onClick={handleSubmit} className="btn-primary">
            Đặt Vị Trí
          </button>
        </div>
      </div>
    </div>
  );
};

export default RobotPoseModal;
