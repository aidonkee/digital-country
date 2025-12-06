'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, useScroll, useGLTF, Environment } from '@react-three/drei';
import { ChevronDown, Send, User, Building2, FileText, CheckCircle2, Menu, X } from 'lucide-react';
import * as THREE from 'three';

// --- КОНСТАНТЫ И НАСТРОЙКИ ---
const THEME = {
  // Фон сплошной, очень темный (почти черный)
  bgColor: '#1e6d84', 
  
  // Акцентный цвет (едва заметный темно-синий/серый)
  primary: '#1e293b', // Slate-800
  
  // Текст: темный, низкий контраст (чуть светлее фона)
  text: '#334155', // Slate-700
  textHighlight: '#475569', // Чуть светлее для заголовков
  
  // Стекло очень темное и чистое
  glassBg: 'rgba(10, 10, 10, 0.6)', 
  glassBorder: 'rgba(255, 255, 255, 0.03)', 
};

// --- 3D КОМПОНЕНТЫ ---

function ModelCoin() {
    const { nodes, materials } = useGLTF('/models/coin-shape.glb'); 
    const meshRef = useRef();
    const { viewport } = useThree();
    
    
    useFrame((state, delta) => {
        if (!meshRef.current) return;
        
        // Простое вращение вокруг своей оси
        meshRef.current.rotation.y += delta * 1.0; 
    });

    // Фиксированная позиция СПРАВА
    // viewport.width / 4 - это примерно середина правой половины экрана
    const positionX = viewport.width / 3.5;

    return (
        <group ref={meshRef} position={[positionX, 0, 0]} scale={2.5}>
             {/* Свет настроен так, чтобы выявлять форму на темном фоне */}
             <pointLight position={[2, 2, 2]} intensity={2} color="#ffffff" />
             <pointLight position={[-2, -2, -2]} intensity={0.5} color="#334155" />
             
            {nodes ? (
                 <primitive object={nodes.Scene || nodes.root || Object.values(nodes)[0]} />
            ) : (
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[1, 1, 0.1, 32]} />
                    <meshStandardMaterial color={THEME.primary} metalness={0.8} roughness={0.3} />
                </mesh>
            )}
        </group>
    );
}

// Предзагрузка
useGLTF.preload('/models/coin-shape.glb');

function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ antialias: true }} className="fixed inset-0 z-0 pointer-events-none">
        {/* Освещение приглушенное для темной темы */}
        <ambientLight intensity={0.1} />
        <Environment preset="night" /> 
        <directionalLight position={[5, 5, 5]} intensity={0.5} color="#ffffff" />
        
        <Suspense fallback={null}>
            <ModelCoin />
        </Suspense>
    </Canvas>
  );
}

// --- UI КОМПОНЕНТЫ ---

