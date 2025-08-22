// src/components/modals/ChatContentModal.jsx
import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import api from '../../api/client';
import { useToast } from '../../contexts/ToastContext';
import ConfirmModal from '../ui/ConfirmModal';

const ChatContentModal = ({ campaign, onClose, onSave }) => {
  const { showSuccess, showError } = useToast();
  const [chatContent, setChatContent] = useState('');
  const [summary, setSummary] = useState('');
  const [attachments, setAttachments] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chatImages, setChatImages] = useState([]);
  const [printConfirm, setPrintConfirm] = useState({ isOpen: false });

  // 기존 카톡 내용 로드
  useEffect(() => {
    const loadChatContent = async () => {
      try {
        const { data } = await api.get(`/api/campaigns/${campaign.id}/chat-content`);
        setChatContent(data.chatContent || '');
        setSummary(data.chatSummary || '');
        setAttachments(data.chatAttachments || '');
      } catch (error) {
        console.error('카톡 내용 로드 실패:', error);
        // 에러가 발생해도 계속 진행 (빈 상태로 시작)
      } finally {
        setLoading(false);
      }
    };

    loadChatContent();
  }, [campaign.id]);

  // 이미지 리사이징 함수
  const resizeImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // 클립보드에서 이미지 붙여넣기 처리
  const handlePaste = async (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter(item => item.type.indexOf('image') !== -1);
    
    for (const item of imageItems) {
      const file = item.getAsFile();
      if (file) {
        try {
          // 이미지 리사이징
          const resizedBlob = await resizeImage(file);
          const resizedFile = new File([resizedBlob], `chat-image-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });
          
          // 미리보기용 URL 생성
          const previewUrl = URL.createObjectURL(resizedFile);
          
          setChatImages(prev => [...prev, {
            id: Date.now(),
            file: resizedFile,
            preview: previewUrl,
            name: resizedFile.name
          }]);
          
          console.log('카톡 이미지 추가됨:', resizedFile.name, '용량:', (resizedFile.size / 1024).toFixed(2) + 'KB');
        } catch (error) {
          console.error('이미지 처리 실패:', error);
          showError('이미지 처리에 실패했습니다.');
        }
      }
    }
  };

  // 이미지 삭제
  const removeImage = (imageId) => {
    setChatImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove?.preview) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let uploadedImageUrls = [];
      
      // 이미지 업로드 (있는 경우)
      if (chatImages.length > 0) {
        const formData = new FormData();
        chatImages.forEach(image => {
          formData.append('images', image.file);
        });
        
        console.log('카톡 이미지 업로드 중...', chatImages.length, '개');
        const imageResponse = await api.post(`/api/campaigns/${campaign.id}/chat-images`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        uploadedImageUrls = imageResponse.data.images || [];
        console.log('이미지 업로드 완료:', uploadedImageUrls.length, '개');
      }
      
      // 카톡 내용과 이미지 URL 저장
      const chatData = {
        chatContent,
        chatSummary: summary,
        chatAttachments: attachments + (uploadedImageUrls.length > 0 ? 
          '\n\n[카톡 스크린샷]\n' + uploadedImageUrls.map(img => `- ${img.originalName}: ${img.url}`).join('\n') : '')
      };
      
      await api.put(`/api/campaigns/${campaign.id}/chat-content`, chatData);
      showSuccess(`카톡 내용이 성공적으로 저장되었습니다.${uploadedImageUrls.length > 0 ? ` (이미지 ${uploadedImageUrls.length}개 포함)` : ''}`);
      onSave(chatData);
    } catch (error) {
      console.error('카톡 내용 저장 실패:', error);
      showError('카톡 내용 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDocument = () => {
    const documentHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>캠페인 카톡 정리 - ${campaign.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .section { margin-bottom: 30px; }
          .content { background: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 10px 0; }
          .chat-content { background: #e3f2fd; padding: 15px; border-radius: 8px; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>캠페인 카톡 정리</h1>
          <h2>${campaign.name}</h2>
          <p>클라이언트: ${campaign.client} | 생성일: ${new Date().toLocaleDateString('ko-KR')}</p>
        </div>
        
        <div class="section">
          <h3>📝 요약</h3>
          <div class="content">${summary || '요약 내용이 없습니다.'}</div>
        </div>
        
        <div class="section">
          <h3>💬 카톡 내용</h3>
          <div class="chat-content">${chatContent || '카톡 내용이 없습니다.'}</div>
        </div>
        
        <div class="section">
          <h3>📎 첨부파일/링크</h3>
          <div class="content">${attachments || '첨부파일이 없습니다.'}</div>
        </div>
        
        <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
          <p style="color: #666; font-size: 12px;">
            본 문서는 BrandFlow 캠페인 관리 시스템에서 생성되었습니다.<br>
            생성일시: ${new Date().toLocaleString('ko-KR')}
          </p>
        </div>
      </body>
      </html>
    `;
    
    const newWindow = window.open('', '_blank');
    newWindow.document.write(documentHTML);
    newWindow.document.close();
    
    setTimeout(() => {
      setPrintConfirm({ isOpen: true, newWindow });
    }, 500);
  };

  const handlePrintConfirm = () => {
    const { newWindow } = printConfirm;
    if (newWindow) {
      newWindow.print();
    }
    setPrintConfirm({ isOpen: false });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>카톡 내용을 불러오는 중...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">📱 카톡 내용 정리 - {campaign.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 요약 (주요 논의사항, 결정사항)
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
              placeholder="캠페인 관련 주요 논의사항이나 결정사항을 요약해주세요..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💬 카톡 내용 및 스크린샷 (Ctrl+V로 텍스트/이미지 붙여넣기)
            </label>
            <div 
              className="w-full border border-gray-300 rounded-lg overflow-hidden"
              onPaste={handlePaste}
            >
              <textarea
                value={chatContent}
                onChange={(e) => setChatContent(e.target.value)}
                className="w-full px-3 py-2 h-48 font-mono text-sm resize-none border-none outline-none"
                placeholder="카톡 대화 내용을 복사해서 붙여넣거나, 스크린샷을 Ctrl+V로 붙여넣어주세요...

예시:
[오후 2:30] 클라이언트: 안녕하세요, 캠페인 진행상황 어떻게 되나요?
[오후 2:31] 담당자: 안녕하세요! 현재 50% 진행되었습니다.
[오후 2:32] 클라이언트: 언제 완료 예정인가요?"
              />
              
              {/* 카톡 스크린샷 이미지들 */}
              {chatImages.length > 0 && (
                <div className="border-t border-gray-200 p-3 bg-gray-50">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    📷 카톡 스크린샷 ({chatImages.length}개)
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {chatImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.preview}
                          alt={image.name}
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          onClick={() => removeImage(image.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {(image.file.size / 1024).toFixed(1)}KB
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              💡 팁: 카톡 스크린샷을 찍고 Ctrl+C → Ctrl+V로 바로 붙여넣기! 자동으로 용량 최적화됩니다.
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📎 첨부파일/링크
            </label>
            <textarea
              value={attachments}
              onChange={(e) => setAttachments(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
              placeholder="첨부파일명, 링크, 이미지 설명 등을 기록해주세요..."
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleGenerateDocument}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <FileText size={16} />
            문서 생성
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
      
      <ConfirmModal
        isOpen={printConfirm.isOpen}
        onConfirm={handlePrintConfirm}
        onCancel={() => setPrintConfirm({ isOpen: false })}
        title="문서 인쇄"
        message="카톡 정리 문서를 인쇄하시겠습니까?\n인쇄 후 PDF로 저장하거나 이미지로 캡처할 수 있습니다."
        confirmText="인쇄"
        cancelText="취소"
        type="info"
      />
    </div>
  );
};

export default ChatContentModal;