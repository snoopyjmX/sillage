# Plano de Curadoria: Catálogo Real & Fotos de Alta Definição

> **Status:** Seed real, comparador de preço e pipeline de imagens implementados (20 dos perfumes abaixo estão em `supabase/seed.sql`). As fotos já têm fundo transparente, enquadramento 4:5 e hash no nome; o envio à produção é feito pelo mantenedor (`images:upload` com a `service_role`).  
> **Custo:** R$ 0,00 (100% suportado no Free Tier do Supabase Storage e Vercel CDN).

---

## 1. Marcas Selecionadas & Perfumes Ícones

### 🌿 Granado & Phebo

- **Bossa** (Cítrico Solar / Coco / Flor de Tiaré)
- **Époque Tropical** (Floral Amadeirado / Mandarina / Sândalo)
- **Boemia** (Amadeirado Especiado / Tabaco / Pimenta Preta)
- **Nostalgia** (Floral Ambarado / Bergamota / Íris)
- **Folha Imperial** (Verde Aromático / Musgo / Vetiver)

### 🌿 Natura (Alta Perfumaria & Amazônia)

- **Essencial Único Masculino & Feminino** (Copaíba / Priprioca / Vetiver)
- **Essencial Mirra** (Amadeirado Oriental / Mirra Nacional e Africana)
- **Essencial Oud** (Amadeirado Intenso / Priprioca / Rosa / Oud)
- **Homem Sagaz** (Oriental Amadeirado / Sálvia / Âmbar)
- **Ekos Alma** (Breu Branco / Priprioca / Palo Santo Amazônico)

### 🌿 O Boticário

- **Malbec Signature** (Amadeirado / Álcool Vínico / Musgo)
- **Malbec Black** (Oriental Amadeirado / Baunilha Preta / Couro)
- **Lily Le Parfum & Absolu** (Floral Branco / Lírio Enfleurage / Jasmim)
- **Elysée** (Chypre Floral / Frésia / Patchouli)
- **Egeo Vanilla Vibe** (Oriental Gourmand / Baunilha / Pimenta Rosa)

### 🌿 Avatim (Sensorial Baiano)

- **Gigi** (Floral Oriental / Figo / Romã / Baunilha)
- **Boníssimo** (Fresco Aromático / Limão Siciliano / Alecrim)
- **Apoena** (Amadeirado Cítrico / Caju / Cardamomo / Cedro)
- **Seleto** (Amadeirado Couro / Notas Licorosas / Café)

### 🌿 Al Wataniah (Perfumaria Árabe)

- **Sabah Al Ward** (Floral Oriental Âmbar / Tangerina / Pimenta Rosa / Cacau)
- **Qimmah** (Oriental Baunilha / Amêndoa / Café / Sândalo)
- **Kayaan Classic** (Amadeirado Oriental / Bergamota / Noz Moscada)
- **Attar Al Wesal** (Fresco Especiado / Pêra / Lavanda / Almíscar)

### 🌿 Phytoderm

- **Glamour** (Floral Frutado / Tangerina / Rosa / Caramelo)
- **Black** (Amadeirado Especiado / Especiarias Frias / Âmbar)
- **A Flor da Pele** (Floral Amadeirado / Frésia / Cedro)

---

## 2. Pipeline de Processamento de Imagens (Script Node + Sharp)

1. **Estrutura de Armazenamento:**
   - Bucket Supabase: `perfume-images` (público, `cacheControl` de 31536000 s).
   - Nome com hash do conteúdo: `{brand-slug}/{perfume-slug}.{hash8}.webp` (+ `-thumb`, `-medium`, `-large`). Mudou a foto, mudou o nome: o cache de 1 ano e o `CacheFirst` do service worker nunca servem a versão velha.

2. **Processamento Automático (`scripts/process-images.mjs`, só sharp):**
   - Fluxo: `npm run images` → `npm run images:preview` (revisar `processed-images/_preview.png` nos três palcos) → `npm run images:upload`.
   - Fundo: cor detectada pela mediana das bordas, flood fill por distância de cor, borda suavizada e descontaminada (sem halo). Casos difíceis em `scripts/image-overrides.json` (`tolerance`, `background`, `cropBottom`).
   - Canvas 4:5 transparente: 320×400, 640×800 e 1280×1600, frasco recortado pelo alfa com margem de 6%.
   - Formato: WebP com 80% de qualidade (~10 a 110 KB por variante).
   - Saídas: `manifest.json` (slug → `image_path`) e o SQL de `update perfumes`. O upload sobe só o que está no manifest; a migration `perfume_images_v2` e o seed já apontam para os novos caminhos.

3. **Automação do Seed SQL:**
   - Criação da migration `seed_real_perfumes.sql` populando:
     - `brands` (marcas)
     - `notes` (notas reais)
     - `perfumes` (dados do frasco e imagem no bucket)
     - `perfume_notes` (camadas: Topo, Coração e Fundo)
