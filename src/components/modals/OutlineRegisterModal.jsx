import React, { useState } from 'react';

const OutlineRegisterModal = ({ onSave, onClose }) => {
    const [outline, setOutline] = useState('');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">목차 등록</h3>
                <textarea
                    value={outline}
                    onChange={(e) => setOutline(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    rows="6"
                    placeholder="등록할 목차를 입력하세요..."
                />
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">취소</button>
                    <button onClick={() => onSave(outline)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">저장 및 승인 요청</button>
                </div>
            </div>
        </div>
    );
};

export default OutlineRegisterModal;