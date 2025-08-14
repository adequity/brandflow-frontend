import React, { useState } from 'react';
import { ImagePlus } from 'lucide-react';
import useImagePaste from '../../hooks/useImagePaste';
import ImageViewer from '../common/ImageViewer';

const OutlineRegisterModal = ({ onSave, onClose }) => {
    const [outline, setOutline] = useState('');
    const [images, setImages] = useState([]);

    const handleImageAdd = (imageData) => {
        setImages(prev => [...prev, imageData]);
    };

    const handleImageRemove = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const { handlePaste, handleDrop, handleDragOver, handleDragLeave, isDragging } = useImagePaste(handleImageAdd);

    const handleSave = () => {
        const data = {
            text: outline,
            images: images
        };
        onSave(data);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">세부사항 등록</h3>
                <div 
                    className={`relative ${
                        isDragging 
                            ? 'border-2 border-dashed border-blue-400 bg-blue-50' 
                            : 'border border-gray-300'
                    } rounded-lg transition-all duration-200`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <textarea
                        value={outline}
                        onChange={(e) => setOutline(e.target.value)}
                        onPaste={handlePaste}
                        className="w-full p-3 text-sm resize-none border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="6"
                        placeholder="세부사항을 입력하세요...&#10;&#10;💡 팁: Ctrl+V로 이미지를 바로 붙여넣을 수 있습니다!"
                    />
                    {isDragging && (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-90 rounded-lg">
                            <div className="text-center">
                                <ImagePlus size={32} className="mx-auto text-blue-500 mb-2" />
                                <p className="text-blue-600 font-medium">이미지를 놓아주세요</p>
                            </div>
                        </div>
                    )}
                </div>
                <ImageViewer images={images} onRemove={handleImageRemove} />
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">취소</button>
                    <button 
                        onClick={handleSave} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        disabled={!outline.trim()}
                    >
                        저장 및 승인 요청 {images.length > 0 && `(${images.length}개 이미지 포함)`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OutlineRegisterModal;