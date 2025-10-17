import React, { useState, useEffect, useRef, useCallback } from "react";
import { Stage, Layer, Image, Rect, Group } from "react-konva";
import "./CSS/MapEditor.css";

import PointLayer from "./components/MapEditorComponents/PointLayer";
import PathLayer from "./components/MapEditorComponents/PathLayer";
import ZoneLayer from "./components/MapEditorComponents/ZoneLayer";
import MeasurementLayer from "./components/MapEditorComponents/MeasurementLayer";
import Crosshair from "./components/MapEditorComponents/Crosshair";
import PointMenu from "./components/Menu/PointMenu";
import AreaContextMenu from "./components/Menu/AreaContextMenu";
import HoverTooltip from "./components/MapEditorComponents/HoverTooltip";

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
  onStageClick,
  stageRef,
  onDeletePointsInSelection,
  onDeletePathsInSelection,
  currentLevelId,
}) => {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const image = useImage(backgroundImage);

  // Luôn đảm bảo mapConfig không phải là null trước khi truy cập
  const pixelsPerMeter = mapConfig?.pixelsPerMeter || 20;

  // Tính toán chiều rộng và chiều cao của nội dung map
  const contentWidth = mapConfig
    ? mapConfig.width * pixelsPerMeter
    : image
    ? image.width
    : 0;

  const contentHeight = mapConfig
    ? mapConfig.height * pixelsPerMeter
    : image
    ? image.height
    : 0;

  const { walls, zones, points, paths } = objects;

  const [pathStartPointId, setPathStartPointId] = useState(null);
  const [drawingPathPoints, setDrawingPathPoints] = useState([]);
  const [isStageDraggable, setIsStageDraggable] = useState(true);
  const [measurement, setMeasurement] = useState({ points: [], distance: 0 });
  const [crosshair, setCrosshair] = useState({ x: 0, y: 0, visible: false });
  const [movingPointId, setMovingPointId] = useState(null); // ID của điểm đang di chuyển
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    pointId: null,
  });
  const [selectionRect, setSelectionRect] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
  });
  const [selectedObjectIds, setSelectedObjectIds] = useState([]);
  const [areaContextMenu, setAreaContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  const [isMovingSelection, setIsMovingSelection] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [hoverTooltip, setHoverTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });

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

  useEffect(() => {
    const handleKeyDown = (e) => {
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

  // MapEditor.js

  useEffect(() => {
    if (contentWidth > 0 && contentHeight > 0) {
      resetStage(contentWidth, contentHeight);
    }
  }, [contentWidth, contentHeight, size]);

  useEffect(() => {
    onSelectedIdChange(null);
    setPathStartPointId(null);
    setDrawingPathPoints([]);
  }, [tool]);
  useEffect(() => {
    if (tool !== "measure") {
      setMeasurement({ points: [], distance: 0 });
    }
  }, [tool]);

  const handleWheel = (e) => {
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
    const stageNode = e.target;
    if (stageNode !== stageNode.getStage()) {
      return;
    }

    const scale = stageNode.scaleX();
    let newX = stageNode.x();
    let newY = stageNode.y();

    const stageWidth = size.width;
    const stageHeight = size.height;
    const padding = 50;
    const maxX = padding;
    const minX = stageWidth - contentWidth * scale - padding;
    const maxY = padding;
    const minY = stageHeight - contentHeight * scale - padding;

    if (contentWidth * scale > stageWidth) {
      newX = Math.max(minX, Math.min(newX, maxX));
    }
    if (contentHeight * scale > stageHeight) {
      newY = Math.max(minY, Math.min(newY, maxY));
    }

    setStage({
      scale: scale,
      x: newX,
      y: newY,
    });
  };

  const findObjectById = (id) => {
    if (!id) return null;
    const all = [...walls, ...zones, ...points, ...paths];
    return all.find((obj) => obj.id === id);
  };
  const isPointInRect = (point, rect) => {
    const pointYTopLeft = contentHeight - point.y;
    const rX1 = Math.min(rect.x, rect.x + rect.width);
    const rX2 = Math.max(rect.x, rect.x + rect.width);
    const rY1 = Math.min(rect.y, rect.y + rect.height);
    const rY2 = Math.max(rect.y, rect.y + rect.height);

    return (
      point.x >= rX1 &&
      point.x <= rX2 &&
      pointYTopLeft >= rY1 &&
      pointYTopLeft <= rY2
    );
  };

  const handleMouseDown = (e) => {
    const konvaStage = e.target.getStage();
    const pos = konvaStage.getPointerPosition();
    const point = {
      x: (pos.x - konvaStage.x()) / konvaStage.scaleX(),
      y: (pos.y - konvaStage.y()) / konvaStage.scaleY(),
    };

    if (e.target !== konvaStage) {
      if (tool !== "measure") {
        return;
      }
    }

    if (tool === "area_select") {
      if (
        selectionRect.visible &&
        isPointInRect({ x: point.x, y: contentHeight - point.y }, selectionRect)
      ) {
        setIsMovingSelection(true);
        setDragStartPos(point);
      } else {
        setIsDrawing(true);
        setSelectionRect({
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
          visible: true,
        });
        setSelectedObjectIds([]);
      }
      return;
    }

    if (tool === "measure") {
      const flippedPoint = { ...point, y: contentHeight - point.y };
      setMeasurement({ points: [flippedPoint, flippedPoint], distance: 0 });
      return;
    }
    if (e.target !== konvaStage) {
      return;
    }

    const drawingTools = ["draw_wall", "draw_rect", "draw_nogo", "draw_slow"];
    if (!drawingTools.includes(tool)) return;
    if (
      point.x < 0 ||
      point.x > contentWidth ||
      point.y < 0 ||
      point.y > contentHeight
    ) {
      alert("Không thể bắt đầu vẽ ở ngoài phạm vi bản đồ.");
      return;
    }
    setIsDrawing(true);
    const id = `${tool}_${Date.now()}`;
    const flippedY = contentHeight - point.y;

    onObjectsChange((prev) => {
      if (tool === "draw_wall") {
        return {
          ...prev,
          walls: [
            ...prev.walls,
            { id, points: [point.x, point.y, point.x, flippedY], type: "wall" },
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
              y: flippedY,
              width: 0,
              height: 0,
              fill: fillColors[tool],
              type: "zone",
              levelId: currentLevelId,
            },
          ],
        };
      }
      return prev;
    });
    onContentChange();
  };

  const handlePointMouseOver = (e, point) => {
    const pos = e.target.getStage().getPointerPosition();
    const x_m = (point.x / pixelsPerMeter).toFixed(2);
    const y_m = (point.y / pixelsPerMeter).toFixed(2);

    setHoverTooltip({
      visible: true,
      x: pos.x,
      y: pos.y,
      content: {
        id: point.id,
        nodeName: point.nodeName,
        x_m: x_m,
        y_m: y_m,
      },
    });
  };

  const handlePointMouseOut = () => {
    setHoverTooltip({ visible: false, x: 0, y: 0, content: null });
  };

  const handleMouseMove = useCallback(
    (e) => {
      const konvaStage = e.target.getStage();
      const pos = konvaStage.getPointerPosition();
      const point = {
        x: (pos.x - konvaStage.x()) / konvaStage.scaleX(),
        y: (pos.y - konvaStage.y()) / konvaStage.scaleY(),
      };
      if (movingPointId) {
        const finalX = Math.max(0, Math.min(point.x, contentWidth));
        const finalY = Math.max(0, Math.min(point.y, contentHeight));
        const finalY_flipped = contentHeight - finalY;
        setCrosshair({
          x: finalX,
          y: finalY_flipped,
          visible: true,
        });
        onObjectsChange((prev) => ({
          ...prev,
          points: prev.points.map((p) =>
            p.id === movingPointId ? { ...p, x: finalX, y: finalY_flipped } : p
          ),
        }));
        onContentChange();
        return;
      }

      if (isMovingSelection) {
        const dx = point.x - dragStartPos.x;
        const dy = point.y - dragStartPos.y;
        setSelectionRect((prev) => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
        }));

        onObjectsChange((prev) => {
          const newObjects = JSON.parse(JSON.stringify(prev));

          selectedObjectIds.forEach((id) => {
            const pIndex = newObjects.points.findIndex((p) => p.id === id);
            if (pIndex !== -1) {
              newObjects.points[pIndex].x += dx;
              newObjects.points[pIndex].y -= dy;
            }
            const pathIndex = newObjects.paths.findIndex((p) => p.id === id);
            if (pathIndex !== -1 && newObjects.paths[pathIndex].controlPoints) {
              newObjects.paths[pathIndex].controlPoints.forEach((cp) => {
                cp.x += dx;
                cp.y -= dy;
              });
            }
          });
          return newObjects;
        });

        setDragStartPos(point); // Cập nhật vị trí bắt đầu cho lần di chuyển tiếp theo
        onContentChange();
        return;
      }

      if (isDrawing && tool === "area_select") {
        setSelectionRect((prev) => ({
          ...prev,
          width: point.x - prev.x,
          height: point.y - prev.y,
        }));
        return;
      }
      if (tool === "place_point") {
        const mousePoint = {
          x: (pos.x - konvaStage.x()) / konvaStage.scaleX(),
          y: (pos.y - konvaStage.y()) / konvaStage.scaleY(),
        };

        setCrosshair({
          x: mousePoint.x,
          y: contentHeight - mousePoint.y,
          visible: true,
        });
      } else if (crosshair.visible) {
        setCrosshair({ ...crosshair, visible: false });
      }

      if (tool === "measure" && measurement.points.length > 0) {
        const mousePoint = {
          x: (pos.x - konvaStage.x()) / konvaStage.scaleX(),
          y: (pos.y - konvaStage.y()) / konvaStage.scaleY(),
        };
        const flippedMousePoint = {
          ...mousePoint,
          y: contentHeight - mousePoint.y,
        };

        const startPoint = measurement.points[0];
        const dx = flippedMousePoint.x - startPoint.x;
        const dy = flippedMousePoint.y - startPoint.y; // Y đã được đồng bộ
        const distInPixels = Math.sqrt(dx * dx + dy * dy);
        const distInMeters = distInPixels / pixelsPerMeter;

        setMeasurement({
          points: [startPoint, flippedMousePoint],
          distance: distInMeters,
        });
        return;
      }
      if (isDrawing) {
        let point = {
          x: (pos.x - konvaStage.x()) / konvaStage.scaleX(),
          y: (pos.y - konvaStage.y()) / konvaStage.scaleY(),
        };

        point.x = Math.max(0, Math.min(point.x, contentWidth));
        point.y = Math.max(0, Math.min(point.y, contentHeight));
        const flippedY = contentHeight - point.y;

        onObjectsChange((prev) => {
          if (tool === "draw_wall" && prev.walls.length > 0) {
            let lastWall = { ...prev.walls[prev.walls.length - 1] };
            lastWall.points = [
              lastWall.points[0],
              lastWall.points[1],
              point.x,
              flippedY, // Dùng flippedY
            ];
            return { ...prev, walls: [...prev.walls.slice(0, -1), lastWall] };
          }
          if (
            ["draw_rect", "draw_nogo", "draw_slow"].includes(tool) &&
            prev.zones.length > 0
          ) {
            let lastZone = { ...prev.zones[prev.zones.length - 1] };
            lastZone.width = point.x - lastZone.x;
            lastZone.height = lastZone.y - flippedY; // y_start(đã lật) - y_end(đã lật)
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
      movingPointId,
      pixelsPerMeter,
      isMovingSelection,
      dragStartPos,
    ]
  );

  const handleMouseUp = () => {
    if (isMovingSelection) {
      setIsMovingSelection(false);
    }

    if (isDrawing && tool === "area_select") {
      const ids = [];
      points.forEach((p) => {
        if (isPointInRect(p, selectionRect)) {
          ids.push(p.id);
        }
      });

      paths.forEach((path) => {
        const startPoint = points.find(
          (p) => p.id === (path.from || path.pointIds?.[0])
        );
        const endPoint = points.find(
          (p) => p.id === (path.to || path.pointIds?.[path.pointIds.length - 1])
        );

        if (
          startPoint &&
          endPoint &&
          isPointInRect(startPoint, selectionRect) &&
          isPointInRect(endPoint, selectionRect)
        ) {
          ids.push(path.id);
        }
      });

      setSelectedObjectIds(ids);
    }

    if (movingPointId) {
      setMovingPointId(null);
      setCrosshair({ ...crosshair, visible: false });
    }
    setIsDrawing(false);
  };

  const handleObjectClick = (e, object) => {
    if (e.evt.button !== 0) {
      return;
    }
    e.cancelBubble = true;

    if (tool === "measure") {
      const snappedPoint = { x: object.x, y: object.y };
      if (measurement.points.length === 0) {
        setMeasurement({ points: [snappedPoint, snappedPoint], distance: 0 });
      } else {
        const startPoint = measurement.points[0];
        const dx = snappedPoint.x - startPoint.x;
        const dy = snappedPoint.y - startPoint.y;
        const distInPixels = Math.sqrt(dx * dx + dy * dy);
        const distInMeters = distInPixels / pixelsPerMeter;

        setMeasurement({
          points: [startPoint, snappedPoint],
          distance: distInMeters,
        });
      }
      return;
    }

    if (tool === "select") {
      onSelectedIdChange(object.id);
      onEditObject(object);
      return;
    }
    if (object.type === "point") {
      if (tool === "draw_path_straight" || tool === "draw_path_curved") {
        if (!pathStartPointId) {
          setPathStartPointId(object.id);
        } else {
          const startPoint = findObjectById(pathStartPointId);
          const endPoint = object;

          if (!startPoint || startPoint.id === endPoint.id) {
            setPathStartPointId(null);
            return;
          }

          if (tool === "draw_path_straight") {
            const existingPath = paths.find((p) => {
              const pStart = p.from || p.pointIds?.[0];
              const pEnd = p.to || p.pointIds?.[p.pointIds.length - 1];
              return (
                (pStart === startPoint.id && pEnd === endPoint.id) ||
                (pStart === endPoint.id && pEnd === startPoint.id)
              );
            });

            if (existingPath) {
              if (existingPath.direction === "one-way") {
                onObjectsChange((prev) => ({
                  ...prev,
                  paths: prev.paths.map((p) =>
                    p.id === existingPath.id
                      ? { ...p, direction: "two-way" }
                      : p
                  ),
                }));
                onContentChange();
                alert("Đường đi đã được cập nhật thành hai chiều.");
              } else {
                alert("Đường đi hai chiều đã tồn tại giữa hai điểm này.");
              }
            } else {
              const newPath = {
                id: `path_${startPoint.id}_${endPoint.id}_${Date.now()}`,
                from: startPoint.id,
                to: endPoint.id,
                type: "path",
                pathType: "straight",
                direction: "one-way",
                slope: 0,
                levelId: currentLevelId,
              };
              onObjectsChange((prev) => ({
                ...prev,
                paths: [...prev.paths, newPath],
              }));
              onContentChange();
            }
          } else if (tool === "draw_path_curved") {
            // Chỉ tìm đường đi chính xác theo hướng đang vẽ (A -> B)
            const pathInSameDirectionExists = paths.some((p) => {
              const pStart = p.from || p.pointIds?.[0];
              const pEnd = p.to || p.pointIds?.[p.pointIds.length - 1];
              return pStart === startPoint.id && pEnd === endPoint.id;
            });

            // Nếu đã có đường cùng chiều thì chặn
            if (pathInSameDirectionExists) {
              alert("Đã tồn tại đường cong theo hướng này.");
              // Nếu chưa có thì tạo mới
            } else {
              // Logic tạo đường cong mặc định (giữ nguyên)
              const p1 = startPoint,
                p2 = endPoint;
              const midX = (p1.x + p2.x) / 2,
                midY = (p1.y + p2.y) / 2;
              const dx = p2.x - p1.x,
                dy = p2.y - p1.y;
              const perpX = -dy,
                perpY = dx;
              const dist = Math.sqrt(perpX * perpX + perpY * perpY);
              const offsetAmount = 30;
              let cpX = midX,
                cpY = midY;
              if (dist !== 0) {
                const normPerpX = perpX / dist,
                  normPerpY = perpY / dist;
                cpX = midX + normPerpX * offsetAmount;
                cpY = midY + normPerpY * offsetAmount;
              }
              const newPath = {
                id: `path_curved_${Date.now()}`,
                type: "path",
                pathType: "curved",
                direction: "one-way",
                pointIds: [p1.id, p2.id],
                controlPoints: [{ x: cpX, y: cpY }],
                slope: 0,
                levelId: currentLevelId,
              };
              onObjectsChange((prev) => ({
                ...prev,
                paths: [...prev.paths, newPath],
              }));
              onContentChange();
            }
          }
          setPathStartPointId(null);
        }
      }
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
    if (onStageClick) {
      onStageClick();
    }
    if (contextMenu.visible) {
      setContextMenu({ ...contextMenu, visible: false });
    }

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
        levelId: currentLevelId,
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

  const handleEditClick = () => {
    // Trường hợp 1: Sửa 1 đối tượng
    if (selectedId) {
      const objectToEdit = findObjectById(selectedId);
      if (objectToEdit) {
        onEditObject(objectToEdit); // Gửi đi 1 object
      }
      // Trường hợp 2: Sửa nhiều đối tượng
    } else if (selectedObjectIds.length > 0) {
      // Lấy tất cả object point từ danh sách ID
      const allPoints = selectedObjectIds
        .filter((id) => id.startsWith("point_"))
        .map((id) => findObjectById(id))
        .filter(Boolean);

      // Chỉ cho phép sửa hàng loạt nếu tất cả đều là point
      if (
        allPoints.length > 0 &&
        allPoints.length === selectedObjectIds.length
      ) {
        onEditObject(allPoints); // Gửi đi 1 mảng object
      } else {
        alert(
          "Chỉnh sửa hàng loạt chỉ hỗ trợ cho các đối tượng cùng loại (Node)."
        );
      }
    }
  };

  const handlePointContextMenu = (e, point) => {
    e.evt.preventDefault(); // Ngăn menu mặc định của trình duyệt

    // Chỉ hiện menu nếu điểm được chuột phải chính là điểm đang được chọn
    if (point.id !== selectedId) {
      return;
    }

    const pointNode = e.target;

    // Lấy tọa độ tuyệt đối của node đó trên Stage (đã tính cả pan/zoom)
    const pos = pointNode.getAbsolutePosition();

    // Để menu hiện ra ngay cạnh điểm thay vì đè lên nó,
    // bạn có thể cộng thêm một khoảng nhỏ (offset)
    const offsetX = 15;
    const offsetY = 5;

    setContextMenu({
      visible: true,
      x: pos.x + offsetX,
      y: pos.y + offsetY,
      pointId: point.id,
    });
  };

  const handleStartMovePoint = () => {
    if (contextMenu.pointId) {
      setMovingPointId(contextMenu.pointId);
      // Ẩn menu đi
      setContextMenu({ visible: false, x: 0, y: 0, pointId: null });
    }
  };
  const handleContextMenu = (e) => {
    e.evt.preventDefault(); // Ngăn menu mặc định

    // Chỉ hoạt động khi ở tool chọn vùng và đã có vùng được chọn
    if (tool !== "area_select" || !selectionRect.visible) {
      return;
    }

    const pos = e.target.getStage().getPointerPosition();
    const point = {
      x: (pos.x - stage.x) / stage.scale,
      y: (pos.y - stage.y) / stage.scale,
    };

    // Kiểm tra xem chuột phải có nằm trong vùng chọn không
    if (
      isPointInRect({ x: point.x, y: contentHeight - point.y }, selectionRect)
    ) {
      setAreaContextMenu({ visible: true, x: pos.x, y: pos.y });
    }
  };

  const handleAreaMenuActions = (action) => {
    // Lọc ra các ID tương ứng với điểm và đường
    const pointIds = selectedObjectIds.filter((id) => id.startsWith("point_"));
    const pathIds = selectedObjectIds.filter((id) => id.startsWith("path_"));

    switch (action) {
      case "deletePaths":
        if (pathIds.length > 0) {
          // Gọi prop từ App.js để xóa
          onDeletePathsInSelection(pathIds);
        }
        break;
      case "deletePoints":
        if (pointIds.length > 0) {
          // Gọi prop từ App.js để xóa
          onDeletePointsInSelection(pointIds);
        }
        break;
      default:
        break;
    }
    // Sau khi thực hiện hành động, đóng menu và reset vùng chọn
    setAreaContextMenu({ visible: false });
    setSelectionRect({ visible: false });
    setSelectedObjectIds([]);
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
          title="Chọn Vùng"
          className={tool === "area_select" ? "active" : ""}
          onClick={() => setTool("area_select")}
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
          disabled={!selectedId && selectedObjectIds.length === 0}
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
          onContextMenu={handleContextMenu}
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

            {image && (
              <Image
                image={image}
                x={0}
                y={0}
                width={contentWidth} // <-- THÊM DÒNG NÀY
                height={contentHeight} // <-- THÊM DÒNG NÀY
                listening={false}
              />
            )}
            <ZoneLayer
              walls={walls}
              zones={zones}
              selectedId={selectedId}
              stage={stage}
              contentHeight={contentHeight}
              handleObjectClick={handleObjectClick}
            />

            <PathLayer
              paths={paths}
              points={points} // PathLayer cần biết các điểm để vẽ đường
              selectedId={selectedId}
              stage={stage}
              contentHeight={contentHeight}
              handleObjectClick={handleObjectClick}
              handleControlPointDrag={handleControlPointDrag}
              setIsStageDraggable={setIsStageDraggable}
              drawingPathPoints={drawingPathPoints} // Truyền cả đường đang vẽ
            />

            <PointLayer
              points={points}
              selectedId={selectedId}
              pathStartPointId={pathStartPointId}
              drawingPathPoints={drawingPathPoints}
              stage={stage}
              contentHeight={contentHeight}
              handleObjectClick={handleObjectClick}
              handlePointContextMenu={handlePointContextMenu}
              onPointMouseOver={handlePointMouseOver}
              onPointMouseOut={handlePointMouseOut}
              selectedObjectIds={selectedObjectIds}
            />

            <MeasurementLayer
              tool={tool}
              measurement={measurement}
              stage={stage}
              contentHeight={contentHeight}
            />

            <Crosshair
              tool={tool}
              crosshair={crosshair}
              stage={stage}
              contentHeight={contentHeight}
              contentWidth={contentWidth}
              movingPointId={movingPointId}
            />
            {selectionRect.visible && (
              <Rect
                x={selectionRect.x}
                y={selectionRect.y}
                width={selectionRect.width}
                height={selectionRect.height}
                fill="rgba(0, 100, 255, 0.2)"
                stroke="rgba(0, 100, 255, 0.8)"
                strokeWidth={1.5 / stage.scale}
                listening={false}
              />
            )}
          </Layer>
        </Stage>
        <div className="scale-display">
          Tỉ lệ: 1m = {mapConfig.pixelsPerMeter || 20}px
        </div>
        {contextMenu.visible && (
          <PointMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onMoveClick={handleStartMovePoint}
            onClose={() => setContextMenu({ ...contextMenu, visible: false })}
          />
        )}
      </div>
      {areaContextMenu.visible && (
        <AreaContextMenu
          x={areaContextMenu.x}
          y={areaContextMenu.y}
          // onMove chưa có chức năng nên chỉ cần đóng menu
          onMove={() => setAreaContextMenu({ visible: false })}
          // Gọi hàm xử lý với action tương ứng
          onDeletePaths={() => handleAreaMenuActions("deletePaths")}
          onDeletePoints={() => handleAreaMenuActions("deletePoints")}
          onClose={() => setAreaContextMenu({ visible: false })}
        />
      )}

      {hoverTooltip.visible && (
        <HoverTooltip
          x={hoverTooltip.x}
          y={hoverTooltip.y}
          content={hoverTooltip.content}
        />
      )}
    </div>
  );
};

export default MapEditor;
