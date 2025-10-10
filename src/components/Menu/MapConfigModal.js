import React, { useState } from "react";
import "../../CSS/MapConfigModal.css";

const MapConfigModal = ({ isOpen, onSubmit }) => {
  const [width, setWidth] = useState(50); // Giá trị mặc định
  const [height, setHeight] = useState(50); // Giá trị mặc định
  const [pixelsPerMeter, setPixelsPerMeter] = useState(20); // Giá trị mặc định

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    // Đảm bảo các giá trị là số và hợp lệ
    if (width > 0 && height > 0 && pixelsPerMeter > 0) {
      onSubmit({ width, height, pixelsPerMeter });
    } else {
      alert("Vui lòng nhập các giá trị hợp lệ.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Cấu hình Bản đồ Mới</h2>
        <div className="form-group">
          <label>Chiều rộng (mét):</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(parseFloat(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Chiều cao (mét):</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(parseFloat(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label>Tỉ lệ (pixel cho mỗi mét):</label>
          <select
            value={pixelsPerMeter}
            onChange={(e) => setPixelsPerMeter(parseInt(e.target.value))}
          >
            <option value="20">20 (Khuyên dùng)</option>
            <option value="50">50</option>
            <option value="60">60</option>
            <option value="100">100</option>
          </select>
        </div>
        <button onClick={handleSubmit}>Tạo Bản đồ</button>
      </div>
    </div>
  );
};

export default MapConfigModal;
