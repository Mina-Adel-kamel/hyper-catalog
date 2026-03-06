import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Product } from './ProductCard';
import { Package, Tag, DollarSign, Image, FileText, X, Loader2 } from 'lucide-react';
import { compressImage } from '../../lib/imageCompression';
import { toast } from 'sonner';

interface ProductFormProps {
  onSubmit: (product: Omit<Product, 'id'> & { id?: string }) => void;
  editingProduct: Product | null;
  onCancel: () => void;
  categories?: string[];
}

export function ProductForm({ onSubmit, editingProduct, onCancel, categories }: ProductFormProps) {
  // Use provided categories or fallback to empty array
  const availableCategories = categories || [];
  
  const [formData, setFormData] = useState({
    name: '',
    category: availableCategories[0] || '',
    description: '',
    price: '',
    oldPrice: '',
    image: '',
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        category: editingProduct.category,
        description: editingProduct.description,
        price: editingProduct.price.toString(),
        oldPrice: editingProduct.oldPrice?.toString() || '',
        image: editingProduct.image,
      });
    } else {
      setFormData({
        name: '',
        category: availableCategories[0] || '',
        description: '',
        price: '',
        oldPrice: '',
        image: '',
      });
    }
  }, [editingProduct, availableCategories]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Show loading toast
        const toastId = toast.loading('جاري ضغط الصورة...');
        
        // Compress the image first
        const compressedFile = await compressImage(file);
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData({ ...formData, image: reader.result as string });
          toast.dismiss(toastId);
          toast.success('تم ضغط الصورة بنجاح!');
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error('Error compressing image:', error);
        toast.error('حدث خطأ أثناء ضغط الصورة');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.image) {
      alert('الرجاء ملء جميع الحقو�� المطلوبة');
      return;
    }

    onSubmit({
      ...(editingProduct && { id: editingProduct.id }),
      name: formData.name,
      category: formData.category,
      description: formData.description,
      price: parseFloat(formData.price),
      oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : undefined,
      image: formData.image,
    });

    setFormData({
      name: '',
      category: availableCategories[0] || '',
      description: '',
      price: '',
      oldPrice: '',
      image: '',
    });
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="rounded-xl shadow-lg overflow-hidden print:hidden max-w-4xl mx-auto"
      dir="rtl"
      style={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        border: '2px solid #3b82f6',
        fontFamily: 'Cairo, sans-serif',
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <Package className="size-5 text-white" />
          </div>
          <h2 
            className="text-xl font-bold text-white"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            {editingProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}
          </h2>
        </div>
        {editingProduct && (
          <Button 
            type="button" 
            size="sm"
            onClick={onCancel}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
            }}
            className="hover:bg-white/30 p-1"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Form Body */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Name */}
          <div className="space-y-1">
            <Label 
              htmlFor="name" 
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: '#1e40af', fontFamily: 'Cairo, sans-serif' }}
            >
              <Package className="size-3.5" />
              اسم المنتج *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: زيت عباد الشمس"
              required
              className="text-sm h-9"
              style={{
                borderColor: '#93c5fd',
                fontFamily: 'Cairo, sans-serif',
              }}
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label 
              htmlFor="category" 
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: '#1e40af', fontFamily: 'Cairo, sans-serif' }}
            >
              <Tag className="size-3.5" />
              القسم *
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger 
                className="h-9"
                style={{
                  borderColor: '#93c5fd',
                  fontFamily: 'Cairo, sans-serif',
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((cat) => (
                  <SelectItem 
                    key={cat} 
                    value={cat}
                    style={{ fontFamily: 'Cairo, sans-serif' }}
                  >
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <Label 
              htmlFor="price" 
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: '#1e40af', fontFamily: 'Cairo, sans-serif' }}
            >
              <DollarSign className="size-3.5" />
              السعر (جنيه) *
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="70"
              required
              className="text-sm h-9"
              style={{
                borderColor: '#93c5fd',
                fontFamily: 'Cairo, sans-serif',
              }}
            />
          </div>

          {/* Old Price */}
          <div className="space-y-1">
            <Label 
              htmlFor="oldPrice" 
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: '#1e40af', fontFamily: 'Cairo, sans-serif' }}
            >
              <DollarSign className="size-3.5" />
              السعر القديم (جنيه)
            </Label>
            <Input
              id="oldPrice"
              type="number"
              step="0.01"
              value={formData.oldPrice}
              onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
              placeholder="80"
              className="text-sm h-9"
              style={{
                borderColor: '#93c5fd',
                fontFamily: 'Cairo, sans-serif',
              }}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-1">
            <Label 
              htmlFor="image" 
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: '#1e40af', fontFamily: 'Cairo, sans-serif' }}
            >
              <Image className="size-3.5" />
              صورة المنتج *
            </Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-xs cursor-pointer h-9"
              style={{
                borderColor: '#93c5fd',
                fontFamily: 'Cairo, sans-serif',
              }}
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2 space-y-1">
            <Label 
              htmlFor="description" 
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: '#1e40af', fontFamily: 'Cairo, sans-serif' }}
            >
              <FileText className="size-3.5" />
              الوصف
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="مثال: زيت طبخ 1 لتر"
              rows={2}
              className="text-sm resize-none"
              style={{
                borderColor: '#93c5fd',
                fontFamily: 'Cairo, sans-serif',
              }}
            />
          </div>

          {/* Image Preview */}
          {formData.image && (
            <div className="md:col-span-2 space-y-1">
              <Label 
                className="flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: '#1e40af', fontFamily: 'Cairo, sans-serif' }}
              >
                <Image className="size-3.5" />
                معاينة الصورة
              </Label>
              <div 
                className="relative w-28 h-28 rounded-lg overflow-hidden shadow-md"
                style={{ border: '2px solid #93c5fd' }}
              >
                <img
                  src={formData.image}
                  alt="معاينة"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button 
            type="submit" 
            className="flex-1 text-base py-4 font-bold shadow-md"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              fontFamily: 'Cairo, sans-serif',
            }}
          >
            {editingProduct ? '✓ تحديث المنتج' : '+ إضافة المنتج'}
          </Button>
          {editingProduct && (
            <Button 
              type="button" 
              onClick={onCancel}
              className="px-6 text-base py-4 font-bold"
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                fontFamily: 'Cairo, sans-serif',
              }}
            >
              إلغاء
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}