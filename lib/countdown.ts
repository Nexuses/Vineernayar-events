export type CountdownUnit = {
  label: string;
  value: number;
};

export type CountdownState =
  | { status: "upcoming"; units: CountdownUnit[] }
  | { status: "live" }
  | { status: "ended" };

export function getCountdownState(
  startMs: number,
  endMs: number,
  now = Date.now()
): CountdownState {
  if (now >= endMs) return { status: "ended" };
  if (now >= startMs) return { status: "live" };

  const diff = Math.max(0, startMs - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return {
    status: "upcoming",
    units: [
      { label: "Days", value: days },
      { label: "Hours", value: hours },
      { label: "Mins", value: minutes },
      { label: "Secs", value: seconds },
    ],
  };
}
