const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const filesToUpdate = [
  path.join(root, 'src/app/book/[slug]/page.tsx'),
  path.join(root, 'src/components/booking/CustomerAiExploreServices.tsx'),
  path.join(root, 'src/components/booking/CustomerAiMyAppointments.tsx'),
  path.join(root, 'src/components/booking/CustomerAiReschedule.tsx'),
  path.join(root, 'src/components/booking/CustomerAiCancel.tsx'),
  path.join(root, 'src/components/booking/CustomerAiChat.tsx'),
  path.join(root, 'src/app/review/page.tsx'),
  path.join(root, 'src/app/review/[token]/page.tsx'),
  path.join(root, 'src/app/book/manage/[token]/page.tsx'),
  path.join(root, 'src/app/onboarding/page.tsx'),
];

filesToUpdate.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.warn('File not found:', filePath);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Surface and dark mode backgrounds
  content = content.replace(/bg-\[#F7F5F0\]/g, 'bg-[#FAF9F3]');
  content = content.replace(/dark:bg-\[#101A2B\]/g, 'dark:bg-[#10251D]');
  content = content.replace(/bg-\[#101A2B\]/g, 'bg-[#043D2E]');
  content = content.replace(/dark:text-\[#101A2B\]/g, 'dark:text-white');
  content = content.replace(/border-\[#101A2B\]/g, 'border-[#043D2E]');
  content = content.replace(/from-\[#101A2B\] to-\[#1E293B\]/g, 'from-[#043D2E] to-[#10251D]');

  // Amber / Gold buttons and accents -> Emerald Sovereign
  content = content.replace(/bg-\[#C49A46\] text-\[#0B1425\]/g, 'bg-[#046A38] text-white hover:bg-[#043D2E]');
  content = content.replace(/bg-\[#C49A46\] hover:brightness-105 text-\[#0B1425\]/g, 'bg-[#046A38] hover:bg-[#043D2E] text-white');
  content = content.replace(/bg-\[#C49A46\] hover:bg-\[#D9B66E\]/g, 'bg-[#046A38] hover:bg-[#043D2E]');
  content = content.replace(/hover:bg-\[#D9B66E\]/g, 'hover:bg-[#043D2E]');
  content = content.replace(/bg-\[#C49A46\]/g, 'bg-[#046A38]');
  content = content.replace(/#D9B66E/g, '#043D2E');
  content = content.replace(/fill-\[#C49A46\]/g, 'fill-[#046A38]');
  content = content.replace(/text-\[#C49A46\]/g, 'text-[#046A38]');
  content = content.replace(/border-\[#C49A46\]/g, 'border-[#046A38]');
  content = content.replace(/ring-\[#C49A46\]/g, 'ring-[#046A38]');
  content = content.replace(/focus:border-\[#C49A46\]/g, 'focus:border-[#046A38]');
  content = content.replace(/hover:border-\[#C49A46\]/g, 'hover:border-[#046A38]');
  content = content.replace(/hover:text-\[#C49A46\]/g, 'hover:text-[#046A38]');
  content = content.replace(/focus:ring-\[#C49A46\]/g, 'focus:ring-[#046A38]');

  // Replace old amber soft badges
  content = content.replace(/bg-amber-50\/50 dark:bg-amber-950\/20/g, 'bg-emerald-50/50 dark:bg-[#043D2E]/20');
  content = content.replace(/bg-amber-50\/60 dark:bg-amber-950\/30/g, 'bg-emerald-50/60 dark:bg-[#043D2E]/30');
  content = content.replace(/bg-amber-50 dark:bg-amber-950\/40/g, 'bg-emerald-50 dark:bg-[#043D2E]/40');
  content = content.replace(/bg-amber-50 dark:bg-slate-800/g, 'bg-emerald-50 dark:bg-[#043D2E]/40');
  content = content.replace(/text-amber-800 dark:text-amber-300/g, 'text-emerald-800 dark:text-emerald-300');

  // Active step button styles
  content = content.replace(/dark:bg-\[#C49A46\] dark:border-\[#C49A46\]/g, 'dark:bg-[#046A38] dark:border-[#046A38]');

  // Legacy navy / gold tokens
  content = content.replace(/dark:bg-navy-950/g, 'dark:bg-[#10251D]');
  content = content.replace(/dark:bg-navy-900/g, 'dark:bg-[#043D2E]');
  content = content.replace(/dark:bg-navy-800/g, 'dark:bg-[#043D2E]/80');
  content = content.replace(/dark:border-navy-700/g, 'dark:border-[#D8DED8]/20');
  content = content.replace(/dark:border-navy-800/g, 'dark:border-[#D8DED8]/20');
  content = content.replace(/text-gold-500/g, 'text-[#046A38]');
  content = content.replace(/text-gold-600/g, 'text-[#046A38]');
  content = content.replace(/text-gold-400/g, 'text-[#9EF6B6]');
  content = content.replace(/bg-gold-500/g, 'bg-[#046A38]');
  content = content.replace(/hover:bg-gold-600/g, 'hover:bg-[#043D2E]');
  content = content.replace(/border-gold-500/g, 'border-[#046A38]');
  content = content.replace(/ring-gold-500/g, 'ring-[#046A38]');
  content = content.replace(/focus:border-gold-500/g, 'focus:border-[#046A38]');
  content = content.replace(/focus:ring-gold-500/g, 'focus:ring-[#046A38]');
  content = content.replace(/bg-slate-50 dark:bg-\[#10251D\]/g, 'bg-[#FAF9F3] dark:bg-[#10251D]');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated:', filePath);
});
