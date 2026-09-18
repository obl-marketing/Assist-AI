import { AvailabilityState } from '@prisma/client';

export interface AvailabilityView {
  state: AvailabilityState;
  /** UI label: "Available now" / "Available in 12 min" / "Next at 4:30 PM" */
  label: string;
  /** for sorting / filtering the "Available now" module */
  liveNow: boolean;
}

export function availabilityView(
  state: AvailabilityState,
  nextAvailableAt: Date | null | undefined,
  now: Date = new Date(),
): AvailabilityView {
  switch (state) {
    case AvailabilityState.AVAILABLE:
      return { state, label: 'Available now', liveNow: true };
    case AvailabilityState.IN_SESSION:
    case AvailabilityState.BUSY: {
      if (nextAvailableAt) {
        const mins = Math.round((nextAvailableAt.getTime() - now.getTime()) / 60000);
        if (mins > 0 && mins <= 60) {
          return { state, label: `Available in ${mins} min`, liveNow: false };
        }
        return { state, label: `Next at ${formatTime(nextAvailableAt)}`, liveNow: false };
      }
      return { state, label: 'Busy', liveNow: false };
    }
    case AvailabilityState.AWAY:
      return {
        state,
        label: nextAvailableAt ? `Back at ${formatTime(nextAvailableAt)}` : 'Away',
        liveNow: false,
      };
    case AvailabilityState.OFFLINE:
    default:
      return {
        state,
        label: nextAvailableAt ? `Next at ${formatTime(nextAvailableAt)}` : 'Offline',
        liveNow: false,
      };
  }
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}
