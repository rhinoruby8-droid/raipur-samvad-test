import React, { useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="border-t-4 border-[#dc2626] bg-[#0f172a] text-white pt-12 pb-8 mt-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
        {/* Brand & Mission */}
        <div className="md:col-span-4">
          <div className="mb-4">
            <Logo variant="footer" />
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-4 font-serif">
            रायपुर संवाद (Raipur Samvad) छत्तीसगढ़ की स्वतंत्र एवं विश्वसनीय पत्रकारिता का प्रमुख केंद्र है। हमारा उद्देश्य निष्पक्ष समाचार, स्थानीय शासन की पारदर्शिता एवं जनसरोकार की आवाज़ को हर नागरिक तक पहुँचाना है।
          </p>
          <div className="text-[11px] text-slate-400 font-sans">
            पंजीकृत डिजिटल समाचार पत्र • ISSN 2831-9021 • रायपुर, छत्तीसगढ़
          </div>
        </div>

        {/* Beats Navigation */}
        <div className="md:col-span-2">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">मुख्य श्रेणियाँ (Desks)</h4>
          <ul className="space-y-2 text-xs text-slate-300">
            <li><a href="#" className="hover:text-white transition-colors">रायपुर नगर निगम (RMC)</a></li>
            <li><a href="#" className="hover:text-white transition-colors">छत्तीसगढ़ शासन & नीतियां</a></li>
            <li><a href="#" className="hover:text-white transition-colors">स्थानीय व्यापार व उद्योग</a></li>
            <li><a href="#" className="hover:text-white transition-colors">संस्कृति एवं कला मंडल</a></li>
            <li><a href="#" className="hover:text-white transition-colors">शिक्षा व रोज़गार</a></li>
          </ul>
        </div>

        {/* Public Disclosures */}
        <div className="md:col-span-2">
          <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">नैतिकता व नीति</h4>
          <ul className="space-y-2 text-xs text-slate-300">
            <li><a href="#" className="hover:text-white transition-colors">संपादकीय स्वतंत्रता नीति</a></li>
            <li><a href="#" className="hover:text-white transition-colors">सत्यापन एवं सुधार</a></li>
            <li><a href="#" className="hover:text-white transition-colors">समाचार टिप भेजें (News Tip)</a></li>
            <li><a href="#" className="hover:text-white transition-colors">विज्ञापन एवं प्रायोजन</a></li>
            <li><a href="#" className="hover:text-white transition-colors">संपर्क सूत्र (Contact Us)</a></li>
          </ul>
        </div>

        {/* Newsletter Signup Box */}
        <div className="md:col-span-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
          <h4 className="text-sm font-bold text-white mb-1 font-serif">दैनिक बुलेटिन (Morning Brief)</h4>
          <p className="text-xs text-slate-300 mb-3">
            रायपुर और छत्तीसगढ़ की प्रमुख ख़बरें हर सुबह 7:00 बजे अपने ईमेल इनबॉक्स में प्राप्त करें।
          </p>

          {subscribed ? (
            <div className="bg-emerald-950/80 border border-emerald-500/50 p-3 rounded-lg text-xs text-emerald-200 flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>आपकी सदस्यता सफलतापूर्वक जुड़ गई है! धन्यवाद।</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ईमेल दर्ज करें..."
                className="p-2.5 text-xs bg-slate-950 border border-slate-700 text-white rounded-lg flex-1 focus:outline-none focus:border-[#dc2626]"
                required
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              >
                सदस्य बनें
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div>© {new Date().getFullYear()} रायपुर संवाद (Raipur Samvad Digital Initiative). सर्वाधिकार सुरक्षित।</div>
        <div className="flex space-x-4">
          <a href="#" className="hover:underline">गोपनीयता नीति (Privacy)</a>
          <a href="#" className="hover:underline">सेवा शर्तें (Terms)</a>
          <a href="#" className="hover:underline">विज्ञापन पूछताछ</a>
        </div>
      </div>
    </footer>
  );
};

