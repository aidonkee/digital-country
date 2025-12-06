'use client';

import React, { useState, useEffect, useRef, Suspense, ReactNode } from 'react';
import { Canvas, useFrame, useThree, RootState } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Send, CheckCircle2, Menu, X } from 'lucide-react';
import { Group, Object3D } from 'three';
import type { GLTF } from 'three-stdlib';

// --- THEME CONSTANTS ---
const THEME = {
  bgColor: '#0a0f14',
  primary: '#1e293b',
  accent: '#3b82f6',
  text: '#94a3b8',
  textHighlight: '#e2e8f0',
  glassBg: 'rgba(15, 23, 42, 0.7)',
  glassBorder: 'rgba(148, 163, 184, 0.1)',
};

// --- TYPE DEFINITIONS ---
interface FormData {
  companyName: string;
  fullName: string;
  description: string;
}

interface NavItem {
  name: string;
  link: string;
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

interface GLTFResult extends GLTF {
  nodes: Record<string, Object3D>;
}

// --- SCROLL CONTEXT ---
interface ScrollContextValue {
  scrollY: number;
  scrollProgress: number;
}

const ScrollContext = React.createContext<ScrollContextValue>({
  scrollY: 0,
  scrollProgress: 0,
});

const ScrollProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const main = document.querySelector('main');
    if (main) {
      mainRef.current = main;
      const handleScroll = () => {
        const currentScrollY = main.scrollTop;
        const maxScroll = main.scrollHeight - main.clientHeight;
        setScrollY(currentScrollY);
        setScrollProgress(maxScroll > 0 ? currentScrollY / maxScroll : 0);
      };
      main.addEventListener('scroll', handleScroll, { passive: true });
      return () => main.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <ScrollContext.Provider value={{ scrollY, scrollProgress }}>
      {children}
    </ScrollContext.Provider>
  );
};

const useScrollContext = () => React.useContext(ScrollContext);

// --- 3D COMPONENTS ---
interface ModelCoinProps {
  scrollProgress: number;
}

function ModelCoin({ scrollProgress }: ModelCoinProps) {
  const { nodes } = useGLTF('/models/coin-shape.glb') as GLTFResult;
  const meshRef = useRef<Group>(null);
  const { viewport } = useThree();

  // Smooth transition values based on scroll
  const targetRotationY = useRef(0);
  const targetPositionX = useRef(0);
  const targetPositionY = useRef(0);
  const targetScale = useRef(2.5);

  useFrame((_state: RootState, delta: number) => {
    if (!meshRef.current) return;

    // Calculate target values based on scroll progress
    // Section 0 (Hero): Coin on the right, rotating
    // Section 1 (Services): Coin moves to center-left, tilts
    // Section 2 (Contact): Coin moves down and shrinks

    const section = Math.floor(scrollProgress * 3);
    const sectionProgress = (scrollProgress * 3) % 1;

    if (section === 0 || (section === 0 && sectionProgress === 0)) {
      // Hero section
      targetPositionX.current = viewport.width / 4;
      targetPositionY.current = 0;
      targetScale.current = 2.5;
    } else if (section === 1) {
      // Services section - move to left side
      targetPositionX.current = -viewport.width / 4 + (1 - sectionProgress) * viewport.width / 2;
      targetPositionY.current = sectionProgress * -0.5;
      targetScale.current = 2.5 - sectionProgress * 0.3;
    } else {
      // Contact section - move down and shrink
      targetPositionX.current = -viewport.width / 4;
      targetPositionY.current = -2 - sectionProgress * 2;
      targetScale.current = 2.2 - sectionProgress * 0.5;
    }

    // Continuous rotation with varying speed based on section
    const rotationSpeed = 0.5 + (1 - scrollProgress) * 0.5;
    targetRotationY.current += delta * rotationSpeed;

    // Smooth interpolation (lerp)
    const lerpFactor = 3 * delta;
    meshRef.current.rotation.y += (targetRotationY.current - meshRef.current.rotation.y) * lerpFactor;
    meshRef.current.rotation.x = Math.sin(targetRotationY.current * 0.5) * 0.2;
    meshRef.current.position.x += (targetPositionX.current - meshRef.current.position.x) * lerpFactor;
    meshRef.current.position.y += (targetPositionY.current - meshRef.current.position.y) * lerpFactor;
    
    const currentScale = meshRef.current.scale.x;
    const newScale = currentScale + (targetScale.current - currentScale) * lerpFactor;
    meshRef.current.scale.set(newScale, newScale, newScale);
  });

  const positionX = viewport.width / 4;

  return (
    <group ref={meshRef} position={[positionX, 0, 0]} scale={2.5}>
      <pointLight position={[2, 2, 2]} intensity={3} color="#ffffff" />
      <pointLight position={[-2, -2, -2]} intensity={1} color={THEME.accent} />

      {nodes ? (
        <primitive object={nodes.Scene || nodes.root || Object.values(nodes)[0]} />
      ) : (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1, 1, 0.1, 32]} />
          <meshStandardMaterial color={THEME.accent} metalness={0.9} roughness={0.2} />
        </mesh>
      )}
    </group>
  );
}

