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

  // ========== دالة التصدير المُصلحة — pixel-perfect ==========
  const exportToPDF = async () => {
    if (!magazineRef.current) return;

    const pdfButton = document.querySelector('[data-pdf-button]') as HTMLElement;
    const stickyHeader = document.querySelector('.sticky') as HTMLElement;

    if (pdfButton) pdfButton.textContent = 'جاري التحضير...';
    if (stickyHeader) stickyHeader.style.display = 'none';

    try {
      toast.info('جاري تحميل الخطوط والصور...');

      // ===== تحميل خط Cairo =====
      try {
        const cairoFont = new FontFace(
          'Cairo',
          "url(https://fonts.gstatic.com/s/cairo/v28/SLXgc1nY6HkvangtZmpQdkhzfH5lkSs2SgRjCAGMQ1z0hAA-W1ToLQ-HmkA.woff2)",
          { weight: '400 900', style: 'normal' }
        );
        const loaded = await cairoFont.load();
        document.fonts.add(loaded);
      } catch (e) {
        console.warn('FontFace load failed, continuing...', e);
      }
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 800));

      // ===== تحميل الصور كـ base64 =====
      toast.info('جاري تحميل الصور...');
      const allImgs = magazineRef.current.querySelectorAll('img');
      const imageCache = new Map<string, string>();
      await Promise.all(Array.from(allImgs).map(async (img) => {
        if (img.src && !imageCache.has(img.src)) {
          const b64 = await loadImageAsBase64(img.src);
          imageCache.set(img.src, b64);
        }
      }));

      // ===== إنشاء PDF بأبعاد A4 landscape =====
      // A4 landscape: 297mm × 210mm
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfW = pdf.internal.pageSize.getWidth();  // 297mm
      const pdfH = pdf.internal.pageSize.getHeight(); // 210mm

      // أبعاد الـ section في البراوزر بالـ px (1122 × 794)
      const PAGE_W_PX = 1122;
      const PAGE_H_PX = 794;

      const sections = magazineRef.current.querySelectorAll('[data-pdf-section]');
      toast.info(`جاري معالجة ${sections.length} صفحة...`);

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;
        if (pdfButton) pdfButton.textContent = `جاري التصدير... ${i + 1} / ${sections.length}`;

        await document.fonts.ready;
        await new Promise(r => setTimeout(r, 300));

        // ===== html2canvas بأبعاد ثابتة = أبعاد الـ section نفسه =====
        const canvas = await html2canvas(section, {
          scale: 1,                    // scale=1 → الـ canvas بنفس أبعاد العنصر
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
          foreignObjectRendering: false,
          imageTimeout: 30000,
          removeContainer: true,
          width: PAGE_W_PX,
          height: PAGE_H_PX,
          windowWidth: PAGE_W_PX,
          windowHeight: PAGE_H_PX,
          onclone: async (clonedDoc, clonedEl) => {
            // تضمين Cairo مباشرة
            const style = clonedDoc.createElement('style');
            style.textContent = `
              @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
              * { font-family: 'Cairo', 'Tahoma', sans-serif !important; direction: rtl !important; }
            `;
            clonedDoc.head.appendChild(style);
            await clonedDoc.fonts.ready;
            await new Promise(r => setTimeout(r, 600));

            // استبدال الصور بـ base64
            clonedEl.querySelectorAll('img').forEach((img: HTMLImageElement) => {
              const cached = imageCache.get(img.src);
              if (cached) img.src = cached;
              img.removeAttribute('loading');
              img.removeAttribute('srcset');
              img.style.display = 'block';
            });
          },
        });

        // ===== إضافة الصفحة للـ PDF =====
        // الـ canvas بالضبط 1122×794 → نضعه في A4 landscape 297×210mm
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);

        await new Promise(r => setTimeout(r, 150));
      }

      // ===== حفظ الملف =====
      pdf.save(`${magazineConfig.title}-${magazineConfig.month || 'مجلة'}.pdf`);
      toast.success('✅ تم تحميل PDF بنجاح!');

      if (pdfButton) {
        pdfButton.textContent = '✓ تم التحميل!';
        setTimeout(() => {
          pdfButton.innerHTML = '<svg class="size-4 ml-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>تحميل PDF';
        }, 3000);
      }

    } catch (err) {
      console.error('PDF Error:', err);
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
        // ===== معاينة المجلة =====
        // كل صفحة بأبعاد A4 landscape بالضبط: 1122 × 794 px (96dpi)
        // هذه الأبعاد هي نفسها التي يستخدمها html2canvas → PDF بدون أي فرق
        <div style={{ backgroundColor: '#e5e7eb', minHeight: '100vh' }}>

          {/* شريط التحكم */}
          <div
            className="print:hidden sticky top-0 z-50 p-3 shadow-lg"
            style={{ backgroundColor: currentTheme.primary, color: '#ffffff' }}
          >
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'Cairo, sans-serif' }}>
                معاينة المجلة — كل صفحة بحجم A4 أفقي
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button onClick={() => setViewMode('admin')} variant="secondary">
                  <SettingsIcon className="size-4 ml-2" />
                  العودة للوحة التحكم
                </Button>
                <Button
                  onClick={exportToPDF}
                  variant="default"
                  style={{ backgroundColor: '#16a34a' }}
                  data-pdf-button
                >
                  <FileDown className="size-4 ml-2" />
                  تحميل PDF
                </Button>
              </div>
            </div>
          </div>

          {/* الصفحات */}
          <div
            ref={magazineRef}
            style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}
          >

            {/* ===== غلاف المجلة ===== */}
            <div
              data-pdf-section
              style={{
                width: '1122px',
                height: '794px',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                fontFamily: 'Cairo, sans-serif',
                background: `linear-gradient(135deg, ${currentTheme.primary} 0%, #9333ea 50%, #ec4899 100%)`,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '40px',
              }}
              dir="rtl"
            >
              {/* صورة الخلفية */}
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${magazineConfig.coverImage})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                opacity: 0.3,
              }} />

              {/* لوجو */}
              {magazineConfig.logo && (
                <div style={{ position: 'absolute', top: '32px', right: '32px', zIndex: 10 }}>
                  <img src={magazineConfig.logo} alt="Logo" crossOrigin="anonymous"
                    style={{ maxHeight: '80px', maxWidth: '240px', objectFit: 'contain' }} />
                </div>
              )}

              {/* المحتوى المركزي */}
              <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', color: '#fff', padding: '0 40px' }}>
                <h1 style={{ fontSize: '96px', fontWeight: '900', marginBottom: '16px', fontFamily: 'Cairo, sans-serif', lineHeight: 1.1 }}>
                  {magazineConfig.title}
                </h1>
                <h2 style={{ fontSize: '40px', fontWeight: '600', fontFamily: 'Cairo, sans-serif' }}>
                  {magazineConfig.storeName}
                </h2>
                <p style={{ fontSize: '24px', marginTop: '24px', opacity: 0.9, fontFamily: 'Cairo, sans-serif' }}>
                  عروض مميزة • أسعار لا تقاوم
                </p>
              </div>

              {/* العنوان أسفل يسار */}
              <div style={{ position: 'absolute', bottom: '32px', left: '32px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span style={{ fontSize: '22px', fontWeight: '600', fontFamily: 'Cairo, sans-serif' }}>شارع ابو كلام بساحل طهطا</span>
              </div>

              {/* الهاتف أسفل يمين */}
              <div style={{ position: 'absolute', bottom: '32px', right: '32px', zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
                <span style={{ fontSize: '22px', fontWeight: '600', fontFamily: 'Cairo, sans-serif' }} dir="ltr">{magazineConfig.phone}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
            </div>

            {/* ===== صفحات المنتجات ===== */}
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
                    width: '1122px',
                    height: '794px',
                    position: 'relative',
                    overflow: 'hidden',
                    flexShrink: 0,
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                    padding: '40px 50px 50px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    fontFamily: 'Cairo, sans-serif',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  dir="rtl"
                >
                  {/* خلفية خفيفة */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'url(https://images.unsplash.com/photo-1560428943-715536fc4689?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920)',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    opacity: 0.05,
                  }} />

                  {/* شريط علوي */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '8px',
                    background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
                  }} />

                  {/* شريط سفلي */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '8px',
                    background: `linear-gradient(90deg, ${currentTheme.secondary}, ${currentTheme.primary})`,
                  }} />

                  {/* لوجو */}
                  {magazineConfig.logo && (
                    <div style={{ position: 'absolute', top: '16px', right: '32px', zIndex: 10 }}>
                      <img src={magazineConfig.logo} alt="Logo" crossOrigin="anonymous"
                        style={{ maxHeight: '50px', maxWidth: '140px', objectFit: 'contain' }} />
                    </div>
                  )}

                  {/* اسم المتجر + الشهر أسفل يسار */}
                  <div style={{ position: 'absolute', bottom: '18px', left: '32px', zIndex: 10 }}>
                    <span style={{ fontSize: '12px', color: currentTheme.primary, fontFamily: 'Cairo, sans-serif', fontWeight: '600', opacity: 0.7 }}>
                      {magazineConfig.storeName} • {magazineConfig.month}
                    </span>
                  </div>

                  {/* المحتوى */}
                  <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* عنوان القسم */}
                    <h2 style={{
                      fontSize: '40px', fontWeight: '900',
                      marginBottom: '20px', textAlign: 'center', paddingBottom: '12px',
                      color: currentTheme.primary,
                      borderBottom: `4px solid ${currentTheme.secondary}`,
                      fontFamily: 'Cairo, sans-serif',
                    }}>
                      {category}
                    </h2>

                    {/* المنتجات */}
                    <div style={{
                      display: 'flex', flexWrap: 'wrap',
                      justifyContent: 'center', gap: '16px',
                      flex: 1, alignContent: 'flex-start',
                      direction: 'rtl',
                    }}>
                      {pageProducts.map(product => (
                        <div key={product.id} style={{ 
                          width: '160px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          backgroundColor: '#fff',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
                          border: '1px solid #e5e7eb',
                          direction: 'rtl',
                          fontFamily: 'Cairo, sans-serif',
                        }}>
                          {/* صورة المنتج */}
                          <div style={{ position: 'relative', width: '100%', height: '140px', overflow: 'hidden' }}>
                            <img
                              src={product.image}
                              alt={product.name}
                              crossOrigin="anonymous"
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                            {product.oldPrice && (
                              <div style={{
                                position: 'absolute', top: '8px', right: '8px',
                                backgroundColor: '#ef4444', color: '#fff',
                                fontSize: '11px', fontWeight: '700',
                                padding: '2px 8px', borderRadius: '20px',
                                fontFamily: 'Cairo, sans-serif',
                              }}>
                                خصم
                              </div>
                            )}
                          </div>

                          {/* تفاصيل المنتج */}
                          <div style={{ padding: '10px 10px 12px', backgroundColor: '#fff' }}>
                            <p style={{
                              fontSize: '13px', fontWeight: '700', color: '#1f2937',
                              marginBottom: '2px', fontFamily: 'Cairo, sans-serif',
                              textAlign: 'right', lineHeight: '1.3',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {product.name}
                            </p>
                            {product.description && (
                              <p style={{
                                fontSize: '11px', color: '#6b7280',
                                marginBottom: '8px', fontFamily: 'Cairo, sans-serif',
                                textAlign: 'right', lineHeight: '1.3',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>
                                {product.description}
                              </p>
                            )}

                            {/* السعر */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              {product.oldPrice && (
                                <span style={{
                                  fontSize: '11px', color: '#9ca3af',
                                  textDecoration: 'line-through', fontFamily: 'Cairo, sans-serif',
                                }}>
                                  {product.oldPrice} جنيه
                                </span>
                              )}
                              <span style={{
                                fontSize: '16px', fontWeight: '900', color: '#ef4444',
                                fontFamily: 'Cairo, sans-serif',
                              }}>
                                {product.price} جنيه
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ));
            })}

            {products.length === 0 && (
              <div style={{ width: '1122px', height: '794px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '24px', color: '#6b7280', fontFamily: 'Cairo, sans-serif' }}>لا توجد منتجات لعرضها</p>
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
