import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';

const NewCampaignModalSimple = ({ onSave, onClose }) => {
    const { showWarning } = useToast();
    const [campaignName, setCampaignName] = useState('');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!campaignName.trim()) {
            showWarning('캠페인명을 입력해주세요.');
            return;
        }
        onSave({ name: campaignName });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-xl font-bold mb-6">새 캠페인 생성 (간단버전)</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            캠페인명
                        </label>
                        <input 
                            type="text" 
                            name="name" 
                            id="name" 
                            value={campaignName} 
                            onChange={(e) => setCampaignName(e.target.value)} 
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" 
                            placeholder="캠페인명을 입력하세요"
                            required 
                        />
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                        >
                            취소
                        </button>
                        <button 
                            type="submit" 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            생성
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewCampaignModalSimple;