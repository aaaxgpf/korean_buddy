const fs = require('fs');
let text = fs.readFileSync('src/components/CompanionChat.tsx', 'utf-8');

// Add MoreVertical import
if (!text.includes('MoreVertical')) {
    text = text.replace(
        "import { Send, Image as ImageIcon, Plus, Mic, Settings, Search, Check, Play, BookOpen, Star, RefreshCw, Paperclip, ChevronLeft, Volume2, Bookmark, Lightbulb, CheckCircle2, ListFilter, X, VolumeX, Sparkles, ExternalLink, Video } from 'lucide-react';",
        "import { Send, Image as ImageIcon, Plus, Mic, Settings, Search, Check, Play, BookOpen, Star, RefreshCw, Paperclip, ChevronLeft, Volume2, Bookmark, Lightbulb, CheckCircle2, ListFilter, X, VolumeX, Sparkles, ExternalLink, Video, MoreVertical } from 'lucide-react';"
    );
}

// Add state for chat mode
if (!text.includes("const [chatMode, setChatMode] = useState<'learning' | 'pure'>('learning');")) {
    text = text.replace(
        "const [showVoiceGuideModal, setShowVoiceGuideModal] = useState(false);",
        "const [showVoiceGuideModal, setShowVoiceGuideModal] = useState(false);\n  const [chatMode, setChatMode] = useState<'learning' | 'pure'>('learning');\n  const [longPressedMsgId, setLongPressedMsgId] = useState<string | null>(null);"
    );
}

// Long press logic
if (!text.includes("let pressTimer: NodeJS.Timeout;")) {
    text = text.replace(
        "const handleToggleSection = (msgId: string, section: string) => {",
        "let pressTimer: NodeJS.Timeout;\n  const handleTouchStart = (msgId: string) => {\n    pressTimer = setTimeout(() => {\n      setLongPressedMsgId(prev => prev === msgId ? null : msgId);\n    }, 500);\n  };\n  const handleTouchEnd = () => {\n    clearTimeout(pressTimer);\n  };\n\n  const handleToggleSection = (msgId: string, section: string) => {"
    );
}

fs.writeFileSync('src/components/CompanionChat.tsx', text, 'utf-8');
