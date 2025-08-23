import React, { useState, useRef } from 'react';
import { Upload, X, Eye, Check } from 'lucide-react';
import api from '../api/client';

const LogoUpload = ({ currentLogo, onLogoUpdate }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (file) => {
        if (!file) return;

        // 파일 타입 검증
        if (!file.type.startsWith('image/')) {
            alert('이미지 파일만 업로드 가능합니다.');
            return;
        }

        // 파일 크기 검증 (5MB 제한)
        if (file.size > 5 * 1024 * 1024) {
            alert('파일 크기는 5MB 이하여야 합니다.');
            return;
        }

        // 미리보기 생성
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleUpload = async () => {
        if (!preview) return;

        setIsUploading(true);
        try {
            // API 호출로 로고 업로드
            const response = await api.post('/api/company/logo', {
                logoUrl: preview
            });

            const logoData = response.data;
            
            // 현재 사용자의 회사 정보 가져오기
            const userData = localStorage.getItem('user');
            const user = userData ? JSON.parse(userData) : null;
            const companyName = user?.company || 'default';
            
            // 회사별 localStorage에 저장하여 즉시 반영
            const companyLogoKey = `companyLogo_${companyName}`;
            localStorage.setItem(companyLogoKey, JSON.stringify({
                logoUrl: logoData.logoUrl,
                uploadedAt: logoData.uploadedAt,
                companyId: logoData.companyId
            }));
            
            onLogoUpdate?.({
                logoUrl: logoData.logoUrl,
                uploadedAt: logoData.uploadedAt
            });
            setPreview(null);
            
            alert('로고가 성공적으로 업로드되었습니다!');
        } catch (error) {
            console.error('로고 업로드 실패:', error);
            alert(error.message || '로고 업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemovePreview = () => {
        setPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveLogo = async () => {
        try {
            // API 호출로 로고 제거
            await api.delete('/api/company/logo');

            // 현재 사용자의 회사 정보 가져오기
            const userData = localStorage.getItem('user');
            const user = userData ? JSON.parse(userData) : null;
            const companyName = user?.company || 'default';
            
            // 회사별 localStorage에서 제거
            const companyLogoKey = `companyLogo_${companyName}`;
            localStorage.removeItem(companyLogoKey);
            onLogoUpdate?.(null);
            alert('로고가 제거되었습니다.');
        } catch (error) {
            console.error('로고 제거 실패:', error);
            alert(error.message || '로고 제거에 실패했습니다.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">회사 로고 설정</h3>
            
            {/* 현재 로고 표시 */}
            {currentLogo && !preview && (
                <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">현재 로고:</p>
                    <div className="flex items-center space-x-4">
                        <div className="w-32 h-16 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                            <img 
                                src={currentLogo.logoUrl} 
                                alt="Current Logo" 
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                        <button
                            onClick={handleRemoveLogo}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200"
                        >
                            로고 제거
                        </button>
                    </div>
                </div>
            )}

            {/* 파일 업로드 영역 */}
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                {preview ? (
                    <div className="space-y-4">
                        <div className="w-48 h-24 mx-auto border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                            <img 
                                src={preview} 
                                alt="Preview" 
                                className="max-w-full max-h-full object-contain"
                            />
                        </div>
                        <div className="flex justify-center space-x-2">
                            <button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Check size={16} className="mr-2" />
                                {isUploading ? '업로드 중...' : '로고 저장'}
                            </button>
                            <button
                                onClick={handleRemovePreview}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                <X size={16} className="mr-2" />
                                취소
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Upload size={48} className="mx-auto text-gray-400" />
                        <div>
                            <p className="text-lg font-medium text-gray-700">로고 파일 업로드</p>
                            <p className="text-sm text-gray-500 mt-1">
                                PNG, JPG, GIF 파일을 드래그하거나 클릭하여 선택하세요
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                권장 크기: 200x100px, 최대 5MB
                            </p>
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-2 border border-blue-300 text-blue-600 rounded-md hover:bg-blue-50"
                        >
                            파일 선택
                        </button>
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
            />

            {/* 안내사항 */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">로고 업로드 안내:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                    <li>• 로고는 사이드바와 로그인 페이지에 표시됩니다</li>
                    <li>• 투명 배경 PNG 파일을 권장합니다</li>
                    <li>• 가로:세로 비율 2:1 정도가 최적입니다</li>
                    <li>• 로고 변경 시 모든 페이지에 즉시 반영됩니다</li>
                </ul>
            </div>
        </div>
    );
};

export default LogoUpload;