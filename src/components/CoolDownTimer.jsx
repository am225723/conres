import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Heart, X } from 'lucide-react';

export const CoolDownTimer = ({ isActive, onDismiss, onSendSpaceMessage, duration = 300 }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, duration]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            <h3 className="text-lg font-semibold">Time for a Cool-Down Break</h3>
          </div>
          <button onClick={onDismiss} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We've detected that the conversation tone has become quite tense. 
            Taking a short break can help both of you reset and communicate more effectively.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-blue-700 dark:text-blue-300">Suggested Break Time</span>
            </div>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 text-center my-4">
              {formatTime(timeLeft)}
            </div>
          </div>

            <div className="space-y-2">
            <p className="font-medium">During this time, try:</p>
            <ul className="text-sm space-y-1 ml-4">
              <li>• Take 5 deep breaths (inhale for 4, hold for 7, exhale for 8)</li>
              <li>• Go for a short walk</li>
              <li>• Drink some water</li>
              <li>• Think about what you appreciate about your partner</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={onSendSpaceMessage}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-gray-700 text-foreground rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Send "I need space" message
          </button>
          <Button onClick={onDismiss} className="w-full sm:w-auto">
            Continue Anyway
          </Button>
        </div>
      </Card>
    </div>
  );
};