useGLTF.preload('/models/coin-shape.glb');

function SceneContent() {
  const { scrollProgress } = useScrollContext();
  
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />
      <directionalLight position={[-3, -3, -3]} intensity={0.3} color="#3b82f6" />
      <Suspense fallback={null}>
        <ModelCoin scrollProgress={scrollProgress} />
      </Suspense>
    </>
  );
}

function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ antialias: true }}
      className="fixed inset-0 z-0 pointer-events-none"
    >
      <SceneContent />
    </Canvas>
  );
}

// --- UI COMPONENTS ---

// Header Component
const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const main = document.querySelector('main');
    if (main) {
      const handleScroll = () => setIsScrolled(main.scrollTop > 20);
      main.addEventListener('scroll', handleScroll, { passive: true });
      return () => main.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const navItems: NavItem[] = [
    { name: 'Innovation', link: '#hero' },
    { name: 'Services', link: '#services' },
    { name: 'Contact', link: '#contact' }
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'py-3' : 'py-6'
      }`}
    >
      <div
        className={`mx-4 md:mx-auto max-w-7xl rounded-xl transition-all duration-500 ${
          isScrolled
            ? 'backdrop-blur-xl py-4 px-6'
            : 'bg-transparent px-4'
        }`}
        style={{
          background: isScrolled ? THEME.glassBg : 'transparent',
          border: isScrolled ? `1px solid ${THEME.glassBorder}` : 'none',
        }}
      >
        <div className="flex justify-between items-center">
          <div
            className="font-bold text-xl tracking-widest flex items-center gap-1"
            style={{ color: THEME.textHighlight }}
          >
            DIGITAL<span style={{ color: THEME.accent }}>COUNTRY</span>
          </div>

          <nav className="hidden md:flex gap-10">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.link}
                className="text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 hover:text-white"
                style={{ color: THEME.text }}
              >
                {item.name}
              </a>
            ))}
          </nav>

          <button
            className="md:hidden p-2"
            style={{ color: THEME.textHighlight }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="absolute top-20 left-4 right-4 rounded-xl p-6 flex flex-col gap-6 md:hidden backdrop-blur-xl"
          style={{
            background: THEME.glassBg,
            border: `1px solid ${THEME.glassBorder}`,
          }}
        >
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.link}
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-bold uppercase tracking-widest transition-colors hover:text-white"
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

// Glass Card Component
const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => (
  <div
    className={`relative overflow-hidden rounded-2xl transition-all duration-500 backdrop-blur-xl ${className}`}
    style={{
      background: THEME.glassBg,
      border: `1px solid ${THEME.glassBorder}`,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    }}
  >
    <div
      className="absolute inset-0 opacity-30"
      style={{
        background: `radial-gradient(ellipse at top left, ${THEME.accent}20, transparent 50%)`,
      }}
    />
    <div className="relative z-10 p-6 md:p-8">{children}</div>
  </div>
);

// Background Text Component
const BackgroundText: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
      style={{
        fontSize: 'clamp(4rem, 15vw, 12rem)',
        fontWeight: 900,
        letterSpacing: '0.1em',
        color: 'transparent',
        WebkitTextStroke: `1px ${THEME.text}20`,
        opacity: 0.3,
      }}
    >
      DIGITAL COUNTRY
    </div>
  </div>
);

// SECTION 1: Hero
const SectionHero: React.FC = () => {
  return (
    <section
      id="hero"
      className="h-screen w-full flex items-center relative snap-start snap-always"
    >
      {/* Background DIGITAL COUNTRY text */}
      <BackgroundText />

      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left column: Text content */}
        <div className="z-10">
          <div className="flex items-center gap-3 mb-8 opacity-70">
            <div
              className="h-px w-12"
              style={{ backgroundColor: THEME.accent }}
            />
            <span
              className="text-xs font-bold tracking-[0.4em] uppercase"
              style={{ color: THEME.text }}
            >
              Digital Country
            </span>
          </div>

          <h1
            className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight"
            style={{ color: THEME.textHighlight }}
          >
            DIGITAL
            <br />
            <span style={{ color: THEME.accent }}>EVOLUTION</span>
          </h1>

          <p
            className="text-lg leading-relaxed max-w-lg font-light mb-8"
            style={{ color: THEME.text }}
          >
            We transform businesses through cutting-edge digital solutions.
            Visualization, analytics, and technologies that drive your results.
          </p>

          <a
            href="#contact"
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full font-semibold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent}80)`,
              color: THEME.textHighlight,
              boxShadow: `0 4px 20px ${THEME.accent}40`,
            }}
          >
            Get Started
            <Send size={16} />
          </a>
        </div>

        {/* Right column: Space for 3D coin */}
        <div className="hidden md:block h-full min-h-[50vh]" />
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce z-10 flex flex-col items-center gap-2">
        <div
          className="w-6 h-10 rounded-full border-2 flex justify-center pt-2"
          style={{ borderColor: THEME.text }}
        >
          <div
            className="w-1 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: THEME.accent }}
          />
        </div>
        <span
          className="text-[10px] uppercase tracking-widest"
          style={{ color: THEME.text }}
        >
          Scroll
        </span>
      </div>
    </section>
  );
};

