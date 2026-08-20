import React, { useState, useRef, useEffect } from "react";
import { FaUpload, FaSearchPlus, FaSearchMinus, FaUndo, FaRedo, FaSync, FaCheck, FaTimes, FaCamera } from "react-icons/fa";
import API from "../../api";

const FamilyPhotoCropModal = ({ isOpen, onClose, onSave, initialImage, relationTitle = "Family Member" }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [scale, setScale] = useState(1);
  const [baseScale, setBaseScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const imageRef = useRef(new Image());
  const fileInputRef = useRef(null);

  const initImageWithScale = (img) => {
    imageRef.current = img;
    // Calculate initial fit scale so full photo is visible in 280x280 box
    const fitScale = Math.min(280 / img.width, 280 / img.height);
    const initialS = fitScale > 0 ? fitScale : 1;
    setBaseScale(initialS);
    setScale(initialS);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setError(null);
    setTimeout(() => drawCanvas(img, initialS, 0, { x: 0, y: 0 }), 50);
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialImage && !initialImage.endsWith('/default.jpg')) {
        const fullUrl = initialImage.startsWith("http") || initialImage.startsWith("data:")
          ? initialImage
          : `${API.defaults.baseURL.replace(/\/api$/, "")}${initialImage.startsWith("/") ? "" : "/"}${initialImage}`;
        
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          setImageSrc(fullUrl);
          initImageWithScale(img);
        };
        img.onerror = () => {
          setImageSrc(null);
        };
        img.src = fullUrl;
      } else {
        setImageSrc(null);
      }
    }
  }, [isOpen, initialImage]);

  // Trackpad / Mouse Wheel Zooming
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !imageSrc) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.06 : 0.94;
      setScale((prevScale) => {
        const minS = Math.min(baseScale * 0.1, 0.05);
        const maxS = Math.max(baseScale * 5.0, 3.0);
        return Math.min(Math.max(minS, prevScale * zoomFactor), maxS);
      });
    };

    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      viewport.removeEventListener("wheel", handleWheel);
    };
  }, [imageSrc, baseScale]);

  const drawCanvas = (img, currentScale, currentRotation, currentPos) => {
    const canvas = canvasRef.current;
    if (!canvas || !img || !img.complete) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.save();

    // Move to center of canvas
    ctx.translate(width / 2 + currentPos.x, height / 2 + currentPos.y);
    ctx.rotate((currentRotation * Math.PI) / 180);
    ctx.scale(currentScale, currentScale);

    // Draw image centered
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  };

  useEffect(() => {
    if (imageSrc && imageRef.current.complete) {
      drawCanvas(imageRef.current, scale, rotation, position);
    }
  }, [scale, rotation, position, imageSrc]);

  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImageSrc(event.target.result);
        initImageWithScale(img);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (!imageSrc || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleRotate = (deg) => {
    setRotation((prev) => (prev + deg + 360) % 360);
  };

  const handleReset = () => {
    setScale(baseScale);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleSaveCrop = async () => {
    if (!imageSrc || !imageRef.current) {
      setError("Please select an image first.");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Create a 300x300 circular cropped output canvas
      const cropCanvas = document.createElement("canvas");
      const cropSize = 300;
      cropCanvas.width = cropSize;
      cropCanvas.height = cropSize;
      const ctx = cropCanvas.getContext("2d");

      // Draw circular clip path
      ctx.beginPath();
      ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
      ctx.clip();

      // White background fill
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, cropSize, cropSize);

      // Scale factors from viewport canvas (280x280) to crop output (300x300)
      const ratio = cropSize / 280;

      ctx.save();
      ctx.translate(
        (cropSize / 2) + position.x * ratio,
        (cropSize / 2) + position.y * ratio
      );
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(scale * ratio, scale * ratio);
      ctx.drawImage(
        imageRef.current,
        -imageRef.current.width / 2,
        -imageRef.current.height / 2
      );
      ctx.restore();

      // Convert canvas to Blob & JPEG base64 data url
      const dataUrl = cropCanvas.toDataURL("image/jpeg", 0.9);

      const blob = await new Promise((resolve) => cropCanvas.toBlob(resolve, "image/jpeg", 0.9));
      const uploadFormData = new FormData();
      uploadFormData.append("photo", blob, `family_${Date.now()}.jpg`);
      uploadFormData.append("photoData", dataUrl);

      // Upload to backend API using FormData
      const response = await API.post("/student/upload-relation-photo", uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data && response.data.photoUrl) {
        onSave(response.data.photoUrl);
        onClose();
      } else {
        throw new Error("Invalid response from server.");
      }
    } catch (err) {
      console.error("Failed to upload family photo:", err);
      setError(err.response?.data?.message || err.message || "Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const minSlider = baseScale * 0.1;
  const maxSlider = baseScale * 4.0;
  const zoomPercent = baseScale > 0 ? Math.round((scale / baseScale) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex items-center space-x-2">
            <FaCamera className="text-xl" />
            <h3 className="text-lg font-semibold">Adjust Photo for {relationTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col items-center">
          {error && (
            <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <FaTimes />
              </button>
            </div>
          )}

          {/* Interactive Canvas Viewport */}
          <div
            ref={viewportRef}
            className="relative w-[280px] h-[280px] bg-gray-100 rounded-full border-4 border-indigo-500 shadow-inner overflow-hidden cursor-move flex items-center justify-center group select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {imageSrc ? (
              <>
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={280}
                  className="w-[280px] h-[280px] object-cover pointer-events-none rounded-full"
                />
                <div className="absolute inset-0 border-4 border-indigo-400/50 rounded-full pointer-events-none group-hover:border-indigo-500 transition"></div>
              </>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 text-center text-gray-500 hover:text-indigo-600 cursor-pointer w-full h-full"
              >
                <FaUpload className="text-4xl mb-2 text-indigo-400 group-hover:scale-110 transition" />
                <span className="font-semibold text-sm">Click to choose image</span>
                <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP formats</span>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Controls Bar */}
          {imageSrc && (
            <div className="w-full mt-5 space-y-3">
              {/* Zoom Slider */}
              <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <FaSearchMinus
                  onClick={() => setScale((s) => Math.max(minSlider, s * 0.9))}
                  className="text-gray-500 hover:text-indigo-600 cursor-pointer"
                  title="Zoom Out"
                />
                <input
                  type="range"
                  min={minSlider}
                  max={maxSlider}
                  step={(maxSlider - minSlider) / 100}
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <FaSearchPlus
                  onClick={() => setScale((s) => Math.min(maxSlider, s * 1.1))}
                  className="text-gray-500 hover:text-indigo-600 cursor-pointer"
                  title="Zoom In"
                />
                <span className="text-xs font-semibold text-gray-600 min-w-[45px] text-right">
                  {zoomPercent}%
                </span>
              </div>

              {/* Clear Instruction Tip below Zoom Slider */}
              <p className="text-center text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 py-1.5 px-3 rounded-lg">
                💡 Drag image to position • Scroll / Pinch trackpad to zoom
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center space-x-1 transition"
                >
                  <FaUpload /> <span>Change Image</span>
                </button>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleRotate(-90)}
                    className="p-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    title="Rotate Left"
                  >
                    <FaUndo />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRotate(90)}
                    className="p-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    title="Rotate Right"
                  >
                    <FaRedo />
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    title="Reset Fit, Position & Zoom"
                  >
                    <FaSync />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveCrop}
            disabled={!imageSrc || uploading}
            className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-md hover:shadow-lg flex items-center space-x-2 transition disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <FaCheck /> <span>Apply & Save Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FamilyPhotoCropModal;
