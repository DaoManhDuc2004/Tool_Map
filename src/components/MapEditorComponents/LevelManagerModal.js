// src/components/LevelManagerModal.js

import React, { useState, useEffect, useRef } from "react";

import "../../CSS/LevelManagerModal.css";

const LevelManagerModal = ({ isOpen, onClose, levels, onLevelsChange }) => {
  // Tạo một bản sao của danh sách các tầng để chỉnh sửa,
  // tránh thay đổi trực tiếp state của App.js
  const [editableLevels, setEditableLevels] = useState([]);
  const fileInputRefs = useRef({});

  useEffect(() => {
    // Khi modal mở, sao chép props 'levels' vào state nội bộ
    if (isOpen) {
      setEditableLevels(JSON.parse(JSON.stringify(levels)));
    }
  }, [isOpen, levels]);

  if (!isOpen) {
    return null;
  }

  // Xử lý thay đổi tên tầng
  const handleNameChange = (levelId, newName) => {
    setEditableLevels((prevLevels) =>
      prevLevels.map((level) =>
        level.levelId === levelId ? { ...level, name: newName } : level
      )
    );
  };

  // Xử lý khi người dùng chọn file ảnh mới
  const handleImageFileChange = (e, levelId) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditableLevels((prevLevels) =>
          prevLevels.map((level) =>
            level.levelId === levelId
              ? { ...level, backgroundImage: event.target.result }
              : level
          )
        );
      };
      reader.readAsDataURL(file);
    }
  };

  // Kích hoạt input file ẩn khi nhấn nút "Thay đổi ảnh"
  const triggerImageInput = (levelId) => {
    fileInputRefs.current[levelId].click();
  };

  // Xử lý xóa một tầng
  const handleDeleteLevel = (levelId) => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa tầng này không? Mọi đối tượng trên tầng này cũng sẽ bị xóa."
      )
    ) {
      // Lọc bỏ tầng cần xóa khỏi danh sách
      const updatedLevels = editableLevels.filter(
        (level) => level.levelId !== levelId
      );
      setEditableLevels(updatedLevels);
    }
  };

  // Xử lý thêm tầng mới
  const handleAddLevel = () => {
    const newLevelId = `L${Date.now()}`;
    const newLevel = {
      levelId: newLevelId,
      name: `Tầng Mới ${editableLevels.length + 1}`,
      order: editableLevels.length + 1,
      backgroundImage: null,
    };
    setEditableLevels([...editableLevels, newLevel]);
  };

  // Xử lý khi nhấn nút "Lưu"
  const handleSave = () => {
    onLevelsChange(editableLevels); // Gửi danh sách tầng đã cập nhật về App.js
    onClose(); // Đóng modal
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content level-manager-modal">
        <h2>Quản lý Tầng</h2>

        <div className="level-list">
          {editableLevels.map((level, index) => (
            <div className="level-item" key={level.levelId}>
              <span className="level-order">{index + 1}.</span>
              <input
                type="text"
                className="level-name-input"
                value={level.name}
                onChange={(e) =>
                  handleNameChange(level.levelId, e.target.value)
                }
              />
              <div className="level-actions">
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  style={{ display: "none" }}
                  ref={(el) => (fileInputRefs.current[level.levelId] = el)}
                  onChange={(e) => handleImageFileChange(e, level.levelId)}
                />
                <button onClick={() => triggerImageInput(level.levelId)}>
                  {level.backgroundImage ? "Thay đổi ảnh" : "Thêm ảnh"}
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteLevel(level.levelId)}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="add-level-btn" onClick={handleAddLevel}>
          + Thêm tầng mới
        </button>

        <div className="modal-actions">
          <button onClick={handleSave}>Lưu và Đóng</button>
          <button onClick={onClose}>Hủy</button>
        </div>
      </div>
    </div>
  );
};

export default LevelManagerModal;
