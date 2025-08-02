import React, { useState } from 'react';

const LinkRegisterModal = ({ onSave, onClose, initialUrl }) => {
    const [url, setUrl] = useState(initialUrl || '');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">{initialUrl ? '발행 링크 수정' : '발행 링크 등록'}</h3>
                <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="https://..."
                />
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">취소</button>
                    <button onClick={() => onSave(url)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">등록하기</button>
                </div>
            </div>
        </div>
    );
};

export default LinkRegisterModal;