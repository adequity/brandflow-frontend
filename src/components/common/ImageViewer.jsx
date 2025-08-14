import React from 'react';
import { X, Download } from 'lucide-react';

const ImageViewer = ({ images, onRemove }) => {
  if (!images || images.length === 0) return null;

  const downloadImage = (imageData, fileName) => {
    const link = document.createElement('a');
    link.href = imageData.data;
    link.download = fileName || 'image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-medium text-gray-700">첨부된 이미지:</h4>
      <div className="grid grid-cols-2 gap-3">
        {images.map((image, index) => (
          <div key={index} className="relative group border rounded-lg overflow-hidden">
            <img 
              src={image.data} 
              alt={image.name}
              className="w-full h-24 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100">
              <button
                onClick={() => downloadImage(image, image.name)}
                className="p-1.5 bg-white rounded-full text-gray-600 hover:text-blue-600"
                title="다운로드"
              >
                <Download size={14} />
              </button>
              <button
                onClick={() => onRemove(index)}
                className="p-1.5 bg-white rounded-full text-gray-600 hover:text-red-600"
                title="제거"
              >
                <X size={14} />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
              <p className="text-xs text-white truncate">{image.name}</p>
              <p className="text-xs text-gray-300">{(image.size / 1024).toFixed(1)}KB</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageViewer;