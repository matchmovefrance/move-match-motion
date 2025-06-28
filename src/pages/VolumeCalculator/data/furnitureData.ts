
import { FurnitureCategory } from '../types';

export const furnitureCategories: FurnitureCategory[] = [
  {
    id: 'living-room',
    name: 'Salon',
    icon: '🛋️',
    items: [
      { id: 'sofa-3-seats', name: 'Canapé 3 places', volume: 1.5, icon: '🛋️', category: 'living-room', description: 'Canapé standard 3 places' },
      { id: 'sofa-2-seats', name: 'Canapé 2 places', volume: 1.0, icon: '🛋️', category: 'living-room', description: 'Canapé 2 places' },
      { id: 'armchair', name: 'Fauteuil', volume: 0.6, icon: '🪑', category: 'living-room', description: 'Fauteuil standard' },
      { id: 'coffee-table', name: 'Table basse', volume: 0.4, icon: '🪑', category: 'living-room', description: 'Table basse de salon' },
      { id: 'tv-stand', name: 'Meuble TV', volume: 0.8, icon: '📺', category: 'living-room', description: 'Meuble télévision' },
      { id: 'bookshelf', name: 'Bibliothèque', volume: 1.2, icon: '📚', category: 'living-room', description: 'Étagère à livres' },
    ]
  },
  {
    id: 'bedroom',
    name: 'Chambre',
    icon: '🛏️',
    items: [
      { id: 'double-bed', name: 'Lit double (140x190)', volume: 2.0, icon: '🛏️', category: 'bedroom', description: 'Lit double avec matelas' },
      { id: 'queen-bed', name: 'Lit queen (160x200)', volume: 2.5, icon: '🛏️', category: 'bedroom', description: 'Grand lit avec matelas' },
      { id: 'single-bed', name: 'Lit simple (90x190)', volume: 1.2, icon: '🛏️', category: 'bedroom', description: 'Lit simple avec matelas' },
      { id: 'wardrobe-2-doors', name: 'Armoire 2 portes', volume: 3.0, icon: '🗄️', category: 'bedroom', description: 'Armoire standard 2 portes' },
      { id: 'wardrobe-3-doors', name: 'Armoire 3 portes', volume: 4.5, icon: '🗄️', category: 'bedroom', description: 'Grande armoire 3 portes' },
      { id: 'dresser', name: 'Commode', volume: 1.0, icon: '🗄️', category: 'bedroom', description: 'Commode avec tiroirs' },
      { id: 'nightstand', name: 'Table de chevet', volume: 0.3, icon: '🪑', category: 'bedroom', description: 'Table de nuit' },
    ]
  },
  {
    id: 'kitchen',
    name: 'Cuisine',
    icon: '🍽️',
    items: [
      { id: 'fridge', name: 'Réfrigérateur', volume: 1.5, icon: '❄️', category: 'kitchen', description: 'Réfrigérateur standard' },
      { id: 'fridge-large', name: 'Réfrigérateur américain', volume: 2.2, icon: '❄️', category: 'kitchen', description: 'Grand réfrigérateur' },
      { id: 'washing-machine', name: 'Lave-linge', volume: 1.0, icon: '🌊', category: 'kitchen', description: 'Machine à laver' },
      { id: 'dishwasher', name: 'Lave-vaisselle', volume: 0.8, icon: '🍽️', category: 'kitchen', description: 'Lave-vaisselle standard' },
      { id: 'oven', name: 'Four', volume: 0.5, icon: '🔥', category: 'kitchen', description: 'Four électrique' },
      { id: 'microwave', name: 'Micro-ondes', volume: 0.2, icon: '📱', category: 'kitchen', description: 'Four micro-ondes' },
      { id: 'kitchen-table', name: 'Table de cuisine', volume: 0.8, icon: '🪑', category: 'kitchen', description: 'Table de cuisine 4 places' },
      { id: 'kitchen-chair', name: 'Chaise de cuisine', volume: 0.2, icon: '🪑', category: 'kitchen', description: 'Chaise de cuisine' },
    ]
  },
  {
    id: 'dining-room',
    name: 'Salle à manger',
    icon: '🍽️',
    items: [
      { id: 'dining-table-6', name: 'Table à manger 6 places', volume: 1.5, icon: '🪑', category: 'dining-room', description: 'Table rectangulaire 6 personnes' },
      { id: 'dining-table-4', name: 'Table à manger 4 places', volume: 1.0, icon: '🪑', category: 'dining-room', description: 'Table carrée/ronde 4 personnes' },
      { id: 'dining-chair', name: 'Chaise de salle à manger', volume: 0.3, icon: '🪑', category: 'dining-room', description: 'Chaise avec dossier' },
      { id: 'sideboard', name: 'Buffet/Bahut', volume: 2.0, icon: '🗄️', category: 'dining-room', description: 'Meuble de rangement' },
      { id: 'china-cabinet', name: 'Vaisselier', volume: 2.5, icon: '🗄️', category: 'dining-room', description: 'Meuble vitré pour vaisselle' },
    ]
  },
  {
    id: 'office',
    name: 'Bureau',
    icon: '💻',
    items: [
      { id: 'office-desk', name: 'Bureau', volume: 1.0, icon: '🪑', category: 'office', description: 'Bureau de travail' },
      { id: 'office-chair', name: 'Chaise de bureau', volume: 0.4, icon: '🪑', category: 'office', description: 'Fauteuil de bureau' },
      { id: 'filing-cabinet', name: 'Classeur', volume: 0.8, icon: '🗄️', category: 'office', description: 'Meuble classeur' },
      { id: 'bookcase', name: 'Étagère bureau', volume: 1.0, icon: '📚', category: 'office', description: 'Étagère de rangement' },
    ]
  },
  {
    id: 'storage',
    name: 'Rangement & Divers',
    icon: '📦',
    items: [
      { id: 'cardboard-box-small', name: 'Carton petit (30L)', volume: 0.03, icon: '📦', category: 'storage', description: 'Petit carton de déménagement' },
      { id: 'cardboard-box-medium', name: 'Carton moyen (60L)', volume: 0.06, icon: '📦', category: 'storage', description: 'Carton moyen' },
      { id: 'cardboard-box-large', name: 'Carton grand (100L)', volume: 0.10, icon: '📦', category: 'storage', description: 'Grand carton' },
      { id: 'plastic-box', name: 'Bac plastique', volume: 0.08, icon: '📦', category: 'storage', description: 'Bac de rangement plastique' },
      { id: 'vacuum-cleaner', name: 'Aspirateur', volume: 0.3, icon: '🌪️', category: 'storage', description: 'Aspirateur traîneau' },
      { id: 'ironing-board', name: 'Planche à repasser', volume: 0.2, icon: '👔', category: 'storage', description: 'Planche à repasser' },
      { id: 'bicycle', name: 'Vélo', volume: 0.8, icon: '🚲', category: 'storage', description: 'Vélo adulte' },
      { id: 'plants-large', name: 'Grande plante', volume: 0.4, icon: '🌱', category: 'storage', description: 'Plante en grand pot' },
      { id: 'plants-small', name: 'Petite plante', volume: 0.1, icon: '🌱', category: 'storage', description: 'Plante en petit pot' },
    ]
  }
];
