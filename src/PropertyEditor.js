// src/PropertyEditor.js

import React, { useState, useEffect } from "react";
import "./PropertyEditor.css";

// 1. Nhận thêm prop mapConfig
const PropertyEditor = ({ object, onSave, onClose, mapConfig }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (object) {
      setFormData({ ...object });
    }
  }, [object]);

  if (!object) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const dataToSave = { ...formData };
    dataToSave.elevation = parseFloat(dataToSave.elevation) || 0;
    onSave(dataToSave);
  };

  // 2. Sửa lại toàn bộ hàm renderFieldsForPoint
  const renderFieldsForPoint = () => {
    // Khai báo biến ở đây, BÊN NGOÀI phần return
    const pixelsPerMeter = mapConfig?.pixelsPerMeter || 1;
    const x_in_meters = (object.x / pixelsPerMeter).toFixed(3);
    const y_in_meters = (object.y / pixelsPerMeter).toFixed(3);

    // Dùng câu lệnh "return" để trả về JSX
    return (
      <>
        <div className="form-group">
          <label>Node type (Loại nút)</label>
          <select
            name="nodeType"
            value={formData.nodeType || "running area"}
            onChange={handleChange}
          >
            <option value="running area">running area</option>
            <option value="charging point">charging point</option>
          </select>
        </div>
        <div className="form-group">
          <label>Node Name</label>
          <input
            type="text"
            name="nodeName"
            value={formData.nodeName || ""}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Physical coordinates (Tọa độ vật lý)</label>
          <p className="coords-display">
            x = {x_in_meters} m, y = {y_in_meters} m
          </p>
        </div>
      </>
    );
  };

  const renderFieldsForPath = () => (
    <div className="form-group">
      <label>Hướng di chuyển (Direction)</label>
      <select
        name="direction"
        value={formData.direction || "one-way"}
        onChange={handleChange}
      >
        <option value="one-way">Một chiều</option>
        <option value="two-way">Hai chiều</option>
      </select>
    </div>
  );

  return (
    <div className="property-editor">
      <div className="editor-header">
        <h3>Chỉnh sửa Thuộc tính</h3>
        <button onClick={onClose} className="close-btn">
          &times;
        </button>
      </div>
      <div className="editor-body">
        <div className="form-group">
          <label>ID</label>
          <input type="text" value={formData.id || ""} disabled />
        </div>
        <div className="form-group">
          <label>Độ cao (Z)</label>
          <input
            type="number"
            name="elevation"
            value={formData.elevation ?? ""}
            onChange={handleChange}
            placeholder="Chiều cao so với mặt sàn (mm)"
          />
        </div>

        {object.type === "point" && renderFieldsForPoint()}
        {object.type === "path" && renderFieldsForPath()}
      </div>
      <div className="editor-footer">
        <button onClick={handleSave}>Lưu</button>
        <button onClick={onClose}>Hủy</button>
      </div>
    </div>
  );
};

export default PropertyEditor;
