// import React, { useState, useRef, useEffect } from "react";
// // import * as THREE from "three";
// // import PointCloudViewer from "./PointCloudViewer";
// import "./App.css";
// import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
// import Map2DViewer from "./Map2DViewer";
// function App() {
//   // const [pcdData, setPcdData] = useState(null);
//   // const [fileName, setFileName] = useState("");
//   // const [error, setError] = useState("");
//   // const [isLoading, setIsLoading] = useState(false);
//   // const [loadingMessage, setLoadingMessage] = useState("");

//   // State và Ref cho bản đồ 2D
//   const [map2D, setMap2D] = useState(null);
//   const map2DInputRef = useRef(null);

//   // const fileInputRef = useRef(null);
//   // const workerRef = useRef(null);

//   // useEffect(() => {
//   //   workerRef.current = new Worker(
//   //     new URL("./pcd-worker.js", import.meta.url),
//   //     {
//   //       type: "module",
//   //     }
//   //   );
//   //   workerRef.current.onmessage = (event) => {
//   //     const { type, positions, colors, message } = event.data;
//   //     if (type === "done") {
//   //       setLoadingMessage("Đang tạo model 3D...");
//   //       setTimeout(() => {
//   //         const geometry = new THREE.BufferGeometry();
//   //         geometry.setAttribute(
//   //           "position",
//   //           new THREE.BufferAttribute(positions, 3)
//   //         );
//   //         if (colors) {
//   //           geometry.setAttribute(
//   //             "color",
//   //             new THREE.BufferAttribute(colors, 3)
//   //           );
//   //         }
//   //         const material = new THREE.PointsMaterial();
//   //         material.vertexColors = true;
//   //         material.sizeAttenuation = false;
//   //         material.size = 0.2; // Giữ nguyên size nhỏ để tối ưu
//   //         const points = new THREE.Points(geometry, material);
//   //         setPcdData(points);
//   //         setIsLoading(false);
//   //       }, 50);
//   //     } else if (type === "error") {
//   //       setError(message);
//   //       setIsLoading(false);
//   //     }
//   //   };
//   //   return () => {
//   //     workerRef.current.terminate();
//   //   };
//   // }, []);

//   // const handleFileChange = (event) => {
//   //   const file = event.target.files[0];
//   //   if (!file) return;
//   //   setPcdData(null);
//   //   setError("");
//   //   setIsLoading(true);
//   //   setFileName(file.name);
//   //   setLoadingMessage("Đang đọc và xử lý file 3D...");
//   //   const reader = new FileReader();
//   //   reader.onload = (e) => {
//   //     const fileBuffer = e.target.result;
//   //     workerRef.current.postMessage({ fileBuffer }, [fileBuffer]);
//   //   };
//   //   reader.onerror = () => {
//   //     setError("Có lỗi xảy ra khi đọc file.");
//   //     setIsLoading(false);
//   //   };
//   //   reader.readAsArrayBuffer(file);
//   // };

//   // Hàm xử lý cho việc import map 2D
//   const handleMap2DChange = (event) => {
//     const file = event.target.files[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       setMap2D(e.target.result);
//     };
//     reader.readAsDataURL(file);
//   };

//   // const handleImportClick = () => {
//   //   fileInputRef.current.click();
//   // };

//   // Hàm xử lý click cho nút import map 2D
//   const handleImportMap2DClick = () => {
//     map2DInputRef.current.click();
//   };

//   return (
//     <div className="app-container">
//       <div className="controls">
//         <h1>Map Tool</h1>
//         {/* <input
//           type="file"
//           accept=".pcd"
//           onChange={handleFileChange}
//           ref={fileInputRef}
//           style={{ display: "none" }}
//           onClick={(event) => {
//             event.target.value = null;
//           }}
//         />
//         <button onClick={handleImportClick} disabled={isLoading}>
//           {isLoading ? "Đang xử lý 3D..." : "1. Import Map 3D (.pcd)"}
//         </button> */}

//         {/* Nút import 2D */}
//         <input
//           type="file"
//           accept="image/png"
//           onChange={handleMap2DChange}
//           ref={map2DInputRef}
//           style={{ display: "none" }}
//           onClick={(event) => {
//             event.target.value = null;
//           }}
//         />
//         <button onClick={handleImportMap2DClick} className="secondary-button">
//           2. Import Map 2D (.png)
//         </button>

//         {/* {isLoading && <p className="loading-message">{loadingMessage}</p>}
//         {fileName && !isLoading && (
//           <p className="file-name">
//             Đã tải: <strong>{fileName}</strong>
//           </p>
//         )}
//         {error && <p className="error-message">{error}</p>} */}
//       </div>

//       {/* Khu vực hiển thị chia đôi */}
//       <div className="display-area">
//         <div className="viewer-container-half">
//           <h2>Bản đồ 2D</h2>
//           <div className="map2d-placeholder">
//             {map2D ? (
//               <TransformWrapper>
//                 <TransformComponent>
//                   <img
//                     src={map2D}
//                     alt="2D Map"
//                     style={{ width: "100%", height: "auto" }}
//                   />
//                 </TransformComponent>
//               </TransformWrapper>
//             ) : (
//               <p>Vui lòng chọn file PNG cho bản đồ 2D</p>
//             )}
//           </div>
//         </div>
//         <div className="viewer-container-half">
//           <h2>Bản đồ 3D</h2>
//           {pcdData ? (
//             <PointCloudViewer data={pcdData} />
//           ) : (
//             <div className="placeholder">
//               <p>Vui lòng chọn một file PCD để hiển thị bản đồ 3D</p>
//               {isLoading && <div className="loader"></div>}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;
