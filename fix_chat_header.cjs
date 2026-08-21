const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

// Add Users import
if (!text.includes('Users')) {
    text = text.replace(
        "import { Send, Image as ImageIcon, Plus, Mic, Settings, Search, Check, Play, BookOpen, Star, RefreshCw, Paperclip, ChevronLeft, Volume2, Bookmark, Lightbulb, CheckCircle2, ListFilter, X, VolumeX, Sparkles, ExternalLink, Video, MoreVertical } from 'lucide-react';",
        "import { Send, Image as ImageIcon, Plus, Mic, Settings, Search, Check, Play, BookOpen, Star, RefreshCw, Paperclip, ChevronLeft, Volume2, Bookmark, Lightbulb, CheckCircle2, ListFilter, X, VolumeX, Sparkles, ExternalLink, Video, MoreVertical, Users, MessageSquare } from 'lucide-react';"
    );
}

// Remove onClick from avatar and name
text = text.replace(
    '<div onClick={onOpenProfile} className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">',
    '<div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-xl overflow-hidden">'
);
text = text.replace(
    '<div className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity" onClick={onOpenProfile}>',
    '<div className="flex flex-col">'
);

// Add pure mode toggle to header right
// And change 3-dots to onOpenProfile
const originalHeaderButtons = `<div className="flex items-center gap-2">
            <button
              onClick={() => setShowHeader(!showHeader)}
              className="p-2 rounded-full hover:bg-stone-100 text-stone-400 transition-colors"
              title="Switch Buddy"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
            </button>
          </div>`;

const newHeaderButtons = `<div className="flex items-center gap-1">
            <button
              onClick={() => setChatMode(chatMode === 'learning' ? 'pure' : 'learning')}
              className={\`p-2 rounded-full transition-colors flex items-center gap-1 \${chatMode === 'learning' ? 'text-amber-600 bg-amber-50' : 'text-stone-400 hover:bg-stone-100'}\`}
              title={chatMode === 'learning' ? "Learning Mode (Click to switch to Pure Chat)" : "Pure Chat Mode (Click to switch to Learning Mode)"}
            >
              {chatMode === 'learning' ? <BookOpen size={18} /> : <MessageSquare size={18} />}
            </button>
            <button
              onClick={() => setShowHeader(!showHeader)}
              className="p-2 rounded-full hover:bg-stone-100 text-stone-400 transition-colors"
              title="Switch Buddy"
            >
              <Users size={20} />
            </button>
            <button
              onClick={onOpenProfile}
              className="p-2 rounded-full hover:bg-stone-100 text-stone-400 transition-colors"
              title="AI Settings"
            >
              <MoreVertical size={20} />
            </button>
          </div>`;

text = text.replace(originalHeaderButtons, newHeaderButtons);

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
