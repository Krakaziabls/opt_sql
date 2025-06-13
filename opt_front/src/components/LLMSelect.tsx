// src/components/LLMSelect.tsx
import React from 'react';
import * as Select from "@radix-ui/react-select";
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons";
import { cn } from "../lib/utils";

interface LLMSelectProps {
    selectedLLM: string;
    onSelectLLM: (llm: string) => void;
}

const LLMSelect: React.FC<LLMSelectProps> = ({ selectedLLM, onSelectLLM }) => {
    return (
        <Select.Root value={selectedLLM} onValueChange={onSelectLLM}>
            <Select.Trigger
                className={cn(
                    "bg-secondary text-text px-4 py-2 rounded-lg inline-flex items-center justify-between w-48 outline-none",
                    "hover:bg-[#2563EB] transition-colors"
                )}
            >
                <Select.Value placeholder="Select LLM" />
                <Select.Icon>
                    <ChevronDownIcon />
                </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
                <Select.Content className="bg-secondary text-text rounded-lg shadow-lg z-50">
                    <Select.ScrollUpButton />
                    <Select.Viewport>
                        <Select.Item value="GigaChat" className="px-4 py-2 hover:bg-primary cursor-pointer relative">
                            <Select.ItemText>GigaChat</Select.ItemText>
                            <Select.ItemIndicator className="absolute right-2">
                                <CheckIcon />
                            </Select.ItemIndicator>
                        </Select.Item>
                        <Select.Item value="Local" className="px-4 py-2 hover:bg-primary cursor-pointer relative">
                            <Select.ItemText>Local</Select.ItemText>
                            <Select.ItemIndicator className="absolute right-2">
                                <CheckIcon />
                            </Select.ItemIndicator>
                        </Select.Item>
                    </Select.Viewport>
                    <Select.ScrollDownButton />
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
};

export default LLMSelect;
