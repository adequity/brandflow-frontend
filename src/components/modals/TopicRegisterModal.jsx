import React, { useState } from 'react';

const TopicRegisterModal = ({ onSave, onClose }) => {
    const [title, setTitle] = useState('');
    const [workType, setWorkType] = useState('블로그');

    const workTypes = [
        '블로그',
        '디자인',
        '마케팅',
        '개발',
        '영상',
        '기획',
        '기타'
    ];

    const handleSave = () => {
        onSave({ title, workType });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">새 업무 등록</h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">업무 타입</label>
                        <select
                            value={workType}
                            onChange={(e) => setWorkType(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                        >
                            {workTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">업무 내용</label>
                        <textarea
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            rows="4"
                            placeholder="업무 내용을 입력하세요..."
                        />
                    </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">취소</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">등록 및 승인 요청</button>
                </div>
            </div>
        </div>
    );
};

export default TopicRegisterModal;