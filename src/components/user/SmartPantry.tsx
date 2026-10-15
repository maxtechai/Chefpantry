import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Refrigerator,
  AlertTriangle,
  Plus,
  Camera,
  Trash2,
  Calendar,
  Sparkles,
  Search,
  Filter,
  Check,
  PackagePlus,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { StorageLocation, FoodCategory } from '../../types';

interface SmartPantryProps {
  onOpenZeroWaste: () => void;
}

export const SmartPantry: React.FC<SmartPantryProps> = ({ onOpenZeroWaste }) => {
  const { pantryItems, addPantryItem, addPantryItemsBatch, deletePantryItem, updatePantryItem } =
    useApp();

  const [activeLocationFilter, setActiveLocationFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAiScanModal, setShowAiScanModal] = useState<boolean>(false);

  // Manual Add Form State
  const [formName, setFormName] = useState<string>('');
  const [formQuantity, setFormQuantity] = useState<string>('1');
  const [formUnit, setFormUnit] = useState<string>('unidade');
  const [formLocation, setFormLocation] = useState<StorageLocation>('Geladeira');
  const [formCategory, setFormCategory] = useState<FoodCategory>('Hortifrúti');
  const [formExpiryDays, setFormExpiryDays] = useState<number>(7);

  // AI Scan Form State
  const [aiScanInput, setAiScanInput] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Filtered Items
  const filteredItems = pantryItems.filter((item) => {
    const matchesLoc =
      activeLocationFilter === 'Todos' || item.location === activeLocationFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLoc && matchesSearch;
  });

  const expiringItems = pantryItems.filter((i) => i.isExpiringSoon);

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const future = new Date();
    future.setDate(future.getDate() + Number(formExpiryDays));
    const expiryStr = future.toISOString().split('T')[0];

    addPantryItem({
      name: formName.trim(),
      quantity: formQuantity,
      unit: formUnit,
      location: formLocation,
      category: formCategory,
      expiryDate: expiryStr,
    });

    setFormName('');
    setFormQuantity('1');
    setShowAddModal(false);
  };

  const handleAiScan = async () => {
    if (!aiScanInput.trim()) return;
    setIsScanning(true);
    try {
      const res = await fetch('/api/gemini/pantry-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: aiScanInput }),
      });
      if (!res.ok) throw new Error('Falha no escaneamento com IA');
      const data = await res.json();
      setScanResult(data);
    } catch (err) {
      console.error(err);
      setScanError('Não foi possível identificar os alimentos com a IA neste momento. Tente novamente.');
      setTimeout(() => setScanError(null), 5000);
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmAiBatch = () => {
    if (!scanResult?.detectedItems) return;
    const now = new Date();

    const itemsToAdd = scanResult.detectedItems.map((item: any) => {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + (item.estimatedShelfLifeDays || 7));
      return {
        name: item.name,
        quantity: item.quantity || '1',
        unit: item.unit || 'un',
        location: (item.location as StorageLocation) || 'Geladeira',
        category: (item.category as FoodCategory) || 'Mercearia & Grãos',
        expiryDate: targetDate.toISOString().split('T')[0],
      };
    });

    addPantryItemsBatch(itemsToAdd);
    setScanResult(null);
    setAiScanInput('');
    setShowAiScanModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <Refrigerator className="w-3.5 h-3.5" />
                Despensa Inteligente
              </span>
              <span className="text-xs text-emerald-200">Zero Desperdício</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Gerencie seus Alimentos &amp; Validades
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 max-w-xl">
              Monitore o que tem na geladeira, freezer e armário. Receba alertas antes de vencer e transforme sobras em refeições de chef!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAiScanModal(true)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-2 backdrop-blur-md border border-white/20 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Scan Rápido com IA</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Adicionar Item</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative z-10 grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-emerald-700/60">
          <div>
            <span className="text-[11px] text-emerald-300 block font-medium">Total de Itens</span>
            <span className="text-xl sm:text-2xl font-black">{pantryItems.length}</span>
          </div>
          <div>
            <span className="text-[11px] text-amber-300 block font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Vencendo Logo (&le; 3d)
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-300">
              {expiringItems.length}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-emerald-300 block font-medium flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-emerald-400" />
              Economia Estimada
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-300">R$ 145/mês</span>
          </div>
        </div>
      </div>

      {/* ALERT BOX: If any item is expiring soon */}
      {expiringItems.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-amber-950 text-sm sm:text-base">
                {expiringItems.length} {expiringItems.length === 1 ? 'alimento precisa' : 'alimentos precisam'} de atenção imediata!
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                {expiringItems.map((i) => i.name).join(', ')} irão vencer em breve. Aproveite hoje mesmo!
              </p>
            </div>
          </div>

          <button
            onClick={onOpenZeroWaste}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Salvar em uma Receita com IA</span>
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Storage Location Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl w-full sm:w-auto">
          {['Todos', 'Geladeira', 'Freezer', 'Armário'].map((loc) => (
            <button
              key={loc}
              onClick={() => setActiveLocationFilter(loc)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeLocationFilter === loc
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {loc}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por alimento ou categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pl-9.5 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Pantry Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredItems.map((item) => {
          let statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
          let statusText = `${item.daysUntilExp} dias restantes`;

          if (item.daysUntilExp <= 3) {
            statusColor = 'bg-red-50 text-red-800 border-red-200 animate-pulse';
            statusText = `Vence em ${item.daysUntilExp} dias!`;
          } else if (item.daysUntilExp <= 7) {
            statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
            statusText = `Vence em ${item.daysUntilExp} dias`;
          }

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                item.isExpiringSoon ? 'border-red-300' : 'border-gray-200/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      {item.location} • {item.category}
                    </span>
                    <h3 className="font-bold text-gray-900 text-sm truncate mt-0.5">{item.name}</h3>
                  </div>

                  <button
                    onClick={() => deletePantryItem(item.id)}
                    className="text-gray-300 hover:text-red-500 p-1 rounded-lg transition-colors"
                    title="Excluir da despensa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-2.5 flex items-baseline gap-1 text-xs">
                  <span className="font-extrabold text-emerald-700 text-base">{item.quantity}</span>
                  <span className="text-gray-500 font-medium">{item.unit}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${statusColor}`}>
                  {statusText}
                </span>

                <button
                  onClick={onOpenZeroWaste}
                  className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] flex items-center gap-1"
                  title="Aproveitar em receitas"
                >
                  <span>Cozinhar</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-300 p-8">
          <Refrigerator className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <h4 className="font-bold text-gray-700 text-sm">Nenhum item encontrado nesta busca</h4>
          <p className="text-xs text-gray-500 mt-1">
            Cadastre novos alimentos manualmente ou use o Scan Rápido com IA!
          </p>
        </div>
      )}

      {/* MODAL: MANUAL ADD ITEM */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Adicionar Alimento à Despensa
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Nome do Alimento:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Queijo mussarela, Ovos, Peito de frango..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Quantidade:</label>
                  <input
                    type="text"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Unidade:</label>
                  <input
                    type="text"
                    required
                    placeholder="g, kg, un, l, ml..."
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Localização:</label>
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value as StorageLocation)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="Geladeira">Geladeira</option>
                    <option value="Freezer">Freezer</option>
                    <option value="Armário">Armário / Despensa</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Categoria:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as FoodCategory)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="Hortifrúti">Hortifrúti</option>
                    <option value="Laticínios & Ovos">Laticínios &amp; Ovos</option>
                    <option value="Carnes & Proteínas">Carnes &amp; Proteínas</option>
                    <option value="Mercearia & Grãos">Mercearia &amp; Grãos</option>
                    <option value="Temperos & Óleos">Temperos &amp; Óleos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Validade estimada em dias a partir de hoje:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formExpiryDays}
                    onChange={(e) => setFormExpiryDays(Number(e.target.value))}
                    className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                  <span className="text-gray-500 text-xs">
                    (Vencerá em {formExpiryDays} dias)
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Salvar na Despensa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AI SMART SCAN (TEXT / RECEIPT / PHOTO) */}
      {showAiScanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">
                    Scan Rápido de Despensa com IA
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Cole texto de compras, lista de feira ou ingredientes soltos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiScanModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {scanError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {scanError}
              </div>
            )}

            {!scanResult ? (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  placeholder="Exemplo: Comprei 1kg de peito de frango, 12 ovos, 2 cenouras, queijo prato, 1 lata de milho verde e pacote de arroz."
                  value={aiScanInput}
                  onChange={(e) => setAiScanInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-2xl p-3 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setAiScanInput(
                        '1kg filé de peito de frango, 1 dúzia de ovos brancos, 500g queijo mussarela fatiado, 3 cenouras, 1 brócolis ninja, 1 lata creme de leite, 2 cebolas'
                      )
                    }
                    className="text-[11px] text-emerald-600 hover:underline font-semibold"
                  >
                    Usar exemplo de compras da semana
                  </button>

                  <button
                    onClick={handleAiScan}
                    disabled={isScanning || !aiScanInput.trim()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2"
                  >
                    {isScanning ? (
                      <>Analisando...</>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Identificar com IA
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-50 p-3 rounded-xl text-xs text-emerald-800">
                  <span className="font-bold">IA identificou:</span> {scanResult.summaryText}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 p-2 rounded-2xl bg-gray-50">
                  {scanResult.detectedItems?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-white rounded-xl border border-gray-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-gray-900">{item.name}</span>
                        <div className="text-[11px] text-gray-500">
                          {item.quantity} {item.unit} • {item.location} • Validade ~ {item.estimatedShelfLifeDays} dias
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setScanResult(null)}
                    className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 text-xs font-bold"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleConfirmAiBatch}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Adicionar Todos à Despensa
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
