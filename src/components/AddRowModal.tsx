import React, { useState } from 'react';
import { X, Plus, Hash, Type } from 'lucide-react';
import { ColumnType, DataRow, Dataset } from '../types';

interface AddRowModalProps {
  dataset: Dataset;
  isOpen: boolean;
  onClose: () => void;
  onAddRow: (row: DataRow) => void;
}

export const AddRowModal: React.FC<AddRowModalProps> = ({
  dataset,
  isOpen,
  onClose,
  onAddRow
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleChange = (column: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRow: DataRow = {};

    dataset.columns.forEach(col => {
      const raw = formData[col];
      const type = dataset.columnTypes[col];

      if (raw === undefined || raw.trim() === '') {
        newRow[col] = null;
      } else if (type === 'numeric') {
        const num = Number(raw.trim());
        newRow[col] = isNaN(num) ? null : num;
      } else {
        newRow[col] = raw.trim();
      }
    });

    onAddRow(newRow);
    setFormData({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-neutral-200 max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-neutral-800" />
              <span>Add New Record to Dataset</span>
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Insert a new sample row into <strong>{dataset.name}</strong>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3">
          {dataset.columns.map(col => {
            const isNumeric = dataset.columnTypes[col] === 'numeric';
            return (
              <div key={col} className="space-y-1">
                <label className="text-xs font-medium text-neutral-700 flex items-center justify-between">
                  <span className="flex items-center gap-1 font-mono">
                    {isNumeric ? (
                      <Hash className="w-3 h-3 text-blue-600" />
                    ) : (
                      <Type className="w-3 h-3 text-amber-600" />
                    )}
                    <span>{col}</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {isNumeric ? 'Numeric' : 'Categorical'}
                  </span>
                </label>
                <input
                  type={isNumeric ? 'number' : 'text'}
                  step="any"
                  placeholder={isNumeric ? 'e.g. 42' : 'e.g. Value'}
                  value={formData[col] || ''}
                  onChange={(e) => handleChange(col, e.target.value)}
                  className="w-full text-xs px-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-md focus:bg-white focus:border-neutral-900 focus:outline-none transition-colors font-mono"
                />
              </div>
            );
          })}

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors cursor-pointer shadow-xs"
            >
              Append Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
