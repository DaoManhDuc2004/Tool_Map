import React, { useState, useEffect } from "react";
import "./PropertyEditor.css";

// <-- THAY ĐỔI: Nhận props mới
const PropertyEditor = ({
  selection,
  onSaveSingle,
  onSaveMultiple,
  onClose,
  mapConfig,
}) => {
  const [formData, setFormData] = useState({});
  const [isMultiple, setIsMultiple] = useState(false);
  const [placeholders, setPlaceholders] = useState({});

  useEffect(() => {
    if (!selection) return;

    const multiple = Array.isArray(selection);
    setIsMultiple(multiple);

    if (multiple) {
      // Xử lý nhiều đối tượng
      const firstObject = selection[0];
      const newFormData = {};
      const newPlaceholders = {};

      // Duyệt qua các thuộc tính của đối tượng đầu tiên để so sánh
      Object.keys(firstObject).forEach((key) => {
        const allHaveSameValue = selection.every(
          (obj) => JSON.stringify(obj[key]) === JSON.stringify(firstObject[key])
        );

        if (allHaveSameValue) {
          newFormData[key] = firstObject[key];
        } else {
          newFormData[key] = ""; // Để trống nếu giá trị khác nhau
          newPlaceholders[key] = "Nhiều giá trị"; // Placeholder cho input
        }
      });
      setFormData(newFormData);
      setPlaceholders(newPlaceholders);
    } else {
      // Xử lý một đối tượng như cũ
      setFormData({ ...selection });
      setPlaceholders({});
    }
  }, [selection]);

  if (!selection) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === "checkbox" ? checked : value;

    // Khi người dùng bắt đầu gõ, xóa placeholder
    if (placeholders[name]) {
      setPlaceholders((prev) => ({ ...prev, [name]: "" }));
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleSave = () => {
    // Chỉ lưu những trường đã được người dùng thay đổi
    const changes = {};
    Object.keys(formData).forEach((key) => {
      // Chỉ lưu nếu giá trị không phải là placeholder
      if (!placeholders[key] || placeholders[key] === "") {
        // Chuyển đổi elevation thành số
        if (key === "elevation") {
          changes[key] = parseFloat(formData[key]) || 0;
        } else {
          changes[key] = formData[key];
        }
      }
    });

    if (isMultiple) {
      onSaveMultiple(changes);
    } else {
      onSaveSingle(formData);
    }
  };

  // Lấy ra một object mẫu để render, dù là đơn hay đa lựa chọn
  const objectSample = isMultiple ? selection[0] : selection;

  const renderFieldsForPoint = () => (
    <>
      <div className="form-group">
        <label>Node type (Loại nút)</label>
        <select
          name="nodeType"
          value={formData.nodeType || "running area"}
          onChange={handleChange}
          placeholder={placeholders.nodeType}
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
          placeholder={placeholders.nodeName}
        />
      </div>
      {/* Tọa độ bị vô hiệu hóa khi sửa nhiều điểm */}
      <div className="form-group">
        <label>Physical coordinates</label>
        <p
          className="coords-display"
          style={{ color: isMultiple ? "#888" : "inherit" }}
        >
          {isMultiple ? "Không thể sửa tọa độ hàng loạt" : `x, y: (chỉ đọc)`}
        </p>
      </div>
    </>
  );

  return (
    <div className="property-editor">
      <div className="editor-header">
        <h3>
          {isMultiple
            ? `Sửa ${selection.length} Đối Tượng`
            : "Chỉnh sửa Thuộc tính"}
        </h3>
        <button onClick={onClose} className="close-btn">
          &times;
        </button>
      </div>
      <div className="editor-body">
        <div className="form-group">
          <label>ID</label>
          <input
            type="text"
            value={isMultiple ? "(Nhiều ID)" : formData.id || ""}
            disabled
          />
        </div>
        <div className="form-group">
          <label>Độ cao (Z)</label>
          <input
            type="number"
            name="elevation"
            value={formData.elevation ?? ""}
            onChange={handleChange}
            placeholder={
              placeholders.elevation || "Chiều cao so với mặt sàn (mm)"
            }
          />
        </div>

        {objectSample.type === "point" && renderFieldsForPoint()}
        {/* Có thể thêm logic cho path sau này */}
      </div>
      <div className="editor-footer">
        <button onClick={handleSave}>Lưu</button>
        <button onClick={onClose}>Hủy</button>
      </div>
    </div>
  );
};

export default PropertyEditor;
