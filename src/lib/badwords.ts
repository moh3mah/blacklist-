export function filterProfanity(text: string): string {
  if (!text) return text;
  
  // List of restricted words (Arabic and English basics)
  const badWords = [
    'كلب', 'حمار', 'حيوان', 'غبي', 'زق', 'قحبة', 'شرموط', 'شرموطة', 'قحبه', 
    'كس', 'زب', 'نيك', 'منيوك', 'قذر', 'عاهرة', 'خول', 'عرص', 'وسخ',
    'fuck', 'shit', 'bitch', 'asshole', 'dick', 'pussy', 'whore', 'slut', 'cunt'
  ];

  let filtered = text;
  badWords.forEach(word => {
    // Escape regex characters just in case
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Using word boundaries might be tricky with Arabic, but let's try a simple global replace first
    // Since Arabic words can have prefixes, a simple string match replace might be safer.
    const regex = new RegExp(escapedWord, 'gi');
    filtered = filtered.replace(regex, '***');
  });

  return filtered;
}
