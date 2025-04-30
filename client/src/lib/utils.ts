import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateInstallment(totalAmount: number, percentage: number) {
  return Math.floor(totalAmount * (percentage / 100));
}

export function getYouTubeEmbedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function extractYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return match && match[2].length === 11 ? match[2] : null;
}
