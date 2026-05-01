# 🌟 منصة المنارة - أداة قص الصور الاحترافية (Al-Manara Image Pro)

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite)
![Deployment](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)
![License](https://img.shields.io/badge/license-MIT-green.svg)

أداة متقدمة واحترافية لقص وتنسيق الصور، تتيح للمستخدمين تقسيم الصور إلى شبكات دقيقة (Grid Splitting) مع ميزات ذكية مثل الجذب المغناطيسي والتصدير المجمع. المشروع مفتوح المصدر ومصمم ليكون منصة متكاملة لأدوات الصور.

---

## 🚀 نظام العمل الاحترافي (Live Development Workflow)

يعتمد المشروع على مبدأ **التطوير الحي (CI/CD)** لضمان أسرع وصول للتحديثات:

1.  **البرمجة والتطوير:** يتم العمل على الكود محلياً باستخدام Vite.
2.  **الرفع لـ GitHub:** يتم رفع التعديلات فوراً باستخدام Git.
3.  **النشر التلقائي (Vercel):** بمجرد وصول الكود لـ GitHub، يقوم Vercel ببناء النسخة الجديدة ونشرها "Live" خلال ثوانٍ.

---

## ✨ المميزات الرئيسية (Key Features)

*   **🎯 نظام شبكة ذكي:** تقسيم الصور بدقة متناهية إلى صفوف وأعمدة.
*   **🧲 الجذب المغناطيسي (Magnetic Snapping):** محاذاة تلقائية دقيقة عند تحريك أو تغيير حجم الخلايا.
*   **🚀 تصدير مجمع:** إمكانية تنزيل الصور المقصوصة كملف ZIP واحد أو ملفات منفصلة.
*   **📱 واجهة مستخدم متميزة:** تصميم عصري يدعم الوضع الليلي (Dark Mode) وتجربة مستخدم سلسة.
*   **🛠️ أدوات تحكم متقدمة:** دعم للـ Zoom، التحريك (Pan)، والمعاينة المباشرة قبل التصدير.
*   **🌐 مفتوح المصدر:** الكود متاح للمشاركة والتطوير من قبل المجتمع.

---

## 🏛️ الهيكلة التقنية (Technical Architecture)

يعتمد المشروع على بنية **Component-Based Architecture** مدعومة بنظام **CSS Modules**.

### 📂 هيكل المجلدات (Project Structure)
```text
src/
├── components/          # المكونات المشتركة (Navbar, Footer, etc.)
├── pages/
│   ├── Home.jsx         # الصفحة الرئيسية (المنصة)
│   └── GridSplitter/    # أداة قاطع الشبكة
│       ├── index.jsx    # النواة الرئيسية للأداة
│       ├── components/  # مكونات الأداة الفرعية (Modal, Sidebar, Toolbar)
│       ├── hooks/       # Custom Hooks (Logic)
│       └── utils/       # دوال المساعدة الحسابية (gridUtils, canvasUtils)
├── App.jsx              # جهاز التوجيه الأساسي وإدارة الحالة العامة
└── index.css            # التصميم العام (Design Tokens)
```

---

## 🛠️ التعليمات للمطورين والوكلاء (Developer/Agent Guide)

لضمان استمرارية المشروع بنفس الجودة، يرجى اتباع القواعد التالية:

### 1. إدارة الحالة (State Management)
- استخدم الـ **Hooks** لفصل المنطق البرمجي عن الواجهة.
- يفضل استخدام `Context API` للأدوات المعقدة لتجنب تمرير الـ Props بشكل متكرر.

### 2. التنسيق (Styling)
- استخدم **CSS Modules** حصراً لكل صفحة أو مكون لضمان عدم تداخل التصميمات.
- حافظ على استخدام المتغيرات العامة (Variables) الموجودة في `index.css`.

### 3. عملية الرفع (Deployment & Git)
- استخدم رسائل Commit واضحة (مثال: `Feat: Add Image Compressor`).
- دائماً تأكد من عمل `git push origin main` لتفعيل النشر التلقائي على Vercel.

### 4. البناء والحفظ (Build & Production)
- لتوليد نسخة الإنتاج يدوياً: `npm run build`.
- المجلد الناتج هو `dist/` وهو المجلد الذي يقرأ منه Vercel.

---

## ⚙️ التشغيل المحلي (Installation & Setup)

1. **تثبيت الاعتمادات:**
   ```bash
   npm install
   ```
2. **تشغيل المشروع:**
   ```bash
   npm run dev
   ```

---

## 🎯 خريطة الطريق (Roadmap)

- [x] إطلاق منصة المنارة الأساسية.
- [x] أداة قاطع الشبكة (Grid Splitter).
- [x] الربط التلقائي بـ Vercel و GitHub.
- [ ] إضافة أداة ضغط الصور (Image Compressor).
- [ ] دعم تحويل صيغ الصور (WebP, PNG, JPG).
- [ ] إضافة فلاتر تعديل الصور المباشرة.

---

## 📄 الترخيص (License)
هذا المشروع مرخص بموجب رخصة **MIT**. راجع ملف [LICENSE](./LICENSE) للمزيد من التفاصيل.

---
**تطوير:** فريق المنارة 🚀
**الحالة:** Live & Active 🌐
