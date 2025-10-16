// import React, { useState, useEffect } from "react";
// import "./PropertyEditor.css";

// // <-- THAY ĐỔI: Nhận props mới
// const PropertyEditor = ({
//   selection,
//   onSaveSingle,
//   onSaveMultiple,
//   onClose,
//   mapConfig,
// }) => {
//   const [formData, setFormData] = useState({});
//   const [isMultiple, setIsMultiple] = useState(false);
//   const [placeholders, setPlaceholders] = useState({});

//   useEffect(() => {
//     if (!selection) return;

//     const multiple = Array.isArray(selection);
//     setIsMultiple(multiple);

//     if (multiple) {
//       // Xử lý nhiều đối tượng
//       const firstObject = selection[0];
//       const newFormData = {};
//       const newPlaceholders = {};

//       // Duyệt qua các thuộc tính của đối tượng đầu tiên để so sánh
//       Object.keys(firstObject).forEach((key) => {
//         const allHaveSameValue = selection.every(
//           (obj) => JSON.stringify(obj[key]) === JSON.stringify(firstObject[key])
//         );

//         if (allHaveSameValue) {
//           newFormData[key] = firstObject[key];
//         } else {
//           newFormData[key] = ""; // Để trống nếu giá trị khác nhau
//           newPlaceholders[key] = "Nhiều giá trị"; // Placeholder cho input
//         }
//       });
//       setFormData(newFormData);
//       setPlaceholders(newPlaceholders);
//     } else {
//       // Xử lý một đối tượng như cũ
//       setFormData({ ...selection });
//       setPlaceholders({});
//     }
//   }, [selection]);

//   if (!selection) return null;

//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     const finalValue = type === "checkbox" ? checked : value;

//     // Khi người dùng bắt đầu gõ, xóa placeholder
//     if (placeholders[name]) {
//       setPlaceholders((prev) => ({ ...prev, [name]: "" }));
//     }

//     setFormData((prev) => ({ ...prev, [name]: finalValue }));
//   };

//   const handleSave = () => {
//     // Chỉ lưu những trường đã được người dùng thay đổi
//     const changes = {};
//     Object.keys(formData).forEach((key) => {
//       // Chỉ lưu nếu giá trị không phải là placeholder
//       if (!placeholders[key] || placeholders[key] === "") {
//         // Chuyển đổi elevation thành số
//         if (key === "elevation") {
//           changes[key] = parseFloat(formData[key]) || 0;
//         } else {
//           changes[key] = formData[key];
//         }
//       }
//     });

//     if (isMultiple) {
//       onSaveMultiple(changes);
//     } else {
//       onSaveSingle(formData);
//     }
//   };

//   // Lấy ra một object mẫu để render, dù là đơn hay đa lựa chọn
//   const objectSample = isMultiple ? selection[0] : selection;

//   const renderFieldsForPoint = () => (
//     <>
//       <div className="form-group">
//         <label>Node type (Loại nút)</label>
//         <select
//           name="nodeType"
//           value={formData.nodeType || "running area"}
//           onChange={handleChange}
//           placeholder={placeholders.nodeType}
//         >
//           <option value="running area">running area</option>
//           <option value="charging point">charging point</option>
//         </select>
//       </div>
//       <div className="form-group">
//         <label>Node Name</label>
//         <input
//           type="text"
//           name="nodeName"
//           value={formData.nodeName || ""}
//           onChange={handleChange}
//           placeholder={placeholders.nodeName}
//         />
//       </div>
//       {/* Tọa độ bị vô hiệu hóa khi sửa nhiều điểm */}
//       <div className="form-group">
//         <label>Physical coordinates</label>
//         <p
//           className="coords-display"
//           style={{ color: isMultiple ? "#888" : "inherit" }}
//         >
//           {isMultiple ? "Không thể sửa tọa độ hàng loạt" : `x, y: (chỉ đọc)`}
//         </p>
//       </div>
//     </>
//   );

