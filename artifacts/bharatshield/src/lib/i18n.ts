export type Lang = 'en' | 'hi';

type Copy = {
  // nav
  nav_home: string;
  nav_analyze: string;
  nav_history: string;
  nav_demo: string;
  nav_models: string;
  nav_about: string;
  cta_analyze: string;
  // hero
  hero_eyebrow: string;
  hero_line1: string;
  hero_line2: string;
  hero_sub: string;
  cta_demo: string;
  // shared
  recent: string;
  no_history: string;
};

export const copy: Record<Lang, Copy> = {
  en: {
    nav_home: 'Home',
    nav_analyze: 'Analyze',
    nav_history: 'History',
    nav_demo: 'Demo Lab',
    nav_models: 'Model Center',
    nav_about: 'About',
    cta_analyze: 'Analyze Something',
    hero_eyebrow: 'Digital Safety / India',
    hero_line1: "Don't trust the message.",
    hero_line2: 'Verify it first.',
    hero_sub:
      'BharatShield gives suspicious texts, audio, images, and video metadata a clear first-pass risk assessment — and explains the signals behind every score.',
    cta_demo: 'Explore Demo',
    recent: 'Analysis history',
    no_history: 'Your checked messages will appear here.',
  },
  hi: {
    nav_home: 'होम',
    nav_analyze: 'जाँच',
    nav_history: 'इतिहास',
    nav_demo: 'डेमो लैब',
    nav_models: 'मॉडल सेंटर',
    nav_about: 'हमारे बारे में',
    cta_analyze: 'कुछ जाँचें',
    hero_eyebrow: 'डिजिटल सुरक्षा / भारत',
    hero_line1: 'संदेश पर आँख मूँदकर भरोसा न करें।',
    hero_line2: 'पहले उसे जाँचें।',
    hero_sub:
      'भारतशील्ड संदिग्ध टेक्स्ट, ऑडियो, इमेज और वीडियो मेटाडेटा का स्पष्ट प्रारंभिक जोखिम आकलन देता है — और हर स्कोर के पीछे के संकेत समझाता है।',
    cta_demo: 'डेमो देखें',
    recent: 'जाँच इतिहास',
    no_history: 'आपके जाँचे हुए संदेश यहाँ दिखेंगे।',
  },
};
