// src/Map2DViewer.js

import React from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import "./Map2DViewer.css";

const Map2DViewer = ({ src }) => {
  if (!src) {
    return (
      <div className="map2d-placeholder">
        <p>Vui lòng chọn file PNG cho bản đồ 2D</p>
      </div>
    );
  }

  return (
    <TransformWrapper
      initialScale={1}
      minScale={0.1}
      maxScale={20} // Tăng giới hạn phóng to
      limitToBounds={false}
      centerZoomedOut={false}
      // --- CÁC TINH CHỈNH ĐỂ MƯỢT HƠN ---
      panning={{
        velocityDisabled: true, // Tắt hiệu ứng 'trượt' sau khi kéo thả, cho cảm giác bám dính hơn.
      }}
      wheel={{
        step: 0.5, // Tăng độ nhạy khi lăn chuột (số càng lớn zoom càng nhanh).
        animationTime: 100, // Giảm thời gian hoạt ảnh zoom xuống 100ms cho cảm giác nhanh hơn.
      }}
      doubleClick={{
        step: 1, // Tăng bước nhảy khi double click.
        animationTime: 100, // Giảm thời gian hoạt ảnh.
      }}
    >
      {({ zoomIn, zoomOut, resetTransform }) => (
        <>
          <div className="tools">
            <button onClick={() => zoomIn(0.5)}>+ </button>
            <button onClick={() => zoomOut(0.5)}>-</button>
            <button onClick={() => resetTransform()}>×</button>
          </div>

          <TransformComponent
            wrapperStyle={{ width: "100%", height: "100%" }}
            contentStyle={{ width: "100%", height: "100%" }}
          >
            <img src={src} alt="2D Map" className="map2d-pannable-image" />
          </TransformComponent>
        </>
      )}
    </TransformWrapper>
  );
};

export default Map2DViewer;
