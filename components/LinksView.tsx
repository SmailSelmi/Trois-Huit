"use client";

import React from "react";
import GlassCard from "./GlassCard";
import {
  Plane,
  PlaneTakeoff,
  Globe,
  Apple,
  ExternalLink,
  Smartphone,
} from "lucide-react";

interface LinkItem {
  title: string;
  description: string;
  url: string;
  Icon: React.ElementType;
  iconColor: string;
  cta: string;
}

const links: LinkItem[] = [
  {
    title: "تطبيق محطتي Mahatati (Android)",
    description:
      "تطبيق شركة سوقرال للاستعلام عن مواعيد وساعات انطلاق الحافلات واقتناء التذاكر.",
    url: "https://play.google.com/store/apps/details?id=com.sogral.mobile&hl=fr",
    Icon: Smartphone,
    iconColor: "text-emerald-400",
    cta: "فتح المتجر",
  },
  {
    title: "تطبيق محطتي Mahatati (iOS)",
    description:
      "تطبيق شركة سوقرال للاستعلام عن مواعيد وساعات انطلاق الحافلات واقتناء التذاكر.",
    url: "https://apps.apple.com/fr/app/mahatati/id6754021775",
    Icon: Apple,
    iconColor: "text-slate-100",
    cta: "فتح المتجر",
  },
  {
    title: "الخطوط الجوية الجزائرية (الموقع الرسمي)",
    description:
      "بوابة حجز الرحلات الداخلية والدولية وإدارة الحجوزات الخاصة بك.",
    url: "https://airalgerie.dz/ar/",
    Icon: Globe,
    iconColor: "text-blue-400",
    cta: "زيارة الموقع",
  },
  {
    title: "تطبيق الخطوط الجوية الجزائرية (iOS)",
    description:
      "حمل التطبيق الرسمي للوصول السريع لجدول الرحلات وبطاقات الصعود.",
    url: "https://apps.apple.com/lu/app/air-alg%C3%A9rie/id1458273665?l=fr-FR",
    Icon: Apple,
    iconColor: "text-slate-100",
    cta: "فتح المتجر",
  },
  {
    title: "طيران الطاسيلي (الموقع الرسمي)",
    description:
      "الموقع المفضل للكثير من عمال قطاع النفط والصناعة للتنقل الداخلي.",
    url: "https://fly.tassiliairlines.com/B2C/ar",
    Icon: Plane,
    iconColor: "text-emerald-400",
    cta: "زيارة الموقع",
  },
];

export default function LinksView() {
  return (
    <div className="flex flex-col gap-6 w-full" dir="rtl">
      <div className="w-full flex flex-col gap-6">
        {/* Header */}
        <div className="text-center mb-2">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.2)] animate-zoom-in">
            <PlaneTakeoff size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-100">روابط مفيدة</h1>
          <p className="text-sm font-bold text-slate-500 mt-1">
            موارد النقل الجوي والشركات الوطنية
          </p>
        </div>

        {/* Links Grid */}
        <div className="grid gap-4">
          {links.map((link, index) => (
            <GlassCard
              key={index}
              className="p-5 group hover:bg-white/[0.04] transition-all duration-300 border-white/[0.05] hover:border-blue-500/20"
            >
              <div className="flex items-start gap-5">
                {/* Icon Container */}
                <div className="p-3 bg-[#0f172a] rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                  <link.Icon size={24} className={link.iconColor} />
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col gap-1">
                  <h3 className="text-base font-black text-slate-100 group-hover:text-blue-400 transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-[11px] font-bold text-slate-500 leading-relaxed mb-3">
                    {link.description}
                  </p>

                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white text-[11px] font-black uppercase tracking-wider transition-all duration-300 active:scale-95"
                  >
                    <span>{link.cta}</span>
                    <ExternalLink size={14} className="scale-x-[-1]" />
                  </a>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Info Card */}
        <div className="mt-2 p-4 rounded-2xl bg-slate-900/40 border border-white/[0.05] text-center">
          <p className="text-[10px] font-bold text-slate-500 italic leading-relaxed px-4">
            هذه الروابط خارجية وتخص الشركات الناقلة الرسمية. Trois Huit لا يتحمل
            مسؤولية محتوى هذه المواقع.
          </p>
        </div>
      </div>
    </div>
  );
}