// SECTION 2: Services
const SectionServices: React.FC = () => {
  const services = [
    {
      title: '3D Tours',
      description:
        'Interactive virtual walkthroughs. Perfect for showcasing real estate and manufacturing facilities.',
    },
    {
      title: '3D Objects',
      description:
        'High-polygon product models. Integration with AR/VR and marketing campaigns.',
    },
    {
      title: 'LIDAR Scanning',
      description:
        'Laser scanning of spaces and territories with millimeter precision. Point clouds for BIM and digital twins.',
      fullWidth: true,
    },
  ];

  return (
    <section
      id="services"
      className="h-screen w-full flex items-center relative snap-start snap-always"
    >
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 h-full items-center relative z-10">
        <div className="md:col-span-4 h-full relative flex items-end pb-20" />

        <div className="md:col-span-8 z-10 flex flex-col justify-center gap-8">
          <div className="mb-4">
            <span
              className="text-xs font-bold tracking-[0.3em] uppercase mb-4 block"
              style={{ color: THEME.accent }}
            >
              What We Offer
            </span>
            <h2
              className="text-4xl md:text-5xl font-bold"
              style={{ color: THEME.textHighlight }}
            >
              Our Services
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <GlassCard
                key={service.title}
                className={`group cursor-pointer hover:scale-[1.02] ${
                  service.fullWidth ? 'md:col-span-2' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3
                    className="text-xl font-bold"
                    style={{ color: THEME.textHighlight }}
                  >
                    {service.title}
                  </h3>
                  <CheckCircle2
                    size={20}
                    className="transition-colors duration-300"
                    style={{ color: THEME.accent }}
                  />
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: THEME.text }}
                >
                  {service.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// SECTION 3: Contact
const SectionContact: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    fullName: '',
    description: '',
  });

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { companyName, fullName, description } = formData;
    const text = `Hello, my name is ${fullName}. I represent ${companyName}. We would like to discuss ${description}`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/77779018747?text=${encodedText}`, '_blank');
  };

  return (
    <section
      id="contact"
      className="h-screen w-full flex items-center justify-center relative snap-start snap-always"
    >
      <div className="container mx-auto px-6 max-w-2xl z-10">
        <GlassCard>
          <div className="mb-10">
            <span
              className="text-xs font-bold tracking-[0.3em] uppercase mb-4 block"
              style={{ color: THEME.accent }}
            >
              Get In Touch
            </span>
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: THEME.textHighlight }}
            >
              Start Your Project
            </h2>
            <p className="text-sm" style={{ color: THEME.text }}>
              Fill out the form below and we&apos;ll get back to you
            </p>
          </div>

          <form onSubmit={handleSend} className="space-y-6">
            <div className="group">
              <input
                type="text"
                required
                className="w-full bg-transparent border-b-2 py-4 text-lg focus:outline-none transition-all duration-300"
                placeholder="Organization Name"
                style={{
                  color: THEME.textHighlight,
                  borderColor: THEME.glassBorder,
                }}
                onFocus={(e) => (e.target.style.borderColor = THEME.accent)}
                onBlur={(e) => (e.target.style.borderColor = THEME.glassBorder)}
                value={formData.companyName}
                onChange={(e) =>
                  setFormData({ ...formData, companyName: e.target.value })
                }
              />
            </div>

            <div className="group">
              <input
                type="text"
                required
                className="w-full bg-transparent border-b-2 py-4 text-lg focus:outline-none transition-all duration-300"
                placeholder="Full Name"
                style={{
                  color: THEME.textHighlight,
                  borderColor: THEME.glassBorder,
                }}
                onFocus={(e) => (e.target.style.borderColor = THEME.accent)}
                onBlur={(e) => (e.target.style.borderColor = THEME.glassBorder)}
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
            </div>

            <div className="group">
              <textarea
                required
                rows={3}
                className="w-full bg-transparent border-b-2 py-4 text-lg focus:outline-none transition-all duration-300 resize-none"
                placeholder="Project Description..."
                style={{
                  color: THEME.textHighlight,
                  borderColor: THEME.glassBorder,
                }}
                onFocus={(e) => (e.target.style.borderColor = THEME.accent)}
                onBlur={(e) => (e.target.style.borderColor = THEME.glassBorder)}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              className="group flex items-center gap-4 px-8 py-4 rounded-full font-semibold text-sm uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:gap-6 mt-8"
              style={{
                background: `linear-gradient(135deg, ${THEME.accent}, ${THEME.accent}80)`,
                color: THEME.textHighlight,
                boxShadow: `0 4px 20px ${THEME.accent}40`,
              }}
            >
              <span>Send Message</span>
              <Send size={16} />
            </button>
          </form>
        </GlassCard>
      </div>
    </section>
  );
};

// --- MAIN COMPONENT ---

export default function App() {
  return (
    <ScrollProvider>
      <div
        className="relative h-screen w-full overflow-hidden font-sans selection:bg-blue-500/30 selection:text-white"
        style={{ backgroundColor: THEME.bgColor }}
      >
        <Header />

        {/* 3D Layer (Fixed) */}
        <Scene />

        {/* Content */}
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
          html {
            scroll-behavior: smooth;
          }
          ::placeholder {
            color: ${THEME.text};
            opacity: 0.6;
          }
        `}</style>
      </div>
    </ScrollProvider>
  );
}