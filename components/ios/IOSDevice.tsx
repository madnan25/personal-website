"use client";

import { useState } from "react";
import { motion, PanInfo } from "framer-motion";
import StatusBar from "./StatusBar";
import HomeScreen from "./HomeScreen";
import AppWindow from "./AppWindow";
import ControlCenter from "./ControlCenter";

interface AppState {
  id: string;
  title: string;
  isOpen: boolean;
  component: React.ReactNode;
}

export default function IOSDevice() {
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [apps, setApps] = useState<Record<string, AppState>>({
    about: {
      id: 'about',
      title: 'About',
      isOpen: false,
      component: <AboutApp />
    },
    portfolio: {
      id: 'portfolio',
      title: 'Portfolio',
      isOpen: false,
      component: <PortfolioApp />
    },
    contact: {
      id: 'contact',
      title: 'Contact',
      isOpen: false,
      component: <ContactApp />
    },
  });

  const handleControlCenterDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const startX = (event as MouseEvent).clientX || 
                  ((event as TouchEvent).touches && (event as TouchEvent).touches[0]?.clientX) || 0;
    const windowWidth = window.innerWidth;
    
    if (startX > windowWidth * 0.7 && info.offset.y > 50) {
      setControlCenterOpen(true);
    }
  };

  const handleAppOpen = (appId: string) => {
    setApps(prev => ({
      ...prev,
      [appId]: { ...prev[appId], isOpen: true }
    }));
  };

  const handleAppClose = (appId: string) => {
    setApps(prev => ({
      ...prev,
      [appId]: { ...prev[appId], isOpen: false }
    }));
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-blue-800" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </motion.div>
      </div>
      
      <motion.div
        className="absolute top-0 right-0 w-20 h-20 z-10"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDrag={handleControlCenterDrag}
      />

      <StatusBar />
      <HomeScreen onAppOpen={handleAppOpen} />
      
      {Object.values(apps).map((app) => (
        <AppWindow
          key={app.id}
          title={app.title}
          isOpen={app.isOpen}
          onClose={() => handleAppClose(app.id)}
        >
          {app.component}
        </AppWindow>
      ))}
      
      <ControlCenter 
        isOpen={controlCenterOpen} 
        onClose={() => setControlCenterOpen(false)} 
      />
    </div>
  );
}

function AboutApp() {
  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
          👨‍💻
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">MD Adnan</h1>
        <p className="text-gray-600 mb-4">Strategic Design Leader</p>
        
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {['CMO', 'Founder', 'Head of Delivery'].map((role) => (
            <span 
              key={role}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
            >
              {role}
            </span>
          ))}
        </div>
      </motion.div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">About Me</h2>
          <p className="text-gray-700 leading-relaxed">
            I'm a strategic design leader who bridges visionary marketing strategies with flawless technical execution. 
            My passion lies in building premium digital experiences that drive measurable business impact.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Core Expertise</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Brand Strategy',
              'Growth Marketing',
              'UX/UI Design',
              'Team Leadership',
              'Product Management',
              'Technical Delivery'
            ].map((skill) => (
              <div key={skill} className="flex items-center space-x-2 text-sm text-gray-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>{skill}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioApp() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Portfolio</h2>
      <div className="space-y-4">
        {[1, 2, 3].map((project) => (
          <div key={project} className="bg-gray-50 rounded-xl p-4">
            <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-3" />
            <h3 className="font-semibold text-gray-900">Project {project}</h3>
            <p className="text-sm text-gray-600">Description of the amazing project work.</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactApp() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Get in Touch</h2>
      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white">📧</span>
          </div>
          <div>
            <div className="font-medium text-gray-900">Email</div>
            <div className="text-sm text-gray-600">hello@mdadnan.com</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white">💼</span>
          </div>
          <div>
            <div className="font-medium text-gray-900">LinkedIn</div>
            <div className="text-sm text-gray-600">@mdadnan</div>
          </div>
        </div>
      </div>
    </div>
  );
}
