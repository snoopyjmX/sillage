# Plano de Curadoria: Catálogo Real & Fotos de Alta Definição

> **Status:** Planejado para execução pós-Fase 11 (PWA) e pré-Deploy (Fase 14).  
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
   - Bucket Supabase: `perfumes/` (Público, com cache de borda de 31536000s).
   - Nomenclatura padronizada: `perfumes/{brand-slug}/{perfume-slug}.webp`.

2. **Processamento Automático:**
   - Resolução: 800 × 800 px (1:1).
   - Formato: WebP com 80% de qualidade.
   - Tamanho médio por imagem: ~40 KB a 65 KB.
   - 50 perfumes = ~2.5 MB total (menos de 0.3% do limite de 1 GB do plano gratuito do Supabase).

3. **Automação do Seed SQL:**
   - Criação da migration `seed_real_perfumes.sql` populando:
     - `brands` (marcas)
     - `notes` (notas reais)
     - `perfumes` (dados do frasco e imagem no bucket)
     - `perfume_notes` (camadas: Topo, Coração e Fundo)
