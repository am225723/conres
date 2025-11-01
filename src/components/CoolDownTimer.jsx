import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Clock, Heart } from 'lucide-react';

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

  return (
    <AlertDialog open={isActive}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Time for a Cool-Down Break
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
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
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <button
            onClick={onSendSpaceMessage}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-gray-700 text-foreground rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Send "I need space" message
          </button>
          <AlertDialogAction onClick={onDismiss} className="w-full sm:w-auto">
            Continue Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
