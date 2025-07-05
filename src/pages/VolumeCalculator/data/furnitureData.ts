import { FurnitureCategory } from '../types';

export const furnitureCategories: FurnitureCategory[] = [
  {
    id: 'salon',
    name: 'Salon',
    icon: '🛋️',
    subcategories: [
      {
        id: 'salon-assises',
        name: 'Assises',
        items: [
          {
            id: 'canape-2places',
            name: 'Canapé 2 places',
            volume: 1.8,
            description: 'Canapé standard 2 places',
            icon: '🛋️',
            category: 'Salon'
          },
          {
            id: 'canape-3places',
            name: 'Canapé 3 places',
            volume: 2.5,
            description: 'Canapé standard 3 places',
            icon: '🛋️',
            category: 'Salon'
          },
          {
            id: 'canape-angle',
            name: "Canapé d'angle",
            volume: 3.5,
            description: "Grand canapé d'angle",
            icon: '🛋️',
            category: 'Salon'
          },
          {
            id: 'canape-convertible',
            name: 'Canapé convertible',
            volume: 3.0,
            description: 'Canapé-lit convertible',
            icon: '🛋️',
            category: 'Salon'
          },
          {
            id: 'fauteuil',
            name: 'Fauteuil',
            volume: 0.8,
            description: 'Fauteuil standard',
            icon: '🪑',
            category: 'Salon'
          },
          {
            id: 'fauteuil-relax',
            name: 'Fauteuil relax',
            volume: 1.2,
            description: 'Fauteuil inclinable/massant',
            icon: '🪑',
            category: 'Salon'
          },
          {
            id: 'pouf',
            name: 'Pouf',
            volume: 0.2,
            description: 'Pouf ou repose-pieds',
            icon: '🟫',
            category: 'Salon'
          },
          {
            id: 'banquette',
            name: 'Banquette',
            volume: 1.0,
            description: 'Banquette ou méridienne',
            icon: '🛋️',
            category: 'Salon'
          }
        ]
      },
      {
        id: 'salon-rangement',
        name: 'Rangement et meubles TV',
        items: [
          {
            id: 'bibliotheque',
            name: 'Bibliothèque',
            volume: 1.5,
            description: 'Bibliothèque standard',
            icon: '📚',
            category: 'Salon'
          },
          {
            id: 'bibliotheque-haute',
            name: 'Bibliothèque haute',
            volume: 2.5,
            description: 'Grande bibliothèque murale',
            icon: '📚',
            category: 'Salon'
          },
          {
            id: 'meuble-tv',
            name: 'Meuble TV',
            volume: 0.8,
            description: 'Meuble télévision standard',
            icon: '📺',
            category: 'Salon'
          },
          {
            id: 'meuble-tv-angle',
            name: "Meuble TV d'angle",
            volume: 1.0,
            description: "Meuble TV d'angle",
            icon: '📺',
            category: 'Salon'
          },
          {
            id: 'meuble-hifi',
            name: 'Meuble Hi-Fi',
            volume: 0.6,
            description: 'Meuble chaîne stéréo',
            icon: '🎵',
            category: 'Salon'
          },
          {
            id: 'commode-salon',
            name: 'Commode salon',
            volume: 1.2,
            description: 'Commode de salon',
            icon: '🗄️',
            category: 'Salon'
          },
          {
            id: 'buffet-salon',
            name: 'Buffet salon',
            volume: 1.8,
            description: 'Buffet ou bahut de salon',
            icon: '🗄️',
            category: 'Salon'
          },
          {
            id: 'vitrine',
            name: 'Vitrine',
            volume: 1.4,
            description: 'Vitrine d\'exposition',
            icon: '🏺',
            category: 'Salon'
          },
          {
            id: 'etagere-murale',
            name: 'Étagère murale',
            volume: 0.3,
            description: 'Étagère fixée au mur',
            icon: '📚',
            category: 'Salon'
          }
        ]
      },
      {
        id: 'salon-tables',
        name: 'Tables',
        items: [
          {
            id: 'table-basse',
            name: 'Table basse',
            volume: 0.5,
            description: 'Table basse de salon',
            icon: '🪑',
            category: 'Salon'
          },
          {
            id: 'table-basse-verre',
            name: 'Table basse en verre',
            volume: 0.4,
            description: 'Table basse plateau verre',
            icon: '🪑',
            category: 'Salon'
          },
          {
            id: 'table-appoint',
            name: "Table d'appoint",
            volume: 0.2,
            description: "Petite table d'appoint",
            icon: '🪑',
            category: 'Salon'
          },
          {
            id: 'console',
            name: 'Console',
            volume: 0.6,
            description: 'Console d\'entrée ou salon',
            icon: '🪑',
            category: 'Salon'
          },
          {
            id: 'bout-canape',
            name: 'Bout de canapé',
            volume: 0.15,
            description: 'Petite table bout de canapé',
            icon: '🪑',
            category: 'Salon'
          }
        ]
      },
      {
        id: 'salon-decoration',
        name: 'Décoration et objets',
        items: [
          {
            id: 'tableau-grand',
            name: 'Grand tableau',
            volume: 0.1,
            description: 'Tableau ou toile grand format',
            icon: '🖼️',
            category: 'Salon'
          },
          {
            id: 'miroir-salon',
            name: 'Miroir salon',
            volume: 0.08,
            description: 'Miroir décoratif',
            icon: '🪞',
            category: 'Salon'
          },
          {
            id: 'lampadaire',
            name: 'Lampadaire',
            volume: 0.3,
            description: 'Lampe sur pied',
            icon: '💡',
            category: 'Salon'
          },
          {
            id: 'lampe-table',
            name: 'Lampe de table',
            volume: 0.05,
            description: 'Petite lampe de table',
            icon: '💡',
            category: 'Salon'
          }
        ]
      }
    ]
  },
  {
    id: 'salle-manger',
    name: 'Salle à manger',
    icon: '🍽️',
    subcategories: [
      {
        id: 'sam-tables',
        name: 'Tables',
        items: [
          {
            id: 'table-sam-4places',
            name: 'Table 4 places',
            volume: 1.0,
            description: 'Table salle à manger 4 personnes',
            icon: '🪑',
            category: 'Salle à manger'
          },
          {
            id: 'table-sam-6places',
            name: 'Table 6 places',
            volume: 1.5,
            description: 'Table salle à manger 6 personnes',
            icon: '🪑',
            category: 'Salle à manger'
          },
          {
            id: 'table-sam-8places',
            name: 'Table 8 places et +',
            volume: 2.2,
            description: 'Grande table salle à manger',
            icon: '🪑',
            category: 'Salle à manger'
          },
          {
            id: 'table-extensible',
            name: 'Table extensible',
            volume: 1.8,
            description: 'Table à rallonges',
            icon: '🪑',
            category: 'Salle à manger'
          },
          {
            id: 'table-ronde',
            name: 'Table ronde',
            volume: 1.3,
            description: 'Table ronde salle à manger',
            icon: '🪑',
            category: 'Salle à manger'
          }
        ]
      },
      {
        id: 'sam-assises',
        name: 'Chaises et assises',
        items: [
          {
            id: 'chaise-sam',
            name: 'Chaise salle à manger',
            volume: 0.2,
            description: 'Chaise standard',
            icon: '🪑',
            category: 'Salle à manger'
          },
          {
            id: 'chaise-accoudoirs',
            name: 'Chaise avec accoudoirs',
            volume: 0.3,
            description: 'Chaise ou fauteuil de table',
            icon: '🪑',
            category: 'Salle à manger'
          },
          {
            id: 'banc-sam',
            name: 'Banc salle à manger',
            volume: 0.6,
            description: 'Banc de table',
            icon: '🪑',
            category: 'Salle à manger'
          }
        ]
      },
      {
        id: 'sam-rangement',
        name: 'Rangement',
        items: [
          {
            id: 'buffet-sam',
            name: 'Buffet salle à manger',
            volume: 2.0,
            description: 'Buffet ou bahut',
            icon: '🗄️',
            category: 'Salle à manger'
          },
          {
            id: 'vaisselier',
            name: 'Vaisselier',
            volume: 2.5,
            description: 'Vaisselier avec vitrine',
            icon: '🍽️',
            category: 'Salle à manger'
          },
          {
            id: 'desserte',
            name: 'Desserte',
            volume: 0.8,
            description: 'Meuble desserte roulant',
            icon: '🗄️',
            category: 'Salle à manger'
          }
        ]
      }
    ]
  },
  {
    id: 'chambre',
    name: 'Chambre',
    icon: '🛏️',
    subcategories: [
      {
        id: 'chambre-couchage',
        name: 'Couchage',
        items: [
          {
            id: 'lit-simple',
            name: 'Lit simple (90x190)',
            volume: 0.8,
            description: 'Lit simple avec sommier',
            icon: '🛏️',
            category: 'Chambre'
          },
          {
            id: 'lit-double',
            name: 'Lit double (140x190)',
            volume: 1.2,
            description: 'Lit double avec sommier',
            icon: '🛏️',
            category: 'Chambre'
          },
          {
            id: 'lit-queen',
            name: 'Lit Queen (160x200)',
            volume: 1.5,
            description: 'Lit Queen size avec sommier',
            icon: '🛏️',
            category: 'Chambre'
          },
          {
            id: 'lit-king',
            name: 'Lit King (180x200)',
            volume: 1.8,
            description: 'Lit King size avec sommier',
            icon: '🛏️',
            category: 'Chambre'
          },
          {
            id: 'lit-coffre',
            name: 'Lit coffre',
            volume: 1.6,
            description: 'Lit avec rangement intégré',
            icon: '🛏️',
            category: 'Chambre'
          },
          {
            id: 'lit-mezzanine',
            name: 'Lit mezzanine',
            volume: 2.0,
            description: 'Lit surélevé avec espace dessous',
            icon: '🛏️',
            category: 'Chambre'
          },
          {
            id: 'matelas-simple',
            name: 'Matelas simple',
            volume: 0.3,
            description: 'Matelas 90x190',
            icon: '🛏️',
            category: 'Chambre'
          },
          {
            id: 'matelas-double',
            name: 'Matelas double',
            volume: 0.5,
            description: 'Matelas 140x190',
            icon: '🛏️',
            category: 'Chambre'
          },
          {
            id: 'matelas-queen',
            name: 'Matelas Queen',
            volume: 0.6,
            description: 'Matelas 160x200',
            icon: '🛏️',
            category: 'Chambre'
          },
          {
            id: 'matelas-king',
            name: 'Matelas King',
            volume: 0.7,
            description: 'Matelas 180x200',
            icon: '🛏️',
            category: 'Chambre'
          },
          {
            id: 'sommier-simple',
            name: 'Sommier simple',
            volume: 0.4,
            description: 'Sommier 90x190',
            icon: '🛏️',
            category: 'Chambre'
          },
          {
            id: 'sommier-double',
            name: 'Sommier double',
            volume: 0.6,
            description: 'Sommier 140x190',
            icon: '🛏️',
            category: 'Chambre'
          }
        ]
      },
      {
        id: 'chambre-rangement',
        name: 'Rangement',
        items: [
          {
            id: 'armoire-2portes',
            name: 'Armoire 2 portes',
            volume: 2.5,
            description: 'Armoire standard 2 portes',
            icon: '🚪',
            category: 'Chambre'
          },
          {
            id: 'armoire-3portes',
            name: 'Armoire 3 portes',
            volume: 3.5,
            description: 'Grande armoire 3 portes',
            icon: '🚪',
            category: 'Chambre'
          },
          {
            id: 'armoire-4portes',
            name: 'Armoire 4 portes',
            volume: 4.5,
            description: 'Très grande armoire 4 portes',
            icon: '🚪',
            category: 'Chambre'
          },
          {
            id: 'armoire-angle',
            name: "Armoire d'angle",
            volume: 3.0,
            description: "Armoire d'angle",
            icon: '🚪',
            category: 'Chambre'
          },
          {
            id: 'penderie',
            name: 'Penderie',
            volume: 1.8,
            description: 'Penderie ouverte',
            icon: '👔',
            category: 'Chambre'
          },
          {
            id: 'dressing',
            name: 'Dressing modulable',
            volume: 5.0,
            description: 'Dressing complet modulable',
            icon: '🚪',
            category: 'Chambre'
          },
          {
            id: 'commode-3tiroirs',
            name: 'Commode 3 tiroirs',
            volume: 0.8,
            description: 'Commode chambre 3 tiroirs',
            icon: '🗄️',
            category: 'Chambre'
          },
          {
            id: 'commode-4tiroirs',
            name: 'Commode 4 tiroirs',
            volume: 1.0,
            description: 'Commode chambre 4 tiroirs',
            icon: '🗄️',
            category: 'Chambre'
          },
          {
            id: 'commode-5tiroirs',
            name: 'Commode 5 tiroirs',
            volume: 1.2,
            description: 'Grande commode 5 tiroirs',
            icon: '🗄️',
            category: 'Chambre'
          },
          {
            id: 'chevet',
            name: 'Table de chevet',
            volume: 0.3,
            description: 'Table de nuit',
            icon: '🪑',
            category: 'Chambre'
          },
          {
            id: 'coffre-rangement',
            name: 'Coffre de rangement',
            volume: 0.6,
            description: 'Coffre ou malle de rangement',
            icon: '📦',
            category: 'Chambre'
          }
        ]
      },
      {
        id: 'chambre-coiffeuse',
        name: 'Coiffeuse et miroirs',
        items: [
          {
            id: 'coiffeuse',
            name: 'Coiffeuse',
            volume: 0.8,
            description: 'Coiffeuse avec miroir',
            icon: '💄',
            category: 'Chambre'
          },
          {
            id: 'miroir-chambre',
            name: 'Miroir chambre',
            volume: 0.1,
            description: 'Miroir de chambre',
            icon: '🪞',
            category: 'Chambre'
          },
          {
            id: 'psyche',
            name: 'Psyché',
            volume: 0.2,
            description: 'Miroir sur pied orientable',
            icon: '🪞',
            category: 'Chambre'
          }
        ]
      }
    ]
  },
  {
    id: 'chambre-enfant',
    name: 'Chambre enfant',
    icon: '🧸',
    subcategories: [
      {
        id: 'enfant-couchage',
        name: 'Couchage enfant',
        items: [
          {
            id: 'lit-bebe',
            name: 'Lit bébé',
            volume: 0.6,
            description: 'Lit à barreaux',
            icon: '👶',
            category: 'Chambre enfant'
          },
          {
            id: 'lit-evolutif',
            name: 'Lit évolutif',
            volume: 0.8,
            description: 'Lit qui grandit avec l\'enfant',
            icon: '👶',
            category: 'Chambre enfant'
          },
          {
            id: 'lit-superpose',
            name: 'Lits superposés',
            volume: 2.5,
            description: 'Lits superposés',
            icon: '🛏️',
            category: 'Chambre enfant'
          },
          {
            id: 'lit-gigogne',
            name: 'Lit gigogne',
            volume: 1.2,
            description: 'Lit avec couchage tiroir',
            icon: '🛏️',
            category: 'Chambre enfant'
          }
        ]
      },
      {
        id: 'enfant-rangement',
        name: 'Rangement enfant',
        items: [
          {
            id: 'armoire-enfant',
            name: 'Armoire enfant',
            volume: 1.8,
            description: 'Petite armoire enfant',
            icon: '🚪',
            category: 'Chambre enfant'
          },
          {
            id: 'commode-enfant',
            name: 'Commode enfant',
            volume: 0.6,
            description: 'Commode adaptée aux enfants',
            icon: '🗄️',
            category: 'Chambre enfant'
          },
          {
            id: 'coffre-jouets',
            name: 'Coffre à jouets',
            volume: 0.4,
            description: 'Rangement pour jouets',
            icon: '🧸',
            category: 'Chambre enfant'
          },
          {
            id: 'bibliotheque-enfant',
            name: 'Bibliothèque enfant',
            volume: 0.8,
            description: 'Étagères pour livres enfant',
            icon: '📚',
            category: 'Chambre enfant'
          }
        ]
      },
      {
        id: 'enfant-bureau',
        name: 'Bureau enfant',
        items: [
          {
            id: 'bureau-enfant',
            name: 'Bureau enfant',
            volume: 0.5,
            description: 'Petit bureau pour enfant',
            icon: '📝',
            category: 'Chambre enfant'
          },
          {
            id: 'chaise-enfant',
            name: 'Chaise enfant',
            volume: 0.1,
            description: 'Chaise adaptée aux enfants',
            icon: '🪑',
            category: 'Chambre enfant'
          }
        ]
      }
    ]
  },
  {
    id: 'cuisine',
    name: 'Cuisine',
    icon: '🍳',
    subcategories: [
      {
        id: 'cuisine-gros-electromenager',
        name: 'Gros électroménager',
        items: [
          {
            id: 'refrigerateur',
            name: 'Réfrigérateur',
            volume: 0.8,
            description: 'Réfrigérateur standard',
            icon: '❄️',
            category: 'Cuisine'
          },
          {
            id: 'refrigerateur-americain',
            name: 'Réfrigérateur américain',
            volume: 1.2,
            description: 'Grand réfrigérateur side-by-side',
            icon: '❄️',
            category: 'Cuisine'
          },
          {
            id: 'congelateur-armoire',
            name: 'Congélateur armoire',
            volume: 0.6,
            description: 'Congélateur vertical',
            icon: '❄️',
            category: 'Cuisine'
          },
          {
            id: 'congelateur-coffre',
            name: 'Congélateur coffre',
            volume: 0.8,
            description: 'Congélateur horizontal',
            icon: '❄️',
            category: 'Cuisine'
          },
          {
            id: 'lave-linge',
            name: 'Lave-linge',
            volume: 0.6,
            description: 'Machine à laver',
            icon: '🌊',
            category: 'Cuisine'
          },
          {
            id: 'lave-linge-sechant',
            name: 'Lave-linge séchant',
            volume: 0.7,
            description: 'Machine lavante-séchante',
            icon: '🌊',
            category: 'Cuisine'
          },
          {
            id: 'seche-linge',
            name: 'Sèche-linge',
            volume: 0.6,
            description: 'Sèche-linge séparé',
            icon: '🌪️',
            category: 'Cuisine'
          },
          {
            id: 'lave-vaisselle',
            name: 'Lave-vaisselle',
            volume: 0.5,
            description: 'Lave-vaisselle standard',
            icon: '🍽️',
            category: 'Cuisine'
          },
          {
            id: 'lave-vaisselle-compact',
            name: 'Lave-vaisselle compact',
            volume: 0.3,
            description: 'Petit lave-vaisselle',
            icon: '🍽️',
            category: 'Cuisine'
          },
          {
            id: 'four',
            name: 'Four',
            volume: 0.3,
            description: 'Four encastrable ou posable',
            icon: '🔥',
            category: 'Cuisine'
          },
          {
            id: 'four-vapeur',
            name: 'Four vapeur',
            volume: 0.25,
            description: 'Four à vapeur encastré',
            icon: '🔥',
            category: 'Cuisine'
          },
          {
            id: 'micro-ondes',
            name: 'Micro-ondes',
            volume: 0.1,
            description: 'Four micro-ondes',
            icon: '📦',
            category: 'Cuisine'
          },
          {
            id: 'cuisiniere',
            name: 'Cuisinière',
            volume: 0.8,
            description: 'Cuisinière avec four',
            icon: '🔥',
            category: 'Cuisine'
          },
          {
            id: 'plaque-cuisson',
            name: 'Plaque de cuisson',
            volume: 0.15,
            description: 'Table de cuisson',
            icon: '🔥',
            category: 'Cuisine'
          },
          {
            id: 'hotte',
            name: 'Hotte aspirante',
            volume: 0.2,
            description: 'Hotte de cuisine',
            icon: '💨',
            category: 'Cuisine'
          }
        ]
      },
      {
        id: 'cuisine-petit-electromenager',
        name: 'Petit électroménager',
        items: [
          {
            id: 'robot-cuisine',
            name: 'Robot de cuisine',
            volume: 0.02,
            description: 'Robot multifonction',
            icon: '🤖',
            category: 'Cuisine'
          },
          {
            id: 'robot-patissier',
            name: 'Robot pâtissier',
            volume: 0.03,
            description: 'Batteur sur socle',
            icon: '🧁',
            category: 'Cuisine'
          },
          {
            id: 'blender',
            name: 'Blender',
            volume: 0.015,
            description: 'Mixeur blender',
            icon: '🥤',
            category: 'Cuisine'
          },
          {
            id: 'cafetiere',
            name: 'Cafetière',
            volume: 0.01,
            description: 'Machine à café',
            icon: '☕',
            category: 'Cuisine'
          },
          {
            id: 'machine-expresso',
            name: 'Machine expresso',
            volume: 0.02,
            description: 'Machine à expresso',
            icon: '☕',
            category: 'Cuisine'
          },
          {
            id: 'grille-pain',
            name: 'Grille-pain',
            volume: 0.008,
            description: 'Toaster',
            icon: '🍞',
            category: 'Cuisine'
          },
          {
            id: 'bouilloire',
            name: 'Bouilloire électrique',
            volume: 0.005,
            description: 'Bouilloire',
            icon: '🫖',
            category: 'Cuisine'
          }
        ]
      },
      {
        id: 'cuisine-mobilier',
        name: 'Mobilier de cuisine',
        items: [
          {
            id: 'table-cuisine',
            name: 'Table de cuisine',
            volume: 0.8,
            description: 'Table de cuisine 4 personnes',
            icon: '🪑',
            category: 'Cuisine'
          },
          {
            id: 'ilot-central',
            name: 'Îlot central',
            volume: 3.0,
            description: 'Îlot de cuisine avec rangements',
            icon: '🏝️',
            category: 'Cuisine'
          },
          {
            id: 'meuble-bas-cuisine',
            name: 'Meuble bas cuisine',
            volume: 0.8,
            description: 'Élément bas avec tiroirs',
            icon: '🗄️',
            category: 'Cuisine'
          },
          {
            id: 'meuble-haut-cuisine',
            name: 'Meuble haut cuisine',
            volume: 0.4,
            description: 'Élément haut mural',
            icon: '🗄️',
            category: 'Cuisine'
          },
          {
            id: 'meuble-colonne-cuisine',
            name: 'Meuble colonne cuisine',
            volume: 1.2,
            description: 'Colonne de cuisine',
            icon: '🗄️',
            category: 'Cuisine'
          },
          {
            id: 'chaise-cuisine',
            name: 'Chaise de cuisine',
            volume: 0.2,
            description: 'Chaise standard',
            icon: '🪑',
            category: 'Cuisine'
          },
          {
            id: 'tabouret-bar',
            name: 'Tabouret de bar',
            volume: 0.15,
            description: 'Tabouret haut',
            icon: '🪑',
            category: 'Cuisine'
          },
          {
            id: 'desserte-cuisine',
            name: 'Desserte de cuisine',
            volume: 0.6,
            description: 'Chariot de cuisine mobile',
            icon: '🛒',
            category: 'Cuisine'
          }
        ]
      }
    ]
  },
  {
    id: 'salle-bain',
    name: 'Salle de bain',
    icon: '🚿',
    subcategories: [
      {
        id: 'sdb-mobilier',
        name: 'Mobilier salle de bain',
        items: [
          {
            id: 'meuble-vasque',
            name: 'Meuble vasque',
            volume: 0.5,
            description: 'Meuble sous vasque',
            icon: '🚿',
            category: 'Salle de bain'
          },
          {
            id: 'meuble-sous-vasque',
            name: 'Meuble sous vasque',
            volume: 0.5,
            description: 'Meuble de rangement sous lavabo',
            icon: '🚿',
            category: 'Salle de bain'
          },
          {
            id: 'meuble-vasque-double',
            name: 'Meuble double vasque',
            volume: 1.0,
            description: 'Meuble sous double vasque',
            icon: '🚿',
            category: 'Salle de bain'
          },
          {
            id: 'colonne-sdb',
            name: 'Colonne de rangement',
            volume: 0.8,
            description: 'Colonne salle de bain',
            icon: '🗄️',
            category: 'Salle de bain'
          },
          {
            id: 'armoire-toilette',
            name: 'Armoire de toilette',
            volume: 0.3,
            description: 'Miroir avec rangements',
            icon: '🪞',
            category: 'Salle de bain'
          },
          {
            id: 'etagere-sdb',
            name: 'Étagère salle de bain',
            volume: 0.2,
            description: 'Étagère murale ou sur roulettes',
            icon: '📚',
            category: 'Salle de bain'
          },
          {
            id: 'etageres-murales-sdb',
            name: 'Étagères murales',
            volume: 0.15,
            description: 'Étagères fixées au mur',
            icon: '📚',
            category: 'Salle de bain'
          },
          {
            id: 'meuble-angle-sdb',
            name: "Meuble d'angle",
            volume: 0.4,
            description: "Meuble de rangement d'angle",
            icon: '🗄️',
            category: 'Salle de bain'
          },
          {
            id: 'tabouret-sdb',
            name: 'Tabouret salle de bain',
            volume: 0.1,
            description: 'Petit tabouret ou marchepied',
            icon: '🪑',
            category: 'Salle de bain'
          },
          {
            id: 'banc-sdb',
            name: 'Banc ou tabouret',
            volume: 0.2,
            description: 'Banc de rangement ou tabouret',
            icon: '🪑',
            category: 'Salle de bain'
          },
          {
            id: 'chariot-rangement-sdb',
            name: 'Chariot de rangement',
            volume: 0.3,
            description: 'Chariot mobile avec étagères',
            icon: '🛒',
            category: 'Salle de bain'
          },
          {
            id: 'porte-serviettes-rangement',
            name: 'Porte-serviettes avec rangement',
            volume: 0.4,
            description: 'Support serviettes avec compartiments',
            icon: '🛁',
            category: 'Salle de bain'
          },
          {
            id: 'panier-linge-meuble',
            name: 'Panier à linge avec meuble intégré',
            volume: 0.6,
            description: 'Meuble avec panier à linge intégré',
            icon: '🧺',
            category: 'Salle de bain'
          },
          {
            id: 'meuble-bas-rangement-sdb',
            name: 'Meuble bas de rangement',
            volume: 0.5,
            description: 'Petit meuble bas pour salle de bain',
            icon: '🗄️',
            category: 'Salle de bain'
          }
        ]
      },
      {
        id: 'sdb-accessoires',
        name: 'Accessoires et miroirs',
        items: [
          {
            id: 'miroir-sdb',
            name: 'Miroir salle de bain',
            volume: 0.05,
            description: 'Miroir simple',
            icon: '🪞',
            category: 'Salle de bain'
          },
          {
            id: 'miroir-eclairant',
            name: 'Miroir éclairant',
            volume: 0.08,
            description: 'Miroir avec éclairage LED',
            icon: '🪞',
            category: 'Salle de bain'
          },
          {
            id: 'panier-linge',
            name: 'Panier à linge',
            volume: 0.15,
            description: 'Bac à linge sale',
            icon: '🧺',
            category: 'Salle de bain'
          },
          {
            id: 'porte-serviettes',
            name: 'Porte-serviettes',
            volume: 0.05,
            description: 'Support serviettes sur pied',
            icon: '🛁',
            category: 'Salle de bain'
          }
        ]
      }
    ]
  },
  {
    id: 'bureau',
    name: 'Bureau',
    icon: '💻',
    subcategories: [
      {
        id: 'bureau-mobilier',
        name: 'Mobilier de bureau',
        items: [
          {
            id: 'bureau-simple',
            name: 'Bureau simple',
            volume: 0.8,
            description: 'Bureau de travail standard',
            icon: '💻',
            category: 'Bureau'
          },
          {
            id: 'bureau-angle',
            name: "Bureau d'angle",
            volume: 1.2,
            description: "Bureau d'angle",
            icon: '💻',
            category: 'Bureau'
          },
          {
            id: 'bureau-direction',
            name: 'Bureau de direction',
            volume: 2.0,
            description: 'Grand bureau de direction',
            icon: '💻',
            category: 'Bureau'
          },
          {
            id: 'bureau-reglable',
            name: 'Bureau réglable en hauteur',
            volume: 1.0,
            description: 'Bureau assis-debout',
            icon: '💻',
            category: 'Bureau'
          },
          {
            id: 'chaise-bureau',
            name: 'Chaise de bureau',
            volume: 0.4,
            description: 'Chaise de bureau ergonomique',
            icon: '🪑',
            category: 'Bureau'
          },
          {
            id: 'fauteuil-direction',
            name: 'Fauteuil de direction',
            volume: 0.6,
            description: 'Fauteuil de bureau haut de gamme',
            icon: '🪑',
            category: 'Bureau'
          },
          {
            id: 'fauteuil-visiteur',
            name: 'Fauteuil visiteur',
            volume: 0.3,
            description: 'Siège pour visiteurs',
            icon: '🪑',
            category: 'Bureau'
          }
        ]
      },
      {
        id: 'bureau-rangement',
        name: 'Rangement bureau',
        items: [
          {
            id: 'armoire-bureau',
            name: 'Armoire de bureau',
            volume: 1.8,
            description: 'Armoire de rangement bureau',
            icon: '🗄️',
            category: 'Bureau'
          },
          {
            id: 'bibliotheque-bureau',
            name: 'Bibliothèque bureau',
            volume: 1.5,
            description: 'Étagères de bureau',
            icon: '📚',
            category: 'Bureau'
          },
          {
            id: 'caisson-bureau',
            name: 'Caisson de bureau',
            volume: 0.3,
            description: 'Caisson à tiroirs mobile',
            icon: '🗄️',
            category: 'Bureau'
          },
          {
            id: 'classeur',
            name: 'Classeur à rideau',
            volume: 0.8,
            description: 'Meuble classeur professionnel',
            icon: '📁',
            category: 'Bureau'
          },
          {
            id: 'coffre-fort',
            name: 'Coffre-fort',
            volume: 0.2,
            description: 'Petit coffre-fort de bureau',
            icon: '🔒',
            category: 'Bureau'
          }
        ]
      },
      {
        id: 'bureau-technique',
        name: 'Équipement technique',  
        items: [
          {
            id: 'imprimante',
            name: 'Imprimante',
            volume: 0.05,
            description: 'Imprimante de bureau',
            icon: '🖨️',
            category: 'Bureau'
          },
          {
            id: 'imprimante-pro',
            name: 'Imprimante professionnelle',
            volume: 0.15,
            description: 'Grande imprimante multifonction',
            icon: '🖨️',
            category: 'Bureau'
          },
          {
            id: 'destructeur',
            name: 'Destructeur de documents',
            volume: 0.08,
            description: 'Broyeur à papier',
            icon: '📄',
            category: 'Bureau'
          },
          {
            id: 'serveur',
            name: 'Serveur informatique',
            volume: 0.3,
            description: 'Rack ou tour serveur',
            icon: '💾',
            category: 'Bureau'
          }
        ]
      }
    ]
  },
  {
    id: 'entree-couloir',
    name: 'Entrée et couloir',
    icon: '🚪',
    subcategories: [
      {
        id: 'entree-rangement',
        name: 'Rangement entrée',
        items: [
          {
            id: 'vestiaire',
            name: 'Vestiaire/Portemanteau',
            volume: 0.4,
            description: 'Meuble vestiaire avec crochets',
            icon: '🧥',
            category: 'Entrée et couloir'
          },
          {
            id: 'meuble-chaussures',
            name: 'Meuble à chaussures',
            volume: 0.6,
            description: 'Rangement pour chaussures',
            icon: '👟',
            category: 'Entrée et couloir'
          },
          {
            id: 'console-entree',
            name: "Console d'entrée",
            volume: 0.5,
            description: "Table console d'entrée",
            icon: '🪑',
            category: 'Entrée et couloir'
          },
          {
            id: 'commode-entree',
            name: "Commode d'entrée",
            volume: 0.8,
            description: "Meuble de rangement d'entrée",
            icon: '🗄️',
            category: 'Entrée et couloir'
          },
          {
            id: 'banc-entree',
            name: "Banc d'entrée",
            volume: 0.3,
            description: 'Banc avec ou sans rangement',
            icon: '🪑',
            category: 'Entrée et couloir'
          }
        ]
      },
      {
        id: 'entree-decoration',
        name: 'Décoration entrée',
        items: [
          {
            id: 'miroir-entree',
            name: "Miroir d'entrée",
            volume: 0.08,
            description: "Grand miroir d'entrée",
            icon: '🪞',
            category: 'Entrée et couloir'
          },
          {
            id: 'porte-parapluie',
            name: 'Porte-parapluies',
            volume: 0.05,
            description: 'Support à parapluies',
            icon: '☂️',
            category: 'Entrée et couloir'
          }
        ]
      }
    ]
  },
  {
    id: 'garage',
    name: 'Garage',
    icon: '🏠',
    subcategories: [
      {
        id: 'garage-mobilier',
        name: 'Mobilier garage',
        items: [
          {
            id: 'etabli-garage',
            name: 'Établi',
            volume: 1.2,
            description: 'Table de travail avec tiroirs',
            icon: '🔨',
            category: 'Garage'
          },
          {
            id: 'armoire-rangement-garage',
            name: 'Armoire de rangement',
            volume: 1.8,
            description: 'Armoire métallique de garage',
            icon: '🗄️',
            category: 'Garage'
          },
          {
            id: 'etageres-murales-garage',
            name: 'Étagères murales',
            volume: 0.6,
            description: 'Rayonnage mural métallique',
            icon: '📚',
            category: 'Garage'
          },
          {
            id: 'ratelier-outils',
            name: 'Râtelier à outils',
            volume: 0.3,
            description: 'Support mural pour outils',
            icon: '🔧',
            category: 'Garage'
          },
          {
            id: 'meuble-tiroirs-garage',
            name: 'Meuble à tiroirs',
            volume: 1.0,
            description: 'Meuble de rangement avec tiroirs',
            icon: '🗄️',
            category: 'Garage'
          },
          {
            id: 'porte-velos',
            name: 'Porte-vélos',
            volume: 0.4,
            description: 'Support de rangement pour vélos',
            icon: '🚲',
            category: 'Garage'
          },
          {
            id: 'meuble-chaussures-garage',
            name: 'Meuble à chaussures',
            volume: 0.6,
            description: 'Rangement chaussures de garage',
            icon: '👟',
            category: 'Garage'
          },
          {
            id: 'coffre-rangement-garage',
            name: 'Coffre de rangement',
            volume: 0.8,
            description: 'Grand coffre pour garage',
            icon: '📦',
            category: 'Garage'
          },
          {
            id: 'panneau-perfore',
            name: 'Panneau perforé (pegboard)',
            volume: 0.2,
            description: 'Panneau mural perforé pour outils',
            icon: '🔧',
            category: 'Garage'
          },
          {
            id: 'banc-travail-garage',
            name: 'Banc de travail',
            volume: 1.0,
            description: 'Banc de travail avec rangements',
            icon: '🔨',
            category: 'Garage'
          }
        ]
      }
    ]
  },
  {
    id: 'cave',
    name: 'Cave',
    icon: '🏠',
    subcategories: [
      {
        id: 'cave-rangement',
        name: 'Rangement cave',
        items: [
          {
            id: 'etageres-metalliques-cave',
            name: 'Étagères métalliques',
            volume: 0.8,
            description: 'Rayonnage métallique de cave',
            icon: '📚',
            category: 'Cave'
          },
          {
            id: 'armoire-stockage-cave',
            name: 'Armoire de stockage',
            volume: 1.5,
            description: 'Grande armoire pour cave',
            icon: '🗄️',
            category: 'Cave'
          },
          {
            id: 'casier-vin-cave',
            name: 'Casier à vin',
            volume: 0.4,
            description: 'Casier de rangement pour bouteilles',
            icon: '🍷',
            category: 'Cave'
          },
          {
            id: 'coffre-rangement-cave',
            name: 'Coffre de rangement',
            volume: 0.6,
            description: 'Coffre de stockage étanche',
            icon: '📦',
            category: 'Cave'
          },
          {
            id: 'meuble-bas-cave',
            name: 'Meuble bas',
            volume: 0.8,
            description: 'Meuble bas résistant à l\'humidité',
            icon: '🗄️',
            category: 'Cave'
          },
          {
            id: 'table-pliante-cave',
            name: 'Table pliante',
            volume: 0.3,
            description: 'Table d\'appoint pliable',
            icon: '🪑',
            category: 'Cave'
          },
          {
            id: 'banc-rangement-cave',
            name: 'Banc de rangement',
            volume: 0.5,
            description: 'Banc avec compartiment de rangement',
            icon: '🪑',
            category: 'Cave'
          },
          {
            id: 'ratelier-buches',
            name: 'Râtelier à bûches',
            volume: 0.6,
            description: 'Support pour stockage bois',
            icon: '🪵',
            category: 'Cave'
          },
          {
            id: 'meuble-bocaux-conserves',
            name: 'Meuble à bocaux et conserves',
            volume: 1.0,
            description: 'Étagère spécialisée pour conserves',
            icon: '🥫',
            category: 'Cave'
          },
          {
            id: 'porte-bouteilles-cave',
            name: 'Porte-bouteilles',
            volume: 0.3,
            description: 'Casier spécialisé pour bouteilles',
            icon: '🍷',
            category: 'Cave'
          }
        ]
      },
      {
        id: 'cave-equipement',
        name: 'Équipement cave',
        items: [
          {
            id: 'congelateur-cave',
            name: 'Congélateur cave',
            volume: 0.8,
            description: 'Congélateur de cave',
            icon: '❄️',
            category: 'Cave'
          },
          {
            id: 'cave-vin',
            name: 'Cave à vin',
            volume: 0.6,
            description: 'Réfrigérateur à vin',
            icon: '🍷',
            category: 'Cave'
          },
          {
            id: 'chaudiere',
            name: 'Chaudière',
            volume: 0.8,
            description: 'Chaudière murale ou au sol',
            icon: '🔥',
            category: 'Cave'
          },
          {
            id: 'cumulus',
            name: 'Chauffe-eau',
            volume: 0.4,
            description: 'Ballon d\'eau chaude',
            icon: '💧',
            category: 'Cave'
          }
        ]
      }
    ]
  },
  {
    id: 'jardin-exterieur',
    name: 'Jardin et extérieur',
    icon: '🌿',
    subcategories: [
      {
        id: 'jardin-mobilier',
        name: 'Mobilier de jardin',
        items: [
          {
            id: 'salon-jardin',
            name: 'Salon de jardin',
            volume: 2.5,
            description: 'Ensemble table et chaises/fauteuils',
            icon: '🪑',
            category: 'Jardin et extérieur'
          },
          {
            id: 'table-jardin',
            name: 'Table de jardin',
            volume: 1.0,
            description: 'Table extérieure',
            icon: '🪑',
            category: 'Jardin et extérieur'
          },
          {
            id: 'chaise-jardin',
            name: 'Chaise de jardin',
            volume: 0.15,
            description: 'Chaise ou fauteuil extérieur',
            icon: '🪑',
            category: 'Jardin et extérieur'
          },
          {
            id: 'transat',
            name: 'Transat/Bain de soleil',
            volume: 0.4,
            description: 'Chaise longue',
            icon: '🏖️',
            category: 'Jardin et extérieur'
          },
          {
            id: 'parasol',
            name: 'Parasol',
            volume: 0.2,
            description: 'Parasol avec pied',
            icon: '☂️',
            category: 'Jardin et extérieur'
          },
          {
            id: 'tonnelle',
            name: 'Tonnelle/Pergola',
            volume: 2.0,
            description: 'Structure démontable',
            icon: '🏕️',
            category: 'Jardin et extérieur'
          }
        ]
      },
      {
        id: 'jardin-rangement',
        name: 'Rangement extérieur',
        items: [
          {
            id: 'abri-jardin',
            name: 'Abri de jardin',
            volume: 8.0,
            description: 'Cabanon de jardin démontable',
            icon: '🏠',
            category: 'Jardin et extérieur'
          },
          {
            id: 'armoire-jardin',
            name: 'Armoire de jardin',
            volume: 1.2,
            description: 'Armoire extérieure étanche',
            icon: '🗄️',
            category: 'Jardin et extérieur'
          },
          {
            id: 'coffre-jardin',
            name: 'Coffre de jardin',
            volume: 0.8,
            description: 'Coffre de rangement extérieur',
            icon: '📦',
            category: 'Jardin et extérieur'
          }
        ]
      },
      {
        id: 'jardin-equipement',
        name: 'Équipement jardin',
        items: [
          {
            id: 'barbecue',
            name: 'Barbecue',
            volume: 0.5,
            description: 'Barbecue mobile',
            icon: '🔥',
            category: 'Jardin et extérieur'
          },
          {
            id: 'plancha',
            name: 'Plancha',
            volume: 0.3,
            description: 'Plancha sur roulettes',
            icon: '🔥',
            category: 'Jardin et extérieur'
          },
          {
            id: 'tondeuse',
            name: 'Tondeuse',
            volume: 0.4,
            description: 'Tondeuse à gazon',
            icon: '🌱',
            category: 'Jardin et extérieur'
          },
          {
            id: 'velo',
            name: 'Vélo',
            volume: 0.6,
            description: 'Vélo adulte',
            icon: '🚲',
            category: 'Jardin et extérieur'
          },
          {
            id: 'trottinette',
            name: 'Trottinette électrique',
            volume: 0.15,
            description: 'Trottinette pliable',
            icon: '🛴',
            category: 'Jardin et extérieur'
          }
        ]
      }
    ]
  },
  {
    id: 'divers',
    name: 'Divers et emballages',
    icon: '📦',
    subcategories: [
      {
        id: 'divers-cartons',
        name: 'Cartons et emballages',
        items: [
          {
            id: 'carton-standard',
            name: 'Carton standard',
            volume: 0.05,
            description: 'Carton de déménagement 55x35x35cm',
            icon: '📦',
            category: 'Divers'
          },
          {
            id: 'carton-livre',
            name: 'Carton livre',
            volume: 0.03,
            description: 'Petit carton renforcé 35x27.5x30cm',
            icon: '📚',
            category: 'Divers'
          },
          {
            id: 'carton-penderie',
            name: 'Carton penderie',
            volume: 0.15,
            description: 'Carton avec barre penderie',
            icon: '👔',
            category: 'Divers'
          },
          {
            id: 'carton-vaisselle',
            name: 'Carton vaisselle',
            volume: 0.04,
            description: 'Carton renforcé pour fragile',
            icon: '🍽️',
            category: 'Divers'
          },
          {
            id: 'housse-matelas',
            name: 'Housse matelas',
            volume: 0.02,
            description: 'Protection plastique matelas',
            icon: '🛏️',
            category: 'Divers'
          },
          {
            id: 'film-plastique',
            name: 'Film plastique (rouleau)',
            volume: 0.01,
            description: 'Film de protection transparent',
            icon: '📦',
            category: 'Divers'
          }
        ]
      },
      {
        id: 'divers-objets',
        name: 'Objets divers',
        items: [
          {
            id: 'aspirateur',
            name: 'Aspirateur',
            volume: 0.2,
            description: 'Aspirateur standard',
            icon: '🌪️',
            category: 'Divers'
          },
          {
            id: 'aspirateur-balai',
            name: 'Aspirateur balai',
            volume: 0.1,
            description: 'Aspirateur sans fil',
            icon: '🌪️',
            category: 'Divers'
          },
          {
            id: 'nettoyeur-vapeur',
            name: 'Nettoyeur vapeur',
            volume: 0.15,
            description: 'Appareil de nettoyage vapeur',
            icon: '💨',
            category: 'Divers'
          },
          {
            id: 'planche-repasser',
            name: 'Planche à repasser',
            volume: 0.2,
            description: 'Table à repasser pliante',
            icon: '👔',
            category: 'Divers'
          },
          {
            id: 'fer-repasser',
            name: 'Fer à repasser',
            volume: 0.008,
            description: 'Fer avec ou sans centrale vapeur',
            icon: '👔',
            category: 'Divers'
          },
          {
            id: 'escabeau',
            name: 'Escabeau',
            volume: 0.3,
            description: 'Échelle pliante',
            icon: '🪜',
            category: 'Divers'
          },
          {
            id: 'plante-grande',
            name: 'Grande plante',
            volume: 0.3,
            description: 'Plante verte de grande taille',
            icon: '🌱',
            category: 'Divers'
          },
          {
            id: 'plante-moyenne',
            name: 'Plante moyenne',
            volume: 0.15,
            description: 'Plante verte de taille moyenne',
            icon: '🌿',
            category: 'Divers'
          },
          {
            id: 'plante-petite',
            name: 'Petite plante',
            volume: 0.05,
            description: 'Plante verte de petite taille',
            icon: '🌿',
            category: 'Divers'
          },
          {
            id: 'aquarium',
            name: 'Aquarium',
            volume: 0.4,
            description: 'Aquarium avec meuble',
            icon: '🐠',
            category: 'Divers'
          },
          {
            id: 'cage-animal',
            name: 'Cage/Transport animaux',
            volume: 0.2,
            description: 'Cage pour animaux domestiques',
            icon: '🐕',
            category: 'Divers'
          }
        ]
      },
      {
        id: 'divers-multimedia',
        name: 'Multimédia et électronique',
        items: [
          {
            id: 'television',
            name: 'Télévision écran plat',
            volume: 0.3,
            description: 'TV LED/OLED jusqu\'à 55"',
            icon: '📺',
            category: 'Divers'
          },
          {
            id: 'television-grande',
            name: 'Grande télévision 65"+',
            volume: 0.5,
            description: 'TV grand format 65" et plus',
            icon: '📺',
            category: 'Divers'
          },
          {
            id: 'ordinateur-fixe',
            name: 'Ordinateur fixe',
            volume: 0.08,
            description: 'Tour + écran + clavier/souris',
            icon: '💻',
            category: 'Divers'
          },
          {
            id: 'ordinateur-portable',
            name: 'Ordinateur portable',
            volume: 0.01,
            description: 'Laptop avec accessoires',
            icon: '💻',
            category: 'Divers'
          },
          {
            id: 'chaine-hifi',
            name: 'Chaîne Hi-Fi',
            volume: 0.15,
            description: 'Système audio complet',
            icon: '🎵',
            category: 'Divers'
          },
          {
            id: 'enceinte-bluetooth',
            name: 'Enceinte Bluetooth',
            volume: 0.02,
            description: 'Haut-parleur portable',
            icon: '🔊',
            category: 'Divers'
          },
          {
            id: 'console-jeux',
            name: 'Console de jeux',
            volume: 0.015,
            description: 'Console de jeux vidéo',
            icon: '🎮',
            category: 'Divers'
          },
          {
            id: 'projecteur',
            name: 'Vidéoprojecteur',
            volume: 0.03,
            description: 'Projecteur avec écran',
            icon: '📽️',
            category: 'Divers'
          }
        ]
      },
      {
        id: 'divers-sport',
        name: 'Sport et loisirs',
        items: [
          {
            id: 'velo-appartement',
            name: "Vélo d'appartement",
            volume: 0.8,
            description: 'Équipement fitness cardio',
            icon: '🚲',
            category: 'Divers'
          },
          {
            id: 'tapis-course',
            name: 'Tapis de course',
            volume: 1.2,
            description: 'Tapis roulant fitness',
            icon: '🏃',
            category: 'Divers'
          },
          {
            id: 'banc-musculation',
            name: 'Banc de musculation',
            volume: 0.6,
            description: 'Banc adjustable fitness',
            icon: '💪',
            category: 'Divers'
          },
          {
            id: 'table-ping-pong',
            name: 'Table de ping-pong',
            volume: 1.5,
            description: 'Table de tennis de table pliante',
            icon: '🏓',
            category: 'Divers'
          },
          {
            id: 'billard',
            name: 'Table de billard',
            volume: 3.5,
            description: 'Table de billard démontable',
            icon: '🎱',
            category: 'Divers'
          },
          {
            id: 'baby-foot',
            name: 'Baby-foot',
            volume: 1.8,
            description: 'Table de baby-foot',
            icon: '⚽',
            category: 'Divers'
          },
          {
            id: 'piano',
            name: 'Piano droit',
            volume: 2.0,
            description: 'Piano acoustique droit',
            icon: '🎹',
            category: 'Divers'
          },
          {
            id: 'piano-queue',
            name: 'Piano à queue',
            volume: 4.5,
            description: 'Piano à queue (transport spécialisé)',
            icon: '🎹',
            category: 'Divers'
          },
          {
            id: 'clavier-numerique',
            name: 'Clavier numérique',
            volume: 0.3,
            description: 'Piano numérique avec support',
            icon: '🎹',
            category: 'Divers'
          },
          {
            id: 'guitare',
            name: 'Guitare',
            volume: 0.08,
            description: 'Guitare avec étui',
            icon: '🎸',
            category: 'Divers'
          }
        ]
      }
    ]
  }
];
