import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * 재사용 가능한 삭제 확인 모달 컴포넌트
 * @param {object} props
 * @param {boolean} props.isOpen - 모달이 열려있는지 여부
 * @param {string} props.itemType - 삭제할 아이템의 종류 (예: "콘텐츠", "사용자")
 * @param {string} props.itemName - 삭제할 아이템의 이름
 * @param {function} props.onConfirm - 삭제 확인 버튼 클릭 시 호출될 함수
 * @param {function} props.onClose - 취소 버튼 또는 배경 클릭 시 호출될 함수
 */
const DeleteModal = ({ isOpen, itemType, itemName, onConfirm, onClose }) => {
    // isOpen이 false이면 아무것도 렌더링하지 않음
    if (!isOpen) {
        return null;
    }
    
    // 한국어 조사(을/를)를 아이템 타입에 맞게 조정
    const objectMarker = itemType.endsWith('츠') || itemType.endsWith('자') ? '를' : '을';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                        <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            {itemType} 삭제
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">
                                "{itemName}" {itemType}{objectMarker} 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                        삭제
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm"
                    >
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;