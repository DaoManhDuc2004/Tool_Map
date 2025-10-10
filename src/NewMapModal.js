// src/NewMapModal.js

import React, { useState, useRef } from "react";
import "./NewMapModal.css";

const NewMapModal = ({ isOpen, onClose, onCreate }) => {
  const [mapType, setMapType] = useState("blank");
  const [backgroundImage, setBackgroundImage] = useState(null);

  // State được khởi tạo bằng chuỗi để sửa lỗi "số 0"
  const [config, setConfig] = useState({
    width: "100",
    height: "100",
    pixelsPerMeter: "20",
  });

  const fileInputRef = useRef(null);

  // *** ĐÃ XÓA HOÀN TOÀN useEffect TỰ ĐỘNG TÍNH TOÁN ***

  if (!isOpen) return null;

  // Cập nhật state dưới dạng chuỗi
  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBackgroundImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    // Chuyển đổi chuỗi thành số khi bấm "Tạo"
    const finalConfig = {
      width: parseFloat(config.width) || 0,
      height: parseFloat(config.height) || 0,
      pixelsPerMeter: parseFloat(config.pixelsPerMeter) || 0,
    };

    if (
      finalConfig.width <= 0 ||
      finalConfig.height <= 0 ||
      finalConfig.pixelsPerMeter <= 0
    ) {
      alert("Các giá trị phải lớn hơn 0.");
      return;
    }

    if (mapType === "blank" || (mapType === "image" && backgroundImage)) {
      onCreate(finalConfig, backgroundImage);
      resetState();
    } else {
      alert("Vui lòng chọn một file ảnh để tạo map.");
    }
  };

  const resetState = () => {
    setConfig({ width: "100", height: "100", pixelsPerMeter: "20" });
    setMapType("blank");
    setBackgroundImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Tạo Bản Đồ Mới</h2>
        <div className="map-type-selector">
          <label>
            <input
              type="radio"
              value="blank"
              checked={mapType === "blank"}
              onChange={() => setMapType("blank")}
            />
            Bản đồ trống
          </label>
          <label>
            <input
              type="radio"
              value="image"
              checked={mapType === "image"}
              onChange={() => setMapType("image")}
            />
            Từ ảnh nền
          </label>
        </div>

        {mapType === "image" && (
          <div className="form-group">
            <label>Tải ảnh nền (.png, .jpg)</label>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleImageChange}
              ref={fileInputRef}
            />
            {backgroundImage && (
              <img
                src={backgroundImage}
                alt="Preview"
                className="image-preview"
              />
            )}
          </div>
        )}

        <div className="form-group">
          <label>Chiều rộng thực tế (mét)</label>
          <input
            type="text"
            name="width"
            value={config.width}
            onChange={handleChange}
            // KHÔNG CÓ readOnly
          />
        </div>
        <div className="form-group">
          <label>Chiều cao thực tế (mét)</label>
          <input
            type="text"
            name="height"
            value={config.height}
            onChange={handleChange}
            // KHÔNG CÓ readOnly
          />
        </div>
        <div className="form-group">
          <label>Tỉ lệ hiển thị (Pixels per Meter)</label>
          <input
            type="text"
            name="pixelsPerMeter"
            value={config.pixelsPerMeter}
            onChange={handleChange}
            // KHÔNG CÓ readOnly
          />
        </div>

        <div className="modal-actions">
          <button onClick={handleSubmit}>Tạo</button>
          <button onClick={resetState}>Hủy</button>
        </div>
      </div>
    </div>
  );
};

export default NewMapModal;
