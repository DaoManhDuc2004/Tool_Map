// src/PropertyEditor.js

import React, { useState, useEffect } from "react";
import "./PropertyEditor.css";

const PropertyEditor = ({ object, onSave, onClose }) => {
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
    // Bỏ tham số valueType
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Tạo một bản sao của dữ liệu để xử lý
    const dataToSave = { ...formData };

    // Đảm bảo 'elevation' là một số trước khi lưu.
    // Chuyển đổi chuỗi rỗng hoặc giá trị không hợp lệ thành số 0.
    dataToSave.elevation = parseFloat(dataToSave.elevation) || 0;

    onSave(dataToSave);
  };

  // CẬP NHẬT: Component BooleanSelect sẽ gọi handleChange với kiểu 'boolean'
  const BooleanSelect = ({ label, name, value }) => (
    <div className="form-group">
      <label>{label}</label>
      <select
        name={name}
        value={value || false}
        onChange={(e) => handleChange(e, "boolean")} // <--- THAY ĐỔI Ở ĐÂY
      >
        <option value="false">No</option>
        <option value="true">Yes</option>
      </select>
    </div>
  );

  const renderFieldsForPoint = () => (
    <>
      <div className="form-group">
        <label>Node type (Loại nút)</label>
        <select
          name="nodeType"
          value={formData.nodeType || "running area"}
          onChange={handleChange} // <-- Giữ nguyên, vì đây là string
        >
          <option value="running area">running area</option>
          <option value="charging point">charging point</option>
        </select>
      </div>

      {/* ... các trường input và select khác cho Point giữ nguyên ... */}
      <div className="form-group">
        <label>Additional types (Loại bổ sung)</label>
        <select
          name="additionalType"
          value={formData.additionalType || "none"}
          onChange={handleChange}
        >
          <option value="none">Chưa chọn</option>
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
        {/* SỬA LẠI DÒNG NÀY */}
        <p className="coords-display">
          x = {Math.round(object.x + object.width / 2)} mm, y ={" "}
          {Math.round(object.y + object.height / 2)} mm
        </p>
      </div>

      {/* Các component BooleanSelect này sẽ tự động hoạt động đúng */}
      <BooleanSelect
        label="Whether to avoid (Có tránh hay không)"
        name="avoid"
        value={formData.avoid}
      />
      <BooleanSelect
        label="Handover area (Khu vực bàn giao)"
        name="handover"
        value={formData.handover}
      />
      <BooleanSelect
        label="Ignore load (Bỏ qua tải trọng)"
        name="ignoreLoad"
        value={formData.ignoreLoad}
      />
      <BooleanSelect
        label="Ignore car (Bỏ qua xe khác)"
        name="ignoreCar"
        value={formData.ignoreCar}
      />
      <BooleanSelect
        label="Movement expands (Mở rộng di chuyển)"
        name="movementExpands"
        value={formData.movementExpands}
      />
    </>
  );

  const renderFieldsForPath = () => (
    <div className="form-group">
      <label>Hướng di chuyển (Direction)</label>
      <select
        name="direction"
        value={formData.direction || "one-way"}
        onChange={handleChange} // <-- Giữ nguyên, vì đây là string
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
            // Dùng ?? '' để hiển thị chuỗi rỗng nếu giá trị là null/undefined,
            // nhưng vẫn hiển thị đúng số 0
            value={formData.elevation ?? ""}
            onChange={handleChange} // <-- Bỏ đi phần gọi hàm phức tạp
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
