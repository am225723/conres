import React from 'react';
import { X, Send, MessageSquare } from 'lucide-react';

const IStatementModal = ({ isOpen, onClose, originalMessage, iStatement, onSendOriginal, onSendIStatement, isLoading, tone, toneColor }) => {
  if (!isOpen) return null;

  const displayTone = tone ? tone.charAt(0).toUpperCase() + tone.slice(1) : 'Calm';
  const displayColor = toneColor && toneColor !== '#FFFFFF' ? toneColor : '#AEC6CF';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-border/20 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div>
            <h3 className="text-xl font-bold text-foreground">Choose How to Send</h3>
            <p className="text-sm text-muted-foreground mt-1">Send your original message or the AI-suggested I-Statement</p>
          </div>
          <div className="flex items-center gap-3">
            <div 
              className="px-4 py-2 rounded-lg font-bold text-white shadow-lg"
              style={{ 
                backgroundColor: displayColor,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              {displayTone}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted/50 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-foreground/70" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Original Message */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              <h4 className="font-semibold text-foreground">Your Original Message</h4>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-xl">
              <p className="text-foreground whitespace-pre-wrap">{originalMessage}</p>
            </div>
            <button
              onClick={onSendOriginal}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              Send Original
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-card text-muted-foreground font-medium">OR</span>
            </div>
          </div>

          {/* I-Statement Version */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="font-semibold text-foreground">AI-Suggested I-Statement</h4>
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
                Recommended
              </span>
            </div>
            {isLoading ? (
              <div className="p-8 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <p className="text-sm text-muted-foreground">Generating I-Statement...</p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <p className="text-foreground whitespace-pre-wrap">{iStatement}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
                  <p className="font-medium mb-1">💡 Why use an I-Statement?</p>
                  <p>I-Statements help express feelings without blame, making it easier for your partner to hear and understand you.</p>
                </div>
                <button
                  onClick={onSendIStatement}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Send I-Statement
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IStatementModal;
