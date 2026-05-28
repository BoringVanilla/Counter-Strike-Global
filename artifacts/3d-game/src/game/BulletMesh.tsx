import { Bullet } from "./types";

interface BulletMeshProps {
  bullet: Bullet;
}

export default function BulletMesh({ bullet }: BulletMeshProps) {
  const color = bullet.fromEnemy ? "#ff4400" : "#ffff00";
  return (
    <mesh position={bullet.position}>
      <sphereGeometry args={[0.06, 6, 6]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}
