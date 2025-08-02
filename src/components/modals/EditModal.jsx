import React, { useState } from 'react';

const EditModal = ({ post, type, onSave, onClose }) => {
    const isTopic = type === 'topic';
    const [content, setContent] = useState(isTopic ? post.title : post.outline);

    const handleSave = () => {
        onSave(content);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">{isTopic ? '주제 수정' : '목차 수정'}</h3>
                <textarea
                    value={content || ''}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                    rows="4"
                />
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">취소</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">재요청하기</button>
                </div>
            </div>
        </div>
    );
};

export default EditModal;