import React, { useState, useRef, useEffect, useMemo } from "react";
import "./App.css";
import MapEditor from "./MapEditor";
import NewMapModal from "./components/Menu/NewMapModal";
import PropertyEditor from "./components/MapEditorComponents/PropertyEditor";
import LevelManagerModal from "./components/MapEditorComponents/LevelManagerModal";
import RobotPoseModal from "./components/MapEditorComponents/RobotPoseModal";

function App() {
  const stageRef = useRef(null);
  const [map2D, setMap2D] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mapConfig, setMapConfig] = useState(null);
  const [siteId, setSiteId] = useState("");
  const [siteName, setSiteName] = useState("");
  const [levels, setLevels] = useState([]);
  const [currentLevelId, setCurrentLevelId] = useState(null);
  const [allObjects, setAllObjects] = useState({
    walls: [],
    zones: [],
    points: [],
    paths: [],
  });
  // Vị trí của mốc A :
  const [originOffset, setOriginOffset] = useState({ x: 0, y: 0 });
  // robotPose: Vị trí ban đầu của Robot  so với Mốc A
  const [robotPose, setRobotPose] = useState(null);

  const visibleObjects = useMemo(() => {
    // Nếu không có tầng nào được chọn, trả về đối tượng rỗng
    if (!currentLevelId) return { walls: [], zones: [], points: [], paths: [] };

    // Lọc từng loại đối tượng dựa trên levelId
    return {
      walls: allObjects.walls.filter((w) => w.levelId === currentLevelId),
      zones: allObjects.zones.filter((z) => z.levelId === currentLevelId),
      points: allObjects.points.filter((p) => p.levelId === currentLevelId),
      paths: allObjects.paths.filter((p) => p.levelId === currentLevelId),
    };
  }, [allObjects, currentLevelId]);

  const currentBackgroundImage = useMemo(() => {
    if (!currentLevelId || !levels) return null;

    const currentLevel = levels.find((l) => l.levelId === currentLevelId);
    return currentLevel?.backgroundImage || null; // Trả về ảnh nền của tầng đó
  }, [currentLevelId, levels]);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLevelManagerOpen, setIsLevelManagerOpen] = useState(false);
  const [isRobotModalOpen, setIsRobotModalOpen] = useState(false);
  const [editingSelection, setEditingSelection] = useState(null);
  const [fileHandle, setFileHandle] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const resetMapObjects = () => {
    setAllObjects({ walls: [], zones: [], points: [], paths: [] });
    // THÊM MỚI: Reset cả mốc tọa độ
    setOriginOffset({ x: 0, y: 0 });
    setRobotPose(null);
    setIsDirty(false);
  };
  const confirmAndExecute = (action) => {
    if (isDirty) {
      if (
        window.confirm(
          "Bạn có các thay đổi chưa được lưu. Bạn có chắc chắn muốn tiếp tục mà không lưu không?"
        )
      ) {
        action(); // Nếu người dùng chọn "OK", thực hiện hành động
      }
      // Nếu người dùng chọn "Cancel", không làm gì cả
    } else {
      action(); // Nếu không có gì thay đổi, thực hiện hành động ngay lập tức
    }
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedId(null); // Bỏ chọn đối tượng luôn cho nhất quán
  };

  const handleSaveMap = async () => {
    let handle = fileHandle;

    // Nếu là file mới (chưa có handle), mở hộp thoại "Save As"
    if (!handle) {
      if (!window.showSaveFilePicker) {
        alert("Trình duyệt của bạn không hỗ trợ chức năng này.");
        return;
      }

      try {
        const suggestedName = `map_${
          siteId || siteName.replace(/\s/g, "_") || "new_map"
        }`;

        handle = await window.showSaveFilePicker({
          suggestedName: suggestedName,
          // Cung cấp các lựa chọn định dạng file
          types: [
            {
              description: "TOPO Map File",
              accept: { "application/json": [".topo"] },
            },
            {
              description: "JSON Map File",
              accept: { "application/json": [".json"] },
            },
          ],
        });
        // Lưu lại handle để cho lần "Save" tiếp theo
        setFileHandle(handle);
      } catch (error) {
        console.log("Hủy bỏ thao tác lưu.");
        return; // Người dùng đã nhấn Cancel
      }
    }
    const fileExtension = handle.name.split(".").pop().toLowerCase();

    try {
      const fileExtension = handle.name.split(".").pop();
      const writable = await handle.createWritable();

      switch (fileExtension) {
        case "topo":
        case "json": {
          // Thêm dấu ngoặc {} để tạo scope mới cho biến
          const { pixelsPerMeter } = mapConfig;
          if (!pixelsPerMeter) {
            alert(
              "Lỗi: Không tìm thấy giá trị pixelsPerMeter trong mapConfig."
            );
            return;
          }

          const objectsInMeters = {
            walls: allObjects.walls.map((wall) => ({
              ...wall,
              // points là một mảng [x1, y1, x2, y2], cần chia mỗi giá trị
              points: wall.points.map((p) => p / pixelsPerMeter),
            })),
            zones: allObjects.zones.map((zone) => ({
              ...zone,
              x: zone.x / pixelsPerMeter,
              y: zone.y / pixelsPerMeter,
              width: zone.width / pixelsPerMeter,
              height: zone.height / pixelsPerMeter,
            })),
            points: allObjects.points.map((point) => ({
              ...point,
              x: point.x / pixelsPerMeter,
              y: point.y / pixelsPerMeter,
            })),
            paths: allObjects.paths.map((path) => {
              if (path.pathType === "curved" && path.controlPoints) {
                return {
                  ...path,
                  controlPoints: path.controlPoints.map((cp) => ({
                    x: cp.x / pixelsPerMeter,
                    y: cp.y / pixelsPerMeter,
                  })),
                };
              }
              return path; // Path thẳng không có tọa độ, chỉ có ID
            }),
          };

          const originOffsetInMeters = {
            x: originOffset.x / pixelsPerMeter,
            y: originOffset.y / pixelsPerMeter,
          };

          const saveData = {
            siteId: siteId,
            siteName: siteName,
            mapConfig: mapConfig,
            levels: levels,
            objects: objectsInMeters,
            originOffset_meters: originOffsetInMeters,
          };
          const jsonString = JSON.stringify(saveData, null, 2);
          await writable.write(jsonString);
          break;
        }
        // ...

        default:
          // Đóng stream và báo lỗi nếu chọn định dạng không hỗ trợ
          await writable.close();
          alert(`Định dạng file .${fileExtension} không được hỗ trợ.`);
          return;
      }

      await writable.close();
      setIsDirty(false);
      alert(`Đã lưu file ${handle.name} thành công!`);
    } catch (error) {
      console.error("Lỗi khi lưu file:", error);
      alert("Có lỗi xảy ra khi đang lưu file.");
    }
  };

  const handleLoadMap = async () => {
    if (!window.showOpenFilePicker) {
      alert("Trình duyệt của bạn không hỗ trợ chức năng mở file trực tiếp.");
      return;
    }
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Map & Image Files",
            accept: {
              "application/json": [".json", ".topo"],
            },
          },
        ],
      });

      const file = await handle.getFile();
      const fileExtension = file.name.split(".").pop().toLowerCase();

      if (fileExtension === "json" || fileExtension === "topo") {
        // SỬA LẠI: Chỉ đọc và parse file khi đã chắc chắn nó là JSON/TOPO
        const content = await file.text();
        try {
          const loadedData = JSON.parse(content);

          // Phần nâng cấp cho đường cong cũ (giữ nguyên từ code của bạn)
          if (loadedData.objects && loadedData.objects.paths) {
            loadedData.objects.paths = loadedData.objects.paths.map((path) => {
              if (
                path.pathType === "curved" &&
                !path.controlPoints &&
                path.pointIds
              ) {
                console.log("Phát hiện và chuyển đổi đường cong cũ:", path.id);
                const newControlPoints = [];
                const pathNodes = path.pointIds
                  .map((id) =>
                    loadedData.objects.points.find((p) => p.id === id)
                  )
                  .filter(Boolean);

                if (pathNodes.length >= 2) {
                  for (let i = 0; i < pathNodes.length - 1; i++) {
                    const p1 = pathNodes[i];
                    const p2 = pathNodes[i + 1];
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const perpX = -dy;
                    const perpY = dx;
                    const dist = Math.sqrt(perpX * perpX + perpY * perpY);
                    const offsetAmount = 30;
                    let cpX = midX;
                    let cpY = midY;
                    if (dist !== 0) {
                      const normPerpX = perpX / dist;
                      const normPerpY = perpY / dist;
                      cpX = midX + normPerpX * offsetAmount;
                      cpY = midY + normPerpY * offsetAmount;
                    }
                    newControlPoints.push({ x: cpX, y: cpY });
                  }
                }
                const migratedPath = {
                  ...path,
                  controlPoints: newControlPoints,
                };
                delete migratedPath.points;
                return migratedPath;
              }
              return path;
            });
          }

          // Kiểm tra và cập nhật state (giữ nguyên)
          if (
            loadedData.objects &&
            loadedData.levels &&
            loadedData.mapConfig && // Đảm bảo mapConfig tồn tại
            loadedData.mapConfig.pixelsPerMeter // và có giá trị pixelsPerMeter
          ) {
            const { pixelsPerMeter } = loadedData.mapConfig;

            // Tạo bản sao và chuyển đổi tọa độ từ mét sang pixel
            const objectsInPixels = {
              // Nếu file JSON không có sẵn các mảng này thì khởi tạo mảng rỗng
              walls: (loadedData.objects.walls || []).map((wall) => ({
                ...wall,
                points: wall.points.map((p) => p * pixelsPerMeter),
              })),
              zones: (loadedData.objects.zones || []).map((zone) => ({
                ...zone,
                x: zone.x * pixelsPerMeter,
                y: zone.y * pixelsPerMeter,
                width: zone.width * pixelsPerMeter,
                height: zone.height * pixelsPerMeter,
              })),
              points: (loadedData.objects.points || []).map((point) => ({
                ...point,
                x: point.x * pixelsPerMeter,
                y: point.y * pixelsPerMeter,
              })),
              paths: (loadedData.objects.paths || []).map((path) => {
                if (path.pathType === "curved" && path.controlPoints) {
                  return {
                    ...path,
                    controlPoints: path.controlPoints.map((cp) => ({
                      x: cp.x * pixelsPerMeter,
                      y: cp.y * pixelsPerMeter,
                    })),
                  };
                }
                return path;
              }),
            };

            let loadedOriginOffset = { x: 0, y: 0 };
            if (loadedData.originOffset_meters) {
              loadedOriginOffset = {
                x: loadedData.originOffset_meters.x * pixelsPerMeter,
                y: loadedData.originOffset_meters.y * pixelsPerMeter,
              };
            }

            setFileHandle(handle);
            setSiteId(loadedData.siteId || "");
            setSiteName(loadedData.siteName || "");
            setMapConfig(loadedData.mapConfig);
            setAllObjects(objectsInPixels);
            setLevels(loadedData.levels || []);
            setCurrentLevelId(loadedData.levels?.[0]?.levelId || null);
            setOriginOffset(loadedOriginOffset);
            setRobotPose(null);
            setIsDirty(false);
            alert("Đã mở bản đồ thành công!");
          } else {
            alert("Lỗi: File không đúng định dạng bản đồ.");
          }
        } catch (e) {
          alert("Lỗi: File JSON không hợp lệ.");
          console.error("Lỗi parse JSON:", e);
        }
      } else {
        alert(`Định dạng file .${fileExtension} không được hỗ trợ.`);
      }
    } catch (error) {
      // Bỏ qua lỗi khi người dùng nhấn "Cancel" trong hộp thoại mở file
      if (error.name !== "AbortError") {
        console.error("Có lỗi xảy ra:", error);
      }
    }
  };

  const handleNewMap = () => {
    setIsModalOpen(true);
  };

  // App.js

  const handleExportImage = async () => {
    if (!stageRef.current) {
      alert("Bản đồ chưa sẵn sàng để xuất ảnh.");
      return;
    }
    if (!window.showSaveFilePicker) {
      alert("Trình duyệt của bạn không hỗ trợ chức năng này.");
      return;
    }

    try {
      const suggestedName = `map_export_${Date.now()}`;

      const handle = await window.showSaveFilePicker({
        suggestedName: suggestedName,
        types: [
          // Chỉ cho phép xuất file PNG
          { description: "PNG Image", accept: { "image/png": [".png"] } },
        ],
      });

      const writable = await handle.createWritable();

      // Xuất canvas thành ảnh PNG
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 }); // pixelRatio 2 cho ảnh nét hơn
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      await writable.write(blob);
      await writable.close();

      alert(`Đã xuất file ảnh ${handle.name} thành công!`);
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Lỗi khi xuất ảnh:", error);
        alert("Có lỗi xảy ra khi đang xuất ảnh.");
      }
    }
  };

  const handleBackgroundImageChange = (newImageBase64) => {
    if (!currentLevelId) return;

    // Cập nhật lại ảnh nền cho tầng hiện tại
    setLevels((prevLevels) =>
      prevLevels.map((level) =>
        level.levelId === currentLevelId
          ? { ...level, backgroundImage: newImageBase64 }
          : level
      )
    );
    setIsDirty(true);
  };

  const handleCreateMap = (config, initialLevels) => {
    setFileHandle(null);
    setSiteId("");
    setSiteName("");
    setMapConfig(config);
    resetMapObjects();

    // --- THAY ĐỔI Ở ĐÂY ---
    setLevels(initialLevels || []); // Lưu danh sách các tầng (lúc này chỉ có 1 tầng)
    setCurrentLevelId(initialLevels?.[0]?.levelId || null); // Chọn tầng đầu tiên đó
    // --------------------

    setIsModalOpen(false);
  };

  const handleOpenEditor = (selection) => {
    setEditingSelection(selection);
    setIsEditorOpen(true);
  };

  const handleSaveSingleObject = (updatedObject) => {
    if (!updatedObject || !updatedObject.type) {
      console.error("Đối tượng đang lưu thiếu thuộc tính 'type'");
      return;
    }

    // "point" -> "points", "path" -> "paths"
    const objectTypeKey = `${updatedObject.type}s`;

    // Kiểm tra xem key có hợp lệ không (ví dụ: 'points', 'paths'...)
    if (allObjects.hasOwnProperty(objectTypeKey)) {
      setAllObjects((prevObjects) => ({
        ...prevObjects,
        [objectTypeKey]: prevObjects[objectTypeKey].map((obj) =>
          obj.id === updatedObject.id ? updatedObject : obj
        ),
      }));
      setIsDirty(true);
    } else {
      console.error(`Không tìm thấy loại đối tượng: ${objectTypeKey}`);
    }

    setIsEditorOpen(false);
    //setEditingObject(null);
  };

  // THÊM HÀM MỚI NÀY
  const handleSaveMultipleObjects = (changes) => {
    const idsToUpdate = editingSelection.map((obj) => obj.id);
    const objectTypeKey = `${editingSelection[0].type}s`; // vd: "points"

    setAllObjects((prev) => ({
      ...prev,
      [objectTypeKey]: prev[objectTypeKey].map((obj) => {
        // Nếu ID nằm trong danh sách cần cập nhật
        if (idsToUpdate.includes(obj.id)) {
          // Gộp object cũ với các thay đổi mới
          return { ...obj, ...changes };
        }
        return obj;
      }),
    }));

    setIsDirty(true);
    setIsEditorOpen(false);
  };

  // src/App.js

  const handleLevelsChange = (updatedLevels) => {
    // 1. Tìm các tầng có ảnh nền bị THAY ĐỔI
    const imageChangedLevelIds = levels
      .filter((oldLevel) => {
        const newLevel = updatedLevels.find(
          (nl) => nl.levelId === oldLevel.levelId
        );
        // Kiểm tra xem tầng đó có còn tồn tại không và ảnh nền có khác không
        return (
          newLevel && newLevel.backgroundImage !== oldLevel.backgroundImage
        );
      })
      .map((l) => l.levelId);

    // 2. Tìm các tầng bị XÓA HOÀN TOÀN (logic cũ)
    const deletedLevelIds = levels
      .filter(
        (oldLevel) =>
          !updatedLevels.some(
            (newLevel) => newLevel.levelId === oldLevel.levelId
          )
      )
      .map((l) => l.levelId);

    // Dùng Set để tránh trùng lặp nếu một tầng vừa bị xóa vừa bị thay ảnh
    const levelIdsToClearObjects = [
      ...new Set([...imageChangedLevelIds, ...deletedLevelIds]),
    ];

    // 4. Nếu có tầng cần xóa đối tượng, thực hiện hành động
    if (levelIdsToClearObjects.length > 0) {
      // QUAN TRỌNG: Hỏi xác nhận người dùng trước khi xóa dữ liệu
      if (imageChangedLevelIds.length > 0) {
        if (
          !window.confirm(
            "Bạn có chắc chắn muốn thay đổi ảnh nền không? Tất cả các điểm và đường đi trên tầng này sẽ bị XÓA."
          )
        ) {
          return; // Nếu người dùng nhấn "Cancel", không làm gì cả
        }
      }

      // Tiến hành xóa tất cả các đối tượng thuộc các tầng đã xác định
      setAllObjects((prev) => ({
        walls: prev.walls.filter(
          (w) => !levelIdsToClearObjects.includes(w.levelId)
        ),
        zones: prev.zones.filter(
          (z) => !levelIdsToClearObjects.includes(z.levelId)
        ),
        points: prev.points.filter(
          (p) => !levelIdsToClearObjects.includes(p.levelId)
        ),
        paths: prev.paths.filter(
          (p) => !levelIdsToClearObjects.includes(p.levelId)
        ),
      }));
    }

    // 5. Cuối cùng, cập nhật lại danh sách các tầng
    setLevels(updatedLevels);
    setIsDirty(true);
  };

  // Thay thế toàn bộ hàm này trong file App.js
  const handleDeleteObject = (objectId) => {
    if (!objectId) return;

    const newAllObjects = { ...allObjects };
    let objectWasDeleted = false;

    // TRƯỜNG HỢP 1: Nếu đối tượng bị xóa là một "điểm"
    if (objectId.startsWith("point_")) {
      // 1. Xóa điểm đó
      newAllObjects.points = allObjects.points.filter(
        (point) => point.id !== objectId
      );

      // 2. Xóa TẤT CẢ các đường đi có kết nối đến điểm này
      newAllObjects.paths = allObjects.paths.filter((path) => {
        // Nếu là đường thẳng, kiểm tra 'from' và 'to'
        if (path.pathType === "straight") {
          return path.from !== objectId && path.to !== objectId;
        }
        // Nếu là đường cong, kiểm tra trong mảng 'pointIds'
        if (path.pathType === "curved") {
          return !path.pointIds.includes(objectId);
        }
        // Giữ lại các loại path khác (nếu có)
        return true;
      });
      objectWasDeleted = true;

      // TRƯỜNG HỢP 2: Đối với các đối tượng khác (tường, vùng, hoặc xóa trực tiếp đường đi)
    } else {
      for (const key in newAllObjects) {
        const originalLength = newAllObjects[key].length;
        newAllObjects[key] = newAllObjects[key].filter(
          (obj) => obj.id !== objectId
        );
        if (newAllObjects[key].length < originalLength) {
          objectWasDeleted = true;
          break;
        }
      }
    }

    if (objectWasDeleted) {
      setAllObjects(newAllObjects);
      setIsDirty(true);
    }
  };

  // HÀM MỚI: XÓA NHIỀU ĐIỂM CÙNG LÚC
  const handleDeletePointsInSelection = (pointIds) => {
    if (!pointIds || pointIds.length === 0) return;
    setAllObjects((prev) => {
      const newPoints = prev.points.filter((p) => !pointIds.includes(p.id));
      const newPaths = prev.paths.filter((path) => {
        const startId = path.from || path.pointIds?.[0];
        const endId = path.to || path.pointIds?.[path.pointIds.length - 1];
        return !pointIds.includes(startId) && !pointIds.includes(endId);
      });
      return { ...prev, points: newPoints, paths: newPaths };
    });
    setIsDirty(true);
  };

  // HÀM MỚI: XÓA NHIỀU ĐƯỜNG CÙNG LÚC
  const handleDeletePathsInSelection = (pathIds) => {
    if (!pathIds || pathIds.length === 0) return;
    setAllObjects((prev) => ({
      ...prev,
      paths: prev.paths.filter((p) => !pathIds.includes(p.id)),
    }));
    setIsDirty(true);
  };

  // [THÊM MỚI: Ngay trước `useEffect` cuối cùng]

  // THÊM MỚI: Hàm xử lý khi thay đổi mốc tọa độ (Mốc A)
  const handleOriginChange = (newOriginInPixels) => {
    // newOriginInPixels là tọa độ (x, y_flipped) so với gốc ảnh
    const oldOrigin = originOffset;

    // Tính toán độ chênh lệch (delta)
    const delta = {
      x: newOriginInPixels.x - oldOrigin.x,
      y: newOriginInPixels.y - oldOrigin.y,
    };

    // Nếu không có chênh lệch, không làm gì cả
    if (delta.x === 0 && delta.y === 0) return;

    // Dịch chuyển TẤT CẢ các đối tượng bằng cách trừ delta
    // Tọa độ mới = Tọa độ cũ - delta
    setAllObjects((prev) => ({
      walls: prev.walls.map((wall) => ({
        ...wall,
        // Giả định wall.points là [x1, y1_flipped, x2, y2_flipped]
        points: [
          wall.points[0] - delta.x,
          wall.points[1] - delta.y,
          wall.points[2] - delta.x,
          wall.points[3] - delta.y,
        ],
      })),
      zones: prev.zones.map((zone) => ({
        ...zone,
        x: zone.x - delta.x,
        y: zone.y - delta.y,
      })),
      points: prev.points.map((point) => ({
        ...point,
        x: point.x - delta.x,
        y: point.y - delta.y,
      })),
      paths: prev.paths.map((path) => {
        if (path.pathType === "curved" && path.controlPoints) {
          return {
            ...path,
            controlPoints: path.controlPoints.map((cp) => ({
              x: cp.x - delta.x,
              y: cp.y - delta.y,
            })),
          };
        }
        return path;
      }),
    }));

    // Cập nhật mốc mới
    setOriginOffset(newOriginInPixels);
    setIsDirty(true);
  };

  // [Trong file App.js]

