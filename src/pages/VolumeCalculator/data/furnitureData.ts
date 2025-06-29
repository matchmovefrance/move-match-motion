
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
            id: 'fauteuil',
            name: 'Fauteuil',
            volume: 0.8,
            description: 'Fauteuil standard',
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
          }
        ]
      },
      {
        id: 'salon-rangement',
        name: 'Rangement',
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
            id: 'meuble-tv',
            name: 'Meuble TV',
            volume: 0.8,
            description: 'Meuble télévision',
            icon: '📺',
            category: 'Salon'
          },
          {
            id: 'commode-salon',
            name: 'Commode',
            volume: 1.2,
            description: 'Commode de salon',
            icon: '🗄️',
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
            id: 'table-appoint',
            name: "Table d'appoint",
            volume: 0.2,
            description: "Petite table d'appoint",
            icon: '🪑',
            category: 'Salon'
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
            id: 'lit-king',
            name: 'Lit King Size (160x200)',
            volume: 1.5,
            description: 'Grand lit avec sommier',
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
            id: 'commode-3tiroirs',
            name: 'Commode 3 tiroirs',
            volume: 0.8,
            description: 'Commode chambre 3 tiroirs',
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
        id: 'cuisine-electromenager',
        name: 'Électroménager',
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
            id: 'lave-linge',
            name: 'Lave-linge',
            volume: 0.6,
            description: 'Machine à laver',
            icon: '🌊',
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
            id: 'four',
            name: 'Four',
            volume: 0.3,
            description: 'Four encastrable ou posable',
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
          }
        ]
      },
      {
        id: 'cuisine-mobilier',
        name: 'Mobilier',
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
            id: 'chaise-cuisine',
            name: 'Chaise de cuisine',
            volume: 0.2,
            description: 'Chaise standard',
            icon: '🪑',
            category: 'Cuisine'
          },
          {
            id: 'tabouret',
            name: 'Tabouret',
            volume: 0.1,
            description: 'Tabouret de bar ou cuisine',
            icon: '🪑',
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
        name: 'Mobilier',
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
            id: 'colonne-sdb',
            name: 'Colonne de rangement',
            volume: 0.8,
            description: 'Colonne salle de bain',
            icon: '🗄️',
            category: 'Salle de bain'
          },
          {
            id: 'miroir-sdb',
            name: 'Miroir',
            volume: 0.1,
            description: 'Miroir de salle de bain',
            icon: '🪞',
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
        name: 'Mobilier',
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
            id: 'chaise-bureau',
            name: 'Chaise de bureau',
            volume: 0.4,
            description: 'Chaise de bureau ergonomique',
            icon: '🪑',
            category: 'Bureau'
          },
          {
            id: 'armoire-bureau',
            name: 'Armoire de bureau',
            volume: 1.8,
            description: 'Armoire de rangement bureau',
            icon: '🗄️',
            category: 'Bureau'
          }
        ]
      }
    ]
  },
  {
    id: 'divers',
    name: 'Divers',
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
            id: 'plante-grande',
            name: 'Grande plante',
            volume: 0.3,
            description: 'Plante verte de grande taille',
            icon: '🌱',
            category: 'Divers'
          },
          {
            id: 'plante-petite',
            name: 'Petite plante',
            volume: 0.1,
            description: 'Plante verte de petite taille',
            icon: '🌿',
            category: 'Divers'
          },
          {
            id: 'television',
            name: 'Télévision',
            volume: 0.4,
            description: 'Télévision écran plat',
            icon: '📺',
            category: 'Divers'
          }
        ]
      }
    ]
  }
];
