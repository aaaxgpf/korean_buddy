const fs = require('fs');
let code = fs.readFileSync('src/components/SpeakingView.tsx', 'utf-8');

// The file has some syntax errors at the bottom.
// We will just find the `return (` block and replace the whole thing with a properly formatted JSX block.

const newReturn = `
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Top Navigation / Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-serif text-[#1A1A1A]">Speaking Practice</h2>
      </div>

      {currentTask && (
        <div className="space-y-8">
          {/* Target Model Korean Sentence */}
          <div className="p-8 bg-[#FAF9F6] rounded-2xl border border-[#E0DED7] text-center space-y-4 font-serif">
            <span className="text-xs uppercase font-bold text-[#B5A69A] tracking-wider">
              Target Sentence
            </span>
            <div className="flex items-center justify-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-serif-kr font-bold text-[#1A1A1A] tracking-tight">
                {currentTask.target_korean}
              </h2>
            </div>
            <p className="text-xs text-[#8B7E74] font-mono">
              [{currentTask.romanization}]
            </p>
            <div className="pt-3 border-t border-[#E0DED7] text-xs text-[#71675E] space-y-1.5">
              <p>
                <strong className="text-[#2D2D2D]">ZH:</strong> {currentTask.translation_zh}
              </p>
              {(languageMode === 'bilingual' || languageMode === 'en') && (
                <p className="text-[#71675E]">
                  <strong>EN:</strong> {currentTask.translation_en}
                </p>
              )}
              <p className="text-[#8B7E74] pt-1">
                <strong>💡 Grammar Focus:</strong> {currentTask.key_grammar}
              </p>
            </div>
            <button
              onClick={handlePlayModelAudio}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#F5F2ED] text-[#2D2D2D] border border-[#E0DED7] text-xs font-serif font-medium transition-all inline-flex items-center gap-2 shadow-sm"
            >
              <Volume2 className="w-4 h-4 text-[#8B7E74]" />
              <span>Listen to Model</span>
            </button>
          </div>

          {/* Interactive Speech Recording Stage */}
          <div className="py-8 bg-[#FAF9F6] rounded-2xl border border-[#E0DED7] flex flex-col items-center justify-center gap-4 text-center p-6 font-serif">
            <button
              onClick={toggleRecording}
              className={\`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-sm \${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse ring-8 ring-red-200 scale-105'
                  : 'bg-[#2D2D2D] hover:bg-[#1A1A1A] text-white hover:scale-105 active:scale-95'
              }\`}
            >
              {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <div>
              <p className="text-sm font-bold text-[#1A1A1A]">
                {isRecording ? 'Listening...' : 'Tap to Record'}
              </p>
            </div>
            {transcript && (
              <div className="w-full max-w-lg p-4 rounded-xl bg-white border border-[#E0DED7] text-xs text-[#2D2D2D] font-serif text-left space-y-1.5">
                <span className="text-[10px] text-[#B5A69A] uppercase font-bold block tracking-wider">
                  Your Spoken Transcript:
                </span>
                <p className="text-base font-bold font-serif-kr text-[#1A1A1A]">{transcript}</p>
              </div>
            )}
            {transcript && !evaluation && (
              <button
                onClick={handleEvaluate}
                disabled={isEvaluating}
                className="px-6 py-2.5 rounded-xl bg-[#2D2D2D] hover:bg-[#1A1A1A] text-white text-xs font-serif font-medium shadow-sm transition-all flex items-center gap-2"
              >
                {isEvaluating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Get AI Feedback</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Evaluation Results Card */}
          {evaluation && (
            <div className="p-6 bg-[#FAF9F6] rounded-2xl border border-[#E0DED7] space-y-5 font-serif animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#E0DED7] pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#2D2D2D] flex items-center justify-center text-white font-serif font-bold text-2xl shadow-sm">
                    {evaluation.score}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1A1A1A] text-base">
                      {evaluation.score >= 90
                        ? 'Excellent! 🌟'
                        : evaluation.score >= 75
                        ? 'Good Job! 👏'
                        : 'Keep Practicing! 💪'}
                    </h4>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 rounded-xl bg-white border border-[#E0DED7]">
                  <span className="text-[#71675E] block mb-1">Accuracy</span>
                  <span className="font-bold text-base text-[#2D2D2D]">{evaluation.accuracy_score}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E0DED7]">
                  <span className="text-[#71675E] block mb-1">Fluency</span>
                  <span className="font-bold text-base text-[#2D2D2D]">{evaluation.fluency_score}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#E0DED7]">
                  <span className="text-[#71675E] block mb-1">Intonation</span>
                  <span className="font-bold text-base text-[#2D2D2D]">{evaluation.intonation_score}</span>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-[#E0DED7] text-xs space-y-1.5">
                <p className="text-[#2D2D2D] font-medium">
                  <strong className="text-[#8B7E74]">Feedback:</strong> {evaluation.feedback_zh}
                </p>
                {(languageMode === 'bilingual' || languageMode === 'en') && (
                  <p className="text-[#71675E]">{evaluation.feedback_en}</p>
                )}
              </div>
              {evaluation.companion_comment && (
                <div className="p-4 bg-white rounded-xl border border-[#E0DED7] text-xs flex items-start gap-3.5">
                  <span className="text-2xl">{companion.avatar}</span>
                  <div>
                    <span className="font-bold text-[#2D2D2D] block mb-1">
                      {companion.name_zh}:
                    </span>
                    <p className="text-[#71675E] italic leading-relaxed">
                      "{evaluation.companion_comment}"
                    </p>
                  </div>
                </div>
              )}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedTaskIndex((prev) => (prev + 1) % speakingTasks.length);
                    setTranscript('');
                    setEvaluation(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-[#2D2D2D] hover:bg-[#1A1A1A] text-white text-xs font-serif font-medium flex items-center gap-2 shadow-sm"
                >
                  <span>Next Practice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
`
const match = code.match(/return \([\s\S]*?\);\n\};/m);
if (match) {
  fs.writeFileSync('src/components/SpeakingView.tsx', code.replace(match[0], newReturn), 'utf-8');
} else {
  // If we can't find 'return (', we might just find the first 'return' or replace from 'return (' to the end
  const idx = code.indexOf('return (');
  if (idx !== -1) {
    fs.writeFileSync('src/components/SpeakingView.tsx', code.slice(0, idx) + newReturn, 'utf-8');
  }
}
