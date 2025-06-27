
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Package } from 'lucide-react';
import { TruckModel, FurnitureItem, PlacedItem } from '../types';

interface Scene3DProps {
  truck: TruckModel | null;
  furniture: FurnitureItem[];
  placedItems: PlacedItem[];
  onItemPlace: (item: PlacedItem) => void;
  onItemRemove: (id: string) => void;
}

const TruckBox = ({ truck }: { truck: TruckModel }) => {
  const { length, width, height } = truck.dimensions;
  
  return (
    <group>
      {/* Truck outline - transparent */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[length, height, width]} />
        <meshBasicMaterial color={truck.color} transparent opacity={0.2} />
      </mesh>
      
      {/* Truck wireframe */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[length, height, width]} />
        <meshBasicMaterial color={truck.color} wireframe />
      </mesh>
      
      {/* Floor */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[length, 0.05, width]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
    </group>
  );
};

const FurnitureBox = ({ furniture, position, rotation }: { 
  furniture: FurnitureItem; 
  position: [number, number, number];
  rotation: [number, number, number];
}) => {
  const { length, width, height } = furniture.dimensions;
  
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={[length, height, width]} />
        <meshStandardMaterial color={furniture.color} />
      </mesh>
      {/* Text label positioned above the furniture */}
      <mesh position={[0, height / 2 + 0.2, 0]}>
        <planeGeometry args={[0.8, 0.2]} />
        <meshBasicMaterial color="white" transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

const Scene3D = ({ truck, furniture, placedItems, onItemPlace, onItemRemove }: Scene3DProps) => {
  if (!truck) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Sélectionnez un camion pour commencer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Canvas 
        camera={{ position: [5, 5, 5], fov: 50 }}
        style={{ background: '#f5f5f5' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        
        <TruckBox truck={truck} />
        
        {placedItems.map((placedItem) => {
          const furnitureItem = furniture.find(f => f.id === placedItem.furnitureId);
          if (!furnitureItem) return null;
          
          return (
            <FurnitureBox
              key={placedItem.id}
              furniture={furnitureItem}
              position={[placedItem.position.x, placedItem.position.y, placedItem.position.z]}
              rotation={[placedItem.rotation.x, placedItem.rotation.y, placedItem.rotation.z]}
            />
          );
        })}
        
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        
        {/* Grid helper */}
        <gridHelper args={[10, 10]} />
      </Canvas>
    </div>
  );
};

export default Scene3D;
