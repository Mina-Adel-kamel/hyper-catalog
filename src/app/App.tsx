import { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ProductCard, Product } from './components/ProductCard';
import { ProductForm } from './components/ProductForm';
import { MagazineCover } from './components/MagazineCover';
import { MagazineSettings, MagazineConfig, THEMES } from './components/MagazineSettings';
import { StatsCard } from './components/StatsCard';
import { SortableProduct } from './components/SortableProduct';
import { ExcelImport } from './components/ExcelImport';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Search, FileDown, Eye, Settings as SettingsIcon, Package, Grid3x3, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Toaster, toast } from 'sonner';

const CATEGORIES = [
  'الزيوت',
  'الأرز',
  'المكرونة',
  'السكر',
  'المعلبات',
  'الألبان',
  'السناكس',
  'المشروبات',
  'المنظفات',
  'العناية الشصية',
];

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'زيت عباد الشمس',
    category: 'الزيوت',
    description: 'زيت طبخ نقي 1 لتر',
    price: 70,
    oldPrice: 80,
    image: 'https://images.unsplash.com/photo-1662058595162-10e024b1a907?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    order: 0,
  },
  {
    id: '2',
    name: 'أرز بسمتي',
    category: 'الأرز',
    description: 'أرز بسمتي درجة أولى 5 كجم',
    price: 120,
    image: 'https://images.unsplash.com/photo-1690654238838-93701cd10afc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    order: 0,
  },
  {
    id: '3',
    name: 'مكرونة إسباجتي',
    category: 'المكرونة',
    description: 'مكرونة إسباجتي 500 جرام',
    price: 15,
    image: 'https://images.unsplash.com/photo-1613634333954-085b019d87b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
    order: 0,
  },
];

const DEFAULT_CONFIG: MagazineConfig = {
  title: 'هايبر براند',
  storeName: 'مجلة عروض السوبر ماركت',
  phone: '01554801630',
  month: 'مارس 2026',
  coverImage: 'https://images.unsplash.com/photo-1606824722920-4c652a70f348?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  logo: '',
  theme: 'blue',
};

const PRODUCTS_PER_PAGE = 6;