// Хедер
const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
    useEffect(() => {
      const handleScroll = () => setIsScrolled(window.scrollY > 20);
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);
  
    const navItems = [
      { name: 'Инновации', link: '#hero' },
      { name: 'Услуги', link: '#services' },
      { name: 'Контакты', link: '#contact' }
    ];
  
    return (
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? 'py-4' : 'py-8'
        }`}
      >
        <div className={`mx-4 md:mx-auto max-w-7xl rounded-none border-b transition-all duration-500 ${
            isScrolled 
            ? 'bg-[#050505]/80 backdrop-blur-md border-[#334155]/20 py-4 px-6' 
            : 'bg-transparent border-transparent px-0'
        }`}>
            <div className="flex justify-between items-center">
                <div className="font-bold text-xl tracking-widest flex items-center gap-2" style={{ color: THEME.textHighlight }}>
                    DIGITAL<span style={{ color: THEME.text }}>COUNTRY</span>
                </div>
  
                <nav className="hidden md:flex gap-10">
                    {navItems.map((item) => (
                        <a 
                            key={item.name} 
                            href={item.link}
                            className="text-xs font-bold uppercase tracking-[0.2em] transition-colors hover:text-white"
                            style={{ color: THEME.text }}
                        >
                            {item.name}
                        </a>
                    ))}
                </nav>

                <button className="md:hidden" style={{ color: THEME.textHighlight }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>
        </div>

        {mobileMenuOpen && (
            <div className="absolute top-24 left-0 right-0 bg-[#050505] border-b border-[#334155]/20 p-6 flex flex-col gap-6 md:hidden">
                 {navItems.map((item) => (
                        <a 
                            key={item.name} 
                            href={item.link}
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-lg font-bold uppercase tracking-widest"
                            style={{ color: THEME.textHighlight }}
                        >
                            {item.name}
                        </a>
                    ))}
            </div>
        )}
      </header>
    );
  };

// Карточка (Minimal Solid/Glass)
const MinimalCard = ({ children, className = '' }) => (
    <div 
        className={`relative overflow-hidden rounded-sm transition-all duration-500 group ${className}`}
        style={{
            background: 'transparent',
            borderLeft: `1px solid ${THEME.text}`, // Тонкая линия слева вместо рамок
        }}
    >
        <div className="relative z-10 p-6 md:p-8">
            {children}
        </div>
    </div>
);

// СТРАНИЦА 1: Главная
const SectionHero = () => {
    return (
        <section id="hero" className="min-h-screen w-full flex items-center relative snap-start pt-20">
            <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
                {/* КОЛОНКА 1: Текст СЛЕВА */}
                <div className="z-10">
                    <div className="flex items-center gap-3 mb-8 opacity-50">
                        <div className="h-px w-12" style={{ backgroundColor: THEME.text }}></div>
                        <span className="text-xs font-bold tracking-[0.4em] uppercase" style={{ color: THEME.text }}>Digital Country</span>
                    </div>
                    
                    {/* Текст темный, чуть светлее фона (низкий контраст) */}
                    <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tighter" style={{ color: THEME.textHighlight }}>
                        ЦИФРОВАЯ <br />
                        ЭВОЛЮЦИЯ
                    </h1>
                    
                    <p className="text-lg leading-relaxed max-w-lg font-light" style={{ color: THEME.text }}>
                        Мы трансформируем бизнес через передовые цифровые решения. 
                        Визуализация, аналитика и технологии, которые работают на ваш результат.
                    </p>
                </div>

                {/* КОЛОНКА 2: Пустое место для монеты СПРАВА */}
                <div className="hidden md:block h-full min-h-[50vh]">
                    {/* Монета здесь (рендерится в Canvas) */}
                </div>
            </div>
            
            <div className="absolute bottom-10 left-6 animate-pulse z-10 flex flex-col items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest rotate-[-90deg] mb-4" style={{ color: THEME.text }}>Scroll</span>
                <div className="w-px h-12" style={{ backgroundColor: THEME.text }}></div>
            </div>
        </section>
    );
};

// СТРАНИЦА 2: Услуги
const SectionServices = () => {
    return (
        <section id="services" className="min-h-screen w-full flex items-center relative snap-start">
            <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 h-full items-center relative z-10">
                <div className="md:col-span-4 h-full relative flex items-end pb-20"></div>

                <div className="md:col-span-8 z-10 flex flex-col justify-center gap-12">
                    <div className="mb-4">
                        <h2 className="text-4xl font-bold" style={{ color: THEME.textHighlight }}>Наши Услуги</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Карточки без фона, только типографика и линии */}
                        <div className="group cursor-pointer">
                            <div className="flex justify-between items-start mb-4 border-b border-[#334155]/30 pb-4 group-hover:border-[#475569] transition-colors">
                                <h3 className="text-xl font-bold" style={{ color: THEME.textHighlight }}>3D Туры</h3>
                                <CheckCircle2 size={20} style={{ color: THEME.text }} />
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: THEME.text }}>
                                Интерактивные виртуальные прогулки. Идеально для демонстрации недвижимости и производств.
                            </p>
                        </div>

                        <div className="group cursor-pointer">
                            <div className="flex justify-between items-start mb-4 border-b border-[#334155]/30 pb-4 group-hover:border-[#475569] transition-colors">
                                <h3 className="text-xl font-bold" style={{ color: THEME.textHighlight }}>3D Объекты</h3>
                                <CheckCircle2 size={20} style={{ color: THEME.text }} />
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: THEME.text }}>
                                Высокополигональные модели товаров. Внедрение в AR/VR и маркетинг.
                            </p>
                        </div>

                        <div className="group cursor-pointer md:col-span-2">
                             <div className="flex justify-between items-start mb-4 border-b border-[#334155]/30 pb-4 group-hover:border-[#475569] transition-colors">
                                <h3 className="text-xl font-bold" style={{ color: THEME.textHighlight }}>LIDAR Сканирование</h3>
                                <CheckCircle2 size={20} style={{ color: THEME.text }} />
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: THEME.text }}>
                                Лазерное сканирование помещений и территорий с точностью до миллиметра. Облака точек для BIM и цифровых двойников.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

// СТРАНИЦА 3: Контакты
const SectionContact = () => {
    const [formData, setFormData] = useState({
        companyName: '',
        fullName: '',
        description: ''
    });

    const handleSend = (e) => {
        e.preventDefault();
        const { companyName, fullName, description } = formData;
        const text = `Здравствуйте, меня зовут ${fullName}. Я представитель компании ${companyName}. Мы хотим сделать для нашей компании ${description}`;
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/77779018747?text=${encodedText}`, '_blank');
    };

    return (
        <section id="contact" className="min-h-screen w-full flex items-center justify-center relative snap-start">
            <div className="container mx-auto px-6 max-w-2xl z-10 pt-20">
                <MinimalCard>
                    <div className="mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: THEME.textHighlight }}>Начать проект</h2>
                        <p className="text-sm" style={{ color: THEME.text }}>Заполните форму ниже</p>
                    </div>

                    <form onSubmit={handleSend} className="space-y-8">
                        <div className="group">
                            <input 
                                type="text" 
                                required
                                className="w-full bg-transparent border-b border-[#334155]/50 py-4 text-lg focus:outline-none focus:border-[#475569] transition-all placeholder-[#334155]"
                                placeholder="Название организации"
                                style={{ color: THEME.textHighlight }}
                                value={formData.companyName}
                                onChange={e => setFormData({...formData, companyName: e.target.value})}
                            />
                        </div>

                        <div className="group">
                            <input 
                                type="text" 
                                required
                                className="w-full bg-transparent border-b border-[#334155]/50 py-4 text-lg focus:outline-none focus:border-[#475569] transition-all placeholder-[#334155]"
                                placeholder="Имя Фамилия"
                                style={{ color: THEME.textHighlight }}
                                value={formData.fullName}
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                            />
                        </div>

                        <div className="group">
                            <textarea 
                                required
                                rows={2}
                                className="w-full bg-transparent border-b border-[#334155]/50 py-4 text-lg focus:outline-none focus:border-[#475569] transition-all placeholder-[#334155] resize-none"
                                placeholder="Описание задачи..."
                                style={{ color: THEME.textHighlight }}
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                        </div>

                        <button 
                            type="submit"
                            className="group flex items-center gap-4 text-sm font-bold uppercase tracking-widest transition-all hover:gap-6 mt-8"
                            style={{ color: THEME.textHighlight }}
                        >
                            <span>Отправить</span>
                            <Send size={16} />
                        </button>
                    </form>
                </MinimalCard>
            </div>
        </section>
    );
};

// --- ОСНОВНОЙ КОМПОНЕНТ ---

export default function App() {
    return (
        <div 
            className="relative h-screen w-full overflow-hidden font-sans selection:bg-[#334155] selection:text-white"
            style={{ backgroundColor: THEME.bgColor }}
        >
            <Header />

            {/* 3D Слой (Фиксированный) */}
            <Scene />

            {/* Контент */}
            <main className="absolute inset-0 overflow-y-auto snap-y snap-mandatory scroll-smooth z-10 no-scrollbar">
                <SectionHero />
                <SectionServices />
                <SectionContact />
            </main>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}