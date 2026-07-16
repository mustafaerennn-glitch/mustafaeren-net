// UI dile göre süre formatlar — schema'da yalnızca dakika sayısı tutuluyor ("38 dk" gibi metin DEĞİL).
export function formatDuration(minutes: number, lang: string): string {
  if (lang === 'tr') {
    if (minutes < 60) return `${minutes} dk`;
    const saat = Math.floor(minutes / 60);
    const dk = minutes % 60;
    return dk > 0 ? `${saat} sa ${dk} dk` : `${saat} sa`;
  }
  // Basit varsayılan diğer diller için (Faz 4-5'te gerçek çeviri sürecinde gözden geçirilecek)
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}
