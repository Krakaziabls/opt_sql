// src/components/ConfirmModal.tsx
import React from 'react';
import { Button } from './Button';

interface ConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    message: React.ReactNode;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    open,
    onClose,
    onConfirm,
    message,
}) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-secondary p-6 rounded-lg text-text w-96">
                <h2 className="text-lg font-semibold mb-4">Confirm Action</h2>
                <div className="mb-4">
                    {message}
                </div>
                <div className="flex justify-end space-x-2">
                    <Button onClick={onClose} variant="outline">
                        Cancel
                    </Button>
                    <Button onClick={onConfirm}>Confirm</Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
