import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, Image as ImageIcon, Palette, Trash2 } from 'lucide-react';

export interface MagazineConfig {
  title: string;
  storeName: string;
  phone: string;
  month: string;
  coverImage: string;
  logo: string;
  theme: 'blue' | 'red' | 'green' | 'orange' | 'purple' | 'pink' | 'teal' | 'yellow' | 'indigo' | 'rose';
}

interface MagazineSettingsProps {
  config: MagazineConfig;
  onConfigChange: (config: MagazineConfig) => void;
}

const THEMES = {
  blue: {
    name: 'أزرق',
    primary: '#3b82f6',
    secondary: '#2563eb',
    accent: '#60a5fa',
  },
  red: {
    name: 'أحمر',
    primary: '#ef4444',
    secondary: '#dc2626',
    accent: '#f87171',
  },
  green: {
    name: 'أخضر',
    primary: '#10b981',
    secondary: '#059669',
    accent: '#34d399',
  },
  orange: {
    name: 'برتقالي',
    primary: '#f97316',
    secondary: '#ea580c',
    accent: '#fb923c',
  },
  purple: {
    name: 'بنفسجي',
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#a855f7',
  },
  pink: {
    name: 'وردي',
    primary: '#ec4899',
    secondary: '#db2777',
    accent: '#ec4899',
  },
  teal: {
    name: 'سمائي مائي',
    primary: '#14b8a6',
    secondary: '#0d9488',
    accent: '#16a34a',
  },
  yellow: {
    name: 'صفراء',
    primary: '#eab308',
    secondary: '#ca8a04',
    accent: '#facc15',
  },
  indigo: {
    name: 'بنفسجي غامق',
    primary: '#6366f1',
    secondary: '#4f46e5',
    accent: '#818cf8',
  },
  rose: {
    name: 'وردي غامق',
    primary: '#f43f5e',
    secondary: '#ec4899',
    accent: '#ec4899',
  },
};

