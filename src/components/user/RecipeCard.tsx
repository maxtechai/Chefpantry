import React from 'react';
import { Recipe, PantryItem } from '../../types';
import { Clock, Flame, CheckCircle2, Bookmark, BookmarkCheck, Utensils, Sparkles, ShoppingBag } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface RecipeCardProps {
  recipe: Recipe;
  pantryItems: PantryItem[];
  onSelect: (recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, pantryItems, onSelect }) => {
  const { user, toggleSaveRecipe, shopeeProducts } = useApp();
  const isSaved = user.savedRecipeIds.includes(recipe.id);

  // Compute pantry match
  const totalIngredients = recipe.ingredients.length;
  const matchingIngredients = recipe.ingredients.filter((rIng) => {
    return pantryItems.some(
      (pItem) =>
        rIng.name.toLowerCase().includes(pItem.name.toLowerCase()) ||
        pItem.name.toLowerCase().includes(rIng.name.toLowerCase())
    );
  });

  const matchPercentage = totalIngredients > 0 ? Math.round((matchingIngredients.length / totalIngredients) * 100) : 0;
  const missingCount = totalIngredients - matchingIngredients.length;

  // Shopee connected products
  const connectedProducts = shopeeProducts.filter((p) => recipe.shopeeProductIds?.includes(p.id));

  return (
    <div
      onClick={() => onSelect(recipe)}
      className="group bg-white rounded-2xl border border-gray-200/80 hover:border-emerald-300 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
    >
      {/* Cover Image & Badges */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Category Pill */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 backdrop-blur-md text-gray-800 shadow-xs">
            {recipe.category}
          </span>
          {recipe.isOfficial && (
            <span className="px-2 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Oficial
            </span>
          )}
        </div>

        {/* Favorite Save Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSaveRecipe(recipe.id);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-gray-700 hover:text-emerald-600 hover:bg-white shadow-xs transition-colors"
          title={isSaved ? 'Remover dos favoritos' : 'Salvar receita'}
        >
          {isSaved ? (
            <BookmarkCheck className="w-4 h-4 text-emerald-600 fill-emerald-600" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>

        {/* Time and Calories bar */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
          <div className="flex items-center gap-1 drop-shadow-sm">
            <Clock className="w-3.5 h-3.5" />
            <span>{recipe.prepTime + recipe.cookTime} min</span>
          </div>
          {recipe.estimatedCalories && (
            <div className="flex items-center gap-1 drop-shadow-sm">
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>{recipe.estimatedCalories} kcal</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 text-base leading-snug line-clamp-2 transition-colors">
            {recipe.title}
          </h3>
          <p className="text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {recipe.description}
          </p>
        </div>

        {/* Pantry Match Indicator */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-gray-700">Na sua despensa:</span>
            </div>
            <span
              className={`font-bold ${
                matchPercentage === 100
                  ? 'text-emerald-600'
                  : matchPercentage >= 60
                  ? 'text-teal-600'
                  : 'text-amber-600'
              }`}
            >
              {matchPercentage}% pronto
            </span>
          </div>

          {/* Progress match bar */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                matchPercentage === 100
                  ? 'bg-emerald-500'
                  : matchPercentage >= 60
                  ? 'bg-teal-500'
                  : 'bg-amber-400'
              }`}
              style={{ width: `${matchPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>
              {matchingIngredients.length} de {totalIngredients} ingredientes
            </span>
            {missingCount === 0 ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" />
                Pode cozinhar agora!
              </span>
            ) : (
              <span className="text-amber-700 font-medium">
                Falta {missingCount} {missingCount === 1 ? 'item' : 'itens'}
              </span>
            )}
          </div>

          {/* Shopee Recommended Utensil Preview */}
          {connectedProducts.length > 0 && (
            <div className="mt-1 pt-2 border-t border-dashed border-gray-100 flex items-center gap-1.5 text-[11px] text-orange-600 font-medium bg-orange-50/60 px-2 py-1 rounded-lg">
              <ShoppingBag className="w-3 h-3 text-orange-500 shrink-0" />
              <span className="truncate">
                Recomenda: <span className="font-bold">{connectedProducts[0].title.split(' ')[0]} {connectedProducts[0].title.split(' ')[1]}</span>
              </span>
              <span className="text-orange-500 font-bold ml-auto shrink-0">
                R$ {connectedProducts[0].price.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
