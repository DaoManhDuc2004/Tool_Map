// src/NewMapModal.js

import React, { useState } from "react";
import "./NewMapModal.css";

const NewMapModal = ({ isOpen, onClose, onCreate }) => {
  const [mapName, setMapName] = useState("New Map");
  const [width, setWidth] = useState(50);
  const [height, setHeight] = useState(50);
  const [originX, setOriginX] = useState(0);
  const [originY, setOriginY] = useState(0);

  if (!isOpen) {
    return null;
  }

  const handleCreate = () => {
    // Truyền dữ liệu về cho App.js
    onCreate({
      name: mapName,
      width,
      height,
      origin: { x: originX, y: originY },
    });
    onClose(); // Đóng modal sau khi tạo
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>New Map</h2>
        <div className="form-group">
          <label>Map name:</label>
          <input
            type="text"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Map width:</label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(parseFloat(e.target.value))}
          />{" "}
          m
        </div>
        <div className="form-group">
          <label>Map height:</label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(parseFloat(e.target.value))}
          />{" "}
          m
        </div>
        <div className="form-group">
          <label>X of map starting point coordinates:</label>
          <input
            type="number"
            value={originX}
            onChange={(e) => setOriginX(parseFloat(e.target.value))}
          />{" "}
          m
        </div>
        <div className="form-group">
          <label>Y of map starting point coordinates:</label>
          <input
            type="number"
            value={originY}
            onChange={(e) => setOriginY(parseFloat(e.target.value))}
          />{" "}
          m
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" disabled>
            Edit preset
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleCreate}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewMapModal;