export function MagazineSettings({ config, onConfigChange }: MagazineSettingsProps) {
  const [formData, setFormData] = useState(config);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleImageUpload = (field: 'coverImage' | 'logo') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newConfig = { ...formData, [field]: reader.result as string };
        setFormData(newConfig);
        onConfigChange(newConfig);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (field: keyof MagazineConfig, value: string) => {
    const newConfig = { ...formData, [field]: value };
    setFormData(newConfig);
    onConfigChange(newConfig);
  };

  const handleDeleteImage = (field: 'coverImage' | 'logo') => {
    const newConfig = { ...formData, [field]: '' };
    setFormData(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <div 
      className="rounded-xl shadow-lg overflow-hidden print:hidden"
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        border: '2px solid #f59e0b',
        fontFamily: 'Cairo, sans-serif',
      }}
    >
      <div 
        className="px-4 py-3 flex items-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        }}
      >
        <div 
          className="p-1.5 rounded-lg"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        >
          <Palette className="size-5 text-white" />
        </div>
        <h2 
          className="text-xl font-bold text-white"
          style={{ fontFamily: 'Cairo, sans-serif' }}
        >
          إعدادات المجلة
        </h2>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Magazine Title */}
          <div className="space-y-1">
            <Label 
              htmlFor="title" 
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: '#92400e', fontFamily: 'Cairo, sans-serif' }}
            >
              عنوان المجلة
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="هايبر براند"
              className="text-sm h-9"
              style={{
                borderColor: '#fbbf24',
                fontFamily: 'Cairo, sans-serif',
              }}
            />
          </div>

          {/* Store Name */}
          <div className="space-y-1">
            <Label 
              htmlFor="storeName" 
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: '#92400e', fontFamily: 'Cairo, sans-serif' }}
            >
              اسم المتجر
            </Label>
            <Input
              id="storeName"
              value={formData.storeName}
              onChange={(e) => handleChange('storeName', e.target.value)}
              placeholder="سوبر ماركت هايبر براند"
              className="text-sm h-9"
              style={{
                borderColor: '#fbbf24',
                fontFamily: 'Cairo, sans-serif',
              }}
            />
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label 
              htmlFor="phone" 
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: '#92400e', fontFamily: 'Cairo, sans-serif' }}
            >
              رقم الهاتف
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="0123456789"
              className="text-sm h-9"
              style={{
                borderColor: '#fbbf24',
                fontFamily: 'Cairo, sans-serif',
              }}
            />
          </div>

          {/* Theme */}
          <div className="space-y-1">
            <Label 
              htmlFor="theme" 
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: '#92400e', fontFamily: 'Cairo, sans-serif' }}
            >
              <Palette className="size-3.5" />
              ثيم المجلة
            </Label>
            <Select
              value={formData.theme}
              onValueChange={(value: 'blue' | 'red' | 'green' | 'orange' | 'purple' | 'pink' | 'teal' | 'yellow' | 'indigo' | 'rose') => handleChange('theme', value)}
            >
              <SelectTrigger 
                className="h-9"
                style={{
                  borderColor: '#fbbf24',
                  fontFamily: 'Cairo, sans-serif',
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(THEMES).map(([key, theme]) => (
                  <SelectItem 
                    key={key} 
                    value={key}
                    style={{ fontFamily: 'Cairo, sans-serif' }}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: theme.primary }}
                      />
                      {theme.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-1">
            <Label 
              htmlFor="coverImage" 
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: '#92400e', fontFamily: 'Cairo, sans-serif' }}
            >
              <ImageIcon className="size-3.5" />
              صورة الغلاف
            </Label>
            <div className="flex gap-2">
              <Input
                id="coverImage"
                type="file"
                accept="image/*"
                onChange={handleImageUpload('coverImage')}
                className="text-xs cursor-pointer h-9 flex-1"
                style={{
                  borderColor: '#fbbf24',
                  fontFamily: 'Cairo, sans-serif',
                }}
              />
              {formData.coverImage && (
                <Button
                  onClick={() => handleDeleteImage('coverImage')}
                  className="h-9"
                  style={{
                    borderColor: '#fbbf24',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-1">
            <Label 
              htmlFor="logo" 
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: '#92400e', fontFamily: 'Cairo, sans-serif' }}
            >
              <Upload className="size-3.5" />
              لوجو المتجر
            </Label>
            <div className="flex gap-2">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleImageUpload('logo')}
                className="text-xs cursor-pointer h-9 flex-1"
                style={{
                  borderColor: '#fbbf24',
                  fontFamily: 'Cairo, sans-serif',
                }}
              />
              {formData.logo && (
                <Button
                  onClick={() => handleDeleteImage('logo')}
                  className="h-9"
                  style={{
                    borderColor: '#fbbf24',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-2 gap-4">
              {formData.coverImage && (
                <div className="space-y-1">
                  <Label 
                    className="flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: '#92400e', fontFamily: 'Cairo, sans-serif' }}
                  >
                    معاينة الغلاف
                  </Label>
                  <div 
                    className="relative w-full h-32 rounded-lg overflow-hidden shadow-md"
                    style={{ border: '2px solid #fbbf24' }}
                  >
                    <img
                      src={formData.coverImage}
                      alt="معاينة الغلاف"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              {formData.logo && (
                <div className="space-y-1">
                  <Label 
                    className="flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: '#92400e', fontFamily: 'Cairo, sans-serif' }}
                  >
                    معاينة اللوجو
                  </Label>
                  <div 
                    className="relative w-full h-32 rounded-lg overflow-hidden shadow-md bg-white flex items-center justify-center"
                    style={{ border: '2px solid #fbbf24' }}
                  >
                    <img
                      src={formData.logo}
                      alt="معاينة اللوجو"
                      className="max-w-full max-h-full object-contain p-2"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { THEMES };