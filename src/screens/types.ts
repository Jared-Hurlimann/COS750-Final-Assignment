import type { Progress } from '../progress';

export interface ScreenProps {
  go: (screen: number) => void;
  progress: Progress;
  update: (fn: (p: Progress) => Progress) => void;
  /**
   * While a message is set, leaving this screen (menu, pager, logo) first asks
   * the student to confirm, showing the message. Pass null to allow leaving.
   */
  setLeaveGuard?: (message: string | null) => void;
}
