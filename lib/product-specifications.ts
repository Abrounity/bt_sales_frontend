import {
  Battery,
  Camera,
  Cpu,
  Gauge,
  HardDrive,
  Monitor,
  ShieldCheck,
  Smartphone,
  Volume2,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export function getSpecificationIcon(label: string): LucideIcon {
  const normalizedLabel = label.toLowerCase();

  if (normalizedLabel.includes('processor') || normalizedLabel.includes('chip')) return Cpu;
  if (normalizedLabel.includes('display') || normalizedLabel.includes('screen')) return Monitor;
  if (normalizedLabel.includes('battery')) return Battery;
  if (normalizedLabel.includes('audio') || normalizedLabel.includes('speaker')) return Volume2;
  if (normalizedLabel.includes('camera')) return Camera;
  if (normalizedLabel.includes('storage') || normalizedLabel.includes('capacity')) return HardDrive;
  if (normalizedLabel.includes('connectivity') || normalizedLabel.includes('connection')) return Wifi;
  if (normalizedLabel.includes('spin') || normalizedLabel.includes('speed') || normalizedLabel.includes('refresh')) return Gauge;
  if (normalizedLabel.includes('energy') || normalizedLabel.includes('charging')) return Zap;
  if (normalizedLabel.includes('warranty')) return ShieldCheck;

  return Smartphone;
}
