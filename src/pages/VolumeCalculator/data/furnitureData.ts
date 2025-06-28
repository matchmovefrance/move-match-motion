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
        volume: 2.1,
        icon: '🛋️',
        category: 'Salon',
        description: 'Canapé standard 2 places - 160x80x80cm'
      },
      {
        id: 'sofa-3p',
        name: 'Canapé 3 places',
        volume: 2.8,
        icon: '🛋️',
        category: 'Salon',
        description: 'Canapé standard 3 places - 200x85x85cm'
      },
      {
        id: 'sofa-angle',
        name: 'Canapé d\'angle',
        volume: 4.2,
        icon: '🛋️',
        category: 'Salon',
        description: 'Canapé d\'angle 5-6 places - 280x280x85cm'
      },
      {
        id: 'sofa-convertible',
        name: 'Canapé convertible',
        volume: 3.2,
        icon: '🛋️',
        category: 'Salon',
        description: 'Canapé-lit convertible - 200x90x85cm'
      },
      {
        id: 'armchair',
        name: 'Fauteuil',
        volume: 1.1,
        icon: '🪑',
        category: 'Salon',
        description: 'Fauteuil standard - 80x80x90cm'
      },
      {
        id: 'armchair-club',
        name: 'Fauteuil club',
        volume: 1.4,
        icon: '🪑',
        category: 'Salon',
        description: 'Fauteuil club en cuir - 90x85x85cm'
      },
      {
        id: 'recliner',
        name: 'Fauteuil relax',
        volume: 1.8,
        icon: '🪑',
        category: 'Salon',
        description: 'Fauteuil relax électrique - 85x95x110cm'
      },
      {
        id: 'coffee-table',
        name: 'Table basse',
        volume: 0.6,
        icon: '🪑',
        category: 'Salon',
        description: 'Table basse salon - 120x60x45cm'
      },
      {
        id: 'coffee-table-glass',
        name: 'Table basse verre',
        volume: 0.4,
        icon: '🪑',
        category: 'Salon',
        description: 'Table basse plateau verre - 110x60x40cm'
      },
      {
        id: 'side-table',
        name: 'Table d\'appoint',
        volume: 0.2,
        icon: '🪑',
        category: 'Salon',
        description: 'Table d\'appoint - 50x50x50cm'
      },
      {
        id: 'tv-stand',
        name: 'Meuble TV',
        volume: 0.8,
        icon: '📺',
        category: 'Salon',
        description: 'Meuble TV standard - 150x40x60cm'
      },
      {
        id: 'tv-wall-unit',
        name: 'Ensemble mural TV',
        volume: 2.4,
        icon: '📺',
        category: 'Salon',
        description: 'Ensemble mural TV complet - 250x40x180cm'
      },
      {
        id: 'bookshelf',
        name: 'Bibliothèque',
        volume: 1.6,
        icon: '📚',
        category: 'Salon',
        description: 'Bibliothèque 5 étagères - 80x30x180cm'
      },
      {
        id: 'display-cabinet',
        name: 'Vitrine',
        volume: 1.2,
        icon: '🗄️',
        category: 'Salon',
        description: 'Vitrine d\'exposition - 80x40x160cm'
      },
      {
        id: 'floor-lamp',
        name: 'Lampadaire',
        volume: 0.1,
        icon: '💡',
        category: 'Salon',
        description: 'Lampadaire sur pied - 40x40x160cm'
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
        volume: 1.8,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Lit simple avec cadre - 90x190x95cm'
      },
      {
        id: 'bed-140',
        name: 'Lit 140x190',
        volume: 2.8,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Lit double avec cadre - 140x190x95cm'
      },
      {
        id: 'bed-160',
        name: 'Lit 160x200',
        volume: 3.4,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Lit Queen avec cadre - 160x200x95cm'
      },
      {
        id: 'bed-180',
        name: 'Lit 180x200',
        volume: 3.8,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Lit King avec cadre - 180x200x95cm'
      },
      {
        id: 'bed-boxspring-160',
        name: 'Lit boxspring 160x200',
        volume: 4.2,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Lit boxspring Queen - 160x200x110cm'
      },
      {
        id: 'bed-boxspring-180',
        name: 'Lit boxspring 180x200',
        volume: 4.8,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Lit boxspring King - 180x200x110cm'
      },
      {
        id: 'mattress-90',
        name: 'Matelas 90x190',
        volume: 0.5,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Matelas simple - 90x190x20cm'
      },
      {
        id: 'mattress-140',
        name: 'Matelas 140x190',
        volume: 0.7,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Matelas double - 140x190x22cm'
      },
      {
        id: 'mattress-160',
        name: 'Matelas 160x200',
        volume: 0.9,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Matelas Queen - 160x200x25cm'
      },
      {
        id: 'mattress-180',
        name: 'Matelas 180x200',
        volume: 1.1,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Matelas King - 180x200x25cm'
      },
      {
        id: 'box-spring-160',
        name: 'Sommier 160x200',
        volume: 0.8,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Sommier tapissier Queen - 160x200x20cm'
      },
      {
        id: 'box-spring-180',
        name: 'Sommier 180x200',
        volume: 0.9,
        icon: '🛏️',
        category: 'Chambre',
        description: 'Sommier tapissier King - 180x200x20cm'
      },
      {
        id: 'wardrobe-2p',
        name: 'Armoire 2 portes',
        volume: 2.8,
        icon: '🚪',
        category: 'Chambre',
        description: 'Armoire 2 portes battantes - 120x60x200cm'
      },
      {
        id: 'wardrobe-3p',
        name: 'Armoire 3 portes',
        volume: 3.8,
        icon: '🚪',
        category: 'Chambre',
        description: 'Armoire 3 portes battantes - 150x60x200cm'
      },
      {
        id: 'wardrobe-4p',
        name: 'Armoire 4 portes',
        volume: 4.8,
        icon: '🚪',
        category: 'Chambre',
        description: 'Grande armoire 4 portes - 200x60x200cm'
      },
      {
        id: 'wardrobe-sliding',
        name: 'Armoire coulissante',
        volume: 3.2,
        icon: '🚪',
        category: 'Chambre',
        description: 'Armoire portes coulissantes - 180x60x200cm'
      },
      {
        id: 'wardrobe-angle',
        name: 'Armoire d\'angle',
        volume: 3.6,
        icon: '🚪',
        category: 'Chambre',
        description: 'Armoire d\'angle - 120x120x200cm'
      },
      {
        id: 'dresser',
        name: 'Commode',
        volume: 0.9,
        icon: '🗄️',
        category: 'Chambre',
        description: 'Commode 3-4 tiroirs - 100x50x80cm'
      },
      {
        id: 'dresser-large',
        name: 'Commode large',
        volume: 1.2,
        icon: '🗄️',
        category: 'Chambre',
        description: 'Grande commode 6 tiroirs - 120x50x90cm'
      },
      {
        id: 'nightstand',
        name: 'Table de chevet',
        volume: 0.3,
        icon: '🗄️',
        category: 'Chambre',
        description: 'Table de nuit 2 tiroirs - 50x40x60cm'
      },
      {
        id: 'chest-drawers',
        name: 'Chiffonnier',
        volume: 0.8,
        icon: '🗄️',
        category: 'Chambre',
        description: 'Chiffonnier 5 tiroirs - 60x40x120cm'
      },
      {
        id: 'dressing-table',
        name: 'Coiffeuse',
        volume: 0.6,
        icon: '🪞',
        category: 'Chambre',
        description: 'Coiffeuse avec miroir - 100x45x75cm'
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
        volume: 1.8,
        icon: '❄️',
        category: 'Cuisine',
        description: 'Réfrigérateur 1 porte - 60x65x180cm'
      },
      {
        id: 'fridge-2door',
        name: 'Réfrigérateur 2 portes',
        volume: 2.2,
        icon: '❄️',
        category: 'Cuisine',
        description: 'Réfrigérateur 2 portes - 60x65x185cm'
      },
      {
        id: 'fridge-american',
        name: 'Frigo américain',
        volume: 2.8,
        icon: '❄️',
        category: 'Cuisine',
        description: 'Réfrigérateur américain - 90x70x180cm'
      },
      {
        id: 'freezer',
        name: 'Congélateur',
        volume: 1.2,
        icon: '❄️',
        category: 'Cuisine',
        description: 'Congélateur armoire - 60x65x160cm'
      },
      {
        id: 'freezer-chest',
        name: 'Congélateur coffre',
        volume: 1.4,
        icon: '❄️',
        category: 'Cuisine',
        description: 'Congélateur coffre - 120x70x85cm'
      },
      {
        id: 'washing-machine',
        name: 'Lave-linge',
        volume: 1.0,
        icon: '🌊',
        category: 'Cuisine',
        description: 'Machine à laver frontale - 60x60x85cm'
      },
      {
        id: 'washing-machine-top',
        name: 'Lave-linge top',
        volume: 0.9,
        icon: '🌊',
        category: 'Cuisine',
        description: 'Machine à laver ouverture dessus - 45x60x90cm'
      },
      {
        id: 'dryer',
        name: 'Sèche-linge',
        volume: 1.0,
        icon: '🌀',
        category: 'Cuisine',
        description: 'Sèche-linge frontal - 60x60x85cm'
      },
      {
        id: 'washer-dryer',
        name: 'Lave-linge séchant',
        volume: 1.1,
        icon: '🌊',
        category: 'Cuisine',
        description: 'Lave-linge séchant - 60x60x85cm'
      },
      {
        id: 'dishwasher',
        name: 'Lave-vaisselle',
        volume: 0.8,
        icon: '🍽️',
        category: 'Cuisine',
        description: 'Lave-vaisselle encastrable - 60x60x82cm'
      },
      {
        id: 'oven',
        name: 'Four',
        volume: 0.4,
        icon: '🔥',
        category: 'Cuisine',
        description: 'Four encastrable - 60x55x60cm'
      },
      {
        id: 'oven-steam',
        name: 'Four vapeur',
        volume: 0.5,
        icon: '🔥',
        category: 'Cuisine',
        description: 'Four vapeur combiné - 60x55x60cm'
      },
      {
        id: 'microwave',
        name: 'Micro-ondes',
        volume: 0.15,
        icon: '📡',
        category: 'Cuisine',
        description: 'Micro-ondes posable - 50x40x30cm'
      },
      {
        id: 'microwave-built-in',
        name: 'Micro-ondes encastrable',
        volume: 0.2,
        icon: '📡',
        category: 'Cuisine',
        description: 'Micro-ondes encastrable - 60x55x40cm'
      },
      {
        id: 'cooktop',
        name: 'Plaque de cuisson',
        volume: 0.1,
        icon: '🔥',
        category: 'Cuisine',
        description: 'Plaque de cuisson - 60x52x5cm'
      },
      {
        id: 'range-hood',
        name: 'Hotte aspirante',
        volume: 0.3,
        icon: '💨',
        category: 'Cuisine',
        description: 'Hotte aspirante - 60x50x40cm'
      },
      {
        id: 'kitchen-cabinet-low',
        name: 'Meuble bas cuisine',
        volume: 0.7,
        icon: '🗄️',
        category: 'Cuisine',
        description: 'Meuble bas 2 portes - 80x60x85cm'
      },
      {
        id: 'kitchen-cabinet-high',
        name: 'Meuble haut cuisine',
        volume: 0.4,
        icon: '🗄️',
        category: 'Cuisine',
        description: 'Meuble haut 2 portes - 80x35x70cm'
      },
      {
        id: 'kitchen-island',
        name: 'Îlot central',
        volume: 2.4,
        icon: '🏝️',
        category: 'Cuisine',
        description: 'Îlot central cuisine - 120x80x90cm'
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
        volume: 1.2,
        icon: '🪑',
        category: 'Salle à manger',
        description: 'Table ronde/carrée 4 pers - 120x120x75cm'
      },
      {
        id: 'dining-table-6p',
        name: 'Table 6 personnes',
        volume: 1.8,
        icon: '🪑',
        category: 'Salle à manger',
        description: 'Table rectangulaire 6 pers - 160x90x75cm'
      },
      {
        id: 'dining-table-8p',
        name: 'Table 8 personnes',
        volume: 2.4,
        icon: '🪑',
        category: 'Salle à manger',
        description: 'Grande table 8 pers - 200x100x75cm'
      },
      {
        id: 'dining-table-10p',
        name: 'Table 10 personnes',
        volume: 3.0,
        icon: '🪑',
        category: 'Salle à manger',
        description: 'Table de réception 10 pers - 240x100x75cm'
      },
      {
        id: 'dining-table-extendable',
        name: 'Table extensible',
        volume: 2.2,
        icon: '🪑',
        category: 'Salle à manger',
        description: 'Table extensible 6-10 pers - 180x90x75cm'
      },
      {
        id: 'dining-chair',
        name: 'Chaise',
        volume: 0.2,
        icon: '🪑',
        category: 'Salle à manger',
        description: 'Chaise salle à manger - 45x45x90cm'
      },
      {
        id: 'dining-chair-arm',
        name: 'Chaise avec accoudoirs',
        volume: 0.3,
        icon: '🪑',
        category: 'Salle à manger',
        description: 'Chaise avec accoudoirs - 60x50x90cm'
      },
      {
        id: 'bench',
        name: 'Banc',
        volume: 0.4,
        icon: '🪑',
        category: 'Salle à manger',
        description: 'Banc 2-3 places - 120x35x45cm'
      },
      {
        id: 'buffet',
        name: 'Buffet',
        volume: 1.6,
        icon: '🗄️',
        category: 'Salle à manger',
        description: 'Buffet/bahut 3 portes - 160x50x90cm'
      },
      {
        id: 'sideboard',
        name: 'Enfilade',
        volume: 2.0,
        icon: '🗄️',
        category: 'Salle à manger',
        description: 'Enfilade 4 portes - 200x45x85cm'
      },
      {
        id: 'china-cabinet',
        name: 'Vaisselier',
        volume: 2.4,
        icon: '🍽️',
        category: 'Salle à manger',
        description: 'Vaisselier vitré 2 corps - 120x45x200cm'
      },
      {
        id: 'bar-cart',
        name: 'Desserte',
        volume: 0.3,
        icon: '🍽️',
        category: 'Salle à manger',
        description: 'Desserte roulante - 80x40x80cm'
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
        volume: 1.0,
        icon: '🖥️',
        category: 'Bureau',
        description: 'Bureau standard 3 tiroirs - 140x70x75cm'
      },
      {
        id: 'desk-large',
        name: 'Grand bureau',
        volume: 1.4,
        icon: '🖥️',
        category: 'Bureau',
        description: 'Grand bureau direction - 180x80x75cm'
      },
      {
        id: 'desk-corner',
        name: 'Bureau d\'angle',
        volume: 1.6,
        icon: '🖥️',
        category: 'Bureau',
        description: 'Bureau d\'angle - 140x140x75cm'
      },
      {
        id: 'desk-standing',
        name: 'Bureau assis-debout',
        volume: 1.2,
        icon: '🖥️',
        category: 'Bureau',
        description: 'Bureau électrique réglable - 160x80x75cm'
      },
      {
        id: 'office-chair',
        name: 'Chaise de bureau',
        volume: 0.5,
        icon: '🪑',
        category: 'Bureau',
        description: 'Siège de bureau ergonomique - 60x60x120cm'
      },
      {
        id: 'executive-chair',
        name: 'Fauteuil direction',
        volume: 0.8,
        icon: '🪑',
        category: 'Bureau',
        description: 'Fauteuil direction cuir - 70x70x130cm'
      },
      {
        id: 'filing-cabinet-2',
        name: 'Classeur 2 tiroirs',
        volume: 0.4,
        icon: '🗃️',
        category: 'Bureau',
        description: 'Caisson 2 tiroirs - 60x40x70cm'
      },
      {
        id: 'filing-cabinet-4',
        name: 'Classeur 4 tiroirs',
        volume: 0.6,
        icon: '🗃️',
        category: 'Bureau',
        description: 'Classeur 4 tiroirs - 40x60x132cm'
      },
      {
        id: 'bookshelf-office',
        name: 'Étagère bureau',
        volume: 0.8,
        icon: '📚',
        category: 'Bureau',
        description: 'Étagère 4 niveaux - 80x30x160cm'
      },
      {
        id: 'bookshelf-tall',
        name: 'Bibliothèque haute',
        volume: 1.4,
        icon: '📚',
        category: 'Bureau',
        description: 'Bibliothèque 6 étagères - 80x35x200cm'
      },
      {
        id: 'printer',
        name: 'Imprimante',
        volume: 0.08,
        icon: '🖨️',
        category: 'Bureau',
        description: 'Imprimante multifonction - 40x35x25cm'
      },
      {
        id: 'safe',
        name: 'Coffre-fort',
        volume: 0.12,
        icon: '🔒',
        category: 'Bureau',
        description: 'Coffre-fort bureau - 40x35x30cm'
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
        volume: 0.035,
        icon: '📦',
        category: 'Divers',
        description: 'Cartons livres - 35x27x30cm'
      },
      {
        id: 'boxes-medium',
        name: 'Cartons moyens (standard)',
        volume: 0.065,
        icon: '📦',
        category: 'Divers',
        description: 'Cartons standard - 55x35x30cm'
      },
      {
        id: 'boxes-large',
        name: 'Cartons grands (vêtements)',
        volume: 0.12,
        icon: '📦',
        category: 'Divers',
        description: 'Cartons vêtements - 60x40x50cm'
      },
      {
        id: 'wardrobe-box',
        name: 'Carton penderie',
        volume: 0.35,
        icon: '👔',
        category: 'Divers',
        description: 'Carton penderie avec barre - 60x50x120cm'
      },
      {
        id: 'moving-box-xl',
        name: 'Carton déménagement XL',
        volume: 0.2,
        icon: '📦',
        category: 'Divers',
        description: 'Grand carton déménagement - 70x50x50cm'
      },
      {
        id: 'vacuum',
        name: 'Aspirateur',
        volume: 0.18,
        icon: '🧹',
        category: 'Divers',
        description: 'Aspirateur traîneau - 40x30x25cm'
      },
      {
        id: 'vacuum-robot',
        name: 'Aspirateur robot',
        volume: 0.02,
        icon: '🤖',
        category: 'Divers',
        description: 'Aspirateur robot - 35x35x10cm'
      },
      {
        id: 'iron',
        name: 'Fer à repasser',
        volume: 0.02,
        icon: '👔',
        category: 'Divers',
        description: 'Fer à repasser - 30x15x15cm'
      },
      {
        id: 'ironing-board',
        name: 'Table à repasser',
        volume: 0.15,
        icon: '👔',
        category: 'Divers',
        description: 'Table à repasser pliante - 140x40x25cm'
      },
      {
        id: 'fan',
        name: 'Ventilateur',
        volume: 0.08,
        icon: '💨',
        category: 'Divers',
        description: 'Ventilateur sur pied - 40x40x130cm'
      },
      {
        id: 'heater',
        name: 'Radiateur électrique',
        volume: 0.12,
        icon: '🔥',
        category: 'Divers',
        description: 'Radiateur mobile - 60x25x65cm'
      },
      {
        id: 'mirror',
        name: 'Miroir',
        volume: 0.15,
        icon: '🪞',
        category: 'Divers',
        description: 'Grand miroir mural - 80x120x5cm'
      },
      {
        id: 'mirror-small',
        name: 'Petit miroir',
        volume: 0.05,
        icon: '🪞',
        category: 'Divers',
        description: 'Miroir décoratif - 50x70x3cm'
      },
      {
        id: 'painting',
        name: 'Tableau',
        volume: 0.08,
        icon: '🖼️',
        category: 'Divers',
        description: 'Tableau encadré - 70x100x5cm'
      },
      {
        id: 'plants',
        name: 'Plantes',
        volume: 0.1,
        icon: '🪴',
        category: 'Divers',
        description: 'Plante verte moyenne - 40x40x60cm'
      },
      {
        id: 'plants-large',
        name: 'Grande plante',
        volume: 0.25,
        icon: '🪴',
        category: 'Divers',
        description: 'Grande plante d\'intérieur - 60x60x150cm'
      },
      {
        id: 'bike',
        name: 'Vélo',
        volume: 1.0,
        icon: '🚲',
        category: 'Divers',
        description: 'Vélo adulte standard - 180x60x100cm'
      },
      {
        id: 'exercise-bike',
        name: 'Vélo d\'appartement',
        volume: 1.2,
        icon: '🚲',
        category: 'Divers',
        description: 'Vélo d\'appartement - 120x60x130cm'
      },
      {
        id: 'treadmill',
        name: 'Tapis de course',
        volume: 2.0,
        icon: '🏃',
        category: 'Divers',
        description: 'Tapis de course - 180x80x140cm'
      },
      {
        id: 'piano',
        name: 'Piano droit',
        volume: 1.8,
        icon: '🎹',
        category: 'Divers',
        description: 'Piano droit acoustique - 150x60x120cm'
      },
      {
        id: 'piano-digital',
        name: 'Piano numérique',
        volume: 0.6,
        icon: '🎹',
        category: 'Divers',
        description: 'Piano numérique avec meuble - 140x40x85cm'
      },
      {
        id: 'suitcase',
        name: 'Valise',
        volume: 0.1,
        icon: '🧳',
        category: 'Divers',
        description: 'Valise moyenne rigide - 65x45x25cm'
      },
      {
        id: 'suitcase-large',
        name: 'Grande valise',
        volume: 0.15,
        icon: '🧳',
        category: 'Divers',
        description: 'Grande valise - 75x50x30cm'
      },
      {
        id: 'trunk',
        name: 'Malle',
        volume: 0.4,
        icon: '📦',
        category: 'Divers',
        description: 'Malle de rangement - 100x50x40cm'
      },
      {
        id: 'tv-32',
        name: 'TV 32 pouces',
        volume: 0.18,
        icon: '📺',
        category: 'Divers',
        description: 'Télévision 32" avec emballage - 75x50x15cm'
      },
      {
        id: 'tv-43',
        name: 'TV 43 pouces',
        volume: 0.25,
        icon: '📺',
        category: 'Divers',
        description: 'Télévision 43" avec emballage - 95x60x15cm'
      },
      {
        id: 'tv-55',
        name: 'TV 55 pouces',
        volume: 0.35,
        icon: '📺',
        category: 'Divers',
        description: 'Télévision 55" avec emballage - 125x75x15cm'
      },
      {
        id: 'tv-65',
        name: 'TV 65 pouces',
        volume: 0.5,
        icon: '📺',
        category: 'Divers',
        description: 'Télévision 65" avec emballage - 145x85x15cm'
      },
      {
        id: 'sound-system',
        name: 'Chaîne Hi-Fi',
        volume: 0.3,
        icon: '🔊',
        category: 'Divers',
        description: 'Chaîne stéréo complète - 80x40x60cm'
      },
      {
        id: 'speakers',
        name: 'Enceintes',
        volume: 0.15,
        icon: '🔊',
        category: 'Divers',
        description: 'Paire d\'enceintes colonnes - 30x30x100cm'
      }
    ]
  }
];
