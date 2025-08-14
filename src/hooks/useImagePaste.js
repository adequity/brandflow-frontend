import { useState } from 'react';

const useImagePaste = (onImageAdd) => {
  const [isDragging, setIsDragging] = useState(false);

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await processImage(file);
        }
      }
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    for (let file of files) {
      if (file.type.startsWith('image/')) {
        await processImage(file);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processImage = async (file) => {
    // 이미지 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB를 초과할 수 없습니다.');
      return;
    }

    try {
      // 이미지 리사이징
      const resizedFile = await resizeImage(file, 800, 600); // 최대 800x600으로 리사이징
      
      // FormData 생성
      const formData = new FormData();
      formData.append('image', resizedFile);

      // 서버에 업로드 (임시로 base64로 처리)
      const base64 = await fileToBase64(resizedFile);
      const imageData = {
        name: file.name,
        size: resizedFile.size,
        type: resizedFile.type,
        data: base64
      };

      onImageAdd(imageData);
    } catch (error) {
      console.error('이미지 처리 실패:', error);
      alert('이미지 처리 중 오류가 발생했습니다.');
    }
  };

  const resizeImage = (file, maxWidth, maxHeight) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 비율 계산
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, file.type, 0.8); // 80% 품질
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return {
    handlePaste,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    isDragging
  };
};

export default useImagePaste;