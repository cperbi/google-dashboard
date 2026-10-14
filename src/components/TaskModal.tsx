import React, { useState, useEffect } from 'react';
import { X, Calendar, Percent, Camera, FileText, CheckCircle2 } from 'lucide-react';
import { ActivityTask, Category } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: ActivityTask) => void;
  initialTask?: ActivityTask | null;
  defaultCategory?: Category;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  defaultCategory = '陳列輔銷'
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>(defaultCategory);
  const [achievementRate, setAchievementRate] = useState<number>(85);
  const [startDate, setStartDate] = useState('2026-03-01');
  const [endDate, setEndDate] = useState('2026-03-31');
  const [requirePhoto, setRequirePhoto] = useState<boolean>(true);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setCategory(initialTask.category);
      setAchievementRate(initialTask.achievementRate);
      setStartDate(initialTask.startDate);
      setEndDate(initialTask.endDate);
      setRequirePhoto(initialTask.requirePhoto);
      setDescription(initialTask.description);
    } else {
      setTitle('');
      setCategory(defaultCategory);
      setAchievementRate(85);
      setStartDate('2026-03-01');
      setEndDate('2026-03-31');
      setRequirePhoto(true);
      setDescription('');
    }
  }, [initialTask, defaultCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: ActivityTask = {
      id: initialTask?.id || `task-${Date.now()}`,
      title: title.trim(),
      category,
      achievementRate: Number(achievementRate),
      startDate,
      endDate,
      requirePhoto,
      description: description.trim(),
      status: initialTask?.status || 'pending',
      unexecutedReason: initialTask?.unexecutedReason,
      executionNotes: initialTask?.executionNotes,
      photos: initialTask?.photos || []
    };

    onSave(newTask);
    onClose();
  };

  const categories: Category[] = ['簽約提報', '陳列輔銷', '盤點退轉', '寄單收款'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-400" size={20} />
            <h2 className="text-base font-bold tracking-tight">
              {initialTask ? '編輯代辦活動事項' : '新增代辦活動事項'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* 1. 主旨 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. 主旨 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例如：2026軟糖季"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* 2. 類別 (行為) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. 所屬行為類別 <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all text-left flex items-center justify-between ${
                    category === cat
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{cat}</span>
                  {category === cat && <CheckCircle2 size={14} className="text-blue-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* 3 & 4. 時間起迄 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                3. 開始日期
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                4. 結束日期
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 5. 是否需要拍照 */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg ${requirePhoto ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>
                <Camera size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">5. 是否需要拍照存證</p>
                <p className="text-[11px] text-slate-500">業務執行時須拍攝陳列或門市現場照</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requirePhoto}
                onChange={(e) => setRequirePhoto(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 6. 活動描述 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              6. 活動描述
            </label>
            <textarea
              rows={3}
              placeholder="請詳細填寫本活動執行的注意事項、重點溝通品項及要求..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95"
            >
              確認儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
