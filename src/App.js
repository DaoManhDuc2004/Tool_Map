import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import MapEditor from "./MapEditor";
import NewMapModal from "./NewMapModal";
import PropertyEditor from "./PropertyEditor";

function App() {
  const stageRef = useRef(null);
  const [map2D, setMap2D] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mapConfig, setMapConfig] = useState(null);
  const [siteId, setSiteId] = useState("");
  const [siteName, setSiteName] = useState("");

  const [allObjects, setAllObjects] = useState({
    walls: [],
    zones: [],
    points: [],
    paths: [],
  });

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingObject, setEditingObject] = useState(null);
  const [fileHandle, setFileHandle] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // THÊM MỚI: Ref cho input mở file .json
  const mapDataInputRef = useRef(null);

  const resetMapObjects = () => {
    setAllObjects({ walls: [], zones: [], points: [], paths: [] });
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

    // --- Bắt đầu tạo nội dung và lưu file ---
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

          // Tạo một bản sao của các đối tượng và chuyển đổi tọa độ
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

          const saveData = {
            siteId: siteId,
            siteName: siteName,
            mapConfig: mapConfig,
            backgroundImage: map2D,
            objects: objectsInMeters, // <-- Sử dụng đối tượng đã được chuyển đổi
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
            loadedData.backgroundImage !== undefined &&
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

            setFileHandle(handle);
            setSiteId(loadedData.siteId || "");
            setSiteName(loadedData.siteName || "");
            setMapConfig(loadedData.mapConfig);
            setMap2D(loadedData.backgroundImage);
            setAllObjects(objectsInPixels); // <-- Sử dụng đối tượng đã được chuyển đổi
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

  const handleCreateMap = (config, bgImage) => {
    setFileHandle(null);
    setSiteId("");
    setSiteName("");

    // Dùng trực tiếp config nhận được từ Modal, không tính toán gì thêm
    // vì nó đã luôn là mét.
    setMapConfig(config);

    resetMapObjects();
    setMap2D(bgImage || null);
    setIsModalOpen(false);
  };

  const handleOpenEditor = (object) => {
    if (selectedId) {
      setIsEditorOpen(true);
    }
  };

  const handleSaveObject = (updatedObject) => {
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

  useEffect(() => {
    // Nếu bảng thuộc tính đang mở và có một đối tượng được chọn
    if (isEditorOpen && selectedId) {
      // Tìm đối tượng đầy đủ từ ID
      const all = [
        ...allObjects.walls,
        ...allObjects.zones,
        ...allObjects.points,
        ...allObjects.paths,
      ];
      const objectToEdit = all.find((obj) => obj.id === selectedId);
      if (objectToEdit) {
        setEditingObject(objectToEdit); // Cập nhật đối tượng cho PropertyEditor
      }
    }
  }, [selectedId, isEditorOpen, allObjects]);
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
        <div className="control-row">
          <h1>2D Map Editor</h1>
          <button onClick={() => confirmAndExecute(handleNewMap)}>
            Tạo Map mới
          </button>
          <button onClick={() => confirmAndExecute(handleLoadMap)}>
            Mở File
          </button>
          {isDirty && (
            <button
              onClick={handleSaveMap}
              style={{ backgroundColor: "#4CAF50" }}
            >
              Lưu
            </button>
          )}
          {mapConfig && <button onClick={handleExportImage}>Export</button>}
        </div>

        <div className="control-row">
          <div className="input-group">
            <input
              type="text"
              className="text-input"
              value={siteId}
              onChange={(e) => {
                setSiteId(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Site ID (ví dụ: KHO_01)"
              style={{ flex: 1 }}
            />
            <input
              type="text"
              className="text-input"
              value={siteName}
              onChange={(e) => {
                setSiteName(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Site Name (ví dụ: Kho Hà Nội)"
              style={{ flex: 2 }}
            />
          </div>
        </div>
      </div>
      <div className="viewer-container">
        {mapConfig && (
          <MapEditor
            backgroundImage={map2D}
            mapConfig={mapConfig}
            objects={allObjects}
            onObjectsChange={setAllObjects}
            onEditObject={handleOpenEditor}
            onContentChange={() => setIsDirty(true)}
            onDeleteObject={handleDeleteObject}
            selectedId={selectedId}
            onSelectedIdChange={setSelectedId}
            stageRef={stageRef}
          />
        )}
        {isEditorOpen && (
          <PropertyEditor
            object={editingObject}
            onSave={handleSaveObject}
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
    </div>
  );
}

export default App;
