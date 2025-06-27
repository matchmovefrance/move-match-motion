
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Text } from '@react-three/drei';
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
      {/* Truck outline */}
      <Box args={[length, height, width]} position={[0, height / 2, 0]}>
        <meshBasicMaterial color={truck.color} transparent opacity={0.2} />
      </Box>
      
      {/* Truck wireframe */}
      <Box args={[length, height, width]} position={[0, height / 2, 0]}>
        <meshBasicMaterial color={truck.color} wireframe />
      </Box>
      
      {/* Floor */}
      <Box args={[length, 0.05, width]} position={[0, 0.025, 0]}>
        <meshStandardMaterial color="#666666" />
      </Box>
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
      <Box args={[length, height, width]}>
        <meshStandardMaterial color={furniture.color} />
      </Box>
      <Text
        position={[0, height / 2 + 0.1, 0]}
        fontSize={0.1}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {furniture.name}
      </Text>
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
    <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
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
      
      <OrbitControls />
      <gridHelper args={[10, 10]} />
    </Canvas>
  );
};

export default Scene3D;
