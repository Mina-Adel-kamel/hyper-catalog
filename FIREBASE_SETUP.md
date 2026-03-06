# دليل إعداد Firebase لموقع هايبر براند

## الخطوات المطلوبة

### 1. إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. انقر على "Add project" (إضافة مشروع)
3. أدخل اسم المشروع مثل "hyper-brand-magazine"
4. اتبع الخطوات حتى يتم إنشاء المشروع

### 2. إنشاء تطبيق ويب (Web App)

1. في صفحة المشروع، انقر على أيقونة الويب `</>`
2. أدخل اسم التطبيق مثل "Hyper Brand Web"
3. لا تحتاج لتفعيل Firebase Hosting
4. انقر على "Register app"

### 3. نسخ إعدادات Firebase

بعد تسجيل التطبيق، سترى كود JavaScript يحتوي على `firebaseConfig`. انسخ هذه القيم:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 4. تحديث ملف Firebase Configuration

افتح ملف `/src/lib/firebase.ts` واستبدل القيم الموجودة بقيمك:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // استبدل هذا
  authDomain: "YOUR_AUTH_DOMAIN", // استبدل هذا
  projectId: "YOUR_PROJECT_ID", // استبدل هذا
  storageBucket: "YOUR_STORAGE_BUCKET", // استبدل هذا
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // استبدل هذا
  appId: "YOUR_APP_ID" // استبدل هذا
};
```

### 5. إعداد Firestore Database

1. في Firebase Console، اذهب إلى "Firestore Database"
2. انقر على "Create database"
3. اختر "Start in production mode" أو "Start in test mode"
4. اختر موقع الخادم (يفضل اختيار أقرب موقع جغرافي)

#### قواعد الأمان لـ Firestore (للتطوير فقط):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{document} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **تحذير**: هذه القواعد تسمح للجميع بالقراءة والكتابة. للإنتاج، يجب تعديلها لتكون أكثر أماناً.

### 6. إعداد Firebase Storage

1. في Firebase Console، اذهب إلى "Storage"
2. انقر على "Get started"
3. اتبع الخطوات لإنشاء Storage bucket

#### قواعد الأمان لـ Storage (للتطوير فقط):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **تحذير**: هذه القواعد تسمح للجميع بالقراءة والكتابة. للإنتاج، يجب تعديلها لتكون أكثر أماناً.

## كيفية استخدام Firebase في التطبيق

### إضافة منتج جديد
- عند إضافة منتج، سيتم:
  1. رفع الصورة إلى Firebase Storage
  2. حفظ بيانات المنتج في Firestore
  3. تخزين رابط الصورة من Storage في Firestore

### تعديل منتج
- عند تعديل منتج، سيتم:
  1. رفع صورة جديدة إذا تم تغييرها
  2. تحديث بيانات المنتج في Firestore

### حذف منتج
- عند حذف منتج، سيتم:
  1. حذف الصورة من Firebase Storage
  2. حذف بيانات المنتج من Firestore

## استكشاف الأخطاء

### خطأ "Firebase: Error (auth/operation-not-allowed)"
- تأكد من تفعيل Authentication في Firebase Console

### خطأ "Permission denied"
- تحقق من قواعد الأمان في Firestore و Storage
- تأكد من أن القواعد تسمح بالقراءة والكتابة

### الصور لا تظهر
- تحقق من أن Storage bucket تم إعداده بشكل صحيح
- تحقق من قواعد CORS في Storage

## الوضع الحالي

حالياً، الموقع يستخدم **localStorage** لتخزين البيانات مؤقتاً.

بعد إعداد Firebase بشكل صحيح:
1. سيتم استخدام Firebase لتخزين المنتجات والصور
2. البيانات ستبقى متاحة عبر جميع الأجهزة
3. الصور ستُحفظ بشكل آمن في Firebase Storage

## ملاحظات مهمة

- 🔒 **الأمان**: القواعد الحالية للتطوير فقط. للإنتاج، يجب إضافة مصادقة (Authentication)
- 💰 **التكلفة**: Firebase مجاني حتى حد معين. راجع [خطط التسعير](https://firebase.google.com/pricing)
- 📦 **الحجم**: حد التخزين المجاني هو 5 GB
- 🌐 **الشبكة**: حد النقل المجاني هو 1 GB/شهر

## دعم فني

إذا واجهت أي مشكلة:
1. راجع [وثائق Firebase](https://firebase.google.com/docs)
2. تحقق من Console في المتصفح للأخطاء
3. تأكد من أن جميع القيم في `firebase.ts` صحيحة
