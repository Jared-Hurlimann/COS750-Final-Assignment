import type { Progress } from '../progress';

export interface ScreenProps {
  go: (screen: number) => void;
  progress: Progress;
  update: (fn: (p: Progress) => Progress) => void;
}
