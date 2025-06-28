
import { FurnitureCategory } from '../types';

export const furnitureCategories: FurnitureCategory[] = [
  {
    id: 'living-room',
    name: 'Salon',
    icon: '🛋️',
    items: [
      {
        id: 'sofa-2p',
        name: 'Canapé 2 places',
        volume: 1.8,
        icon: '🛋️',
        category: 'Salon',
        description: 'Canapé standard 2 places'
      },
      {
        id: 'sofa-3p',
        name: 'Canapé 3 places',
        volume: 2.4,
        icon: '🛋️',
        category: 'Salon',
        description: 'Canapé standard 3 places'
      },
      {
        id: 'sofa-angle',
        name: 'Canapé d\'angle',
        volume: 3.5,
        icon: '🛋️',
        category: 'Salon',
        description: 'Canapé d\'angle 5-6 places'
      },
      {
        id: 'armchair',
        name: 'Fauteuil',
        volume: 0.8,
        icon: '🪑',
        category: 'Salon',
        description: 'Fauteuil standard'
      },
      {
        id: 'coffee-table',
        name: 'Table basse',
        volume: 0.4,
        icon: '🪑',
        category: 'Salon',
        description: 'Table basse salon'
      },
      {
        id: 'tv-stand',
        name: 'Meuble TV',
        volume: 0.6,
        icon: '📺',
        category: 'Salon',
        description: 'Meuble TV standard'
      },
      {
        id: 'bookshelf',
        name: 'Bibliothèque',
        volume: 1.2,
        icon: '📚',
        category: 'Salon',
        description: 'Bibliothèque standard'
      }
    ]
  },
  {
    id: 'bedroom',
    name: 'Chambre',
    icon: '🛏️',
    items: [
      {
        id: 'bed-90',
        name: 'Lit 90x190',
        volume: 1.2,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Lit simple 90x190'
      },
      {
        id: 'bed-140',
        name: 'Lit 140x190',
        volume: 2.1,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Lit double 140x190'
      },
      {
        id: 'bed-160',
        name: 'Lit 160x200',
        volume: 2.8,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Lit Queen 160x200'
      },
      {
        id: 'bed-180',
        name: 'Lit 180x200',
        volume: 3.2,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Lit King 180x200'
      },
      {
        id: 'mattress-90',
        name: 'Matelas 90x190',
        volume: 0.4,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Matelas simple'
      },
      {
        id: 'mattress-140',
        name: 'Matelas 140x190',
        volume: 0.6,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Matelas double'
      },
      {
        id: 'mattress-160',
        name: 'Matelas 160x200',
        volume: 0.8,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Matelas Queen'
      },
      {
        id: 'mattress-180',
        name: 'Matelas 180x200',
        volume: 0.9,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Matelas King'
      },
      {
        id: 'wardrobe-2p',
        name: 'Armoire 2 portes',
        volume: 2.2,
        icon: '🚪',
        category: 'Chambre',
        description: 'Armoire 2 portes standard'
      },
      {
        id: 'wardrobe-3p',
        name: 'Armoire 3 portes',
        volume: 3.1,
        icon: '🚪',
        category: 'Chambre',
        description: 'Armoire 3 portes'
      },
      {
        id: 'wardrobe-sliding',
        name: 'Armoire coulissante',
        volume: 2.8,
        icon: '🚪',
        category: 'Chambre',
        description: 'Armoire à portes coulissantes'
      },
      {
        id: 'dresser',
        name: 'Commode',
        volume: 0.7,
        icon: '🗄️',
        category: 'Chambre',
        description: 'Commode standard'
      },
      {
        id: 'nightstand',
        name: 'Table de chevet',
        volume: 0.2,
        icon: '🗄️',
        category: 'Chambre',
        description: 'Table de nuit'
      }
    ]
  },
  {
    id: 'kitchen',
    name: 'Cuisine',
    icon: '🍽️',
    items: [
      {
        id: 'fridge',
        name: 'Réfrigérateur',
        volume: 1.4,
        icon: '❄️',
        category: 'Cuisine',
        description: 'Réfrigérateur standard'
      },
      {
        id: 'fridge-american',
        name: 'Frigo américain',
        volume: 2.1,
        icon: '❄️',
        category: 'Cuisine',
        description: 'Réfrigérateur américain'
      },
      {
        id: 'washing-machine',
        name: 'Lave-linge',
        volume: 0.8,
        icon: '🌊',
        category: 'Cuisine',
        description: 'Machine à laver'
      },
      {
        id: 'dryer',
        name: 'Sèche-linge',
        volume: 0.8,
        icon: '🌀',
        category: 'Cuisine',
        description: 'Sèche-linge'
      },
      {
        id: 'dishwasher',
        name: 'Lave-vaisselle',
        volume: 0.6,
        icon: '🍽️',
        category: 'Cuisine',
        description: 'Lave-vaisselle'
      },
      {
        id: 'oven',
        name: 'Four',
        volume: 0.3,
        icon: '🔥',
        category: 'Cuisine',
        description: 'Four encastrable'
      },
      {
        id: 'microwave',
        name: 'Micro-ondes',
        volume: 0.1,
        icon: '📡',
        category: 'Cuisine',
        description: 'Micro-ondes'
      },
      {
        id: 'kitchen-cabinet-low',
        name: 'Meuble bas cuisine',
        volume: 0.5,
        icon: '🗄️',
        category: 'Cuisine',
        description: 'Meuble bas de cuisine'
      },
      {
        id: 'kitchen-cabinet-high',
        name: 'Meuble haut cuisine',
        volume: 0.3,
        icon: '🗄️',
        category: 'Cuisine',
        description: 'Meuble haut de cuisine'
      }
    ]
  },
  {
    id: 'dining-room',
    name: 'Salle à manger',
    icon: '🍽️',
    items: [
      {
        id: 'dining-table-4p',
        name: 'Table 4 personnes',
        volume: 1.0,
        icon: '🪑',
        category: 'Salle à manger',
        description: 'Table ronde/carrée 4 personnes'
      },
      {
        id: 'dining-table-6p',
        name: 'Table 6 personnes',
        volume: 1.5,
        icon: '🪑',
        category: 'Salle à manger',
        description: 'Table rectangulaire 6 personnes'
      },
      {
        id: 'dining-table-8p',
        name: 'Table 8 personnes',
        volume: 2.0,
        icon: '🪑',
        category: 'Salle à manger',
        description: 'Grande table 8 personnes'
      },
      {
        id: 'dining-chair',
        name: 'Chaise',
        volume: 0.15,
        icon: '🪑',
        category: 'Salle à manger',
        description: 'Chaise de salle à manger'
      },
      {
        id: 'buffet',
        name: 'Buffet',
        volume: 1.2,
        icon: '🗄️',
        category: 'Salle à manger',
        description: 'Buffet/bahut'
      },
      {
        id: 'china-cabinet',
        name: 'Vaisselier',
        volume: 1.8,
        icon: '🍽️',
        category: 'Salle à manger',
        description: 'Vaisselier vitré'
      }
    ]
  },
  {
    id: 'office',
    name: 'Bureau',
    icon: '💼',
    items: [
      {
        id: 'desk',
        name: 'Bureau',
        volume: 0.8,
        icon: '🖥️',
        category: 'Bureau',
        description: 'Bureau standard'
      },
      {
        id: 'desk-corner',
        name: 'Bureau d\'angle',
        volume: 1.2,
        icon: '🖥️',
        category: 'Bureau',
        description: 'Bureau d\'angle'
      },
      {
        id: 'office-chair',
        name: 'Chaise de bureau',
        volume: 0.4,
        icon: '🪑',
        category: 'Bureau',
        description: 'Siège de bureau'
      },
      {
        id: 'filing-cabinet',
        name: 'Classeur',
        volume: 0.3,
        icon: '🗃️',
        category: 'Bureau',
        description: 'Meuble classeur'
      },
      {
        id: 'bookshelf-office',
        name: 'Étagère bureau',
        volume: 0.6,
        icon: '📚',
        category: 'Bureau',
        description: 'Étagère de bureau'
      },
      {
        id: 'printer',
        name: 'Imprimante',
        volume: 0.05,
        icon: '🖨️',
        category: 'Bureau',
        description: 'Imprimante/scanner'
      }
    ]
  },
  {
    id: 'miscellaneous',
    name: 'Divers',
    icon: '📦',
    items: [
      {
        id: 'boxes-small',
        name: 'Cartons petits (livre)',
        volume: 0.03,
        icon: '📦',
        category: 'Divers',
        description: 'Cartons 35x27x30 cm'
      },
      {
        id: 'boxes-medium',
        name: 'Cartons moyens (standard)',
        volume: 0.06,
        icon: '📦',
        category: 'Divers',
        description: 'Cartons 55x35x30 cm'
      },
      {
        id: 'boxes-large',
        name: 'Cartons grands (vêtements)',
        volume: 0.12,
        icon: '📦',
        category: 'Divers',
        description: 'Cartons 60x40x50 cm'
      },
      {
        id: 'wardrobe-box',
        name: 'Carton penderie',
        volume: 0.3,
        icon: '👔',
        category: 'Divers',
        description: 'Carton penderie avec barre'
      },
      {
        id: 'mirror',
        name: 'Miroir',
        volume: 0.1,
        icon: '🪞',
        category: 'Divers',
        description: 'Miroir standard'
      },
      {
        id: 'painting',
        name: 'Tableau',
        volume: 0.05,
        icon: '🖼️',
        category: 'Divers',
        description: 'Tableau/cadre'
      },
      {
        id: 'plants',
        name: 'Plantes',
        volume: 0.08,
        icon: '🪴',
        category: 'Divers',
        description: 'Plantes en pot'
      },
      {
        id: 'vacuum',
        name: 'Aspirateur',
        volume: 0.15,
        icon: '🧹',
        category: 'Divers',
        description: 'Aspirateur'
      },
      {
        id: 'ironing-board',
        name: 'Table à repasser',
        volume: 0.1,
        icon: '👔',
        category: 'Divers',
        description: 'Table à repasser'
      },
      {
        id: 'bike',
        name: 'Vélo',
        volume: 0.8,
        icon: '🚲',
        category: 'Divers',
        description: 'Vélo adulte'
      },
      {
        id: 'suitcase',
        name: 'Valise',
        volume: 0.08,
        icon: '🧳',
        category: 'Divers',
        description: 'Valise moyenne'
      },
      {
        id: 'tv-32',
        name: 'TV 32 pouces',
        volume: 0.15,
        icon: '📺',
        category: 'Divers',
        description: 'Télévision 32 pouces'
      },
      {
        id: 'tv-55',
        name: 'TV 55 pouces',
        volume: 0.25,
        icon: '📺',
        category: 'Divers',
        description: 'Télévision 55 pouces'
      }
    ]
  }
];
