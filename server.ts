import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(express.json({ limit: '15mb' }));

const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Agnes AI Configuration (Agnes 3.0 Flash for text & Agnes Image 2.5 Flash for image generation)
const AGNES_API_KEY = process.env.AGNES_API_KEY || 'cpk-y2D6ZtFr7bgpFFq51uplmjeBz7EqR2immS5MwL4vVAbTMzGy';
const AGNES_BASE_URL = 'https://apihub.agnes-ai.com/v1';

function parseJsonSafe(raw: string): any {
  if (!raw) throw new Error('Resposta vazia');
  let clean = raw.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  }
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(clean);
}

// Agnes 3.0 Flash Chat Completions
async function callAgnesChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: { temperature?: number; max_tokens?: number }
): Promise<string> {
  if (!AGNES_API_KEY) throw new Error('AGNES_API_KEY não configurada');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(`${AGNES_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AGNES_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'agnes-3.0-flash',
        messages,
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.max_tokens ?? 2048,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Agnes Chat API status ${res.status}: ${errBody}`);
    }

    const data: any = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Agnes não retornou texto na resposta');
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}

// Agnes Image Generation (agnes-image-2.5-flash)
async function generateAgnesImage(
  prompt: string,
  dishTitle?: string,
  category?: string
): Promise<string> {
  if (!AGNES_API_KEY) throw new Error('AGNES_API_KEY não configurada');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  const cleanTitle = (dishTitle || prompt || 'Prato culinário').trim();
  const enhancedPrompt = `Gourmet culinary photography of ${cleanTitle}, ${category ? `category ${category}, ` : ''}authentic high-end restaurant dish presentation, freshly cooked, studio food lighting, depth of field, 8k resolution, appetizing, professional chef plating, realistic textures.`;

  try {
    const res = await fetch(`${AGNES_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AGNES_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'agnes-image-2.5-flash',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Agnes Image API status ${res.status}: ${errBody}`);
    }

    const data: any = await res.json();
    const url = data?.data?.[0]?.url;
    if (!url) {
      throw new Error('Agnes não retornou URL de imagem');
    }
    return url;
  } finally {
    clearTimeout(timer);
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number = 25000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout de ${ms}ms excedido na chamada Gemini.`)), ms)
    ),
  ]);
}

// Resilient AI caller with model failover and retries
async function callGeminiWithFailover(options: { contents: any; config?: any; primaryModel?: string }) {
  if (!ai) throw new Error('GEMINI_API_KEY não configurada no servidor.');
  // Model priority:
  // 1. gemini-3.1-flash-lite (fastest, highly stable for JSON schemas)
  // 2. gemini-flash-latest (latest high capability flash)
  // 3. gemini-3.8-flash (flagship flash fallback)
  const models = [
    options.primaryModel || 'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
  ];
  let lastErr: any = null;

  for (const model of models) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({
          model,
          contents: options.contents,
          config: options.config,
        }),
        25000
      );
      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastErr = err;
      console.warn(`Model ${model} unavailable (${err?.message || '503'}), trying next model in chain...`);
      // Small backoff before next model attempt
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw lastErr || new Error('Serviço temporariamente indisponível.');
}

// Algorithmic Zero-Waste fallback engine (ensures 100% uptime even if upstream AI models have 503 spikes)
function buildAlgorithmicZeroWasteMatch(pantryItems: any[], catalogRecipes: any[], preferences: any) {
  const pantryList = pantryItems || [];
  const expiringList = pantryList.filter((item) => item.daysUntilExp <= 3 || item.isExpiringSoon);
  const expiringNames = expiringList.map((i) => i.name);

  // 1. Calculate real catalog matches
  const catalogMatches = (catalogRecipes || []).map((recipe) => {
    const rIngredients: any[] = recipe.ingredients || [];
    const available: string[] = [];
    const missing: string[] = [];

    rIngredients.forEach((ing) => {
      const ingName = typeof ing === 'string' ? ing : ing.name;
      const cleanIng = ingName.toLowerCase();

      const found = pantryList.find((p) => {
        const pClean = p.name.toLowerCase();
        return cleanIng.includes(pClean) || pClean.includes(cleanIng);
      });

      if (found) {
        available.push(ingName);
      } else {
        missing.push(ingName);
      }
    });

    const total = rIngredients.length || 1;
    const matchPercentage = Math.min(100, Math.round((available.length / total) * 100));

    let zeroWasteTip = 'Aproveita alimentos frescos que você já tem em casa.';
    const savesExpiring = available.some((a) =>
      expiringNames.some((exp) => a.toLowerCase().includes(exp.toLowerCase()) || exp.toLowerCase().includes(a.toLowerCase()))
    );
    if (savesExpiring) {
      zeroWasteTip = '🌟 Esta receita aproveita diretamente itens que vencem nos próximos dias!';
    }

    return {
      recipeId: recipe.id,
      matchPercentage,
      availableIngredients: available,
      missingIngredients: missing,
      zeroWasteTip,
    };
  });

  // Sort by highest match
  catalogMatches.sort((a, b) => b.matchPercentage - a.matchPercentage);

  // 2. Generate customized Zero-Waste recipe using actual expiring / available items
  const mainExpiring = expiringList[0] || pantryList[0] || { name: 'Alimentos da despensa', quantity: '2', unit: 'porções' };
  const secondaryItem = expiringList[1] || pantryList[1] || { name: 'Temperos frescos', quantity: '1', unit: 'pitada' };
  const thirdItem = pantryList[2] || { name: 'Azeite ou óleo', quantity: '1', unit: 'colher de sopa' };

  const customRecipeTitle = `Salva-Despensa: Frigideira Dourada de ${mainExpiring.name}`;
  const customRecipeDescription = `Receita prática de ${preferences?.maxTime || 25} minutos desenvolvida para aproveitar ${mainExpiring.name} e ${secondaryItem.name} com ponto perfeito e zero desperdício.`;

  return {
    pantryAnalysisSummary: expiringList.length > 0
      ? `Atenção: Identificamos que você tem ${expiringList.length} itens que vencem em breve (${expiringNames.join(', ')}). Cruzamos sua despensa com o catálogo oficial e criamos uma receita especial sob medida para salvar esses alimentos!`
      : `Sua despensa está bem abastecida! Cruzamos ${pantryList.length} ingredientes disponíveis e encontramos excelentes opções para cozinhar agora em menos de ${preferences?.maxTime || 30} minutos.`,
    catalogMatches,
    aiCustomRecipe: {
      title: customRecipeTitle,
      description: customRecipeDescription,
      category: 'Almoço rápido',
      prepTime: 8,
      cookTime: Math.min(preferences?.maxTime ? preferences.maxTime - 8 : 17, 20),
      servings: 2,
      difficulty: 'Fácil',
      savedExpiringItems: expiringNames.length > 0 ? expiringNames : [mainExpiring.name],
      ingredients: [
        { name: mainExpiring.name, quantity: String(mainExpiring.quantity || '1'), unit: mainExpiring.unit || 'porção', isFromPantry: true },
        { name: secondaryItem.name, quantity: String(secondaryItem.quantity || '1'), unit: secondaryItem.unit || 'porção', isFromPantry: true },
        { name: thirdItem.name, quantity: String(thirdItem.quantity || '1'), unit: thirdItem.unit || 'a gosto', isFromPantry: true },
        { name: 'Alho e cebola picadinhos', quantity: '2', unit: 'dentes', isFromPantry: false },
        { name: 'Sal e orégano', quantity: '1', unit: 'a gosto', isFromPantry: false },
      ],
      instructions: [
        { step: 1, title: 'Separar e fatiar', text: `Higienize e corte ${mainExpiring.name} e ${secondaryItem.name} em pedaços médios para cozimento uniforme.`, timeMinutes: 4 },
        { step: 2, title: 'Dourar na frigideira', text: 'Aqueça um fio de azeite em frigideira quente. Adicione os temperos e doure até liberar aroma.', timeMinutes: 5 },
        { step: 3, title: 'Finalizar e servir', text: `Incorpore ${mainExpiring.name}, ajuste o sal e tampe por 4 minutos até amaciar e dourar. Sirva quente!`, timeMinutes: 6 },
      ],
      chefTip: `Ao dourar ${mainExpiring.name} primeiro, você sela o sabor natural e evita que alimentos amoleçam demais ao salvar da geladeira.`,
    },
  };
}

// ============================================================
// SHOPEE PRODUCT EXTRACTOR & OFFICIAL API ADAPTER
// When official Shopee API credentials are ready, configure in .env:
// SHOPEE_PARTNER_ID and SHOPEE_PARTNER_KEY
// ============================================================
const SHOPEE_PARTNER_ID = process.env.SHOPEE_PARTNER_ID || '';
const SHOPEE_PARTNER_KEY = process.env.SHOPEE_PARTNER_KEY || '';

function extractMetaTag(html: string, property: string): string | null {
  const ogRegex = new RegExp(`<meta\\s+[^>]*property=["'](?:og:)?${property}["'][^>]*content=["']([^"']+)["']`, 'i');
  const nameRegex = new RegExp(`<meta\\s+[^>]*name=["'](?:og:)?${property}["'][^>]*content=["']([^"']+)["']`, 'i');
  const m1 = html.match(ogRegex);
  if (m1 && m1[1]) return m1[1];
  const m2 = html.match(nameRegex);
  if (m2 && m2[1]) return m2[1];
  return null;
}

// Endpoint: Extract & Unfurl Shopee Product Details from Affiliate Link
app.post('/api/shopee/unfurl', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'URL do link de afiliado Shopee é obrigatória.' });
    }

    let inputUrl = url.trim();
    if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
      inputUrl = `https://${inputUrl}`;
    }

    console.log(`[Shopee Scraper] Processando link: ${inputUrl}`);

    let finalUrl = inputUrl;
    let htmlContent = '';
    let extractedTitle = '';
    let extractedDescription = '';
    let extractedImage = '';
    const extractedImages: string[] = [];
    let extractedVideo = '';
    let extractedPrice = 0;
    let extractedOrigPrice = 0;
    let shopId = '';
    let itemId = '';

    // Step 1: Follow redirects and resolve URL (e.g. s.shopee.com.br -> shopee.com.br/product-...)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(inputUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept':
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      finalUrl = response.url || inputUrl;
      htmlContent = await response.text().catch(() => '');
      console.log(`[Shopee Scraper] URL Final resolvida: ${finalUrl} (HTML len: ${htmlContent.length})`);

      // If initial page was a short link or redirect wrapper, check canonical or og:url
      if (htmlContent && (inputUrl.includes('s.shopee') || inputUrl.includes('shp.ee') || inputUrl.includes('shope.ee') || finalUrl === inputUrl)) {
        const canonicalMatch = htmlContent.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) ||
          htmlContent.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i) ||
          htmlContent.match(/window\.location(?:\.replace|\.href)?\s*=\s*['"]([^'"]+)['"]/i) ||
          htmlContent.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^;]+;\s*url=([^"']+)["']/i);

        if (canonicalMatch && canonicalMatch[1] && canonicalMatch[1].startsWith('http') && canonicalMatch[1] !== finalUrl) {
          try {
            console.log(`[Shopee Scraper] Encontrada URL canônica/redirecionada secundária: ${canonicalMatch[1]}`);
            const secRes = await fetch(canonicalMatch[1], {
              method: 'GET',
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9',
              },
            });
            if (secRes.ok) {
              finalUrl = secRes.url || canonicalMatch[1];
              const secHtml = await secRes.text();
              if (secHtml.length > htmlContent.length) {
                htmlContent = secHtml;
              }
            }
          } catch (_) {}
        }
      }
    } catch (fetchErr: any) {
      console.warn('[Shopee Scraper] Aviso ao seguir redirecionamento:', fetchErr?.message);
    }

    // Step 2: Extract shopId and itemId from finalUrl, inputUrl, or htmlContent
    const urlToCheck = finalUrl + ' ' + inputUrl;
    const matchId =
      urlToCheck.match(/i\.(\d+)\.(\d+)/) ||
      urlToCheck.match(/product\/(\d+)\/(\d+)/) ||
      urlToCheck.match(/item\/(\d+)\/(\d+)/) ||
      urlToCheck.match(/itemid=(\d+).*?shopid=(\d+)/i) ||
      urlToCheck.match(/shopid=(\d+).*?itemid=(\d+)/i);

    if (matchId) {
      shopId = matchId[1];
      itemId = matchId[2];
      console.log(`[Shopee Scraper] Detectado shopId: ${shopId}, itemId: ${itemId}`);
    } else if (htmlContent) {
      // Look inside HTML for embedded IDs
      const itemMatchInHtml = htmlContent.match(/"itemid":\s*(\d+)/) || htmlContent.match(/itemid=(\d+)/i) || htmlContent.match(/"itemId":\s*(\d+)/);
      const shopMatchInHtml = htmlContent.match(/"shopid":\s*(\d+)/) || htmlContent.match(/shopid=(\d+)/i) || htmlContent.match(/"shopId":\s*(\d+)/);
      if (itemMatchInHtml && shopMatchInHtml) {
        shopId = shopMatchInHtml[1];
        itemId = itemMatchInHtml[1];
        console.log(`[Shopee Scraper] Detectado IDs no HTML -> shopId: ${shopId}, itemId: ${itemId}`);
      }
    }

    // Step 3: Extract from HTML OpenGraph, Meta Tags, and Video Elements
    if (htmlContent) {
      extractedTitle =
        extractMetaTag(htmlContent, 'title') ||
        extractMetaTag(htmlContent, 'product:name') ||
        '';

      if (!extractedTitle) {
        const titleTagMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleTagMatch && titleTagMatch[1]) {
          extractedTitle = titleTagMatch[1].replace(/\|\s*Shopee.*$/i, '').trim();
        }
      }

      extractedDescription =
        extractMetaTag(htmlContent, 'description') ||
        extractMetaTag(htmlContent, 'product:description') ||
        '';

      extractedImage =
        extractMetaTag(htmlContent, 'image') ||
        extractMetaTag(htmlContent, 'image:secure_url') ||
        '';

      extractedVideo =
        extractMetaTag(htmlContent, 'video') ||
        extractMetaTag(htmlContent, 'video:url') ||
        extractMetaTag(htmlContent, 'video:secure_url') ||
        '';

      // HTML5 video tag or source tag check
      if (!extractedVideo) {
        const videoTagMatch = htmlContent.match(/<video[^>]+src=["']([^"']+\.mp4[^"']*)["']/i) ||
          htmlContent.match(/<source[^>]+src=["']([^"']+\.mp4[^"']*)["']/i);
        if (videoTagMatch && videoTagMatch[1]) {
          extractedVideo = videoTagMatch[1];
        }
      }

      if (extractedImage) {
        extractedImages.push(extractedImage);
      }

      // Check JSON-LD in HTML
      const jsonLdMatches = htmlContent.matchAll(
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
      );
      for (const m of jsonLdMatches) {
        try {
          const parsedLd = JSON.parse(m[1].trim());
          if (parsedLd) {
            if (parsedLd.name && !extractedTitle) extractedTitle = parsedLd.name;
            if (parsedLd.description && !extractedDescription) extractedDescription = parsedLd.description;
            if (parsedLd.image) {
              if (Array.isArray(parsedLd.image)) {
                extractedImages.push(...parsedLd.image);
              } else if (typeof parsedLd.image === 'string') {
                extractedImages.push(parsedLd.image);
              }
            }
            if (parsedLd.video?.contentUrl && !extractedVideo) {
              extractedVideo = parsedLd.video.contentUrl;
            }
            if (parsedLd.offers) {
              const offer = Array.isArray(parsedLd.offers) ? parsedLd.offers[0] : parsedLd.offers;
              if (offer?.price) {
                const p = parseFloat(offer.price);
                if (!isNaN(p) && p > 0) extractedPrice = p;
              }
            }
          }
        } catch (_) {}
      }
    }

    // Step 4: Try public Shopee Item API if shopId and itemId are present
    if (shopId && itemId) {
      try {
        const apiUrl = `https://shopee.com.br/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`;
        const apiRes = await fetch(apiUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': finalUrl,
            'Accept': 'application/json',
          },
        });
        if (apiRes.ok) {
          const apiJson: any = await apiRes.json();
          const itemData = apiJson?.data;
          if (itemData) {
            if (itemData.name && !extractedTitle) extractedTitle = itemData.name;
            if (itemData.description && !extractedDescription) extractedDescription = itemData.description;
            if (itemData.price && extractedPrice === 0) {
              extractedPrice = Number((itemData.price / 100000).toFixed(2));
            }
            if (itemData.price_before_discount) {
              extractedOrigPrice = Number((itemData.price_before_discount / 100000).toFixed(2));
            }
            if (itemData.images && Array.isArray(itemData.images)) {
              const cdnImages = itemData.images.map(
                (hash: string) => `https://down-br.img.susercontent.com/file/${hash}`
              );
              extractedImages.push(...cdnImages);
            }
            if (
              itemData.video_info_list &&
              Array.isArray(itemData.video_info_list) &&
              itemData.video_info_list[0]?.default_format?.url
            ) {
              extractedVideo = itemData.video_info_list[0].default_format.url;
            }
          }
        }
      } catch (apiErr: any) {
        console.warn('[Shopee Scraper] Shopee public item API indisponível:', apiErr?.message);
      }
    }

    // Step 5: Clean and parse the slug from the URL
    let urlSlugTitle = '';
    try {
      const pathname = new URL(finalUrl).pathname;
      const parts = pathname.split('/').filter(Boolean);
      for (const part of parts) {
        if (part.includes('-i.') || (!part.startsWith('universal-link') && part.length > 5)) {
          const slug = part.replace(/-i\.\d+\.\d+.*$/, '').replace(/[-_]/g, ' ');
          if (slug.length > urlSlugTitle.length) {
            urlSlugTitle = decodeURIComponent(slug);
          }
        }
      }
    } catch (_) {}

    // Step 6: AI Structuring & Enrichment with Agnes 3.0 Flash (with Gemini fallback)
    const aiContext = {
      inputUrl,
      finalUrl,
      urlSlugTitle,
      extractedTitle,
      extractedDescription: (extractedDescription || '').substring(0, 1000),
      extractedPrice,
      extractedOrigPrice,
      extractedImages: Array.from(new Set(extractedImages)).filter(Boolean).slice(0, 8),
      extractedVideo,
    };

    const systemPrompt = `Você é o extrator e curador de produtos Shopee para o e-commerce gastronômico ChefPantry.
Sua missão é extrair e organizar com precisão os dados de um produto Shopee a partir dos dados brutos raspados de um link de afiliado.

REGRAS OBRIGATÓRIAS:
1. title: Nome limpo e atrativo do produto em português (remova tags poluídas de vendedor como [ENVIO RÁPIDO], [PRONTA ENTREGA], [FRETE GRÁTIS], [PROMOÇÃO], mantendo a marca e modelo do produto).
2. description: Descrição profissional e vendedora com 2 a 3 parágrafos curtos destacando utilidade na cozinha, material e benefícios.
3. category: Escolha a categoria ideal para a cozinha:
   - "Utensílios de Medição"
   - "Formas & Assadeiras"
   - "Panelas & Frigideiras"
   - "Airfryer & Acessórios"
   - "Eletroportáteis"
   - "Organizadores & Potes"
   - "Facas & Tábuas"
   - "Acessórios de Cozinha"
4. price: Preço atual em Reais (número float, ex: 39.90). Se não veio no HTML, deduza um valor justo de mercado para o item indicado.
5. originalPrice: Preço original "de:" (sempre maior que o price para gerar desconto, ex: 59.90).
6. imageUrl: URL da imagem principal (priorize imagens de CDN da Shopee ou fotos de alta qualidade do produto).
7. images: Lista com 2 a 5 URLs de fotos do produto.
8. videoUrl: URL de vídeo se foi extraído, ou deixe vazio string "" se não houver.
9. badge: Selo persuasivo ("Destaque Shopee", "Mais Vendido", "Frete Grátis", "Super Oferta" ou "Escolha do Chef").
10. commissionEstimate: Estimativa em R$ da comissão de afiliado (12% do preço atual, ex: "R$ 4,79").
11. rating: Nota de avaliação (número entre 4.7 e 5.0).
12. salesCount: Texto de vendas ("1.2k+ vendidos", "5k+ vendidos", "10k+ vendidos").

Retorne ESTRITAMENTE o JSON no esquema solicitado.`;

    let finalProductData: any = null;

    // Call Agnes 3.0 Flash for structuring
    try {
      console.log(`[Shopee Scraper] Estruturando produto com Agnes 3.0 Flash...`);
      const agnesReply = await callAgnesChat([
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Extraia e organize os dados deste produto Shopee:\n${JSON.stringify(aiContext, null, 2)}`,
        },
      ]);
      finalProductData = parseJsonSafe(agnesReply);
    } catch (agnesErr: any) {
      console.warn('[Shopee Scraper] Agnes falhou/timeout, acionando fallback Gemini:', agnesErr?.message);
    }

    // Fallback: Gemini API
    if (!finalProductData || !finalProductData.title) {
      try {
        const geminiOutput = await callGeminiWithFailover({
          contents: `Extraia e organize os dados deste produto Shopee:\n${JSON.stringify(aiContext, null, 2)}`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
          },
        });
        finalProductData = parseJsonSafe(geminiOutput);
      } catch (gemErr: any) {
        console.warn('[Shopee Scraper] Gemini fallback falhou, usando extrator algorítmico:', gemErr?.message);
      }
    }

    // Tertiary Fallback: Algorithmic fallback if AI unavailable
    if (!finalProductData || !finalProductData.title) {
      const fallbackTitle = extractedTitle || urlSlugTitle || 'Acessório Gourmet Shopee';
      const p = extractedPrice > 0 ? extractedPrice : 49.9;
      const op = extractedOrigPrice > p ? extractedOrigPrice : Number((p * 1.45).toFixed(2));
      const primaryImg =
        extractedImages[0] ||
        extractedImage ||
        'https://images.unsplash.com/photo-1594498653385-d5172c532c00?auto=format&fit=crop&w=800&q=80';

      finalProductData = {
        title: fallbackTitle,
        description:
          extractedDescription ||
          'Produto oficial selecionado para sua cozinha prática com alta durabilidade, facilidade de limpeza e ótimo acabamento.',
        category: 'Acessórios de Cozinha',
        price: p,
        originalPrice: op,
        imageUrl: primaryImg,
        images: extractedImages.length > 0 ? extractedImages : [primaryImg],
        videoUrl: extractedVideo || '',
        badge: 'Destaque Shopee',
        commissionEstimate: `R$ ${(p * 0.12).toFixed(2)}`,
        rating: 4.9,
        reviewsCount: 1420,
        salesCount: '5k+ vendidos',
      };
    }

    // Ensure affiliateLink is preserved as the user's input URL
    const priceNum = Number(finalProductData.price) || 29.9;
    const origPriceNum = Number(finalProductData.originalPrice) || Number((priceNum * 1.4).toFixed(2));
    const disc = origPriceNum > priceNum ? Math.round(((origPriceNum - priceNum) / origPriceNum) * 100) : 0;

    return res.json({
      title: finalProductData.title,
      description: finalProductData.description || '',
      category: finalProductData.category || 'Acessórios de Cozinha',
      price: priceNum,
      originalPrice: origPriceNum,
      discountPercent: disc,
      imageUrl:
        finalProductData.imageUrl ||
        extractedImage ||
        'https://images.unsplash.com/photo-1594498653385-d5172c532c00?auto=format&fit=crop&w=800&q=80',
      images:
        Array.isArray(finalProductData.images) && finalProductData.images.length > 0
          ? finalProductData.images
          : [finalProductData.imageUrl],
      videoUrl: finalProductData.videoUrl || extractedVideo || '',
      badge: finalProductData.badge || 'Destaque Shopee',
      commissionEstimate: finalProductData.commissionEstimate || `R$ ${(priceNum * 0.12).toFixed(2)}`,
      rating: Number(finalProductData.rating) || 4.9,
      reviewsCount: Number(finalProductData.reviewsCount) || 1200,
      salesCount: finalProductData.salesCount || '5k+ vendidos',
      affiliateLink: inputUrl,
      resolvedCanonicalUrl: finalUrl,
      source: 'shopee-scraper-ai',
      hasOfficialApiConfigured: Boolean(SHOPEE_PARTNER_ID && SHOPEE_PARTNER_KEY),
    });
  } catch (err: any) {
    console.error('Error in shopee unfurl:', err);
    return res.status(500).json({ error: err.message || 'Erro ao puxar dados do produto Shopee.' });
  }
});

// 0. Endpoint: Interactive Chat with Agnes AI for Recipe Consulting & Generation
app.post('/api/agnes/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Array de mensagens é obrigatório' });
    }

    const systemInstruction = `Você é a Agnes AI, chef executiva consultora e especialista em gastronomia brasileira e internacional do ChefPantry.
Você conversa em tom acolhedor, profissional e criativo com o administrador do sistema para sugerir pratos irresistíveis, combinações de sabores, técnicas e criar receitas completas de alto nível para o catálogo oficial.
Diretrizes:
1. Responda em português brasileiro de forma clara e envolvente.
2. Dê dicas de culinária práticas e autênticas.
3. Se o usuário pedir uma receita (ou quando você sugerir um prato específico detalhado), SEMPRE inclua ao final da sua resposta o bloco especial:
[RECEITA_ESTRUTURADA]
{
  "title": "Nome do Prato",
  "description": "Breve descrição convidativa do prato",
  "category": "Doces & Sobremesas" | "Almoço rápido" | "Jantar" | "Airfryer & Prático" | "Café da manhã" | "Fit & Saudável",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "difficulty": "Fácil" | "Médio" | "Difícil",
  "estimatedCalories": 350,
  "ingredients": [
    { "name": "Nome do ingrediente", "quantity": "2", "unit": "xícaras", "category": "Mercearia & Grãos" }
  ],
  "instructions": [
    { "step": 1, "title": "Nome do passo", "text": "Explicação do que fazer", "timeMinutes": 5 }
  ],
  "suggestedShopeeProducts": [
    { "name": "Utensílio útil", "searchKeywords": "palavra-chave", "reason": "motivo" }
  ],
  "tips": ["Dica especial"]
}
[/RECEITA_ESTRUTURADA]
Esse bloco permite que o administrador clique em um botão na interface para preencher instantaneamente todos os campos do catálogo com a receita criada na conversa!`;

    // 1. PRIMARY: Call Agnes 3.0 Flash
    try {
      console.log('[AI Chat] Enviando mensagem para Agnes 3.0 Flash...');
      const chatMessages = [
        { role: 'system' as const, content: systemInstruction },
        ...messages.map((m: any) => ({
          role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
          content: String(m.content || ''),
        })),
      ];

      const agnesReply = await callAgnesChat(chatMessages, {
        temperature: 0.6,
        max_tokens: 1600,
      });

      if (agnesReply) {
        // Check if there is structured recipe data
        let structuredRecipe: any = null;
        const match = agnesReply.match(/\[RECEITA_ESTRUTURADA\]([\s\S]*?)\[\/RECEITA_ESTRUTURADA\]/);
        if (match && match[1]) {
          try {
            structuredRecipe = parseJsonSafe(match[1]);
          } catch (e) {
            console.warn('Could not parse structured recipe inside chat response:', e);
          }
        }

        // Clean user display text
        const cleanDisplayText = agnesReply
          .replace(/\[RECEITA_ESTRUTURADA\][\s\S]*?\[\/RECEITA_ESTRUTURADA\]/, '')
          .trim();

        return res.json({
          reply: cleanDisplayText || agnesReply,
          structuredRecipe,
          source: 'agnes-3.0-flash',
        });
      }
    } catch (agnesErr: any) {
      console.warn('[AI Chat] Falha no Agnes Chat, usando fallback Gemini:', agnesErr?.message);
    }

    // 2. FALLBACK: Gemini API
    try {
      const geminiContents = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content || '') }],
      }));

      const geminiReply = await callGeminiWithFailover({
        contents: geminiContents,
        config: {
          systemInstruction,
        },
      });

      let structuredRecipe: any = null;
      const match = (geminiReply || '').match(/\[RECEITA_ESTRUTURADA\]([\s\S]*?)\[\/RECEITA_ESTRUTURADA\]/);
      if (match && match[1]) {
        try {
          structuredRecipe = parseJsonSafe(match[1]);
        } catch (e) {
          console.warn('Could not parse structured recipe inside gemini chat response:', e);
        }
      }

      const cleanDisplayText = (geminiReply || '')
        .replace(/\[RECEITA_ESTRUTURADA\][\s\S]*?\[\/RECEITA_ESTRUTURADA\]/, '')
        .trim();

      return res.json({
        reply: cleanDisplayText || geminiReply,
        structuredRecipe,
        source: 'gemini-fallback',
      });
    } catch (geminiErr: any) {
      console.error('[AI Chat] Falha no fallback Gemini:', geminiErr);
      return res.status(500).json({
        error: 'Não foi possível processar a conversa no momento. Tente novamente em instantes.',
      });
    }
  } catch (err: any) {
    console.error('Error in chat endpoint:', err);
    return res.status(500).json({ error: err.message || 'Erro interno no chat' });
  }
});

// 1. Endpoint: AI Assistant for Admin Recipe Structuring
app.post('/api/gemini/format-recipe', async (req, res) => {
  try {
    const { prompt, rawText } = req.body;
    const inputContent = (prompt || rawText || 'Receita Especial').trim();

    const systemInstruction = `Você é um chef executivo e confeiteiro profissional brasileiro de alta gastronomia.
Sua missão é transformar o nome ou texto bruto de uma receita em dados culinários estruturados perfeitos em JSON.

REGRAS CRÍTICAS:
1. CATEGORIA OBRIGATÓRIA: Escolha EXATAMENTE uma das seguintes opções válidas:
   - "Doces & Sobremesas" (SEMPRE que for bolo, torta doce, pudim, chocolate, brigadeiro, sobremesa, brownie, mousse, cookie, etc.)
   - "Almoço rápido" (arroz de forno, risoto, massas do dia a dia, pratos rápidos)
   - "Jantar especial" (carnes nobres, peixes, pratos mais elaborados)
   - "Airfryer & Prático" (frituras sem óleo, frango crocante, petiscos rápidos na airfryer)
   - "Lanches & Petiscos" (sanduíches, empadas, coxinhas, salgadinhos)
   - "Saladas & Leves" (saladas verdes, bowls saudáveis, legumes grelhados)
   - "Café da manhã" (panquecas, ovos mexidos, pão de queijo, crepioca)

2. SEGREGAÇÃO DE INGREDIENTES:
   - Para BOLOS e DOCES ("Doces & Sobremesas"): NUNCA coloque alho, cebola, azeite de oliva ou temperos salgados! Use ingredientes reais de confeitaria: farinha de trigo, açúcar, ovos, óleo vegetal/manteiga, fermento em pó, chocolate/cacau, cenoura, leite, essência de baunilha, etc.
   - Para receitas salgadas: use os aromáticos adequados (alho, cebola, azeite, sal, ervas).

3. INGREDIENTES ESTRUTURADOS:
   - Nome limpo e descritivo em português
   - Quantidade numérica ou fracionária (ex: "3", "2", "1/2", "200")
   - Unidade clara ("unidades", "g", "kg", "ml", "xícara", "colheres de sopa", "colher de chá", "pitada", "dentes")
   - Categoria: 'Hortifrúti', 'Carnes & Proteínas', 'Laticínios & Ovos', 'Mercearia & Grãos', 'Temperos & Óleos', 'Congelados' ou 'Bebidas'.

4. MODO DE PREPARO (PASSOS):
   - Etapas numeradas sequenciais (ex: 1: bater no liquidificador / preparar massa, 2: incorporar farinha e fermento, 3: assar no forno pré-aquecido a 180°C, 4: cobertura/finalização).
   - Tempo estimado em minutos para cada etapa.

5. SUGESTÃO DE PRODUTOS SHOPEE:
   - Sugira 2 a 3 utensílios culinários que combinam perfeitamente com a receita (ex: balança digital, forma de silicone, espátula de silicone, liquidificador).

Retorne estritamente o JSON no esquema solicitado.`;

    const userPrompt = `Formate a seguinte receita culinária em dados estruturados e precisos:
${inputContent}`;

    // 1. PRIMARY: Call Agnes 3.0 Flash for recipe structuring
    try {
      console.log(`[AI Text] Estruturando receita com Agnes 3.0 Flash para: "${inputContent}"`);
      const agnesOutput = await callAgnesChat([
        {
          role: 'system',
          content: `${systemInstruction}\nIMPORTANTE: Retorne ESTRITAMENTE o objeto JSON correspondente aos campos: title, description, category, prepTime, cookTime, servings, difficulty, estimatedCalories, ingredients (array de {name, quantity, unit, category}), instructions (array de {step, title, text, timeMinutes}), suggestedShopeeProducts (array de {name, searchKeywords, reason}), tips (array de string). Sem markdown ou texto fora do JSON.`,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ]);
      const parsedAgnes = parseJsonSafe(agnesOutput);
      if (parsedAgnes && parsedAgnes.title && Array.isArray(parsedAgnes.ingredients) && parsedAgnes.ingredients.length > 0) {
        console.log(`[AI Text] Receita estruturada com sucesso via Agnes 3.0 Flash: "${parsedAgnes.title}"`);
        return res.json(parsedAgnes);
      }
    } catch (agnesErr: any) {
      console.warn('[AI Text] Agnes format-recipe indisponível/falhou, acionando fallback Gemini:', agnesErr?.message);
    }

    // 2. FALLBACK: Gemini API
    try {
      const textOutput = await callGeminiWithFailover({
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              prepTime: { type: Type.NUMBER },
              cookTime: { type: Type.NUMBER },
              servings: { type: Type.NUMBER },
              difficulty: { type: Type.STRING },
              estimatedCalories: { type: Type.NUMBER },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    category: { type: Type.STRING },
                  },
                  required: ['name', 'quantity', 'unit'],
                },
              },
              instructions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    step: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    text: { type: Type.STRING },
                    timeMinutes: { type: Type.INTEGER },
                  },
                  required: ['step', 'title', 'text'],
                },
              },
              suggestedShopeeProducts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    searchKeywords: { type: Type.STRING },
                    reason: { type: Type.STRING },
                  },
                  required: ['name', 'searchKeywords', 'reason'],
                },
              },
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['title', 'description', 'category', 'prepTime', 'cookTime', 'servings', 'difficulty', 'ingredients', 'instructions', 'suggestedShopeeProducts'],
          },
        },
      });

      const parsed = JSON.parse(textOutput || '{}');
      return res.json(parsed);
    } catch (aiErr) {
      console.warn('Gemini format-recipe unavailable, activating intelligent culinary fallback:', aiErr);
      const titleClean = inputContent || 'Receita Especial do Chef';
      const lower = titleClean.toLowerCase();

      const isSweet = /bolo|torta doce|doce|sobremesa|pudim|chocolate|brigadeiro|mousse|cookie|brownie|cenoura/i.test(lower);
      const isSalad = /salada|folha|verde|caesar/i.test(lower);
      const isAirfryer = /airfryer|frita|crocante|asa|batata/i.test(lower);

      if (isSweet) {
        const isCarrot = lower.includes('cenoura');
        return res.json({
          title: titleClean,
          description: `Receita clássica artesanal de ${titleClean}, fofinho e delicioso, perfeito para o café da tarde ou sobremesa.`,
          category: 'Doces & Sobremesas',
          prepTime: 15,
          cookTime: 40,
          servings: 10,
          difficulty: 'Fácil',
          estimatedCalories: 290,
          ingredients: isCarrot
            ? [
                { name: 'Cenouras médias descascadas e picadas', quantity: '3', unit: 'unidades (250g)', category: 'Hortifrúti' },
                { name: 'Ovos inteiros', quantity: '4', unit: 'unidades', category: 'Laticínios & Ovos' },
                { name: 'Óleo vegetal', quantity: '1/2', unit: 'xícara', category: 'Temperos & Óleos' },
                { name: 'Açúcar refinado', quantity: '1 e 1/2', unit: 'xícara', category: 'Mercearia & Grãos' },
                { name: 'Farinha de trigo peneirada', quantity: '2', unit: 'xícaras (240g)', category: 'Mercearia & Grãos' },
                { name: 'Fermento químico em pó', quantity: '1', unit: 'colher de sopa', category: 'Mercearia & Grãos' },
                { name: 'Chocolate em pó 50% (para a cobertura)', quantity: '4', unit: 'colheres de sopa', category: 'Mercearia & Grãos' },
                { name: 'Manteiga sem sal', quantity: '2', unit: 'colheres de sopa', category: 'Laticínios & Ovos' },
                { name: 'Leite integral', quantity: '4', unit: 'colheres de sopa', category: 'Laticínios & Ovos' },
              ]
            : [
                { name: 'Farinha de trigo peneirada', quantity: '2', unit: 'xícaras', category: 'Mercearia & Grãos' },
                { name: 'Açúcar refinado', quantity: '1.5', unit: 'xícara', category: 'Mercearia & Grãos' },
                { name: 'Ovos inteiros', quantity: '3', unit: 'unidades', category: 'Laticínios & Ovos' },
                { name: 'Manteiga ou óleo vegetal', quantity: '1/2', unit: 'xícara', category: 'Laticínios & Ovos' },
                { name: 'Leite morno', quantity: '1', unit: 'xícara', category: 'Laticínios & Ovos' },
                { name: 'Fermento químico em pó', quantity: '1', unit: 'colher de sopa', category: 'Mercearia & Grãos' },
              ],
          instructions: [
            { step: 1, title: 'Bater a base líquida', text: isCarrot ? 'No liquidificador, bata as cenouras picadas, os ovos e o óleo por cerca de 3 a 4 minutos até obter um creme perfeitamente liso.' : 'Bata os ovos com o açúcar e a manteiga até virar um creme esbranquiçado.', timeMinutes: 5 },
            { step: 2, title: 'Incorporar secos delicadamente', text: 'Transfira o creme para uma tigela e adicione a farinha aos poucos, mexendo com uma espátula de silicone. Por último, incorpore o fermento em pó.', timeMinutes: 5 },
            { step: 3, title: 'Assar no forno', text: 'Despeje a massa em uma forma untada e enfarinhada. Asse em forno pré-aquecido a 180°C por 35 a 40 minutos (teste do palito).', timeMinutes: 40 },
            { step: 4, title: 'Finalizar com calda', text: isCarrot ? 'Em uma panelinha, ferva o chocolate, açúcar, manteiga e leite até engrossar. Despeje sobre o bolo ainda morno.' : 'Desenforme após esfriar levemente e sirva acompanhado de um bom café.', timeMinutes: 8 },
          ],
          suggestedShopeeProducts: [
            { name: 'Balança Digital de Cozinha Alta Precisão 10kg Inox com Visor LCD', searchKeywords: 'balanca digital cozinha', reason: 'Essencial para pesar as cenouras e secos com precisão para o bolo não solar' },
            { name: 'Jogo de Espátulas de Silicone Maciço Resistente a 240°C', searchKeywords: 'espatula silicone', reason: 'Excelente para envolver a massa sem perder a aeração' },
            { name: 'Forma de Silicone Reutilizável', searchKeywords: 'forma silicone', reason: 'Desenforma com facilidade sem grudar' },
          ],
          tips: ['O grande segredo do bolo de cenoura é não ultrapassar 250g de cenoura (cerca de 3 unidades médias) para a massa ficar leve e fofa.'],
        });
      }

      if (isSalad) {
        return res.json({
          title: titleClean,
          description: `Receita fresca e nutritiva de ${titleClean}, perfeita para uma alimentação equilibrada e rápida.`,
          category: 'Saladas & Leves',
          prepTime: 10,
          cookTime: 0,
          servings: 2,
          difficulty: 'Fácil',
          estimatedCalories: 180,
          ingredients: [
            { name: 'Mix de folhas verdes (alface, rúcula)', quantity: '1', unit: 'maço higienizado', category: 'Hortifrúti' },
            { name: 'Tomate sweet grape', quantity: '10', unit: 'unidades cortadas ao meio', category: 'Hortifrúti' },
            { name: 'Azeite de oliva extravirgem', quantity: '2', unit: 'colheres de sopa', category: 'Temperos & Óleos' },
            { name: 'Suco de limão fresco', quantity: '1', unit: 'colher de sopa', category: 'Hortifrúti' },
            { name: 'Queijo branco em cubinhos', quantity: '100', unit: 'g', category: 'Laticínios & Ovos' },
            { name: 'Sal e orégano', quantity: '1', unit: 'a gosto', category: 'Temperos & Óleos' },
          ],
          instructions: [
            { step: 1, title: 'Higienizar e secar', text: 'Lave as folhas verdes em água corrente com sanitizante e seque bem em um secador de saladas.', timeMinutes: 5 },
            { step: 2, title: 'Montar a salada', text: 'Em uma travessa, disponha as folhas verdes, espalhe os tomatinhos e os cubinhos de queijo.', timeMinutes: 3 },
            { step: 3, title: 'Temperar e servir', text: 'Emule o azeite com o limão, sal e orégano. Regue por cima apenas na hora de servir para manter a crocância.', timeMinutes: 2 },
          ],
          suggestedShopeeProducts: [
            { name: 'Processador e Triturador Manual de Alimentos', searchKeywords: 'triturador manual alimentos', reason: 'Prático para picar nozes, castanhas e temperos da salada' },
            { name: 'Kit 4 Potes Herméticos de Vidro com Trava', searchKeywords: 'potes hermeticos vidro', reason: 'Conserva folhas e saladas frescas por até 5 dias na geladeira' },
          ],
          tips: ['Adicione o molho somente no momento de comer para as folhas não murcharem.'],
        });
      }

      // Default savory fallback
      return res.json({
        title: titleClean,
        description: `Deliciosa receita artesanal de ${titleClean}, fácil de preparar, cheia de sabor e perfeita para o dia a dia.`,
        category: isAirfryer ? 'Airfryer & Prático' : 'Almoço rápido',
        prepTime: 12,
        cookTime: 20,
        servings: 4,
        difficulty: 'Fácil',
        estimatedCalories: 340,
        ingredients: [
          { name: titleClean.replace(/liquidificador|forno|panela/gi, '').trim() || 'Frango ou carne', quantity: '500', unit: 'g', category: 'Carnes & Proteínas' },
          { name: 'Alho picadinho', quantity: '3', unit: 'dente', category: 'Hortifrúti' },
          { name: 'Cebola picadinha', quantity: '1', unit: 'unidade', category: 'Hortifrúti' },
          { name: 'Azeite de oliva', quantity: '2', unit: 'colheres de sopa', category: 'Temperos & Óleos' },
          { name: 'Sal e temperos a gosto', quantity: '1', unit: 'a gosto', category: 'Temperos & Óleos' },
        ],
        instructions: [
          { step: 1, title: 'Preparar ingredientes', text: 'Higienize e corte os ingredientes em pedaços proporcionais.', timeMinutes: 5 },
          { step: 2, title: 'Refogar aromáticos', text: 'Aqueça o azeite e doure o alho e a cebola até liberarem aroma perfumado.', timeMinutes: 5 },
          { step: 3, title: 'Cozinhar o prato', text: 'Adicione o ingrediente principal, tempere com sal e cozinhe até atingir o ponto desejado.', timeMinutes: 10 },
        ],
        suggestedShopeeProducts: [
          { name: 'Processador e Triturador Manual de Alimentos 3 Lâminas Inox', searchKeywords: 'triturador manual alimentos', reason: 'Pica alho e cebola em 3 segundos sem chorar' },
          { name: 'Jogo de Espátulas de Silicone Maciço Resistente a 240°C', searchKeywords: 'espatula silicone', reason: 'Não risca as panelas e suporta altas temperaturas' },
        ],
        tips: ['Finalize com cheiro-verde fresco para realçar o sabor e o visual do prato.'],
      });
    }
  } catch (error: any) {
    console.error('Error formatting recipe:', error);
    return res.status(500).json({ error: error.message || 'Falha ao formatar receita' });
  }
});

// 2. Endpoint: AI Zero-Waste Match & Custom Recipe Generator
app.post('/api/gemini/zero-waste-match', async (req, res) => {
  try {
    const { pantryItems, catalogRecipes, preferences } = req.body;

    const promptData = {
      pantry: (pantryItems || []).map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        daysUntilExp: item.daysUntilExp,
        isExpiringSoon: item.daysUntilExp <= 3,
      })),
      catalogRecipes: (catalogRecipes || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        ingredients: (r.ingredients || []).map((i: any) => `${i.name} (${i.quantity} ${i.unit})`),
      })),
      preferences: preferences || { maxTime: 45, dietary: 'Nenhuma restrição' },
    };

    const systemInstruction = `Você é o motor de inteligência culinária Zero Desperdício do ChefPantry.
Seu objetivo é:
1. Analisar os ingredientes da despensa do usuário (dando prioridade MÁXIMA aos itens com isExpiringSoon = true para evitar desperdício de comida).
2. Avaliar as receitas do catálogo fornecidas, calculando a porcentagem real de compatibilidade (matchPercentage entre 0 e 100), listando exatamente quais ingredientes o usuário já tem na despensa e quais estão faltando.
3. Se os itens da despensa permitirem ou sugerirem algo criativo, crie também 1 receita original "Cozinha Zero Desperdício" sob medida utilizando primariamente os itens disponíveis que estão vencendo logo!
Responda estritamente no esquema JSON fornecido.`;

    // 1. PRIMARY: Call Agnes 3.0 Flash for zero-waste matching & custom recipe
    try {
      console.log('[AI Text] Processando Zero-Waste Match com Agnes 3.0 Flash...');
      const agnesOutput = await callAgnesChat([
        {
          role: 'system',
          content: `${systemInstruction}\nIMPORTANTE: Retorne ESTRITAMENTE um objeto JSON válido com:
- pantryAnalysisSummary (string)
- catalogMatches (array de { recipeId, matchPercentage, availableIngredients: string[], missingIngredients: string[], zeroWasteTip: string })
- aiCustomRecipe ({ title, description, category, prepTime, cookTime, servings, difficulty, savedExpiringItems: string[], ingredients: array de { name, quantity, unit, isFromPantry: boolean }, instructions: array de { step, title, text, timeMinutes }, chefTip: string })
Sem markdown ou comentários adicionais fora do JSON.`,
        },
        {
          role: 'user',
          content: `Analise estes dados de despensa e receitas:\n${JSON.stringify(promptData, null, 2)}`,
        },
      ]);
      const parsedAgnes = parseJsonSafe(agnesOutput);
      if (parsedAgnes && parsedAgnes.pantryAnalysisSummary && Array.isArray(parsedAgnes.catalogMatches)) {
        console.log('[AI Text] Zero-Waste Match processado com sucesso via Agnes 3.0 Flash');
        return res.json(parsedAgnes);
      }
    } catch (agnesErr: any) {
      console.warn('[AI Text] Agnes zero-waste-match indisponível/falhou, acionando fallback Gemini:', agnesErr?.message);
    }

    // 2. FALLBACK: Gemini API
    try {
      const textOutput = await callGeminiWithFailover({
        contents: `Analise estes dados de despensa e receitas:\n${JSON.stringify(promptData, null, 2)}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pantryAnalysisSummary: {
                type: Type.STRING,
                description: 'Resumo amigável sobre o que cozinhar e itens salvos do desperdício',
              },
              catalogMatches: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    recipeId: { type: Type.STRING },
                    matchPercentage: { type: Type.INTEGER },
                    availableIngredients: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    missingIngredients: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    zeroWasteTip: {
                      type: Type.STRING,
                    },
                  },
                  required: ['recipeId', 'matchPercentage', 'availableIngredients', 'missingIngredients'],
                },
              },
              aiCustomRecipe: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING },
                  prepTime: { type: Type.NUMBER },
                  cookTime: { type: Type.NUMBER },
                  servings: { type: Type.NUMBER },
                  difficulty: { type: Type.STRING },
                  savedExpiringItems: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  ingredients: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        quantity: { type: Type.STRING },
                        unit: { type: Type.STRING },
                        isFromPantry: { type: Type.BOOLEAN },
                      },
                      required: ['name', 'quantity', 'unit', 'isFromPantry'],
                    },
                  },
                  instructions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        step: { type: Type.INTEGER },
                        title: { type: Type.STRING },
                        text: { type: Type.STRING },
                        timeMinutes: { type: Type.INTEGER },
                      },
                      required: ['step', 'title', 'text'],
                    },
                  },
                  chefTip: { type: Type.STRING },
                },
                required: ['title', 'description', 'category', 'prepTime', 'cookTime', 'servings', 'ingredients', 'instructions', 'savedExpiringItems'],
              },
            },
            required: ['pantryAnalysisSummary', 'catalogMatches', 'aiCustomRecipe'],
          },
        },
      });

      const parsed = JSON.parse(textOutput || '{}');
      return res.json(parsed);
    } catch (aiErr) {
      console.warn('Gemini zero-waste-match failed/unavailable, activating algorithmic zero-waste engine fallback:', aiErr);
      const fallbackResult = buildAlgorithmicZeroWasteMatch(pantryItems, catalogRecipes, preferences);
      return res.json(fallbackResult);
    }
  } catch (error: any) {
    console.error('Error in zero-waste matching:', error);
    return res.status(500).json({ error: error.message || 'Falha ao cruzar despensa com IA' });
  }
});

