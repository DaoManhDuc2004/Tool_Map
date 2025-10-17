import React, { useState, useEffect } from "react";
import "../../CSS/PropertyEditor.css";
// Hiển thị thông tin chi tiết của 1 đường, 1 điểm, 1 vùng
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
  const [coordsInMeters, setCoordsInMeters] = useState({ x: "", y: "" });

  useEffect(() => {
    if (!selection) return;

    const multiple = Array.isArray(selection);
    setIsMultiple(multiple);

    if (multiple) {
      // Xử lý nhiều đối tượng
      const firstObject = selection[0];
      const newFormData = {};
      const newPlaceholders = {};

      Object.keys(firstObject).forEach((key) => {
        const allHaveSameValue = selection.every(
          (obj) => JSON.stringify(obj[key]) === JSON.stringify(firstObject[key])
        );
        if (allHaveSameValue) {
          newFormData[key] = firstObject[key];
        } else {
          newFormData[key] = "";
          newPlaceholders[key] = "Nhiều giá trị";
        }
      });
      setFormData(newFormData);
      setPlaceholders(newPlaceholders);
      // Reset tọa độ khi chọn nhiều
      setCoordsInMeters({ x: "", y: "" });
    } else {
      // Xử lý một đối tượng
      setFormData({ ...selection });
      setPlaceholders({});

      if (selection.type === "point") {
        const pixelsPerMeter = mapConfig?.pixelsPerMeter || 1;
        setCoordsInMeters({
          x: (selection.x / pixelsPerMeter).toFixed(3),
          y: (selection.y / pixelsPerMeter).toFixed(3),
        });
      }
    }
  }, [selection, mapConfig]);

  if (!selection) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === "checkbox" ? checked : value;
    if (placeholders[name]) {
      setPlaceholders((prev) => ({ ...prev, [name]: "" }));
    }
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const handleCoordsChange = (e) => {
    const { name, value } = e.target;
    setCoordsInMeters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (isMultiple) {
      // Lưu cho nhiều đối tượng
      const changes = {};
      Object.keys(formData).forEach((key) => {
        if (!placeholders[key] || placeholders[key] === "") {
          // --- SỬA LẠI DÒNG IF NÀY ---
          if (key === "elevation" || key === "slope") {
            changes[key] = parseFloat(formData[key]) || 0;
          } else {
            changes[key] = formData[key];
          }
        }
      });
      onSaveMultiple(changes);
    } else {
      // Lưu cho một đối tượng
      const dataToSave = { ...formData };
      dataToSave.elevation = parseFloat(dataToSave.elevation) || 0;
      // --- THÊM DÒNG NÀY ---
      dataToSave.slope = parseFloat(dataToSave.slope) || 0;

      if (dataToSave.type === "point") {
        const pixelsPerMeter = mapConfig?.pixelsPerMeter || 1;
        const x_meters = parseFloat(coordsInMeters.x) || 0;
        const y_meters = parseFloat(coordsInMeters.y) || 0;

        dataToSave.x = x_meters * pixelsPerMeter;
        dataToSave.y = y_meters * pixelsPerMeter;
      }

      onSaveSingle(dataToSave);
    }
  };

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

      <div className="form-group">
        <label>Physical coordinates (Tọa độ vật lý - mét)</label>
        <div className="coords-inputs">
          <div className="coord-input-group">
            <span>X:</span>
            <input
              type="number"
              name="x"
              value={coordsInMeters.x}
              onChange={handleCoordsChange}
              disabled={isMultiple} // Bị vô hiệu hóa khi chọn nhiều
              step="0.01"
            />
            <span>m</span>
          </div>
          <div className="coord-input-group">
            <span>Y:</span>
            <input
              type="number"
              name="y"
              value={coordsInMeters.y}
              onChange={handleCoordsChange}
              disabled={isMultiple} // Bị vô hiệu hóa khi chọn nhiều
              step="0.01"
            />
            <span>m</span>
          </div>
        </div>
        {isMultiple && (
          <p
            className="coords-display"
            style={{ color: "#888", marginTop: "5px" }}
          >
            Không thể sửa tọa độ hàng loạt
          </p>
        )}
      </div>
    </>
  );

  const renderFieldsForPath = () => {
    return (
      <>
        {/* Phần hiển thị Hướng di chuyển (không đổi) */}
        {formData.pathType === "straight" ? (
          <div className="form-group">
            <label>Hướng di chuyển (Direction)</label>
            <select
              name="direction"
              value={formData.direction || "one-way"}
              onChange={handleChange}
              placeholder={placeholders.direction}
            >
              <option value="one-way">Một chiều</option>
              <option value="two-way">Hai chiều</option>
            </select>
          </div>
        ) : (
          <div className="form-group">
            <label>Hướng di chuyển (Direction)</label>
            <input type="text" value="Một chiều (mặc định)" disabled />
          </div>
        )}

        <div className="form-group">
          <label>Độ dốc (Slope)</label>
          <input
            type="number"
            name="slope"
            value={formData.slope ?? 0} // Hiển thị giá trị slope, mặc định là 0
            onChange={handleChange}
            placeholder={placeholders.slope}
            step="0.1"
          />
        </div>
      </>
    );
  };

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
        {objectSample.type === "path" && renderFieldsForPath()}
      </div>
      <div className="editor-footer">
        <button onClick={handleSave}>Lưu</button>
        <button onClick={onClose}>Hủy</button>
      </div>
    </div>
  );
};

export default PropertyEditor;
