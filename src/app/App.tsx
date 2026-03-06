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
      // Update existing product
      setProducts(products.map(p => p.id === productData.id ? { ...productData, id: productData.id, order: p.order } : p));
      setEditingProduct(null);
      toast.success('تم تحديث المنتج بنجاح!');
    } else {
      // Add new product
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
    // Check if category is a custom category (not default)
    if (CATEGORIES.includes(categoryName)) {
      toast.error('❌ لا يمكن حذف الأقسام الافتراضية');
      return;
    }

    // Check if category has products
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

  // Calculate total pages
  const totalPages = allCategories.reduce((total, category) => {
    const categoryProducts = productsByCategory[category] || [];
    if (categoryProducts.length === 0) return total;
    return total + Math.ceil(categoryProducts.length / PRODUCTS_PER_PAGE);
  }, 1); // +1 for cover page

  const currentTheme = THEMES[magazineConfig.theme];

  const exportToPDF = async () => {
    if (!magazineRef.current) return;

    const button = document.querySelector('[data-pdf-button]') as HTMLElement;
    const stickyHeader = document.querySelector('.sticky') as HTMLElement;
    
    if (button) {
      button.textContent = 'جاري التحضير للتصدير...';
    }
    if (stickyHeader) stickyHeader.style.display = 'none';

    try {
      // ========== الخطوة 1: التأكد من تحميل الخطوط العربية ==========
      toast.info('جاري تحميل الخطوط العربية...');
      await document.fonts.ready;
      
      // تحميل خط Cairo بشكل صريح
      await document.fonts.load('16px Cairo');
      await document.fonts.load('bold 16px Cairo');
      await document.fonts.load('900 16px Cairo');
      
      // انتظار إضافي للتأكد من تحميل جميع الخطوط
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('تم تحميل الخطوط بنجاح');

      // ========== الخطوة 2: إنشاء PDF ==========
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const sections = magazineRef.current.querySelectorAll('[data-pdf-section]');
      
      toast.info(`جاري معالجة ${sections.length} صفحة...`);

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;
        
        if (button) {
          button.textContent = `جاري التصدير... صفحة ${i + 1} من ${sections.length}`;
        }
        
        // ========== الخطوة 3: معالجة القسم الحالي ==========
        // انتظار تحميل جميع الصور في القسم
        const images = section.querySelectorAll('img');
        await Promise.all(
          Array.from(images).map(
            img =>
              new Promise((resolve) => {
                if (img.complete) {
                  resolve(null);
                } else {
                  img.onload = () => resolve(null);
                  img.onerror = () => resolve(null);
                }
              })
          )
        );

        // انتظار تحميل الخطوط مرة أخرى قبل كل صفحة
        await document.fonts.ready;
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // ========== الخطوة 4: تحويل القسم إلى صورة بجودة عالية ==========
        const canvas = await html2canvas(section, {
          scale: 3, // دقة عالية جداً
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          foreignObjectRendering: false, // مهم للنصوص العربية
          letterRendering: true, // تحسين عرض الحروف
          imageTimeout: 30000,
          removeContainer: false,
          windowWidth: 1240, // عرض A4
          windowHeight: 1754, // ارتفاع A4
          scrollY: -window.scrollY,
          scrollX: -window.scrollX,
          // ========== معالجة خاصة للنصوص العربية ==========
          onclone: (clonedDoc) => {
            const clonedSection = clonedDoc.querySelector('[data-pdf-section]') as HTMLElement;
            if (clonedSection) {
              // تطبيق خط Cairo على جميع العناصر بقوة
              const allElements = clonedSection.querySelectorAll('*');
              allElements.forEach((el: Element) => {
                const htmlEl = el as HTMLElement;
                
                // ========== إعدادات الخط العربي ==========
                htmlEl.style.fontFamily = 'Cairo, -apple-system, BlinkMacSystemFont, sans-serif';
                htmlEl.style.direction = 'rtl';
                htmlEl.style.unicodeBidi = 'embed';
                
                // ========== إزالة أي transform قد يسبب مشاكل ==========
                htmlEl.style.transform = 'none';
                htmlEl.style.webkitTransform = 'none';
                
                // ========== تحسين عرض النصوص ==========
                htmlEl.style.textRendering = 'optimizeLegibility';
                htmlEl.style.webkitFontSmoothing = 'antialiased';
                htmlEl.style.mozOsxFontSmoothing = 'grayscale';
                htmlEl.style.fontFeatureSettings = 'normal';
                htmlEl.style.fontKerning = 'normal';
                htmlEl.style.fontVariantLigatures = 'normal';
                
                // ========== منع تكسير النصوص ==========
                htmlEl.style.whiteSpace = 'normal';
                htmlEl.style.wordBreak = 'normal';
                htmlEl.style.wordWrap = 'normal';
                htmlEl.style.overflowWrap = 'normal';
                htmlEl.style.hyphens = 'none';
                
                // ========== الحفاظ على المحاذاة الصحيحة ==========
                const computedStyle = window.getComputedStyle(el);
                if (computedStyle.textAlign === 'right' || computedStyle.textAlign === 'center') {
                  htmlEl.style.textAlign = computedStyle.textAlign;
                }
              });
              
              // ========== معالجة الصور بشكل خاص ==========
              const images = clonedSection.querySelectorAll('img');
              images.forEach((img: HTMLImageElement) => {
                img.style.display = 'block';
                img.setAttribute('crossorigin', 'anonymous');
                // إزالة أي lazy loading
                img.removeAttribute('loading');
                // التأكد من تحميل الصورة
                if (!img.complete) {
                  img.src = img.src; // إعادة تحميل
                }
              });

              // ========== معالجة الخلفيات المتدرجة ==========
              const gradientElements = clonedSection.querySelectorAll('[style*="gradient"]');
              gradientElements.forEach((el: Element) => {
                const htmlEl = el as HTMLElement;
                // التأكد من عدم فقدان الـ gradient
                const style = window.getComputedStyle(el);
                if (style.backgroundImage && style.backgroundImage.includes('gradient')) {
                  htmlEl.style.backgroundImage = style.backgroundImage;
                }
              });

              // ========== إصلاح العناوين الكبيرة ==========
              const headings = clonedSection.querySelectorAll('h1, h2, h3, h4, h5, h6');
              headings.forEach((heading: Element) => {
                const htmlHeading = heading as HTMLElement;
                htmlHeading.style.fontFamily = 'Cairo, sans-serif';
                htmlHeading.style.fontWeight = '900';
                htmlHeading.style.direction = 'rtl';
                htmlHeading.style.whiteSpace = 'normal';
                htmlHeading.style.wordBreak = 'keep-all';
                htmlHeading.style.overflowWrap = 'normal';
              });
            }
          },
        });

        // ========== الخطوة 5: تحويل Canvas إلى صورة عالية الجودة ==========
        const imgData = canvas.toDataURL('image/jpeg', 0.95); // جودة 95%
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;

        // ========== الخطوة 6: إضافة الصفحة إلى PDF ==========
        if (i > 0) {
          pdf.addPage();
        }

        // توسيط الصورة إذا كانت أقصر من الصفحة
        if (imgHeight > pageHeight) {
          // إذا كانت الصورة أطول من الصفحة، نقوم بتصغيرها لتناسب
          const scaledWidth = (pageHeight * canvas.width) / canvas.height;
          const xOffset = scaledWidth > pageWidth ? 0 : (pageWidth - scaledWidth) / 2;
          pdf.addImage(imgData, 'JPEG', xOffset, 0, Math.min(scaledWidth, pageWidth), pageHeight);
        } else {
          // إذا كانت الصورة أقصر، نضعها في المنتصف
          const yOffset = (pageHeight - imgHeight) / 2;
          pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight);
        }
        
        // انتظار صغير بين الصفحات
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // ========== الخطوة 7: حفظ الملف ==========
      const fileName = `${magazineConfig.title}-${magazineConfig.month || 'مجلة'}.pdf`;
      pdf.save(fileName);
      
      if (button) {
        button.textContent = '✓ تم التحميل بنجاح!';
        setTimeout(() => {
          button.innerHTML = '<svg class="size-4 ml-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>تحميل PDF';
        }, 3000);
      }
      
      toast.success('✅ تم تحميل ملف PDF بنجاح!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('❌ حدث خطأ أثناء إنشاء ملف PDF');
      
      if (button) {
        button.innerHTML = '<svg class="size-4 ml-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>تحميل PDF';
      }
    } finally {
      if (stickyHeader) stickyHeader.style.display = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {viewMode === 'admin' ? (
        // Admin Panel
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-black text-blue-900 mb-2">هايبر براند</h1>
            <p className="text-xl text-gray-600">نظام إدارة مجلة عروض السوبر ماركت</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatsCard
              title="عدد المنتجات"
              value={products.length}
              icon={Package}
              color="#3b82f6"
            />
            <StatsCard
              title="عدد الأقسام"
              value={allCategories.filter(cat => productsByCategory[cat]?.length > 0).length}
              icon={Grid3x3}
              color="#10b981"
            />
            <StatsCard
              title="عدد الصفحات"
              value={totalPages}
              icon={FileText}
              color="#f59e0b"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-6 justify-center print:hidden flex-wrap">
            <Button
              onClick={() => setViewMode('settings')}
              variant="default"
              style={{
                backgroundColor: '#f59e0b',
              }}
            >
              <SettingsIcon className="size-4 ml-2" />
              إعدادات المجلة
            </Button>
            <ExcelImport onImport={handleImportExcel} />
            <Button
              onClick={() => setViewMode('preview')}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              <Eye className="size-4 ml-2" />
              معاينة المجلة
            </Button>
            <Button
              onClick={exportToPDF}
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <FileDown className="size-4 ml-2" />
              تحميل PDF
            </Button>
          </div>

          {/* Product Form */}
          <div className="mb-8">
            <ProductForm
              onSubmit={handleAddOrUpdateProduct}
              editingProduct={editingProduct}
              onCancel={() => setEditingProduct(null)}
              categories={allCategories}
            />
          </div>

          {/* Search */}
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

          {/* Category Tabs */}
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

          {/* Products Grid with Drag & Drop */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredProducts.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-wrap justify-center gap-2 max-w-7xl mx-auto">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(product => (
                    <SortableProduct
                      key={product.id}
                      product={product}
                      onDelete={handleDeleteProduct}
                      onEdit={handleEditProduct}
                    />
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
        // Settings Page
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-black mb-2" style={{ color: '#f59e0b' }}>إعدادات المجلة</h1>
            <p className="text-xl text-gray-600">قم بتخصيص مظهر ومعلومات مجلة عروضك</p>
          </div>

          <MagazineSettings
            config={magazineConfig}
            onConfigChange={setMagazineConfig}
          />

          {/* Add New Category Section */}
          <div 
            className="mt-8 rounded-xl shadow-lg overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              border: '2px solid #3b82f6',
            }}
          >
            <div 
              className="px-4 py-3 flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              }}
            >
              <div 
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
              >
                <Grid3x3 className="size-5 text-white" />
              </div>
              <h2 
                className="text-xl font-bold text-white"
                style={{ fontFamily: 'Cairo, sans-serif' }}
              >
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCategory();
                    }
                  }}
                  className="flex-1"
                  style={{
                    borderColor: '#60a5fa',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                />
                <Button
                  onClick={handleAddCategory}
                  className="bg-blue-600 hover:bg-blue-700"
                  style={{ fontFamily: 'Cairo, sans-serif' }}
                >
                  <svg 
                    className="size-4 ml-2" 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14"/><path d="M12 5v14"/>
                  </svg>
                  إضافة القسم
                </Button>
              </div>

              {/* Display Custom Categories */}
              {customCategories.length > 0 ? (
                <div>
                  <h3 
                    className="text-sm font-semibold mb-2"
                    style={{ color: '#1e40af', fontFamily: 'Cairo, sans-serif' }}
                  >
                    ��لأقسام المخصصة ({customCategories.length}):
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {customCategories.map((category) => (
                      <div
                        key={category}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm"
                        style={{
                          backgroundColor: '#eff6ff',
                          border: '1px solid #93c5fd',
                          fontFamily: 'Cairo, sans-serif',
                        }}
                      >
                        <span className="text-sm font-medium" style={{ color: '#1e40af' }}>
                          {category}
                        </span>
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: '#dbeafe', color: '#1e3a8a' }}
                        >
                          {productsByCategory[category]?.length || 0}
                        </span>
                        <button
                          onClick={() => handleDeleteCategory(category)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="حذف القسم"
                        >
                          <svg 
                            className="size-4" 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="24" 
                            height="24" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div 
                  className="text-center py-6 rounded-lg"
                  style={{
                    backgroundColor: '#f0f9ff',
                    border: '2px dashed #93c5fd',
                  }}
                >
                  <p 
                    className="text-sm"
                    style={{ color: '#1e40af', fontFamily: 'Cairo, sans-serif' }}
                  >
                    لا توجد أقسام مخصصة حتى الآن. قم بإضافة قسم جديد أعلاه!
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-center mt-8">
            <Button
              onClick={() => {
                setViewMode('admin');
                toast.success('تم حفظ الإعدادات بنجاح!');
              }}
              variant="default"
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              <svg 
                className="size-5 ml-2" 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              حفظ والعودة
            </Button>
            <Button
              onClick={() => setViewMode('preview')}
              variant="default"
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Eye className="size-5 ml-2" />
              معاينة المجلة
            </Button>
          </div>
        </div>
      ) : (
        // Magazine Preview
        <div style={{ backgroundColor: '#ffffff' }}>
          <div 
            className="print:hidden sticky top-0 z-50 p-4 shadow-lg"
            style={{
              backgroundColor: currentTheme.primary,
              color: '#ffffff',
            }}
          >
            <div className="container mx-auto flex items-center justify-between">
              <h2 className="text-2xl font-bold">معاينة المجلة</h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => setViewMode('admin')}
                  variant="secondary"
                >
                  <SettingsIcon className="size-4 ml-2" />
                  العودة للحة التحكم
                </Button>
                <Button
                  onClick={exportToPDF}
                  variant="default"
                  style={{
                    backgroundColor: '#16a34a',
                  }}
                  data-pdf-button
                >
                  <FileDown className="size-4 ml-2" />
                  تحميل PDF
                </Button>
              </div>
            </div>
          </div>

          <div ref={magazineRef}>
            {/* Magazine Cover */}
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

            {/* Products by Category - Magazine Style with Pages */}
            {allCategories.map(category => {
              const categoryProducts = productsByCategory[category];
              if (!categoryProducts || categoryProducts.length === 0) return null;

              // Split products into pages
              const pages: Product[][] = [];
              for (let i = 0; i < categoryProducts.length; i += PRODUCTS_PER_PAGE) {
                pages.push(categoryProducts.slice(i, i + PRODUCTS_PER_PAGE));
              }

              return pages.map((pageProducts, pageIndex) => (
                <div 
                  key={`${category}-page-${pageIndex}`}
                  data-pdf-section 
                  className="relative min-h-screen p-12 print:break-after-page"
                  style={{ 
                    backgroundColor: '#ffffff',
                  }}
                >
                  {/* Logo at Top */}
                  {magazineConfig.logo && (
                    <div className="absolute top-4 right-8 z-10">
                      <img
                        src={magazineConfig.logo}
                        alt="Logo"
                        className="max-h-16 max-w-[200px] object-contain"
                      />
                    </div>
                  )}

                  {/* Background Image */}
                  <div 
                    className="absolute inset-0 opacity-5"
                    style={{
                      backgroundImage: 'url(https://images.unsplash.com/photo-1560428943-715536fc4689?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <h2 
                      className="text-5xl font-black mb-8 text-center pb-4"
                      style={{
                        color: currentTheme.primary,
                        borderBottom: `4px solid ${currentTheme.secondary}`,
                        fontFamily: 'Cairo, sans-serif',
                      }}
                    >
                      {category}
                    </h2>
                    <div className="flex flex-wrap justify-center gap-6">
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
                  <Button
                    onClick={() => setViewMode('admin')}
                    className="mt-4"
                  >
                    إضافة منتجات
                  </Button>
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