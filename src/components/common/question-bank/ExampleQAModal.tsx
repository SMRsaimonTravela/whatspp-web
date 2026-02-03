import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../ui/dialog';
import { questionExamples } from '../../../constants/questionExamples';

interface ExampleQAModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ExampleQAModal: React.FC<ExampleQAModalProps> = ({
    open,
    onOpenChange,
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-2xl max-h-[80vh] overflow-y-auto"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 transparent',
                }}
            >
                <div className="dialog-content">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">EXAMPLES</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 text-sm">
                        {questionExamples.map((example, index) => (
                            <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-b-0">
                                <div className="mb-1">
                                    <strong className="text-gray-900 dark:text-white">Q:</strong>
                                    <span className="ml-2 text-gray-700 dark:text-gray-300">{example.question}</span>
                                </div>
                                <div>
                                    <strong className="text-gray-900 dark:text-white">A:</strong>
                                    <span className="ml-2 text-gray-700 dark:text-gray-300 whitespace-pre-line">{example.answer}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