// ========== دالة مساعدة لتحميل الصور كـ base64 ==========
const loadImageAsBase64 = (src: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } catch {
          resolve(src); // fallback
        }
      } else {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    // إضافة timestamp لتجنب cache مشاكل CORS
    img.src = src.includes('?') ? `${src}&_t=${Date.now()}` : `${src}?_t=${Date.now()}`;
  });
};

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [viewMode, setViewMode] = useState<'admin' | 'preview' | 'settings'>('admin');
  const [magazineConfig, setMagazineConfig] = useState<MagazineConfig>(DEFAULT_CONFIG);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const magazineRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Combine default categories with custom categories
  const allCategories = [...CATEGORIES, ...customCategories];

  // Load products from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('hyperBrandProducts');
    if (saved) {
      setProducts(JSON.parse(saved));
    } else {
      setProducts(SAMPLE_PRODUCTS);
    }

    const savedConfig = localStorage.getItem('hyperBrandConfig');
    if (savedConfig) {
      setMagazineConfig(JSON.parse(savedConfig));
    }

    const savedCustomCategories = localStorage.getItem('hyperBrandCustomCategories');
    if (savedCustomCategories) {
      setCustomCategories(JSON.parse(savedCustomCategories));
    }
  }, []);

  // Save products to localStorage whenever they change
  useEffect(() => {
    if (products.length >= 0) {
      localStorage.setItem('hyperBrandProducts', JSON.stringify(products));
    }
  }, [products]);

  // Save config to localStorage
  useEffect(() => {
    localStorage.setItem('hyperBrandConfig', JSON.stringify(magazineConfig));
  }, [magazineConfig]);

  // Save custom categories to localStorage
  useEffect(() => {
    localStorage.setItem('hyperBrandCustomCategories', JSON.stringify(customCategories));
  }, [customCategories]);

  const handleAddOrUpdateProduct = (productData: Omit<Product, 'id'> & { id?: string }) => {
    if (productData.id) {
      setProducts(products.map(p => p.id === productData.id ? { ...productData, id: productData.id, order: p.order } : p));
      setEditingProduct(null);
      toast.success('تم تحديث المنتج بنجاح!');
    } else {
      const newProduct: Product = {
        ...productData,
        id: Date.now().toString(),
        order: products.length,
      };
      setProducts([...products, newProduct]);
      toast.success('تم إضافة المنتج بنجاح!');
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      setProducts(products.filter(p => p.id !== id));
      toast.success('تم حذف المنتج بنجاح!');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setProducts((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      toast.success('تم تغيير ترتيب المنتجات');
    }
  };

  const handleImportExcel = (importedProducts: Omit<Product, 'id'>[]) => {
    const newProducts: Product[] = importedProducts.map((p, index) => ({
      ...p,
      id: `${Date.now()}_${index}`,
      order: products.length + index,
    }));
    setProducts([...products, ...newProducts]);
  };

  const handleAddCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      toast.error('❌ الرجاء إدخال اسم القسم');
      return;
    }
    if (allCategories.includes(trimmedName)) {
      toast.error('❌ هذا القسم موجود بالفعل');
      return;
    }
    setCustomCategories([...customCategories, trimmedName]);
    setNewCategoryName('');
    toast.success(`✅ تم إضافة قسم "${trimmedName}" بنجاح!`);
  };

  const handleDeleteCategory = (categoryName: string) => {
    if (CATEGORIES.includes(categoryName)) {
      toast.error('❌ لا يمكن حذف الأقسام الافتراضية');
      return;
    }
    const hasProducts = products.some(p => p.category === categoryName);
    if (hasProducts) {
      toast.error('❌ لا يمكن حذف قسم يحتوي على منتجات');
      return;
    }
    if (confirm(`هل أنت متأكد من حذف قسم "${categoryName}"؟`)) {
      setCustomCategories(customCategories.filter(c => c !== categoryName));
      toast.success(`✅ تم حذف القسم "${categoryName}" بنجاح!`);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'الكل' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const productsByCategory = allCategories.reduce((acc, category) => {
    acc[category] = products.filter(p => p.category === category);
    return acc;
  }, {} as Record<string, Product[]>);

  const totalPages = allCategories.reduce((total, category) => {
    const categoryProducts = productsByCategory[category] || [];
    if (categoryProducts.length === 0) return total;
    return total + Math.ceil(categoryProducts.length / PRODUCTS_PER_PAGE);
  }, 1);

  const currentTheme = THEMES[magazineConfig.theme];

  // ========== دالة التصدير المُصلحة ==========
  const exportToPDF = async () => {
    if (!magazineRef.current) return;

    const pdfButton = document.querySelector('[data-pdf-button]') as HTMLElement;
    const stickyHeader = document.querySelector('.sticky') as HTMLElement;

    if (pdfButton) pdfButton.textContent = 'جاري التحضير...';
    if (stickyHeader) stickyHeader.style.display = 'none';

    try {
      toast.info('جاري تحميل الخطوط والصور...');

      // ========== الخطوة 1: تحميل خط Cairo بشكل صريح ==========
      // إضافة خط Cairo عبر FontFace API
      const fontUrl = 'https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hAA-W1ToLQ-HmkA.woff2';
      try {
        const cairoFont = new FontFace('Cairo', `url(${fontUrl})`, {
          weight: '400 900',
          style: 'normal',
        });
        const loadedFont = await cairoFont.load();
        document.fonts.add(loadedFont);
      } catch (fontErr) {
        console.warn('Could not load Cairo font via FontFace API, using fallback', fontErr);
      }

      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 1000));

      // ========== الخطوة 2: تحميل جميع الصور مسبقاً وتحويلها لـ base64 ==========
      toast.info('جاري تحميل الصور...');
      const allImages = magazineRef.current.querySelectorAll('img');
      const imageCache = new Map<string, string>();

      await Promise.all(
        Array.from(allImages).map(async (img) => {
          if (img.src && !imageCache.has(img.src)) {
            const base64 = await loadImageAsBase64(img.src);
            imageCache.set(img.src, base64);
          }
        })
      );

      toast.success('تم تحميل الصور');

      // ========== الخطوة 3: إنشاء PDF ==========
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const sections = magazineRef.current.querySelectorAll('[data-pdf-section]');
      toast.info(`جاري معالجة ${sections.length} صفحة...`);

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;

        if (pdfButton) {
          pdfButton.textContent = `جاري التصدير... ${i + 1} / ${sections.length}`;
        }

        // انتظار تحميل الخطوط قبل كل صفحة
        await document.fonts.ready;
        await new Promise(resolve => setTimeout(resolve, 500));

        // ========== الخطوة 4: تحويل القسم لصورة ==========
        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
          foreignObjectRendering: false,
          imageTimeout: 30000,
          removeContainer: true,
          // ========== onclone: إصلاح النصوص العربية والصور ==========
          onclone: async (clonedDoc, clonedElement) => {
            // ========== 1. تضمين خط Cairo مباشرة في الـ clone ==========
            const styleEl = clonedDoc.createElement('style');
            styleEl.textContent = `
              @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
              * {
                font-family: 'Cairo', 'Arial Unicode MS', 'Tahoma', sans-serif !important;
                direction: rtl !important;
                -webkit-font-smoothing: antialiased !important;
                text-rendering: optimizeLegibility !important;
              }
            `;
            clonedDoc.head.appendChild(styleEl);

            // انتظار تحميل الخطوط في الـ clone
            await clonedDoc.fonts.ready;
            await new Promise(resolve => setTimeout(resolve, 800));

            // ========== 2. استبدال جميع الصور بـ base64 ==========
            const clonedImages = clonedElement.querySelectorAll('img');
            clonedImages.forEach((img: HTMLImageElement) => {
              const originalSrc = img.src;
              // البحث في الـ cache
              const cachedSrc = imageCache.get(originalSrc);
              if (cachedSrc && cachedSrc !== originalSrc) {
                img.src = cachedSrc;
              }
              img.removeAttribute('loading');
              img.removeAttribute('srcset');
              img.style.display = 'block';
              img.style.objectFit = 'cover';
            });

            // ========== 3. تطبيق الإعدادات على جميع العناصر النصية ==========
            const allTextElements = clonedElement.querySelectorAll('*');
            allTextElements.forEach((el: Element) => {
              const htmlEl = el as HTMLElement;
              const tag = htmlEl.tagName.toLowerCase();

              // تطبيق الخط على العناصر النصية فقط
              if (!['img', 'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon'].includes(tag)) {
                htmlEl.style.fontFamily = "'Cairo', 'Arial Unicode MS', 'Tahoma', sans-serif";
                htmlEl.style.direction = 'rtl';
                htmlEl.style.unicodeBidi = 'embed';
              }
            });

            // ========== 4. إصلاح العناوين الكبيرة بشكل خاص ==========
            const headings = clonedElement.querySelectorAll('h1, h2, h3, h4, h5, h6, [class*="font-black"], [class*="font-bold"]');
            headings.forEach((heading: Element) => {
              const h = heading as HTMLElement;
              h.style.fontFamily = "'Cairo', 'Arial Unicode MS', 'Tahoma', sans-serif";
              h.style.fontWeight = '900';
              h.style.letterSpacing = 'normal';
              h.style.wordSpacing = 'normal';
            });
          },
        });

        // ========== الخطوة 5: إضافة الصفحة للـ PDF ==========
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;

        if (i > 0) pdf.addPage();

        if (imgHeight > pageHeight) {
          const scaledWidth = (pageHeight * canvas.width) / canvas.height;
          const xOffset = Math.max(0, (pageWidth - scaledWidth) / 2);
          pdf.addImage(imgData, 'JPEG', xOffset, 0, Math.min(scaledWidth, pageWidth), pageHeight);
        } else {
          const yOffset = (pageHeight - imgHeight) / 2;
          pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight);
        }

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // ========== الخطوة 6: حفظ الملف ==========
      const fileName = `${magazineConfig.title}-${magazineConfig.month || 'مجلة'}.pdf`;
      pdf.save(fileName);

      toast.success('✅ تم تحميل ملف PDF بنجاح!');

      if (pdfButton) {
        pdfButton.textContent = '✓ تم التحميل!';
        setTimeout(() => {
          pdfButton.innerHTML = '<svg class="size-4 ml-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>تحميل PDF';
        }, 3000);
      }

    } catch (error) {
      console.error('PDF Error:', error);
      toast.error('❌ حدث خطأ أثناء إنشاء PDF');
      if (pdfButton) {
        pdfButton.innerHTML = '<svg class="size-4 ml-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>تحميل PDF';
      }
    } finally {
      if (stickyHeader) stickyHeader.style.display = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {viewMode === 'admin' ? (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-black text-blue-900 mb-2">هايبر براند</h1>
            <p className="text-xl text-gray-600">نظام إدارة مجلة عروض السوبر ماركت</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatsCard title="عدد المنتجات" value={products.length} icon={Package} color="#3b82f6" />
            <StatsCard title="عدد الأقسام" value={allCategories.filter(cat => productsByCategory[cat]?.length > 0).length} icon={Grid3x3} color="#10b981" />
            <StatsCard title="عدد الصفحات" value={totalPages} icon={FileText} color="#f59e0b" />
          </div>

          <div className="flex gap-2 mb-6 justify-center print:hidden flex-wrap">
            <Button onClick={() => setViewMode('settings')} variant="default" style={{ backgroundColor: '#f59e0b' }}>
              <SettingsIcon className="size-4 ml-2" />
              إعدادات المجلة
            </Button>
            <ExcelImport onImport={handleImportExcel} />
            <Button onClick={() => setViewMode('preview')} variant="default" className="bg-green-600 hover:bg-green-700">
              <Eye className="size-4 ml-2" />
              معاينة المجلة
            </Button>
            <Button onClick={exportToPDF} variant="default" className="bg-blue-600 hover:bg-blue-700">
              <FileDown className="size-4 ml-2" />
              تحميل PDF
            </Button>
          </div>

          <div className="mb-8">
            <ProductForm
              onSubmit={handleAddOrUpdateProduct}
              editingProduct={editingProduct}
              onCancel={() => setEditingProduct(null)}
              categories={allCategories}
            />
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />
              <Input
                type="text"
                placeholder="البحث عن منتج أو قسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-lg"
              />
            </div>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
            <TabsList className="flex-wrap h-auto gap-2 justify-start" dir="rtl">
              <TabsTrigger value="الكل">الكل ({products.length})</TabsTrigger>
              {allCategories.map(cat => (
                <TabsTrigger key={cat} value={cat}>
                  {cat} ({productsByCategory[cat]?.length || 0})
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-wrap justify-center gap-2 max-w-7xl mx-auto">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <SortableProduct key={product.id} product={product} onDelete={handleDeleteProduct} onEdit={handleEditProduct} />
                  ))
                ) : (
                  <div className="w-full text-center py-12 text-gray-500">
                    <p className="text-xl">لا توجد منتجات</p>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : viewMode === 'settings' ? (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-black mb-2" style={{ color: '#f59e0b' }}>إعدادات المجلة</h1>
            <p className="text-xl text-gray-600">قم بتخصيص مظهر ومعلومات مجلة عروضك</p>
          </div>

          <MagazineSettings config={magazineConfig} onConfigChange={setMagazineConfig} />

          <div className="mt-8 rounded-xl shadow-lg overflow-hidden" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: '2px solid #3b82f6' }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                <Grid3x3 className="size-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                إدارة الأقسام المخصصة
              </h2>
            </div>

            <div className="p-4">
              <div className="flex gap-2 mb-4">
                <Input
                  type="text"
                  placeholder="اسم القسم الجديد (مثال: العصائر، الحلويات...)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddCategory(); }}
                  className="flex-1"
                  style={{ borderColor: '#60a5fa', fontFamily: 'Cairo, sans-serif' }}
                />
                <Button onClick={handleAddCategory} className="bg-blue-600 hover:bg-blue-700" style={{ fontFamily: 'Cairo, sans-serif' }}>
                  <svg className="size-4 ml-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14"/><path d="M12 5v14"/>
                  </svg>
                  إضافة القسم
                </Button>
              </div>

              {customCategories.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{ color: '#1e40af', fontFamily: 'Cairo, sans-serif' }}>
                    الأقسام المخصصة ({customCategories.length}):
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {customCategories.map((category) => (
                      <div key={category} className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm" style={{ backgroundColor: '#eff6ff', border: '1px solid #93c5fd', fontFamily: 'Cairo, sans-serif' }}>
                        <span className="text-sm font-medium" style={{ color: '#1e40af' }}>{category}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#dbeafe', color: '#1e3a8a' }}>
                          {productsByCategory[category]?.length || 0}
                        </span>
                        <button onClick={() => handleDeleteCategory(category)} className="text-red-500 hover:text-red-700 transition-colors" title="حذف القسم">
                          <svg className="size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 rounded-lg" style={{ backgroundColor: '#f0f9ff', border: '2px dashed #93c5fd' }}>
                  <p className="text-sm" style={{ color: '#1e40af', fontFamily: 'Cairo, sans-serif' }}>
                    لا توجد أقسام مخصصة حتى الآن. قم بإضافة قسم جديد أعلاه!
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-center mt-8">
            <Button onClick={() => { setViewMode('admin'); toast.success('تم حفظ الإعدادات بنجاح!'); }} variant="default" size="lg" className="bg-green-600 hover:bg-green-700">
              <svg className="size-5 ml-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              حفظ والعودة
            </Button>
            <Button onClick={() => setViewMode('preview')} variant="default" size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Eye className="size-5 ml-2" />
              معاينة المجلة
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: '#ffffff' }}>
          <div className="print:hidden sticky top-0 z-50 p-4 shadow-lg" style={{ backgroundColor: currentTheme.primary, color: '#ffffff' }}>
            <div className="container mx-auto flex items-center justify-between">
              <h2 className="text-2xl font-bold">معاينة المجلة</h2>
              <div className="flex gap-2">
                <Button onClick={() => setViewMode('admin')} variant="secondary">
                  <SettingsIcon className="size-4 ml-2" />
                  العودة للوحة التحكم
                </Button>
                <Button onClick={exportToPDF} variant="default" style={{ backgroundColor: '#16a34a' }} data-pdf-button>
                  <FileDown className="size-4 ml-2" />
                  تحميل PDF
                </Button>
              </div>
            </div>
          </div>

          <div ref={magazineRef}>
            <div data-pdf-section>
              <MagazineCover
                backgroundImage={magazineConfig.coverImage}
                title={magazineConfig.title}
                storeName={magazineConfig.storeName}
                phone={magazineConfig.phone}
                month={magazineConfig.month}
                logo={magazineConfig.logo}
                theme={currentTheme.primary}
              />
            </div>

            {allCategories.map(category => {
              const categoryProducts = productsByCategory[category];
              if (!categoryProducts || categoryProducts.length === 0) return null;

              const pages: Product[][] = [];
              for (let i = 0; i < categoryProducts.length; i += PRODUCTS_PER_PAGE) {
                pages.push(categoryProducts.slice(i, i + PRODUCTS_PER_PAGE));
              }

              return pages.map((pageProducts, pageIndex) => (
                <div
                  key={`${category}-page-${pageIndex}`}
                  data-pdf-section
                  style={{
                    position: 'relative',
                    width: '297mm',
                    minHeight: '210mm',
                    backgroundColor: '#ffffff',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    margin: '0 auto',
                    padding: '40px 50px',
                    pageBreakAfter: 'always',
                  }}
                >
                  {/* خلفية تملأ الصفحة بالكامل */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: 'url(https://images.unsplash.com/photo-1560428943-715536fc4689?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      opacity: 0.07,
                      width: '100%',
                      height: '100%',
                    }}
                  />

                  {/* شريط لوني علوي */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '8px',
                      background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                    }}
                  />

                  {/* شريط لوني سفلي */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '8px',
                      background: `linear-gradient(90deg, ${currentTheme.secondary}, ${currentTheme.primary})`,
                    }}
                  />

                  {magazineConfig.logo && (
                    <div style={{ position: 'absolute', top: '16px', right: '32px', zIndex: 10 }}>
                      <img src={magazineConfig.logo} alt="Logo" style={{ maxHeight: '56px', maxWidth: '160px', objectFit: 'contain' }} crossOrigin="anonymous" />
                    </div>
                  )}

                  {/* اسم المتجر أسفل يسار */}
                  <div style={{ position: 'absolute', bottom: '20px', left: '32px', zIndex: 10 }}>
                    <span style={{ fontSize: '11px', color: currentTheme.primary, fontFamily: 'Cairo, sans-serif', fontWeight: '600', opacity: 0.7 }}>
                      {magazineConfig.storeName} • {magazineConfig.month}
                    </span>
                  </div>

                  {/* المحتوى */}
                  <div style={{ position: 'relative', zIndex: 10 }}>
                    <h2
                      style={{
                        fontSize: '42px',
                        fontWeight: '900',
                        marginBottom: '24px',
                        textAlign: 'center',
                        paddingBottom: '12px',
                        color: currentTheme.primary,
                        borderBottom: `4px solid ${currentTheme.secondary}`,
                        fontFamily: 'Cairo, sans-serif',
                      }}
                    >
                      {category}
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                      {pageProducts.map(product => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onDelete={() => {}}
                          onEdit={() => {}}
                          isAdminMode={false}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ));
            })}

            {products.length === 0 && (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl text-gray-500">لا توجد منتجات لعرضها</p>
                  <Button onClick={() => setViewMode('admin')} className="mt-4">إضافة منتجات</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
