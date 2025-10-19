import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getEmotionColor } from '../lib/emotionAnalysis';

const EmotionGauge = ({ sessionId, userId }) => {
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [averageIntensity, setAverageIntensity] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmotionData();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`emotion-gauge-${sessionId}-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_emotions',
        },
        (payload) => {
          updateEmotionData(payload.new);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, userId]);

  const loadEmotionData = async () => {
    try {
      // Get latest emotion
      const { data: latestEmotion, error: emotionError } = await supabase
        .from('message_emotions')
        .select(`
          *,
          messages!inner(session_id, user_id)
        `)
        .eq('messages.session_id', sessionId)
        .eq('messages.user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!emotionError && latestEmotion) {
        setCurrentEmotion(latestEmotion);
      }

      // Get average intensity
      const { data: stats, error: statsError } = await supabase
        .from('emotion_statistics')
        .select('average_intensity')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single();

      if (!statsError && stats) {
        setAverageIntensity(stats.average_intensity || 0);
      }
    } catch (error) {
      console.error('Error loading emotion data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmotionData = (newEmotion) => {
    setCurrentEmotion(newEmotion);
    loadEmotionData(); // Refresh stats
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!currentEmotion) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No emotion data available yet.
      </div>
    );
  }

  const emotion = currentEmotion.primary_emotion;
  const intensity = currentEmotion.emotion_intensity;
  const color = getEmotionColor(emotion, intensity);
  const percentage = (intensity / 10) * 100;

  return (
    <div className="emotion-gauge p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-6 gradient-text">Emotional Temperature</h3>
      
      <div className="flex flex-col items-center">
        {/* Circular Gauge */}
        <div className="relative w-48 h-48 mb-6">
          <svg className="transform -rotate-90 w-48 h-48">
            {/* Background Circle */}
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="hsl(var(--muted))"
              strokeWidth="16"
              fill="none"
            />
            {/* Progress Circle */}
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke={color}
              strokeWidth="16"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 80}`}
              strokeDashoffset={`${2 * Math.PI * 80 * (1 - percentage / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div 
              className="text-5xl font-bold mb-1"
              style={{ color }}
            >
              {intensity}
            </div>
            <div className="text-sm text-muted-foreground">out of 10</div>
          </div>
        </div>

        {/* Emotion Label */}
        <div className="text-center mb-4">
          <div 
            className="text-2xl font-bold capitalize mb-2"
            style={{ color }}
          >
            {emotion}
          </div>
          <div className="text-sm text-muted-foreground">
            Current Emotion
          </div>
        </div>

        {/* Average Intensity */}
        <div className="w-full bg-muted rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Average Intensity</span>
            <span className="text-sm font-bold">{averageIntensity.toFixed(1)}/10</span>
          </div>
          <div className="w-full bg-background rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-500"
              style={{ 
                width: `${(averageIntensity / 10) * 100}%`,
                backgroundColor: color
              }}
            />
          </div>
        </div>

        {/* Sentiment Score */}
        {currentEmotion.sentiment_score !== null && (
          <div className="w-full bg-muted rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Sentiment</span>
              <span className={`text-sm font-bold ${
                currentEmotion.sentiment_score > 0 ? 'text-green-600' : 
                currentEmotion.sentiment_score < 0 ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {(currentEmotion.sentiment_score * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-background rounded-full h-2 relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-foreground/20"></div>
              <div 
                className="h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.abs(currentEmotion.sentiment_score) * 50}%`,
                  marginLeft: currentEmotion.sentiment_score < 0 ? `${50 + currentEmotion.sentiment_score * 50}%` : '50%',
                  backgroundColor: currentEmotion.sentiment_score > 0 ? '#10b981' : '#ef4444'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionGauge;