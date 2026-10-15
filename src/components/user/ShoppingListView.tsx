import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  PackageCheck,
  Refrigerator,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { FoodCategory } from '../../types';

export const ShoppingListView: React.FC = () => {
  const {
    shoppingList,
    toggleShoppingItem,
    removeShoppingItem,
    addToShoppingList,
    movePurchasedToPantry,
    clearCompletedShopping,
  } = useApp();

  const [inputName, setInputName] = useState<string>('');
  const [inputQuantity, setInputQuantity] = useState<string>('1');
  const [inputUnit, setInputUnit] = useState<string>('un');
  const [inputCategory, setInputCategory] = useState<FoodCategory>('Mercearia & Grãos');
  const [transferToast, setTransferToast] = useState<string | null>(null);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    addToShoppingList([
      {
        name: inputName.trim(),
        quantity: inputQuantity,
        unit: inputUnit,
        category: inputCategory,
      },
    ]);
    setInputName('');
  };

  const handleTransferPurchased = () => {
    const count = movePurchasedToPantry();
    if (count > 0) {
      setTransferToast(`${count} itens comprados foram movidos direto para a sua Despensa Inteligente!`);
      setTimeout(() => setTransferToast(null), 4500);
    }
  };

  const checkedCount = shoppingList.filter((i) => i.checked).length;
  const categories = Array.from(new Set(shoppingList.map((i) => i.category)));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-300" />
              Lista Sincronizada
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Lista de Compras Inteligente
          </h1>
          <p className="text-xs text-emerald-100/90 mt-1">
            Itens faltantes de receitas vêm para cá com 1 clique. Conforme compra, mova direto para a despensa!
          </p>
        </div>

        {checkedCount > 0 && (
          <button
            onClick={handleTransferPurchased}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all shrink-0 animate-bounce-subtle"
          >
            <PackageCheck className="w-5 h-5" />
            <span>Mover {checkedCount} Comprados para Despensa!</span>
          </button>
        )}
      </div>

      {transferToast && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{transferToast}</span>
        </div>
      )}

      {/* Quick Add Form */}
      <form
        onSubmit={handleAddItem}
        className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap sm:flex-nowrap items-center gap-2"
      >
        <input
          type="text"
          placeholder="Adicionar item à lista (ex: Farinha, Leite, Tomate)..."
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          className="flex-1 min-w-[180px] bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Qtd"
            value={inputQuantity}
            onChange={(e) => setInputQuantity(e.target.value)}
            className="w-14 bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 text-xs text-center"
          />
          <input
            type="text"
            placeholder="Un"
            value={inputUnit}
            onChange={(e) => setInputUnit(e.target.value)}
            className="w-14 bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 text-xs text-center"
          />
          <select
            value={inputCategory}
            onChange={(e) => setInputCategory(e.target.value as FoodCategory)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 text-xs"
          >
            <option value="Hortifrúti">Hortifrúti</option>
            <option value="Laticínios & Ovos">Laticínios &amp; Ovos</option>
            <option value="Carnes & Proteínas">Carnes &amp; Proteínas</option>
            <option value="Mercearia & Grãos">Mercearia &amp; Grãos</option>
            <option value="Temperos & Óleos">Temperos &amp; Óleos</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>
      </form>

      {/* Shopping Items Categorized */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8">
            <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <h3 className="font-bold text-gray-700 text-sm">Sua lista de compras está vazia!</h3>
            <p className="text-xs text-gray-500 mt-1">
              Ao abrir qualquer receita oficial ou customizada, basta clicar em "Adicionar faltantes".
            </p>
          </div>
        ) : (
          categories.map((cat) => {
            const itemsInCat = shoppingList.filter((i) => i.category === cat);
            return (
              <div
                key={cat}
                className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                    Corredor: {cat}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {itemsInCat.length} {itemsInCat.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {itemsInCat.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleShoppingItem(item.id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        item.checked
                          ? 'bg-emerald-50/60 border-emerald-200 text-gray-400'
                          : 'bg-white border-gray-100 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            item.checked
                              ? 'bg-emerald-600 text-white'
                              : 'border-2 border-gray-300'
                          }`}
                        >
                          {item.checked ? <CheckSquare className="w-4 h-4" /> : null}
                        </div>

                        <div className="truncate">
                          <span
                            className={`text-sm font-bold block truncate ${
                              item.checked ? 'line-through text-gray-400' : 'text-gray-900'
                            }`}
                          >
                            {item.name}
                          </span>
                          {item.recipeOrigin && (
                            <span className="text-[10px] text-emerald-700 block truncate">
                              Receita: {item.recipeOrigin}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                          {item.quantity} {item.unit}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeShoppingItem(item.id);
                          }}
                          className="text-gray-300 hover:text-red-500 p-1 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {checkedCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={clearCompletedShopping}
            className="text-xs text-gray-500 hover:text-gray-800 font-semibold"
          >
            Limpar itens marcados sem mover
          </button>
        </div>
      )}
    </div>
  );
};
