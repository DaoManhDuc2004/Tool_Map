// // PointCloudViewer.js - PHIÊN BẢN TỐI ƯU CHO MAP TĨNH

// import React, { useRef, useLayoutEffect, useEffect } from "react";
// import { Canvas, useThree } from "@react-three/fiber";
// import { OrbitControls } from "@react-three/drei";

// import * as THREE from "three";

// // Component con để xử lý việc render theo yêu cầu
// function DemandRenderer({ controlsRef }) {
//   const { invalidate } = useThree(); // invalidate là hàm yêu cầu render lại 1 frame

//   // Tự động render 1 lần ngay sau khi data được tải
//   useLayoutEffect(() => {
//     invalidate();
//   }, [invalidate]);

//   useEffect(() => {
//     const controls = controlsRef.current;
//     if (controls) {
//       // Mỗi khi camera thay đổi (xoay, zoom, ...) thì mới render lại
//       const handleControlChange = () => invalidate();
//       controls.addEventListener("change", handleControlChange);

//       // Dọn dẹp listener khi component bị hủy
//       return () => controls.removeEventListener("change", handleControlChange);
//     }
//   }, [controlsRef, invalidate]);

//   return null; // Component này không render gì cả
// }

// function PointCloudViewer({ data }) {
//   const controlsRef = useRef();
//   const pointsRef = useRef();

//   // Hook này vẫn giữ nguyên để tự động điều chỉnh camera
//   useLayoutEffect(() => {
//     if (data && pointsRef.current && controlsRef.current) {
//       const sceneObject = pointsRef.current;
//       const controls = controlsRef.current;
//       const box = new THREE.Box3().setFromObject(sceneObject);
//       const center = box.getCenter(new THREE.Vector3());
//       const size = box.getSize(new THREE.Vector3());
//       controls.target.copy(center);
//       const maxDim = Math.max(size.x, size.y, size.z);
//       const cameraPosition = new THREE.Vector3(
//         center.x + maxDim,
//         center.y + maxDim,
//         center.z + maxDim
//       );
//       controls.object.position.copy(cameraPosition);
//       controls.object.near = maxDim / 100;
//       controls.object.far = maxDim * 100;
//       controls.object.updateProjectionMatrix();
//       controls.update(); // Cần gọi update để thay đổi có hiệu lực
//     }
//   }, [data]);

//   return (
//     // Bật chế độ "frameloop='demand'" để Canvas chỉ render khi có yêu cầu
//     <Canvas frameloop="demand" camera={{ fov: 75, position: [0, 0, 5] }}>
//       <ambientLight intensity={1.0} />
//       <axesHelper args={[100]} />

//       <primitive object={data} ref={pointsRef} />

//       <OrbitControls
//         ref={controlsRef}
//         enableDamping={false} // Tắt damping vì nó không hoạt động tốt với frameloop='demand'
//       />

//       {/* Component đặc biệt để lắng nghe sự kiện từ OrbitControls */}
//       <DemandRenderer controlsRef={controlsRef} />
//     </Canvas>
//   );
// }

// export default PointCloudViewer;
