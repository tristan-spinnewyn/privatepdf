import { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { ToolNavigation } from './components/layout/ToolNavigation';
import { MergeTool } from './components/tools/MergeTool';
import { OrganizeTool } from './components/tools/OrganizeTool';
import { SplitTool } from './components/tools/SplitTool';
import { SignTool } from './components/tools/SignTool';
import { ImagesToPdfTool } from './components/tools/ImagesToPdfTool';
import type { ToolType } from './types';
import { ShieldCheck, Zap, Lock, HardDriveDownload } from 'lucide-react';

export function App() {
  const [activeTool, setActiveTool] = useState<ToolType>('merge');

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'merge':
        return <MergeTool />;
      case 'organize':
        return <OrganizeTool />;
      case 'split':
        return <SplitTool />;
      case 'sign':
        return <SignTool />;
      case 'images-to-pdf':
        return <ImagesToPdfTool />;
      default:
        return <MergeTool />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/70 text-slate-800">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Aucun transfert de données : 100% exécuté sur votre machine</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Toutes vos manipulations PDF, <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              en toute confidentialité
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600">
            Fusionnez, organisez, découpez, signez et convertissez vos documents sans risquer de divulguer vos données personnelles à des serveurs tiers.
          </p>
        </div>

        {/* Tool Navigation Tabs */}
        <ToolNavigation activeTool={activeTool} onSelectTool={setActiveTool} />

        {/* Tool Content Workspace */}
        <div className="transition-all duration-300 ease-out">
          {renderActiveTool()}
        </div>

        {/* Value Proposition Cards / Guarantees */}
        <div className="pt-12 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Sécurité & Vie Privée Totale</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Vos fiches de paie, pièces d'identité et contrats restent chez vous. Aucun octet n'est téléversé sur un cloud externe.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Vitesse Instantanée</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pas de temps d'attente d'upload ou de download vers un serveur. Le traitement exploite directement la puissance de votre processeur.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <HardDriveDownload className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Gratuit & Sans Limites</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Aucune restriction arbitraire sur le nombre de pages ou la taille des fichiers. Pas d'inscription ni d'abonnement requis.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-slate-200/80 bg-white/60 text-center text-xs text-slate-400">
        <p>© 2026 PDF Privé — Outil 100% Client-Side. Vos documents restent strictement sur votre ordinateur.</p>
      </footer>
    </div>
  );
}

export default App;
