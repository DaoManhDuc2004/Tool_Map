import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Stage,
  Layer,
  Line,
  Image,
  Rect,
  Circle,
  Arrow,
  Path,
  Text,
} from "react-konva";
import "./MapEditor.css";

const useImage = (url) => {
  const [image, setImage] = useState(null);
  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }
    const imageObj = new window.Image();
    imageObj.src = url;
    imageObj.onload = () => {
      setImage(imageObj);
    };
  }, [url]);
  return image;
};

// THAY ĐỔI: Component nhận props đầy đủ từ App.js
const MapEditor = ({
  backgroundImage,
  onContentChange,
  mapConfig,
  objects,
  onObjectsChange,
  onEditObject,
  onDeleteObject,
  onSelectedIdChange,
  selectedId,
  stageRef,
}) => {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const image = useImage(backgroundImage);
  const PIXELS_PER_METER = 20;
  const contentWidth = image
    ? image.width
    : mapConfig
    ? mapConfig.width * PIXELS_PER_METER
    : 0;
  const contentHeight = image
    ? image.height
    : mapConfig
    ? mapConfig.height * PIXELS_PER_METER
    : 0;

  // THAY ĐỔI: Lấy dữ liệu từ props thay vì state nội bộ
  const { walls, zones, points, paths } = objects;

  // THAY ĐỔI: State cho việc chọn đối tượng và vẽ đường đi
  //const [selectedId, setSelectedId] = useState(null);
  const [pathStartPointId, setPathStartPointId] = useState(null);
  const [drawingPathPoints, setDrawingPathPoints] = useState([]);
  const [isStageDraggable, setIsStageDraggable] = useState(true);
  const [measurement, setMeasurement] = useState({ points: [], distance: 0 });
  const [crosshair, setCrosshair] = useState({ x: 0, y: 0, visible: false });

  // ... (Các hàm useEffect, resetStage không đổi)
  useEffect(() => {
    if (containerRef.current) {
      setSize({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
  }, []);

  const resetStage = (contentWidth, contentHeight) => {
    if (!containerRef.current || !contentWidth || !contentHeight) return;

    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;
    const padding = 0.9;
    const scaleX = (containerWidth / contentWidth) * padding;
    const scaleY = (containerHeight / contentHeight) * padding;
    const newScale = Math.min(scaleX, scaleY);
    const newX = (containerWidth - contentWidth * newScale) / 2;
    const newY = (containerHeight - contentHeight * newScale) / 2;

    setStage({
      scale: newScale,
      x: newX,
      y: newY,
    });
  };

  const [tool, setTool] = useState("select");
  const [isDrawing, setIsDrawing] = useState(false);

  // THAY ĐỔI: Bỏ các state [walls, setWalls], [zones, setZones], [points, setPoints]

  // THAY ĐỔI: Hàm helper để cập nhật state ở component cha (App.js)
  // const updateObjects = (key, value) => {
  //   onObjectsChange({ ...objects, [key]: value });
  //   onContentChange(); // Báo cho App là có thay đổi
  // };

  // Thêm useEffect này vào MapEditor.js
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Chỉ hoạt động khi có đối tượng được chọn :       || e.key === "Backspace"

      if (selectedId && e.key === "Delete") {
        e.preventDefault(); // Ngăn trình duyệt quay lại trang trước (với Backspace)
        onDeleteObject(selectedId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedId, onDeleteObject]); // Dependency để useEffect luôn có giá trị selectedId mới nhất

  const [stage, setStage] = useState({ scale: 1, x: 0, y: 0 });

  useEffect(() => {
    // THAY ĐỔI: Bỏ việc reset state ở đây vì App.js sẽ quản lý việc này
    const PIXELS_PER_METER = 20;
    if (image) {
      resetStage(image.width, image.height);
    } else if (mapConfig) {
      const contentWidth = mapConfig.width * PIXELS_PER_METER;
      const contentHeight = mapConfig.height * PIXELS_PER_METER;
      resetStage(contentWidth, contentHeight);
    }
    // eslint-disable-next-line
  }, [image, mapConfig, size]);

  // THAY ĐỔI: Khi đổi công cụ, reset các state liên quan
  useEffect(() => {
    onSelectedIdChange(null);
    setPathStartPointId(null);
    setDrawingPathPoints([]);
  }, [tool]);
  useEffect(() => {
    // Reset trạng thái đo khi chuyển công cụ
    if (tool !== "measure") {
      setMeasurement({ points: [], distance: 0 });
    }
  }, [tool]);

  const handleWheel = (e) => {
    // ... (Không đổi)
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const mousePointTo = {
      x: (stage.getPointerPosition().x - stage.x()) / oldScale,
      y: (stage.getPointerPosition().y - stage.y()) / oldScale,
    };
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setStage({
      scale: newScale,
      x: stage.getPointerPosition().x - mousePointTo.x * newScale,
      y: stage.getPointerPosition().y - mousePointTo.y * newScale,
    });
  };

  const handleStageDrag = (e) => {
    if (e.target !== e.target.getStage()) {
      return;
    }
    const stage = e.target;
    setStage({
      scale: stage.scaleX(), // Lấy tỷ lệ hiện tại
      x: stage.x(), // Cập nhật tọa độ x mới
      y: stage.y(), // Cập nhật tọa độ y mới
    });
  };

  // THAY ĐỔI: Hàm tìm đối tượng trong state tổng
  const findObjectById = (id) => {
    if (!id) return null;
    // Gộp tất cả các mảng đối tượng lại để tìm
    const all = [...walls, ...zones, ...points, ...paths];
    return all.find((obj) => obj.id === id);
  };

  const handleMouseDown = (e) => {
    const konvaStage = e.target.getStage(); // Lấy đối tượng stage trực tiếp từ sự kiện
    if (e.target !== konvaStage) {
      if (tool !== "measure") {
        return;
      }
    }

    const pos = konvaStage.getPointerPosition();
    const point = {
      x: (pos.x - konvaStage.x()) / konvaStage.scaleX(),
      y: (pos.y - konvaStage.y()) / konvaStage.scaleY(),
    };

    if (tool === "measure") {
      // Mỗi lần click sẽ là một lần đo mới
      const flippedPoint = { ...point, y: contentHeight - point.y };
      setMeasurement({ points: [flippedPoint, flippedPoint], distance: 0 });
      return; // Dừng lại để không chạy code vẽ ở dưới
    }
    if (e.target !== konvaStage) {
      return;
    }

    const drawingTools = ["draw_wall", "draw_rect", "draw_nogo", "draw_slow"];
    if (!drawingTools.includes(tool)) return;

    // === BẮT ĐẦU KIỂM TRA RANH GIỚI ===
    if (
      point.x < 0 ||
      point.x > contentWidth ||
      point.y < 0 ||
      point.y > contentHeight
    ) {
      alert("Không thể bắt đầu vẽ ở ngoài phạm vi bản đồ.");
      return; // Dừng lại, không cho vẽ
    }
    // === KẾT THÚC KIỂM TRA RANH GIỚI ===

    setIsDrawing(true);

    const id = `${tool}_${Date.now()}`;

    onObjectsChange((prev) => {
      if (tool === "draw_wall") {
        return {
          ...prev,
          walls: [
            ...prev.walls,
            { id, points: [point.x, point.y, point.x, point.y], type: "wall" },
          ],
        };
      }
      if (["draw_rect", "draw_nogo", "draw_slow"].includes(tool)) {
        const fillColors = {
          draw_rect: "rgba(100, 100, 255, 0.5)",
          draw_nogo: "rgba(255, 0, 0, 0.5)",
          draw_slow: "rgba(255, 255, 0, 0.5)",
        };
        return {
          ...prev,
          zones: [
            ...prev.zones,
            {
              id,
              x: point.x,
              y: point.y,
              width: 0,
              height: 0,
              fill: fillColors[tool],
              type: "zone",
            },
          ],
        };
      }
      return prev;
    });
    onContentChange();
  };

  // File: MapEditor.js

  const handleMouseMove = useCallback(
    (e) => {
      const konvaStage = e.target.getStage();
      const pos = konvaStage.getPointerPosition();
      if (tool === "place_point") {
        const mousePoint = {
          x: (pos.x - konvaStage.x()) / konvaStage.scaleX(),
          y: (pos.y - konvaStage.y()) / konvaStage.scaleY(),
        };
        // Cập nhật state của crosshair với tọa độ đã lật
        setCrosshair({
          x: mousePoint.x,
          y: contentHeight - mousePoint.y, // Tọa độ bottom-left
          visible: true,
        });
      } else if (crosshair.visible) {
        // Ẩn crosshair đi nếu chuyển sang công cụ khác
        setCrosshair({ ...crosshair, visible: false });
      }

      if (tool === "measure" && measurement.points.length > 0) {
        const mousePoint = {
          x: (pos.x - konvaStage.x()) / konvaStage.scaleX(),
          y: (pos.y - konvaStage.y()) / konvaStage.scaleY(),
        };

        // SỬA LẠI: Lật tọa độ Y của chuột
        const flippedMousePoint = {
          ...mousePoint,
          y: contentHeight - mousePoint.y,
        };

        const startPoint = measurement.points[0]; // Điểm này đã là hệ bottom-left

        // Tính khoảng cách trên hệ tọa độ MỚI (bottom-left)
        const dx = flippedMousePoint.x - startPoint.x;
        const dy = flippedMousePoint.y - startPoint.y; // Y đã được đồng bộ
        const distInPixels = Math.sqrt(dx * dx + dy * dy);

        const distInMeters = distInPixels / PIXELS_PER_METER;

        setMeasurement({
          points: [startPoint, flippedMousePoint], // Lưu 2 điểm đều là hệ bottom-left
          distance: distInMeters,
        });
        return;
      }

      // Logic vẽ tường, vùng... khi đang nhấn giữ chuột
      if (isDrawing) {
        const point = {
          x: (pos.x - konvaStage.x()) / konvaStage.scaleX(),
          y: (pos.y - konvaStage.y()) / konvaStage.scaleY(),
        };

        // === BẮT ĐẦU LOGIC "KẸP" TỌA ĐỘ ===
        // Đảm bảo tọa độ x không vượt ra ngoài [0, contentWidth]
        point.x = Math.max(0, Math.min(point.x, contentWidth));
        // Đảm bảo tọa độ y không vượt ra ngoài [0, contentHeight]
        point.y = Math.max(0, Math.min(point.y, contentHeight));
        // === KẾT THÚC LOGIC "KẸP" TỌA ĐỘ ===

        onObjectsChange((prev) => {
          if (tool === "draw_wall" && prev.walls.length > 0) {
            let lastWall = { ...prev.walls[prev.walls.length - 1] };
            lastWall.points = [
              lastWall.points[0],
              lastWall.points[1],
              point.x,
              point.y,
            ];
            return { ...prev, walls: [...prev.walls.slice(0, -1), lastWall] };
          }
          if (
            ["draw_rect", "draw_nogo", "draw_slow"].includes(tool) &&
            prev.zones.length > 0
          ) {
            let lastZone = { ...prev.zones[prev.zones.length - 1] };
            lastZone.width = point.x - lastZone.x;
            lastZone.height = point.y - lastZone.y;
            return { ...prev, zones: [...prev.zones.slice(0, -1), lastZone] };
          }
          return prev;
        });
        onContentChange();
        return;
      }
    },
    [
      isDrawing,
      tool,
      points,
      contentWidth,
      contentHeight,
      onObjectsChange,
      onContentChange,
      measurement,
      crosshair,
    ]
  );
  const handleMouseUp = () => setIsDrawing(false);

  const handleObjectClick = (e, object) => {
    if (e.evt.button !== 0) {
      return;
    }
    e.cancelBubble = true;

    if (tool === "select") {
      onSelectedIdChange(object.id);
      return;
    }

    if (object.type === "point") {
      if (tool === "draw_path_straight") {
        if (!pathStartPointId) {
          setPathStartPointId(object.id);
        } else {
          const newPath = {
            id: `path_${pathStartPointId}_${object.id}_${Date.now()}`,
            from: pathStartPointId,
            to: object.id,
            type: "path",
            pathType: "straight",
            direction: "one-way",
          };
          // SỬA LẠI: Dùng functional update an toàn
          onObjectsChange((prev) => ({
            ...prev,
            paths: [...prev.paths, newPath],
          }));
          onContentChange();
          setPathStartPointId(null);
        }
      } else if (tool === "draw_path_curved") {
        if (drawingPathPoints[drawingPathPoints.length - 1]?.id !== object.id) {
          setDrawingPathPoints([...drawingPathPoints, object]);
        }
      }
    }
  };

  // Thay thế toàn bộ hàm này
  const handleStageRightClick = (e) => {
    e.evt.preventDefault();

    if (tool === "draw_path_curved" && drawingPathPoints.length >= 2) {
      const controlPoints = [];

      // Tạo điểm điều khiển mặc định cho mỗi đoạn
      for (let i = 0; i < drawingPathPoints.length - 1; i++) {
        const p1 = drawingPathPoints[i];
        const p2 = drawingPathPoints[i + 1];

        // --- LOGIC MỚI ĐỂ TẠO ĐỘ CONG MẶC ĐỊNH ---
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const perpX = -dy;
        const perpY = dx;
        const dist = Math.sqrt(perpX * perpX + perpY * perpY);

        let cpX = midX;
        let cpY = midY;

        if (dist !== 0) {
          const normPerpX = perpX / dist;
          const normPerpY = perpY / dist;
          const offsetAmount = 10; // Khoảng cách kéo, bạn có thể điều chỉnh
          cpX = midX + normPerpX * offsetAmount;
          cpY = midY + normPerpY * offsetAmount;
        }
        controlPoints.push({ x: cpX, y: cpY });
      }

      const newPath = {
        id: `path_curved_${Date.now()}`,
        type: "path",
        pathType: "curved",
        direction: "one-way",
        pointIds: drawingPathPoints.map((p) => p.id),
        controlPoints: controlPoints,
      };

      onObjectsChange((prevObjects) => ({
        ...prevObjects,
        paths: [...prevObjects.paths, newPath],
      }));
      onContentChange();
      setDrawingPathPoints([]);
    }
  };

  const handleControlPointDrag = (e, pathId, controlPointIndex) => {
    const newX = e.target.x();
    const newY = e.target.y();

    // SỬA LẠI: Lật tọa độ Y trước khi cập nhật state
    const flippedY = contentHeight - newY;

    onObjectsChange((prevObjects) => {
      const newPaths = prevObjects.paths.map((path) => {
        if (path.id === pathId) {
          const newControlPoints = [...path.controlPoints];
          // Lưu tọa độ đã được lật
          newControlPoints[controlPointIndex] = { x: newX, y: flippedY };
          return { ...path, controlPoints: newControlPoints };
        }
        return path;
      });
      return { ...prevObjects, paths: newPaths };
    });
    onContentChange();
  };

  // File: MapEditor.js

  const handleStageClick = (e) => {
    const konvaStage = e.target.getStage();
    if (e.target !== konvaStage) return;

    if (tool === "place_point") {
      const pos = konvaStage.getPointerPosition();
      const point = {
        x: (pos.x - konvaStage.x()) / konvaStage.scaleX(),
        y: (pos.y - konvaStage.y()) / konvaStage.scaleY(),
      };

      // Tọa độ cuối cùng giờ đây chính là tọa độ chuột
      const finalX = point.x;
      const finalY = point.y;

      const finalY_flipped = contentHeight - finalY;

      if (
        finalX < 0 ||
        finalX > contentWidth ||
        finalY_flipped < 0 ||
        finalY_flipped > contentHeight
      ) {
        alert("Không thể đặt điểm ở ngoài phạm vi bản đồ.");
        return;
      }

      const id = `point_${Date.now()}`;
      const newPoint = {
        id,
        x: finalX,
        y: finalY_flipped,
        elevation: 0,
        type: "point",
        nodeType: "running area",
        nodeName: `Point-${id.substring(6)}`,
      };

      onObjectsChange((prev) => ({
        ...prev,
        points: [...prev.points, newPoint],
      }));
      onContentChange();
    } else {
      onSelectedIdChange(null);
      setPathStartPointId(null);
    }
  };

  // THAY ĐỔI: Hàm kích hoạt Property Editor
  const handleEditClick = () => {
    const objectToEdit = findObjectById(selectedId);
    if (objectToEdit) {
      onEditObject(objectToEdit);
    }
  };

  // ... (Các hằng số stageWidth, stageHeight,... không đổi)
  const stageWidth = size.width;
  const stageHeight = size.height;

  return (
    <div className="editor-container">
      <div className="toolbar">
        <button
          title="Chọn & Di chuyển"
          className={tool === "select" ? "active" : ""}
          onClick={() => setTool("select")}
        >
          ⮝
        </button>
        <button
          title="Vẽ Vùng (Hình chữ nhật)"
          className={tool === "draw_rect" ? "active" : ""}
          onClick={() => setTool("draw_rect")}
        >
          ⏹️ Vùng
        </button>
        <button
          title="Đặt Node"
          className={tool === "place_point" ? "active" : ""}
          onClick={() => setTool("place_point")}
        >
          🟦 Node
        </button>
        <span className="separator">|</span>
        <button
          title="Tạo Vùng Cấm"
          className={tool === "draw_nogo" ? "active" : ""}
          onClick={() => setTool("draw_nogo")}
        >
          🚫Vùng cấm
        </button>
        <button
          title="Tạo Vùng Giảm Tốc"
          className={tool === "draw_slow" ? "active" : ""}
          onClick={() => setTool("draw_slow")}
        >
          ⏬Vùng giảm tốc
        </button>
        <button
          title="Vẽ Đường thẳng (Click 2 điểm)"
          className={tool === "draw_path_straight" ? "active" : ""}
          onClick={() => setTool("draw_path_straight")}
        >
          ━ Thẳng
        </button>
        <button
          title="Vẽ Đường cong"
          className={tool === "draw_path_curved" ? "active" : ""}
          onClick={() => setTool("draw_path_curved")}
        >
          〜 Cong
        </button>
        <span className="separator">|</span>
        <button
          title="Chỉnh sửa Thuộc tính"
          onClick={handleEditClick}
          disabled={!selectedId}
        >
          📝 Chi tiết
        </button>
        <button
          title="Thước đo"
          className={tool === "measure" ? "active" : ""} // Thêm className để highlight khi được chọn
          onClick={() => setTool("measure")} // Thêm onClick
        >
          📏Thước đo
        </button>
        <button title="Bật/Tắt Lưới" disabled>
          🔳
        </button>
        <button
          title="Xóa đối tượng"
          onClick={() => onDeleteObject(selectedId)} // Gọi hàm từ props
          disabled={!selectedId} // Chỉ bật khi có đối tượng được chọn
        >
          🗑️
        </button>
      </div>

      <div className="konva-container" ref={containerRef}>
        <Stage
          width={stageWidth}
          height={stageHeight}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleStageClick}
          onContextMenu={handleStageRightClick}
          draggable={tool === "select" && isStageDraggable}
          scaleX={stage.scale}
          scaleY={stage.scale}
          x={stage.x}
          y={stage.y}
          ref={stageRef}
          onDragMove={handleStageDrag}
          onDragEnd={handleStageDrag}
        >
          <Layer>
            {mapConfig && !image && (
              <Rect
                x={0}
                y={0}
                width={contentWidth}
                height={contentHeight}
                fill="white"
                stroke="black"
                strokeWidth={1 / stage.scale}
                listening={false}
              />
            )}

            {image && <Image image={image} x={0} y={0} listening={false} />}

            {drawingPathPoints.length > 1 && (
              <Line
                points={drawingPathPoints.flatMap((p) => [
                  p.x,
                  contentHeight - p.y,
                ])}
                stroke="rgba(0, 0, 0, 0.5)"
                strokeWidth={3 / stage.scale}
                lineCap="round"
                lineJoin="round"
                tension={tool === "draw_path_curved" ? 0.8 : 0} // Sửa lại thành "draw_path_curved"
              />
            )}

            {paths.map((path) => {
              const isSelected = path.id === selectedId;

              if (path.pathType === "straight") {
                const fromPoint = points.find((p) => p.id === path.from);
                const toPoint = points.find((p) => p.id === path.to);
                if (!fromPoint || !toPoint) return null;

                const fromY = contentHeight - fromPoint.y;
                const toY = contentHeight - toPoint.y;

                const arrowLength = 20 / stage.scale; // Chiều dài của mũi tên
                const midX = (fromPoint.x + toPoint.x) / 2;
                const midY = (fromY + toY) / 2;

                const dx = toPoint.x - fromPoint.x;
                const dy = toY - fromY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Tránh chia cho 0 nếu 2 điểm trùng nhau
                if (dist === 0) return null;

                // Vector đơn vị (chỉ hướng)
                const ux = dx / dist;
                const uy = dy / dist;

                // Tọa độ bắt đầu và kết thúc của đoạn thẳng nhỏ làm mũi tên
                const arrowStartX = midX - ux * (arrowLength / 2);
                const arrowStartY = midY - uy * (arrowLength / 2);
                const arrowEndX = midX + ux * (arrowLength / 2);
                const arrowEndY = midY + uy * (arrowLength / 2);

                return (
                  <React.Fragment key={path.id}>
                    {/* Logic sẽ kiểm tra hướng đi TRƯỚC KHI vẽ */}
                    {path.direction === "one-way" ? (
                      // --- PHẦN NÀY ĐƯỢC GIỮ NGUYÊN ---
                      <>
                        <Line
                          points={[fromPoint.x, fromY, toPoint.x, toY]}
                          stroke={isSelected ? "#00e6e6" : "red"}
                          strokeWidth={3 / stage.scale}
                          hitStrokeWidth={15 / stage.scale}
                          onClick={(e) => handleObjectClick(e, path)}
                        />
                        <Arrow
                          points={[
                            arrowStartX,
                            arrowStartY,
                            arrowEndX,
                            arrowEndY,
                          ]}
                          fill={isSelected ? "#00e6e6" : "red"}
                          strokeWidth={0}
                          pointerLength={15 / stage.scale}
                          pointerWidth={15 / stage.scale}
                          listening={false}
                        />
                      </>
                    ) : (
                      // --- PHẦN NÀY ĐÃ ĐƯỢC CẬP NHẬT LOGIC MỚI ---
                      // Vẽ 2 đường song song và biểu tượng mũi tên ở giữa
                      <>
                        {(() => {
                          // --- Phần 1: Thông số cho 2 đường thẳng song song ---
                          const lineOffset = 4 / stage.scale; // Khoảng cách giữa 2 đường
                          const perpX = -uy;
                          const perpY = ux;
                          const offsetX = perpX * lineOffset;
                          const offsetY = perpY * lineOffset;

                          // --- Phần 2: Thông số cho biểu tượng mũi tên ở giữa ---
                          const arrowLength = 15 / stage.scale; // Chiều dài mỗi mũi tên nhỏ
                          const arrowOffset = 4 / stage.scale; // Khoảng cách lệch của 2 mũi tên nhỏ

                          // Vị trí tâm của mũi tên nhỏ thứ nhất
                          const mid1X = midX + perpX * arrowOffset;
                          const mid1Y = midY + perpY * arrowOffset;

                          // Vị trí tâm của mũi tên nhỏ thứ hai
                          const mid2X = midX - perpX * arrowOffset;
                          const mid2Y = midY - perpY * arrowOffset;

                          return (
                            <React.Fragment>
                              {/* Vẽ 2 ĐƯỜNG THẲNG song song (không có đầu mũi tên) */}
                              <Line
                                points={[
                                  fromPoint.x + offsetX,
                                  fromY + offsetY,
                                  toPoint.x + offsetX,
                                  toY + offsetY,
                                ]}
                                stroke={isSelected ? "#00e6e6" : "red"}
                                strokeWidth={2 / stage.scale}
                                hitStrokeWidth={15 / stage.scale}
                                onClick={(e) => handleObjectClick(e, path)}
                              />
                              <Line
                                points={[
                                  fromPoint.x - offsetX,
                                  fromY - offsetY,
                                  toPoint.x - offsetX,
                                  toY - offsetY,
                                ]}
                                stroke={isSelected ? "#00e6e6" : "red"}
                                hitStrokeWidth={15 / stage.scale}
                                strokeWidth={2 / stage.scale}
                                listening={false}
                              />

                              {/* Vẽ BIỂU TƯỢNG mũi tên ở giữa */}
                              <Arrow
                                points={[
                                  mid1X - ux * (arrowLength / 2),
                                  mid1Y - uy * (arrowLength / 2),
                                  mid1X + ux * (arrowLength / 2),
                                  mid1Y + uy * (arrowLength / 2),
                                ]}
                                fill={isSelected ? "#00e6e6" : "red"}
                                strokeWidth={0}
                                pointerLength={10 / stage.scale}
                                pointerWidth={10 / stage.scale}
                                listening={false}
                              />
                              <Arrow
                                points={[
                                  mid2X + ux * (arrowLength / 2),
                                  mid2Y + uy * (arrowLength / 2),
                                  mid2X - ux * (arrowLength / 2),
                                  mid2Y - uy * (arrowLength / 2),
                                ]}
                                fill={isSelected ? "#00e6e6" : "red"}
                                strokeWidth={0}
                                pointerLength={10 / stage.scale}
                                pointerWidth={10 / stage.scale}
                                listening={false}
                              />
                            </React.Fragment>
                          );
                        })()}
                      </>
                    )}
                  </React.Fragment>
                );
              }

              // File: MapEditor.js (bên trong return, trong paths.map)

              if (path.pathType === "curved") {
                const pathNodes = path.pointIds
                  .map((id) => points.find((p) => p.id === id))
                  .filter(Boolean);
                if (pathNodes.length < 2) return null;

                const flippedPathNodes = pathNodes.map((p) => ({
                  ...p,
                  y: contentHeight - p.y,
                }));
                const flippedControlPoints = path.controlPoints.map((cp) => ({
                  ...cp,
                  y: contentHeight - cp.y,
                }));

                let svgPathData = `M ${flippedPathNodes[0].x} ${flippedPathNodes[0].y}`;
                for (let i = 0; i < flippedPathNodes.length - 1; i++) {
                  const controlPoint = flippedControlPoints[i];
                  const endPoint = flippedPathNodes[i + 1];
                  if (controlPoint && endPoint) {
                    svgPathData += ` Q ${controlPoint.x} ${controlPoint.y} ${endPoint.x} ${endPoint.y}`;
                  }
                }

                return (
                  <React.Fragment key={path.id}>
                    <Path
                      data={svgPathData}
                      stroke={isSelected ? "#00e6e6" : "red"}
                      strokeWidth={3 / stage.scale}
                      hitStrokeWidth={15 / stage.scale}
                      onClick={(e) => handleObjectClick(e, path)}
                    />

                    {/* SỬA LẠI: Dùng flippedControlPoints để vẽ Circle */}
                    {isSelected &&
                      flippedControlPoints.map((cp, index) => (
                        <Circle
                          key={`cp_${path.id}_${index}`}
                          x={cp.x}
                          y={cp.y} // Dùng tọa độ y đã lật để hiển thị
                          radius={6 / stage.scale}
                          fill="#FFF"
                          stroke="#007bff"
                          strokeWidth={2 / stage.scale}
                          draggable
                          onDragMove={(e) =>
                            handleControlPointDrag(e, path.id, index)
                          }
                          onDragStart={() => setIsStageDraggable(false)}
                          onDragEnd={() => setIsStageDraggable(true)}
                        />
                      ))}

                    {(() => {
                      // SỬA LẠI: Dùng các điểm đã lật để tính toán hướng mũi tên
                      const startPoint = flippedPathNodes[0];
                      const endPoint =
                        flippedPathNodes[flippedPathNodes.length - 1];
                      const firstControlPoint = flippedControlPoints[0];
                      const lastControlPoint =
                        flippedControlPoints[flippedControlPoints.length - 1];

                      if (
                        !startPoint ||
                        !endPoint ||
                        !firstControlPoint ||
                        !lastControlPoint
                      ) {
                        return null;
                      }

                      if (path.direction === "one-way") {
                        const dx = endPoint.x - lastControlPoint.x;
                        const dy = endPoint.y - lastControlPoint.y; // Tính dy trên hệ tọa độ hiển thị
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist === 0) return null;
                        const ux = dx / dist;
                        const uy = dy / dist;

                        return (
                          <Arrow
                            points={[
                              endPoint.x - ux * 20,
                              endPoint.y - uy * 20,
                              endPoint.x,
                              endPoint.y,
                            ]}
                            fill={isSelected ? "#00e6e6" : "red"}
                            stroke={isSelected ? "#00e6e6" : "red"}
                            strokeWidth={0}
                            pointerLength={15 / stage.scale}
                            pointerWidth={15 / stage.scale}
                            listening={false}
                          />
                        );
                      } else {
                        const dx_end = endPoint.x - lastControlPoint.x;
                        const dy_end = endPoint.y - lastControlPoint.y;
                        const dist_end = Math.sqrt(
                          dx_end * dx_end + dy_end * dy_end
                        );
                        const ux_end = dist_end === 0 ? 0 : dx_end / dist_end;
                        const uy_end = dist_end === 0 ? 0 : dy_end / dist_end;

                        const dx_start = firstControlPoint.x - startPoint.x;
                        const dy_start = firstControlPoint.y - startPoint.y;
                        const dist_start = Math.sqrt(
                          dx_start * dx_start + dy_start * dy_start
                        );
                        const ux_start =
                          dist_start === 0 ? 0 : dx_start / dist_start;
                        const uy_start =
                          dist_start === 0 ? 0 : dy_start / dist_start;

                        return (
                          <>
                            <Arrow
                              points={[
                                endPoint.x - ux_end * 20,
                                endPoint.y - uy_end * 20,
                                endPoint.x,
                                endPoint.y,
                              ]}
                              fill={isSelected ? "#00e6e6" : "red"}
                              stroke={isSelected ? "#00e6e6" : "red"}
                              strokeWidth={0}
                              pointerLength={15 / stage.scale}
                              pointerWidth={15 / stage.scale}
                              listening={false}
                            />
                            <Arrow
                              points={[
                                startPoint.x + ux_start * 20,
                                startPoint.y + uy_start * 20,
                                startPoint.x,
                                startPoint.y,
                              ]}
                              fill={isSelected ? "#00e6e6" : "red"}
                              stroke={isSelected ? "#00e6e6" : "red"}
                              strokeWidth={0}
                              pointerLength={15 / stage.scale}
                              pointerWidth={15 / stage.scale}
                              listening={false}
                            />
                          </>
                        );
                      }
                    })()}
                  </React.Fragment>
                );
              }
            })}

            {zones.map((zone) => {
              const isSelected = zone.id === selectedId;
              return (
                <Rect
                  key={zone.id}
                  x={zone.x}
                  y={contentHeight - zone.y - zone.height} // Lật lại tọa độ y
                  width={zone.width}
                  height={zone.height}
                  fill={zone.fill}
                  stroke={isSelected ? "#00e6e6" : "white"}
                  strokeWidth={isSelected ? 3 / stage.scale : 1 / stage.scale}
                  onClick={(e) => handleObjectClick(e, zone)}
                />
              );
            })}

            {points.map((point) => {
              const isSelected = point.id === selectedId;
              const isStartPoint = point.id === pathStartPointId;
              const isInDrawingPath = drawingPathPoints.some(
                (p) => p.id === point.id
              );
              let fillColor = "#007bff"; // Màu mặc định (running area)

              if (isStartPoint || isInDrawingPath) {
                // Ưu tiên màu cam khi đang vẽ
                fillColor = "#ff7f50";
              } else if (point.nodeType === "charging point") {
                // Nếu là trạm sạc, dùng màu xanh lá
                fillColor = "#28a745"; // 🟢
              } else {
                // Mặc định là màu xanh dương
                fillColor = "#007bff"; // 🔵
              }
              const visualSize = 20 / stage.scale; // Tính kích thước hiển thị động

              return (
                <Rect
                  key={point.id}
                  // Tính toán lại tọa độ top-left để hình vuông luôn ở tâm
                  x={point.x - visualSize / 2}
                  y={contentHeight - point.y - visualSize / 2}
                  width={visualSize} // Dùng kích thước hiển thị động
                  height={visualSize} // Dùng kích thước hiển thị động
                  fill={fillColor}
                  stroke={isSelected ? "#00e6e6" : "white"}
                  strokeWidth={isSelected ? 2 / stage.scale : 1 / stage.scale}
                  onClick={(e) => handleObjectClick(e, point)}
                />
              );
            })}
            {tool === "measure" && measurement.points.length > 1 && (
              <React.Fragment>
                {/* Vẽ đường kẻ */}
                <Line
                  points={measurement.points.flatMap((p) => [
                    p.x,
                    contentHeight - p.y,
                  ])}
                  stroke="#4B0082" // Màu xanh dương sáng
                  strokeWidth={2 / stage.scale}
                  dash={[5, 5]} // Kiểu đứt nét
                  listening={false}
                />
                {/* Vẽ điểm bắt đầu */}
                <Circle
                  x={measurement.points[0].x}
                  y={contentHeight - measurement.points[0].y} // Lật y
                  radius={4 / stage.scale}
                  fill="#ff6f00"
                  listening={false}
                />
                {/* Hiển thị text khoảng cách */}
                {measurement.distance > 0 && (
                  <Text
                    x={measurement.points[1].x + 10 / stage.scale} // Lệch 1 chút so với con trỏ
                    y={
                      contentHeight - measurement.points[1].y + 10 / stage.scale
                    } // Lật y
                    text={`${measurement.distance.toFixed(2)} m`} // Hiển thị mét, 2 chữ số thập phân
                    fontSize={14 / stage.scale}
                    fill="#20232a"
                    padding={4 / stage.scale}
                    background="#333333" // Nền cùng màu với đường kẻ
                    cornerRadius={4 / stage.scale}
                    listening={false}
                  />
                )}
              </React.Fragment>
            )}
            {tool === "place_point" && crosshair.visible && (
              <React.Fragment>
                {/* Vẽ đường dọc của dấu cộng */}
                <Line
                  points={[crosshair.x, 0, crosshair.x, contentHeight]}
                  stroke="rgba(255, 111, 0, 0.5)" // Màu cam mờ
                  strokeWidth={3 / stage.scale}
                  listening={false}
                />
                {/* Vẽ đường ngang của dấu cộng */}
                <Line
                  points={[
                    0,
                    contentHeight - crosshair.y,
                    contentWidth,
                    contentHeight - crosshair.y,
                  ]}
                  stroke="rgba(255, 111, 0, 0.5)" // Màu cam mờ
                  strokeWidth={3 / stage.scale}
                  listening={false}
                />
                {/* Hiển thị ô tọa độ */}
                <Text
                  x={crosshair.x + 15 / stage.scale} // Lệch 1 chút so với con trỏ
                  y={contentHeight - crosshair.y + 15 / stage.scale}
                  text={`X: ${Math.round(crosshair.x)}\nY: ${Math.round(
                    crosshair.y
                  )}`} // Hiển thị tọa độ X, Y đã lật
                  fontSize={20 / stage.scale}
                  fill="#20232a"
                  padding={10 / stage.scale}
                  background="rgba(255, 111, 0, 0.8)" // Nền màu cam đậm hơn
                  cornerRadius={4 / stage.scale}
                  listening={false}
                />
              </React.Fragment>
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default MapEditor;
