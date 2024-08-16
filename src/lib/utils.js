import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getScoreColor(score) {
  if (score < 3) return 'bg-red-500';
  if (score < 5) return 'bg-orange-500';
  if (score < 7) return 'bg-yellow-500';
  if (score < 9) return 'bg-lime-500';
  return 'bg-green-500';
}