//   const renderFieldsForPath = () => {
//     // TRƯỜNG HỢP 1: Nếu là đường thẳng, hiển thị dropdown cho phép sửa
//     if (formData.pathType === "straight") {
//       return (
//         <div className="form-group">
//           <label>Hướng di chuyển (Direction)</label>
//           <select
//             name="direction"
//             value={formData.direction || "one-way"}
//             onChange={handleChange}
//             placeholder={placeholders.direction}
//           >
//             <option value="one-way">Một chiều</option>
//             <option value="two-way">Hai chiều</option>
//           </select>
//         </div>
//       );
//     }

//     // TRƯỜNG HỢP 2: Nếu là đường cong, hiển thị text bị vô hiệu hóa
//     return (
//       <div className="form-group">
//         <label>Hướng di chuyển (Direction)</label>
//         <input
//           type="text"
//           value="Một chiều (mặc định)"
//           disabled
//           title="Hướng của đường cong được quyết định khi vẽ."
//         />
//       </div>
//     );
//   };

//   return (
//     <div className="property-editor">
//       <div className="editor-header">
//         <h3>
//           {isMultiple
//             ? `Sửa ${selection.length} Đối Tượng`
//             : "Chỉnh sửa Thuộc tính"}
//         </h3>
//         <button onClick={onClose} className="close-btn">
//           &times;
//         </button>
//       </div>
//       <div className="editor-body">
//         <div className="form-group">
//           <label>ID</label>
//           <input
//             type="text"
//             value={isMultiple ? "(Nhiều ID)" : formData.id || ""}
//             disabled
//           />
//         </div>
//         <div className="form-group">
//           <label>Độ cao (Z)</label>
//           <input
//             type="number"
//             name="elevation"
//             value={formData.elevation ?? ""}
//             onChange={handleChange}
//             placeholder={
//               placeholders.elevation || "Chiều cao so với mặt sàn (mm)"
//             }
//           />
//         </div>

//         {objectSample.type === "point" && renderFieldsForPoint()}
//         {objectSample.type === "path" && renderFieldsForPath()}
//       </div>
//       <div className="editor-footer">
//         <button onClick={handleSave}>Lưu</button>
//         <button onClick={onClose}>Hủy</button>
//       </div>
//     </div>
//   );
// };

// export default PropertyEditor;

// src/PropertyEditor.js
import React, { useState, useEffect } from "react";
import "./PropertyEditor.css";

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
  // <-- KHÔI PHỤC LẠI: State để quản lý tọa độ trong ô input (tính bằng mét)
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

      // <-- KHÔI PHỤC LẠI: Tính toán và hiển thị tọa độ (mét) khi chọn 1 điểm
      if (selection.type === "point") {
        const pixelsPerMeter = mapConfig?.pixelsPerMeter || 1;
        setCoordsInMeters({
          x: (selection.x / pixelsPerMeter).toFixed(3),
          y: (selection.y / pixelsPerMeter).toFixed(3),
        });
      }
    }
  }, [selection, mapConfig]); // Thêm mapConfig vào dependency

  if (!selection) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === "checkbox" ? checked : value;
    if (placeholders[name]) {
      setPlaceholders((prev) => ({ ...prev, [name]: "" }));
    }
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  // <-- KHÔI PHỤC LẠI: Hàm xử lý khi thay đổi tọa độ trong ô input
  const handleCoordsChange = (e) => {
    const { name, value } = e.target;
    setCoordsInMeters((prev) => ({ ...prev, [name]: value }));
  };

  // THAY THẾ TOÀN BỘ HÀM NÀY
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

      // Logic chuyển đổi tọa độ (không đổi)
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

      {/* <-- KHÔI PHỤC LẠI: Giao diện input để sửa tọa độ --> */}
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

  // THAY THẾ TOÀN BỘ HÀM NÀY
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

        {/* --- THÊM Ô INPUT MỚI CHO ĐỘ DỐC --- */}
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