const handleExportWaypoints = async () => {
  if (!mapConfig || !mapConfig.pixelsPerMeter) {
    alert("Cấu hình bản đồ chưa đầy đủ (thiếu pixelsPerMeter).");
    return;
  }

  // 1. Chuẩn bị dữ liệu (Chuyển đổi tất cả sang mét trước)
  const pointsInMeters = allObjects.points.map((p) => ({
    ...p,
    // Lưu ý: point.x/y trong state hiện tại là Pixel (Relative to Origin A)
    // Ta chia cho ppm để ra mét
    xm: p.x / mapConfig.pixelsPerMeter,
    ym: p.y / mapConfig.pixelsPerMeter,
    z: p.elevation || 0, // Nếu không có elevation thì bằng 0
  }));

  // 2. Tạo nội dung CSV
  // Header file csv: name, x, y, z, theta
  let csvContent = "name,x,y,z,theta\n";

  pointsInMeters.forEach((currentPoint) => {
    let theta = 0; // Mặc định là 0 độ (hướng 3 giờ)

    // --- LOGIC TÍNH GÓC THETA TỰ ĐỘNG ---
    // Tìm xem điểm này có phải là điểm BẮT ĐẦU của một đường đi nào không?
    // (Tức là robot sẽ đi từ Current -> Next)
    const connectedPath = allObjects.paths.find((path) => {
      if (path.pathType === "straight") {
        return path.from === currentPoint.id;
      }
      // Với đường cong, kiểm tra xem nó có phải điểm đầu tiên trong mảng pointIds không
      if (path.pathType === "curved" && path.pointIds) {
        return path.pointIds[0] === currentPoint.id;
      }
      return false;
    });

    if (connectedPath) {
      // Tìm điểm tiếp theo (Target Point)
      let nextPointId = null;
      if (connectedPath.pathType === "straight") {
        nextPointId = connectedPath.to;
      } else if (connectedPath.pathType === "curved") {
        // Điểm tiếp theo trong đường cong
        nextPointId = connectedPath.pointIds[1]; 
      }

      const nextPointObj = pointsInMeters.find((p) => p.id === nextPointId);

      if (nextPointObj) {
        // Tính góc giữa 2 điểm: atan2(dy, dx)
        // Kết quả là Radian (-3.14 đến 3.14)
        const dx = nextPointObj.xm - currentPoint.xm;
        const dy = nextPointObj.ym - currentPoint.ym;
        theta = Math.atan2(dy, dx);
      }
    }
    // --------------------------------------

    // Làm tròn số liệu cho đẹp (4 chữ số thập phân)
    const row = [
      currentPoint.nodeName || currentPoint.id, // Name
      currentPoint.xm.toFixed(4),               // X
      currentPoint.ym.toFixed(4),               // Y
      currentPoint.z.toFixed(4),                // Z
      theta.toFixed(4)                          // Theta (Radian)
    ].join(",");

    csvContent += row + "\n";
  });

  // 3. Lưu file
  if (!window.showSaveFilePicker) {
     // Fallback cho trình duyệt cũ
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.href = url;
     link.setAttribute("download", `waypoints_${Date.now()}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     return;
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: `waypoints_${Date.now()}.csv`,
      types: [{ description: "CSV File", accept: { "text/csv": [".csv"] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(csvContent);
    await writable.close();
    alert("Xuất file Waypoints thành công!");
  } catch (err) {
    console.error("Hủy lưu file hoặc lỗi:", err);
  }
};

  const handleSetRobotPose = (newPose) => {
    // newPose là một object { x, y }
    setRobotPose({
      x: isNaN(newPose.x) ? 0 : newPose.x,
      y: isNaN(newPose.y) ? 0 : newPose.y,
    });
    setIsRobotModalOpen(false); // Đóng modal sau khi set
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Nếu có thay đổi chưa lưu, kích hoạt cảnh báo của trình duyệt
      if (isDirty) {
        e.preventDefault(); // Cần thiết cho một số trình duyệt
        e.returnValue = ""; // Cần thiết cho một số trình duyệt khác
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Dọn dẹp listener khi component bị unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]); // Chỉ chạy lại effect này khi isDirty thay đổi

  return (
    <div className="app-container">
      <div className="controls">
        {/* Nhóm 1: Tiêu đề và các nút chính */}
        <div className="control-group">
          <h1>2D Map Editor</h1>
          <button onClick={() => confirmAndExecute(handleNewMap)}>
            Tạo Map mới
          </button>
          <button onClick={() => confirmAndExecute(handleLoadMap)}>
            Mở File
          </button>
          {isDirty && (
            <button onClick={handleSaveMap} className="btn-save">
              {" "}
              {/* Thêm class mới */}
              Lưu
            </button>
          )}
          {mapConfig && <button onClick={handleExportImage}>Export</button>}
          <button className="btn-secondary" onClick={handleExportWaypoints} style={{ marginLeft: "5px" }}>
  📄 Xuất Waypoints (CSV)
</button>
        </div>

        {/* Nhóm 2: Thông tin Site và Tầng */}
        <div className="control-group">
          <div className="input-group">
            <input
              type="text"
              className="text-input"
              value={siteId}
              onChange={(e) => {
                setSiteId(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Site ID"
              style={{ width: "150px" }}
            />
            <input
              type="text"
              className="text-input"
              value={siteName}
              onChange={(e) => {
                setSiteName(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Site Name"
              style={{ width: "250px" }}
            />
          </div>

          <div className="input-group">
            <button
              onClick={() => setIsRobotModalOpen(true)}
              title="Đặt vị trí robot mô phỏng"
              className="btn-robot" // Thêm class để dễ style
            >
              🤖 Location
            </button>
          </div>

          {levels.length > 0 && (
            <div className="input-group">
              <label>Tầng:</label>
              <select
                value={currentLevelId || ""}
                onChange={(e) => setCurrentLevelId(e.target.value)}
              >
                {levels.map((level) => (
                  <option key={level.levelId} value={level.levelId}>
                    {level.name}
                  </option>
                ))}
              </select>
              <button
                className="level-manage-btn"
                onClick={() => setIsLevelManagerOpen(true)}
                title="Thêm/Sửa/Xóa tầng"
              >
                ⚙️
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="viewer-container">
        {mapConfig && (
          <MapEditor
            backgroundImage={currentBackgroundImage}
            mapConfig={mapConfig}
            objects={visibleObjects}
            onObjectsChange={setAllObjects}
            onEditObject={handleOpenEditor}
            onContentChange={() => setIsDirty(true)}
            onDeleteObject={handleDeleteObject}
            selectedId={selectedId}
            onSelectedIdChange={setSelectedId}
            onStageClick={handleCloseEditor}
            stageRef={stageRef}
            onDeletePointsInSelection={handleDeletePointsInSelection}
            onDeletePathsInSelection={handleDeletePathsInSelection}
            currentLevelId={currentLevelId}
            onBackgroundImageChange={handleBackgroundImageChange}
            originOffset={originOffset}
            robotPose={robotPose}
            onOriginChange={handleOriginChange}
          />
        )}
        {isEditorOpen && (
          <PropertyEditor
            selection={editingSelection}
            onSaveSingle={handleSaveSingleObject}
            onSaveMultiple={handleSaveMultipleObjects}
            onClose={() => setIsEditorOpen(false)}
            mapConfig={mapConfig}
          />
        )}
      </div>
      <NewMapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateMap}
      />
      <LevelManagerModal
        isOpen={isLevelManagerOpen}
        onClose={() => setIsLevelManagerOpen(false)}
        levels={levels}
        onLevelsChange={handleLevelsChange}
      />
      <RobotPoseModal
        isOpen={isRobotModalOpen}
        onClose={() => setIsRobotModalOpen(false)}
        onSetPose={handleSetRobotPose}
        currentPose={robotPose || { x: 0, y: 0 }}
      />
    </div>
  );
}

export default App;
