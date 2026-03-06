import { Trash2, Edit2, GripVertical } from 'lucide-react';
import { Button } from './ui/button';

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  image: string;
  order?: number;
}

interface ProductCardProps {
  product: Product;
  onDelete: (id: string) => void;
  onEdit: (product: Product) => void;
  isAdminMode?: boolean;
  isDragging?: boolean;
  dragHandleProps?: any;
}

export function ProductCard({ product, onDelete, onEdit, isAdminMode = true, isDragging = false, dragHandleProps }: ProductCardProps) {
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  
  return (
    <div 
      className={`rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow print:break-inside-avoid print:shadow-none ${isDragging ? 'opacity-50' : ''}`}
      dir="rtl"
      style={{
        backgroundColor: '#ffffff',
        border: '2px solid #e5e7eb',
        fontFamily: 'Cairo, sans-serif',
        width: '280px',
      }}
    >
      {/* صورة المنتج */}
      <div 
        className="relative"
        style={{ 
          backgroundColor: '#f3f4f6',
          height: '200px',
        }}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        
        {/* Discount Badge */}
        {hasDiscount && (
          <div 
            className="absolute top-2 left-2 px-3 py-1 rounded-full font-bold text-sm print:block"
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontFamily: 'Cairo, sans-serif',
            }}
          >
            عرض 🔥
          </div>
        )}
        
        {isAdminMode && (
          <div className="absolute top-2 right-2 flex gap-1 print:hidden">
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                className="w-8 h-8 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                style={{
                  backgroundColor: '#6b7280',
                  color: '#ffffff',
                }}
              >
                <GripVertical className="size-4" />
              </div>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onEdit(product)}
              className="w-8 h-8 p-0 rounded-full"
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
              }}
            >
              <Edit2 className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(product.id)}
              className="w-8 h-8 p-0 rounded-full"
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {/* تفاصيل المنتج — خلفية بيضاء صريحة */}
      <div 
        style={{ 
          padding: '16px',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #f3f4f6',
        }}
      >
        <h3 
          className="font-bold text-lg mb-2"
          style={{ 
            color: '#1f2937',
            fontFamily: 'Cairo, sans-serif',
            backgroundColor: '#ffffff',
          }}
        >
          {product.name}
        </h3>
        <p 
          className="text-sm mb-3"
          style={{ 
            color: '#6b7280',
            fontFamily: 'Cairo, sans-serif',
            minHeight: '40px',
            backgroundColor: '#ffffff',
          }}
        >
          {product.description}
        </p>
        <div 
          className="flex items-center justify-center gap-2"
          style={{ backgroundColor: '#ffffff' }}
        >
          {hasDiscount && (
            <div 
              className="text-lg line-through"
              style={{ 
                color: '#9ca3af',
                fontFamily: 'Cairo, sans-serif',
                backgroundColor: '#ffffff',
              }}
            >
              {product.oldPrice} جنيه
            </div>
          )}
          <div 
            className="text-2xl font-bold"
            style={{ 
              color: '#ef4444',
              fontFamily: 'Cairo, sans-serif',
              backgroundColor: '#ffffff',
            }}
          >
            {product.price} جنيه
          </div>
        </div>
      </div>
    </div>
  );
}
