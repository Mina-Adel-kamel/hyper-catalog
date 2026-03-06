import { useRef } from 'react';
import { Button } from './ui/button';
import { FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Product } from './ProductCard';
import { toast } from 'sonner';

interface ExcelImportProps {
  onImport: (products: Omit<Product, 'id'>[]) => void;
}

export function ExcelImport({ onImport }: ExcelImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const products: Omit<Product, 'id'>[] = [];

      for (const row of jsonData as any[]) {
        if (!row.name || !row.category || !row.price || !row.image) {
          console.warn('Skipping invalid row:', row);
          continue;
        }

        products.push({
          name: row.name,
          category: row.category,
          description: row.description || '',
          price: parseFloat(row.price),
          oldPrice: row.oldPrice ? parseFloat(row.oldPrice) : undefined,
          image: row.image,
        });
      }

      if (products.length === 0) {
        toast.error('لم يتم العثور على منتجات صالحة في الملف');
        return;
      }

      onImport(products);
      toast.success(`تم استيراد ${products.length} منتج بنجاح!`);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error importing Excel:', error);
      toast.error('حدث خطأ أثناء استيراد الملف');
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="default"
        className="bg-green-600 hover:bg-green-700"
      >
        <FileSpreadsheet className="size-4 ml-2" />
        استيراد من Excel
      </Button>
    </>
  );
}