// 3. Endpoint: AI Smart Ingredient Substitution
app.post('/api/gemini/substitute', async (req, res) => {
  try {
    const { ingredientName, recipeContext, pantryItems } = req.body;

    const systemInstruction = `Você é um chef especialista em substituições culinárias práticas para o dia a dia brasileiro.
Quando um cozinheiro não tem um ingrediente específico para uma receita, ofereça 3 opções de substituição reais e viáveis.
Analise a despensa do usuário para destacar se ele JÁ TEM alguma das opções em casa!
Responda em formato JSON padronizado.`;

    const prompt = `Ingrediente que falta: "${ingredientName}".
Contexto da receita: "${recipeContext || 'Preparo culinário geral'}".
Ingredientes que o usuário tem na despensa: ${JSON.stringify(pantryItems || [])}.`;

    // 1. PRIMARY: Call Agnes 3.0 Flash for ingredient substitutes
    try {
      console.log(`[AI Text] Buscando substitutos com Agnes 3.0 Flash para: "${ingredientName}"`);
      const agnesOutput = await callAgnesChat([
        {
          role: 'system',
          content: `${systemInstruction}\nIMPORTANTE: Retorne ESTRITAMENTE um objeto JSON com:
- ingredient (string)
- substitutes (array de { name: string, ratio: string, flavorNote: string, alreadyInUserPantry: boolean, bestFor: string })
- expertTip (string)
Sem markdown ou comentários fora do JSON.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ]);
      const parsedAgnes = parseJsonSafe(agnesOutput);
      if (parsedAgnes && parsedAgnes.ingredient && Array.isArray(parsedAgnes.substitutes)) {
        console.log(`[AI Text] Substitutos obtidos via Agnes 3.0 Flash para: "${ingredientName}"`);
        return res.json(parsedAgnes);
      }
    } catch (agnesErr: any) {
      console.warn('[AI Text] Agnes substitute indisponível/falhou, acionando fallback Gemini:', agnesErr?.message);
    }

    // 2. FALLBACK: Gemini API
    try {
      const textOutput = await callGeminiWithFailover({
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ingredient: { type: Type.STRING },
              substitutes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    ratio: { type: Type.STRING },
                    flavorNote: { type: Type.STRING },
                    alreadyInUserPantry: { type: Type.BOOLEAN },
                    bestFor: { type: Type.STRING },
                  },
                  required: ['name', 'ratio', 'flavorNote', 'alreadyInUserPantry'],
                },
              },
              expertTip: { type: Type.STRING },
            },
            required: ['ingredient', 'substitutes', 'expertTip'],
          },
        },
      });

      const parsed = JSON.parse(textOutput || '{}');
      return res.json(parsed);
    } catch (aiErr) {
      console.warn('Gemini substitute unavailable, using culinary database fallback:', aiErr);
      const pItems: string[] = pantryItems || [];
      const hasItem = (name: string) => pItems.some((p) => p.toLowerCase().includes(name.toLowerCase()));

      return res.json({
        ingredient: ingredientName,
        substitutes: [
          {
            name: 'Requeijão cremoso ou Iogurte natural',
            ratio: '1 para 1',
            flavorNote: 'Dá textura aveludada com leve acidez agradável.',
            alreadyInUserPantry: hasItem('requeijão') || hasItem('iogurte'),
            bestFor: 'Molhos, recheios e massas cremosas',
          },
          {
            name: 'Leite com 1 colher de manteiga derretida',
            ratio: '1 xícara de leite + 1 colher de manteiga',
            flavorNote: 'Substitui a gordura láctea com perfeição.',
            alreadyInUserPantry: hasItem('leite') || hasItem('manteiga'),
            bestFor: 'Bolos, tortas e cozidos',
          },
          {
            name: 'Queijo branco ou ricota batida com azeite',
            ratio: '1 para 1',
            flavorNote: 'Opção mais proteica e leve.',
            alreadyInUserPantry: hasItem('queijo'),
            bestFor: 'Gratinados e recheios de forno',
          },
        ],
        expertTip: 'Ao substituir ingredientes líquidos ou cremosos, adicione aos poucos para controlar a consistência final.',
      });
    }
  } catch (error: any) {
    console.error('Error getting substitution:', error);
    return res.status(500).json({ error: error.message || 'Falha ao buscar substitutos' });
  }
});

// 4. Endpoint: AI Smart Pantry Entry (Text or Receipt/Photo OCR)
app.post('/api/gemini/pantry-scan', async (req, res) => {
  try {
    const { rawText, imageBase64, mimeType } = req.body;

    const systemInstruction = `Você é um assistente de reconhecimento e inventário de despensa inteligente.
Analise o texto ou imagem fornecida (como foto da geladeira, armário, ou cupom fiscal de compras de supermercado).
Extraia os itens alimentícios com nome limpo em português, quantidade estimada, unidade (g, kg, l, ml, un, cx, pct) e estime os dias de validade recomendados a partir de hoje (se for hortifrúti fresco ~ 5-7 dias, laticínios abertos ~ 4-7 dias, congelados ~ 60-90 dias, grãos/enlatados ~ 180 dias).
Classifique a categoria de armazenamento ideal: 'Geladeira', 'Freezer' ou 'Armário'.`;

    let contentsPayload: any;
    if (imageBase64) {
      contentsPayload = {
        parts: [
          {
            inlineData: {
              data: imageBase64.replace(/^data:[a-zA-Z0-9/]+;base64,/, ''),
              mimeType: mimeType || 'image/jpeg',
            },
          },
          {
            text: 'Identifique todos os itens e alimentos visíveis nesta foto ou nota fiscal e estruture em JSON para a despensa.',
          },
        ],
      };
    } else {
      contentsPayload = `Extraia e organize os seguintes alimentos para a despensa:
${rawText || 'Leite, 6 ovos, queijo mussarela, 1kg de arroz, 2 cenouras, cebola, peito de frango'}`;
    }

    // 1. PRIMARY (for text scan): Call Agnes 3.0 Flash
    if (!imageBase64) {
      try {
        console.log('[AI Text] Escaneando texto da despensa com Agnes 3.0 Flash...');
        const agnesOutput = await callAgnesChat([
          {
            role: 'system',
            content: `${systemInstruction}\nIMPORTANTE: Retorne ESTRITAMENTE um objeto JSON com:
- detectedItems: array de { name: string, quantity: string, unit: string, location: string, category: string, estimatedShelfLifeDays: number }
- summaryText: string resumo
Sem comentários fora do JSON.`,
          },
          {
            role: 'user',
            content: contentsPayload,
          },
        ]);
        const parsedAgnes = parseJsonSafe(agnesOutput);
        if (parsedAgnes && Array.isArray(parsedAgnes.detectedItems)) {
          console.log('[AI Text] Despensa estruturada com sucesso via Agnes 3.0 Flash');
          return res.json(parsedAgnes);
        }
      } catch (agnesErr: any) {
        console.warn('[AI Text] Agnes pantry-scan falhou/indisponível, usando fallback Gemini:', agnesErr?.message);
      }
    }

    // 2. FALLBACK: Gemini API
    try {
      const textOutput = await callGeminiWithFailover({
        contents: contentsPayload,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    location: { type: Type.STRING },
                    category: { type: Type.STRING },
                    estimatedShelfLifeDays: { type: Type.INTEGER },
                  },
                  required: ['name', 'quantity', 'unit', 'location', 'category', 'estimatedShelfLifeDays'],
                },
              },
              summaryText: { type: Type.STRING },
            },
            required: ['detectedItems', 'summaryText'],
          },
        },
      });

      const parsed = JSON.parse(textOutput || '{}');
      return res.json(parsed);
    } catch (aiErr) {
      console.warn('Gemini pantry-scan unavailable, using heuristic text parser fallback:', aiErr);
      const text = rawText || 'Alimentos identificados';
      const lines = text.split(/,|\n/).map((l: string) => l.trim()).filter((l: string) => l.length > 0);

      const detected = lines.map((line: string) => {
        let loc = 'Geladeira';
        let cat = 'Mercearia & Grãos';
        let shelfLife = 7;

        const lower = line.toLowerCase();
        if (lower.includes('carne') || lower.includes('frango') || lower.includes('peixe') || lower.includes('congelado')) {
          loc = 'Freezer';
          cat = 'Carnes & Proteínas';
          shelfLife = 45;
        } else if (lower.includes('arroz') || lower.includes('feijão') || lower.includes('farinha') || lower.includes('óleo') || lower.includes('azeite')) {
          loc = 'Armário';
          cat = 'Mercearia & Grãos';
          shelfLife = 120;
        } else if (lower.includes('queijo') || lower.includes('leite') || lower.includes('iogurte') || lower.includes('ovo')) {
          loc = 'Geladeira';
          cat = 'Laticínios & Ovos';
          shelfLife = 8;
        } else if (lower.includes('tomate') || lower.includes('cenoura') || lower.includes('cebola') || lower.includes('maçã') || lower.includes('fruta')) {
          loc = 'Geladeira';
          cat = 'Hortifrúti';
          shelfLife = 5;
        }

        return {
          name: line.replace(/^[0-9]+(\s*(kg|g|l|ml|un|cx|pct))?\s*/i, '').trim() || line,
          quantity: '1',
          unit: 'un',
          location: loc,
          category: cat,
          estimatedShelfLifeDays: shelfLife,
        };
      });

      return res.json({
        detectedItems: detected,
        summaryText: `${detected.length} itens identificados e categorizados na sua despensa.`,
      });
    }
  } catch (error: any) {
    console.error('Error scanning pantry items:', error);
    return res.status(500).json({ error: error.message || 'Falha ao escanear despensa' });
  }
});

// 5. Endpoint: AI Dish & Recipe Image Generator
app.post('/api/gemini/generate-image', async (req, res) => {
  try {
    const { prompt, dishTitle, category, avoidUrl } = req.body;
    const query = (dishTitle || prompt || 'Prato culinário especial').toLowerCase();

    // High-resolution gastronomic culinary collections by dish type (with multiple verified options per dish)
    const CULINARY_COLLECTIONS: Array<{ keywords: string[]; photos: string[] }> = [
      {
        keywords: ['bolo de cenoura', 'bolo cenoura', 'cenoura liquidificador', 'cenoura'],
        photos: [
          'https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=900&q=80', // Bolo caseiro com cobertura
          'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&w=900&q=80', // Bolo com calda de chocolate
          'https://images.unsplash.com/photo-1557925923-cd4648e211a0?auto=format&fit=crop&w=900&q=80', // Fatia generosa de bolo dourado
          'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?auto=format&fit=crop&w=900&q=80', // Bolo confeitado artesanal
        ],
      },
      {
        keywords: ['bolo de chocolate', 'brownie', 'cacau', 'chocolate'],
        photos: [
          'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=900&q=80',
        ],
      },
      {
        keywords: ['bolo', 'torta', 'doce', 'sobremesa', 'pudim', 'mousse', 'brigadeiro'],
        photos: [
          'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=900&q=80',
        ],
      },
      {
        keywords: ['escondidinho', 'carne-seca', 'purê', 'gratinado', 'mandioca', 'aipim'],
        photos: [
          'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
        ],
      },
      {
        keywords: ['frango', 'ave', 'peito', 'fricassê', 'strogonoff', 'filé'],
        photos: [
          'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=900&q=80',
        ],
      },
      {
        keywords: ['airfryer', 'crocante', 'frito', 'batata', 'asa', 'coxinha', 'empanado'],
        photos: [
          'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=900&q=80',
        ],
      },
      {
        keywords: ['arroz', 'risoto', 'paella', 'forno'],
        photos: [
          'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80',
        ],
      },
      {
        keywords: ['massa', 'macarrão', 'espaguete', 'lasanha', 'penne', 'talharim'],
        photos: [
          'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=900&q=80',
        ],
      },
      {
        keywords: ['salada', 'legumes', 'verde', 'vegetais', 'vegano', 'fit', 'bowl'],
        photos: [
          'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
        ],
      },
      {
        keywords: ['peixe', 'salmão', 'camarão', 'moqueca', 'frutos do mar', 'tilápia'],
        photos: [
          'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=900&q=80',
        ],
      },
      {
        keywords: ['sopa', 'caldo', 'creme', 'canja'],
        photos: [
          'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=900&q=80',
        ],
      },
      {
        keywords: ['café', 'pão', 'omelete', 'ovo', 'panqueca', 'manhã', 'tapioca'],
        photos: [
          'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=900&q=80',
        ],
      },
    ];

    const match = CULINARY_COLLECTIONS.find((item) =>
      item.keywords.some((k) => query.includes(k))
    );

    const availablePhotos = match
      ? match.photos
      : [
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
        ];

    // Select a photo, preferably different from the current avoidUrl
    const nonAvoided = availablePhotos.filter((url) => url !== avoidUrl);
    const selectedList = nonAvoided.length > 0 ? nonAvoided : availablePhotos;
    const fallbackUrl = selectedList[0];

    // 1. PRIMARY: Generate real AI gastronomic image using Agnes Image 2.5 Flash
    try {
      console.log(`[AI Image] Gerando imagem gastronômica com Agnes Image 2.5 Flash para: "${dishTitle || prompt}"`);
      const agnesImageUrl = await generateAgnesImage(prompt, dishTitle, category);
      if (agnesImageUrl && agnesImageUrl.startsWith('http')) {
        console.log(`[AI Image] Sucesso Agnes Image: ${agnesImageUrl}`);
        return res.json({
          imageUrl: agnesImageUrl,
          alternatives: [agnesImageUrl, ...availablePhotos.filter((u) => u !== agnesImageUrl)],
          source: 'agnes_image_2.5_flash',
          dishTitle: dishTitle || prompt,
        });
      }
    } catch (agnesErr: any) {
      console.warn('[AI Image] Falha na geração Agnes Image, aplicando fallback gastronômico:', agnesErr?.message);
    }

    // 2. FALLBACK: Curated Gastronomy Library
    return res.json({
      imageUrl: fallbackUrl,
      alternatives: availablePhotos,
      source: 'culinary_gastronomy_fallback',
      dishTitle: dishTitle || prompt,
    });
  } catch (error: any) {
    console.error('Error generating image:', error);
    return res.status(500).json({ error: error.message || 'Falha ao gerar imagem' });
  }
});

// Setup Vite dev server or static files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  if (isProd) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChefPantry Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
