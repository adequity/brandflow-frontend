import React, { useState } from 'react';
import { Image, X } from 'lucide-react';

const ImagePreview = ({ images }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  if (!images || images.length === 0) return null;

  const openImageModal = (image) => {
    setSelectedImage(image);
    setShowModal(true);
  };

  return (
    <>
      <div className="flex items-center space-x-1">
        <Image size={14} className="text-blue-500" />
        <button
          onClick={() => openImageModal(images[0])}
          className="text-xs text-blue-600 hover:underline"
        >
          {images.length}개 이미지
        </button>
      </div>

      {/* 이미지 모달 */}
      {showModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 z-10"
            >
              <X size={20} />
            </button>
            <img 
              src={selectedImage.data} 
              alt={selectedImage.name}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded">
              <p className="text-sm">{selectedImage.name}</p>
              <p className="text-xs text-gray-300">{(selectedImage.size / 1024).toFixed(1)}KB</p>
            </div>
            
            {/* 여러 이미지일 때 네비게이션 */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded flex space-x-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(img)}
                    className={`w-8 h-8 rounded border-2 overflow-hidden ${
                      selectedImage === img ? 'border-blue-400' : 'border-transparent'
                    }`}
                  >
                    <img 
                      src={img.data} 
                      alt={`이미지 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImagePreview;