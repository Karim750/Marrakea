# MARRAKEA — ATLAS / TERRITOIRES

> **Cartographie vivante des savoir-faire marocains**

---

## 📋 Table des matières

- [Vision & Concept](#-vision--concept)
- [Changement de paradigme](#-changement-de-paradigme)
- [Installation](#-installation)
- [Architecture du site](#-architecture-du-site)
- [Design System](#-design-system)
- [Expérience utilisateur](#-expérience-utilisateur)
- [Développement](#-développement)
- [Contenu territorial](#-contenu-territorial)
- [Roadmap](#-roadmap)
- [FAQ Stratégique](#-faq-stratégique)

---

## 🎯 Vision & Concept

### L'idée fondatrice

**MARRAKEA ne montre pas des objets, mais des territoires en action.**

```
Avant : "Voici un tapis Azilal"
Maintenant : "Voici le Haut Atlas. Voici ce qu'il produit."
```

### Positionnement unique

MARRAKEA devient **la carte de référence du savoir-faire marocain**, pas un site de vente.

Chaque produit est :
- Un **fragment de géographie**
- Une **expression locale** 
- Un **savoir-faire situé**

> **On n'achète pas un tapis. On entre dans le Haut Atlas.**

---

## 🔄 Changement de paradigme

### Rupture avec l'approche classique

| Approche classique | ATLAS / TERRITOIRES |
|-------------------|---------------------|
| Objet centré | **Territoire centré** |
| Catalogue | **Cartographie** |
| Page statique | **Parcours exploratoire** |
| Produit → Artisan | **Territoire → Matière → Technique → Objet** |
| E-commerce direct | **Narration géographique** |
| Silence éditorial | **Mouvement, exploration** |

### Ce que ça change concrètement

**Parcours utilisateur classique** :
```
1. Voir produits
2. Cliquer sur un produit
3. Voir détails
4. Acheter
```

**Parcours ATLAS / TERRITOIRES** :
```
1. Explorer la carte du Maroc
2. Cliquer sur "Haut Atlas"
3. Découvrir le territoire (climat, altitude, matières)
4. Voir les techniques associées
5. Découvrir les objets issus de ce territoire
6. Rencontrer les artisans de cette région
```

---

## ⚡ Installation

### Prérequis techniques

```bash
# Navigateur moderne avec support :
- CSS Grid
- CSS Variables
- SVG interactif
- JavaScript ES6+
```

### Lancement rapide

```bash
# 1. Cloner le projet
git clone <repo> marrakea-atlas
cd marrakea-atlas

# 2. Installer dépendances (si version interactive)
npm install

# 3. Lancer en développement
npm run dev
# → http://localhost:3000

# Alternative : Version statique
open index.html
```

### Structure minimale

```
marrakea-atlas/
├── index.html              # Page carte interactive
├── territoire.html         # Template page territoire
├── objet.html             # Template page objet
├── assets/
│   ├── map-morocco.svg    # Carte SVG interactive
│   ├── territories/       # Données JSON par territoire
│   └── images/            # Photos artisans/objets
└── styles/
    ├── map.css            # Styles carte
    ├── territory.css      # Styles pages territoire
    └── variables.css      # Design system
```

---

## 🏗️ Architecture du site

### Navigation principale

```
┌─────────────────────────────────────┐
│  MARRAKEA                           │
│  [Carte] Territoires Objets Artisans Méthode
└─────────────────────────────────────┘
```

**"Carte" est l'entrée par défaut** — changement radical.

### Flux d'information

```
CARTE DU MAROC (hero)
    ↓
TERRITOIRE (ex: Haut Atlas)
    ├── Géographie (altitude, climat)
    ├── Matières disponibles (laine, bois, argile)
    ├── Techniques dominantes (tissage, tournage)
    └── Objets issus de ce territoire
        └── FICHE OBJET
            ├── Contexte territorial
            ├── Artisan associé
            └── "Pourquoi cet objet ne peut venir d'ailleurs"
```

### Pages clés

#### 1. Page d'accueil — Carte interactive

```html
<!-- HERO : Carte du Maroc stylisée -->
<section class="hero-map">
    <h1>MARRAKEA</h1>
    <p>Cartographie vivante des savoir-faire marocains</p>
    
    <!-- Carte SVG interactive -->
    <div class="map-container">
        <svg>
            <!-- Zones cliquables -->
            <g id="rif" class="territory">...</g>
            <g id="moyen-atlas" class="territory">...</g>
            <g id="haut-atlas" class="territory">...</g>
            <g id="sud" class="territory">...</g>
        </svg>
    </div>
    
    <div class="cta">
        <a href="#carte">Explorer la carte</a>
        <a href="#methode">Comprendre la méthode</a>
    </div>
</section>

<!-- Section : Un territoire, un savoir-faire -->
<section class="territory-preview">
    <h2>Un territoire, un savoir-faire</h2>
    <div class="grid">
        <!-- Carte 1 : Laine & bois, Moyen Atlas -->
        <!-- Carte 2 : Laine du Haut Atlas -->
        <!-- Carte 3 : Cuivre, médina de Fès -->
    </div>
</section>
```

#### 2. Page Territoire (NOUVELLE)

```html
<!-- Breadcrumb cartographique -->
<nav class="breadcrumb">
    <a href="/">Carte</a> › 
    <span>Haut Atlas</span>
</nav>

<!-- Header territoire -->
<header class="territory-header">
    <span class="territory-label">Territoire</span>
    <h1>Haut Atlas</h1>
    <div class="territory-map-small">
        <!-- Mini carte de localisation -->
    </div>
</header>

<!-- Données territoriales -->
<section class="territory-data">
    <dl>
        <dt>Altitude</dt>
        <dd>1.200 – 2.500 m</dd>
        
        <dt>Climat</dt>
        <dd>Montagnard rude, hivers rigoureux</dd>
        
        <dt>Matières locales</dt>
        <dd>Laine de mouton, bois de cèdre, argile</dd>
        
        <dt>Techniques dominantes</dt>
        <dd>Tissage berbère, travail du bois</dd>
    </dl>
</section>

<!-- Explication : Pourquoi ce territoire produit cela -->
<section class="territory-context">
    <h2>Pourquoi le Haut Atlas produit ces objets</h2>
    <p>
        L'altitude et le climat rigoureux ont façonné 
        un savoir-faire unique autour de la laine épaisse...
    </p>
</section>

<!-- Objets issus de ce territoire -->
<section class="territory-objects">
    <h2>Objets du Haut Atlas</h2>
    <div class="objects-grid">
        <!-- Tapis Azilal -->
        <!-- Couverture Handira -->
        <!-- Tapis Beni Ouarain -->
    </div>
</section>
```

#### 3. Page Objet — Devient un point sur la carte

```html
<!-- Breadcrumb géographique -->
<nav class="breadcrumb">
    <a href="/">Carte</a> › 
    <a href="/territoire/haut-atlas">Haut Atlas</a> › 
    <span>Tapis Azilal</span>
</nav>

<!-- Référence objet -->
<div class="object-reference">
    <span>Objet nº014</span>
</div>

<!-- Title avec données géographiques -->
<header class="object-header">
    <h1>Tapis Azilal</h1>
    <p class="object-subtitle">
        Tapis berbère en laine non-teinte tissé à la main
    </p>
</header>

<!-- Données territoriales (NOUVEAU BLOC) -->
<aside class="object-territory-data">
    <dl>
        <dt>Territoire :</dt>
        <dd>Haut Atlas</dd>
        
        <dt>Altitude :</dt>
        <dd>1.200 – 2.500 m</dd>
        
        <dt>Matière :</dt>
        <dd>Laine vierge</dd>
        
        <dt>Technique :</dt>
        <dd>Tissage manuel</dd>
        
        <dt>Temps estimé :</dt>
        <dd>120 – 160 heures</dd>
        
        <dt>Variations :</dt>
        <dd>Oui</dd>
    </dl>
    
    <!-- Mini carte avec localisation -->
    <div class="object-map">
        <svg><!-- Haut Atlas highlighted --></svg>
    </div>
</aside>

<!-- Section CLÉE : Pourquoi cet objet ne peut venir d'ailleurs -->
<section class="object-unique">
    <h2>Pourquoi cet objet ne peut venir d'ailleurs ?</h2>
    <p>
        Haut Atlas, au-dessus de 600 mètres d'altitude : 
        un climat montagnard rude, des hivers rigoureux, 
        une laine dense et rustique...
    </p>
    
    <!-- Citation artisan (avec photo) -->
    <blockquote class="artisan-quote">
        <p>"Des tapis Azilal, il y en a toinous ici: 
           fait main avec la laine des troupeaux des villages"</p>
        <cite>
            <img src="artisan-avatar.jpg" alt="">
            Abdellah, potier à Dabbouët
        </cite>
    </blockquote>
</section>
```

---

## 🎨 Design System

### Palette "Paysage" — Nouvelle grammaire

Inspirée des **cartes topographiques**, pas de la décoration.

```css
:root {
    /* Fond */
    --blanc-poussiere: #F8F7F3;
    
    /* Textes */
    --noir-graphite: #232323;
    
    /* Structure */
    --gris-topographique: #CFCBC4;
    
    /* Accents territoriaux */
    --ocre-roche: #9C5A2E;
    --vert-sec: #6A7B5A;
    --bleu-ardoise: #5B6D73;
}
```

**Ratios visuels** :
- 70% blanc poussière (fond)
- 20% gris topographique (lignes, structure)
- 10% accents (ocre, vert, bleu selon contexte)

### Typographie — Logique géographique

```css
/* Typo principale : Sans-serif humaniste */
--font-primary: 'Inter', 'Helvetica Neue', sans-serif;
/* Usage : Corps de texte, UI, descriptions */

/* Typo secondaire : Serif étroite ou Monospace */
--font-geography: 'IBM Plex Mono', 'Courier New', monospace;
/* Usage : Coordonnées, données territoriales, légendes */
```

**Principe** : Le site ressemble à une **carte commentée**, pas à un magazine.

### Éléments visuels distinctifs

#### Carte interactive (SVG)

```html
<svg viewBox="0 0 1000 800" class="morocco-map">
    <!-- Fond océan -->
    <rect class="ocean" fill="var(--bleu-ardoise)" opacity="0.1"/>
    
    <!-- Territoires cliquables -->
    <path id="haut-atlas" 
          class="territory hoverable"
          data-territory="haut-atlas"
          fill="var(--ocre-roche)" 
          opacity="0.3"/>
    
    <!-- Labels -->
    <text class="territory-label" x="450" y="420">
        Haut Atlas
    </text>
    
    <!-- Relief topographique (lignes de niveau stylisées) -->
    <g class="relief-lines">
        <path stroke="var(--gris-topographique)" 
              stroke-width="0.5" 
              opacity="0.4"/>
    </g>
</svg>
```

#### Cartes de territoire (composant)

```html
<article class="territory-card">
    <div class="card-image">
        <img src="laine-tissage.jpg" alt="Tissage berbère">
    </div>
    <div class="card-content">
        <span class="card-meta">Laine & bois, Moyen Atlas</span>
        <h3>Tissage berbère</h3>
        <p class="card-description">Un territoire Hiumlesint</p>
        <a href="/territoire/moyen-atlas" class="card-link">
            Avec Farbores →
        </a>
    </div>
</article>
```

#### Bloc de données territoriales

```html
<dl class="territory-specs">
    <div class="spec-item">
        <dt>Territoire :</dt>
        <dd>Haut Atlas</dd>
    </div>
    <div class="spec-item">
        <dt>Altitude :</dt>
        <dd>1.200 – 2.500 m</dd>
    </div>
    <div class="spec-item">
        <dt>Matière :</dt>
        <dd>Laine vierge</dd>
    </div>
</dl>
```

**Style** :

```css
.territory-specs {
    font-family: var(--font-geography);
    font-size: 0.9rem;
    border: 1px solid var(--gris-topographique);
    padding: 1.5rem;
    background: white;
}

.spec-item {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 1rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--gris-topographique);
}

.spec-item:last-child {
    border-bottom: none;
}

.spec-item dt {
    color: var(--noir-graphite);
    font-weight: 500;
}

.spec-item dd {
    color: var(--noir-graphite);
    opacity: 0.8;
}
```

---

## 🎮 Expérience utilisateur

### Interactions clés

#### 1. Carte interactive (Hero)

```javascript
// Hover sur territoire
document.querySelectorAll('.territory').forEach(territory => {
    territory.addEventListener('mouseenter', (e) => {
        // Highlight territoire
        e.target.style.opacity = '0.6';
        
        // Afficher tooltip avec nom + matières
        showTooltip(e.target.dataset.territory);
    });
    
    territory.addEventListener('click', (e) => {
        // Navigation vers page territoire
        window.location.href = `/territoire/${e.target.dataset.territory}`;
    });
});
```

**Comportement** :
- Hover : opacité augmente, tooltip apparaît
- Clic : transition douce vers page territoire
- Animations lentes (300-500ms)

#### 2. Scroll & Pan sur carte

```javascript
// Zoom et pan sur la carte (optionnel, phase 2)
import { zoom } from 'd3-zoom';

const svg = d3.select('.morocco-map');
svg.call(zoom()
    .scaleExtent([1, 8])
    .on('zoom', (event) => {
        svg.select('g').attr('transform', event.transform);
    })
);
```

#### 3. Navigation géographique

**Breadcrumb dynamique** :

```
Carte › Haut Atlas › Tapis Azilal
  ↑        ↑            ↑
Retour  Contexte   Objet actuel
```

Chaque niveau est cliquable et maintient le contexte territorial.

---

## 💻 Développement

### Stack technique recommandée

**Version MVP (statique)** :
```
HTML5 + CSS3 + Vanilla JS
└── SVG inline pour carte interactive
```

**Version Production** :
```
React ou Vue.js
├── D3.js (manipulation carte)
├── Framer Motion (animations)
└── Next.js / Nuxt (SSR pour SEO)
```

### Composants React (exemple)

```jsx
// components/TerritoryMap.jsx
import { useState } from 'react';

export default function TerritoryMap({ territories }) {
    const [hoveredTerritory, setHoveredTerritory] = useState(null);
    
    return (
        <div className="map-container">
            <svg viewBox="0 0 1000 800">
                {territories.map(territory => (
                    <path
                        key={territory.id}
                        d={territory.pathData}
                        className="territory"
                        onMouseEnter={() => setHoveredTerritory(territory)}
                        onMouseLeave={() => setHoveredTerritory(null)}
                        onClick={() => navigateToTerritory(territory.id)}
                        style={{
                            fill: territory.color,
                            opacity: hoveredTerritory?.id === territory.id ? 0.6 : 0.3
                        }}
                    />
                ))}
            </svg>
            
            {hoveredTerritory && (
                <Tooltip territory={hoveredTerritory} />
            )}
        </div>
    );
}
```

```jsx
// components/TerritoryCard.jsx
export default function TerritoryCard({ territory, craft, artisan }) {
    return (
        <article className="territory-card">
            <div className="card-image">
                <img src={craft.image} alt={craft.name} />
            </div>
            <div className="card-content">
                <span className="card-meta">
                    {craft.material}, {territory.name}
                </span>
                <h3>{craft.name}</h3>
                <p>{craft.description}</p>
                <a href={`/territoire/${territory.slug}`}>
                    Avec {artisan.name} →
                </a>
            </div>
        </article>
    );
}
```

### Structure de données JSON

```json
// data/territories/haut-atlas.json
{
    "id": "haut-atlas",
    "name": "Haut Atlas",
    "coordinates": {
        "center": [31.0640, -7.9181],
        "bounds": [[30.5, -8.5], [31.5, -7.3]]
    },
    "geography": {
        "altitude": "1.200 – 2.500 m",
        "climate": "Montagnard rude, hivers rigoureux",
        "terrain": "Vallées encaissées, plateaux arides"
    },
    "materials": [
        {
            "name": "Laine de mouton",
            "origin": "Troupeaux locaux",
            "quality": "Dense, rustique, naturelle"
        },
        {
            "name": "Bois de cèdre",
            "origin": "Forêts d'altitude",
            "usage": "Menuiserie, sculpture"
        }
    ],
    "techniques": [
        "Tissage berbère au métier vertical",
        "Teinture végétale",
        "Travail du cuir"
    ],
    "crafts": [
        {
            "id": "tapis-azilal",
            "name": "Tapis Azilal",
            "technique": "Tissage manuel",
            "time": "120-160 heures",
            "artisans": ["fatima-ait-ahmed"]
        }
    ]
}
```

---

## 🗺️ Contenu territorial

### Territoires à documenter (Phase 1)

1. **Haut Atlas**
   - Altitudes : 1.200 – 2.500 m
   - Matières : Laine, bois de cèdre
   - Techniques : Tissage Azilal, menuiserie

2. **Moyen Atlas**
   - Altitudes : 800 – 1.800 m
   - Matières : Laine, bois, argile
   - Techniques : Tissage, poterie

3. **Rif**
   - Altitudes : 600 – 2.000 m
   - Matières : Laine, chanvre, bois
   - Techniques : Tissage, sparterie

4. **Sud (Pré-Sahara)**
   - Altitudes : 200 – 800 m
   - Matières : Palmier doum, laine
   - Techniques : Vannerie, tissage

5. **Villes artisanales**
   - Fès : Cuivre, cuir, céramique
   - Marrakech : Cuir, fer forgé
   - Essaouira : Bois de thuya, sparterie

### Données requises par territoire

```yaml
Territoire:
  - Nom
  - Localisation géographique
  - Altitude min/max
  - Climat
  - Relief
  - Matières disponibles localement
  - Techniques traditionnelles
  - Contraintes spécifiques
  - Histoire du savoir-faire
  - Artisans représentatifs
  - Objets emblématiques
  - Photos du territoire
  - Photos des matières premières
```

### Checklist contenu (par objet)

- [ ] Territoire d'origine identifié
- [ ] Altitude/climat documenté
- [ ] Matière première locale expliquée
- [ ] Technique ancestrale décrite
- [ ] Contraintes géographiques expliquées
- [ ] Section "Pourquoi cet objet ne peut venir d'ailleurs"
- [ ] Citation artisan avec photo
- [ ] Localisation sur carte

---

## 🚀 Roadmap

### Phase 1 : PoC Interactive (3 mois)
- [ ] Carte SVG interactive du Maroc
- [ ] 3 territoires documentés (Haut Atlas, Moyen Atlas, Fès)
- [ ] 8-10 objets géolocalisés
- [ ] Navigation carte → territoire → objet
- [ ] Design system "cartographie"
- [ ] Responsive mobile

### Phase 2 : MVP Territorial (6 mois)
- [ ] 8 territoires complets
- [ ] 30-40 objets documentés
- [ ] CMS pour gestion contenu territorial
- [ ] Filtres par matière/technique/territoire
- [ ] Zoom et pan sur carte (D3.js)
- [ ] Animations de transition territoire
- [ ] Panier et checkout basique

### Phase 3 : Plateforme Complète (12 mois)
- [ ] Tous territoires du Maroc
- [ ] 100+ objets
- [ ] Profils artisans géolocalisés
- [ ] Itinéraires de découverte ("Parcours Laine", "Route du Cuivre")
- [ ] API publique (données géographiques)
- [ ] Carte 3D en relief (Three.js)
- [ ] Mode "Atlas physique" vs "Atlas culturel"

### Phase 4 : Expansion Culturelle (18+ mois)
- [ ] Extension autres pays (Tunisie, Algérie)
- [ ] Carte historique (évolution techniques)
- [ ] Collaborations musées/institutions
- [ ] Application mobile (géolocalisation sur site)
- [ ] Programme éducatif (écoles)
- [ ] Documentaires vidéo par territoire

---

## ❓ FAQ Stratégique

### Pourquoi ce changement radical ?

**Problème des approches classiques** :
- Tous les sites d'artisanat se ressemblent
- Folklore décoratif sans substance
- Provenance = simple mention marketing

**Solution ATLAS / TERRITOIRES** :
- Position totalement unique
- Impossible à folkloriser
- Pédagogie naturelle via géographie
- Mémorisation forte (carte mentale)

### Est-ce que ça reste un e-commerce ?

**Oui, mais avec une approche inversée** :

```
E-commerce classique : Vendre → Expliquer
ATLAS / TERRITOIRES : Comprendre → Découvrir → Acheter
```

Le commerce est présent mais **subordonné à la narration territoriale**.

### Complexité technique : est-ce réalisable ?

**Phase 1 (PoC)** : Très simple
- Carte SVG statique avec zones cliquables
- Pages HTML classiques
- Aucune complexité technique

**Phase 2 (MVP)** : Modérée
- D3.js pour interactions carte
- CMS headless (Strapi, Contentful)
- Framework React/Vue

**Phase 3 (Production)** : Avancée
- Carte 3D, WebGL
- Données géographiques complexes
- Performance optimisée

### Risques identifiés

| Risque | Mitigation |
|--------|------------|
| **Trop complexe pour utilisateur** | Tests utilisateurs précoces, onboarding guidé |
| **Contenu territorial insuffisant** | Commencer avec 3 territoires très documentés |
| **Conversion plus faible** | Accepter taux conversion plus bas mais panier moyen plus élevé |
| **Coût production contenu** | Partenariats universités, géographes, anthropologues |

### Métriques de succès spécifiques

```yaml
Engagement territorial:
  - Temps moyen sur carte : > 1 minute
  - Clics territoires : > 70% des visiteurs
  - Pages territoire visitées : > 2.5 par session

Compréhension:
  - Lecture "Pourquoi cet objet ne peut venir d'ailleurs" : > 60%
  - Taux de rebond page territoire : < 30%

Commerce:
  - Panier moyen : +40% vs approche classique
  - Taux conversion : Acceptable si -20% (compensé par panier)
```

---

## 🎓 Principes de développement

### Pour les contributeurs

**Règles d'or** :

1. **La géographie guide tout**
   - Chaque objet DOIT avoir un territoire
   - Chaque territoire DOIT avoir des contraintes documentées
   - Pas de produit "hors-sol"

2. **Cartographie > Décoration**
   - Style inspiré cartes topographiques
   - Fonctionnel avant esthétique
   - Pas de folklore visuel

3. **Mouvement > Silence**
   - Encourager exploration
   - Transitions fluides
   - Pan, zoom, découverte

4. **Preuve géographique**
   - "Pourquoi ici et pas ailleurs ?" obligatoire
   - Climat, altitude, matières = arguments
   - Pas de storytelling générique

**Question décisionnelle** :
> "Est-ce que cet élément aide l'utilisateur à comprendre le lien entre géographie et savoir-faire ?"

Si non → supprimer.

---

## 🔧 Commandes de développement

```bash
# Installation
npm install

# Développement
npm run dev
# → http://localhost:3000

# Build production
npm run build

# Générer données territoires depuis CSV
npm run generate:territories

# Tester navigation carte
npm run test:navigation

# Optimiser SVG carte
npm run optimize:map

# Générer sitemap géographique
npm run generate:sitemap
```

---

## 📚 Ressources

### Documentation technique
- [D3.js Geographic Projections](https://github.com/d3/d3-geo)
- [SVG Map Tutorial](https://www.toptal.com/designers/ui/d3-data-map)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)

### Données géographiques
- [Natural Earth Data](https://www.naturalearthdata.com/)
- [OpenStreetMap Morocco](https://www.openstreetmap.org/#map=6/31.791/-7.092)

### Références design
- Cartes topographiques IGN
- Atlas géographiques Michelin
- National Geographic cartography

---

## 🌍 Vision long-terme

**MARRAKEA ATLAS devient** :

1. **La référence cartographique** du savoir-faire marocain
2. **Un outil éducatif** (écoles, musées, tourisme culturel)
3. **Une plateforme de préservation** (documentation géographique)
4. **Un modèle exportable** (autres pays, autres artisanats)

**Impact souhaité** :

> Quand quelqu'un pense "artisanat marocain", il visualise mentalement la carte MARRAKEA, pas un souk générique.

---

**Version** : 2.0.0 — ATLAS / TERRITOIRES  
**Date** : Décembre 2024  
**Statut** : 🗺️ Concept Ready for Prototype

---

## 🚦 Quick Start (TL;DR)

```bash
# Concept en 3 lignes
1. MARRAKEA = carte interactive du Maroc
2. Clic territoire → découverte géographique → objets locaux
3. Commerce subordonné à la narration territoriale

# Différence clé
Avant : "Voici nos produits"
Maintenant : "Voici le territoire. Voici ce qu'il produit."
```

---

**Made with strategic vision** 🗺️  
*Territoire > Objet > Commerce*
