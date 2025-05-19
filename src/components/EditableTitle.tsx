import React, { useState, useEffect, useRef } from 'react';
import { Pencil } from 'lucide-react';

interface EditableTitleProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  inputClassName?: string;
}

export default function EditableTitle({ value, onSave, className = '', inputClassName = '' }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleSave = () => {
    if (editValue.trim() !== '' && editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`px-2 py-1 rounded border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputClassName}`}
      />
    );
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <h3
        onClick={() => setIsEditing(true)}
        className={`cursor-pointer hover:bg-black/5 rounded px-2 py-1 -mx-2 ${className}`}
      >
        {value}
      </h3>
      {isHovered && !isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute -right-6 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}