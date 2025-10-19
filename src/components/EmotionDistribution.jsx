import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { EMOTIONS, getEmotionColor } from '../lib/emotionAnalysis';

const EmotionDistribution = ({ sessionId, userId }) => {
  const [distribution, setDistribution] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmotionDistribution();
  }, [sessionId, userId]);

  const loadEmotionDistribution = async () => {
    try {
      const { data, error } = await supabase
        .from('emotion_statistics')
        .select('emotion_distribution')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      if (data && data.emotion_distribution) {
        setDistribution(data.emotion_distribution);
      }
    } catch (error) {
      console.error('Error loading emotion distribution:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="spinner"></div>
      </div>
    );
  }

  const emotions = Object.entries(distribution);
  const total = emotions.reduce((sum, [_, count]) => sum + count, 0);

  if (total === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No emotion data available yet.
      </div>
    );
  }

  // Calculate percentages
  const emotionPercentages = emotions.map(([emotion, count]) => ({
    emotion,
    count,
    percentage: (count / total) * 100
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="emotion-distribution p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-6 gradient-text">Emotion Distribution</h3>
      
      {/* Pie Chart Representation */}
      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* SVG Pie Chart */}
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 200 200" className="transform -rotate-90">
            {(() => {
              let currentAngle = 0;
              return emotionPercentages.map(({ emotion, percentage }, index) => {
                const angle = (percentage / 100) * 360;
                const startAngle = currentAngle;
                const endAngle = currentAngle + angle;
                currentAngle = endAngle;

                // Calculate path for pie slice
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                const x1 = 100 + 90 * Math.cos(startRad);
                const y1 = 100 + 90 * Math.sin(startRad);
                const x2 = 100 + 90 * Math.cos(endRad);
                const y2 = 100 + 90 * Math.sin(endRad);
                const largeArc = angle > 180 ? 1 : 0;

                return (
                  <path
                    key={emotion}
                    d={`M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={getEmotionColor(emotion, 7)}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                );
              });
            })()}
          </svg>
          
          {/* Center Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold">{total}</div>
            <div className="text-sm text-muted-foreground">Messages</div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {emotionPercentages.map(({ emotion, count, percentage }) => (
            <div key={emotion} className="flex items-center gap-3">
              <div 
                className="w-6 h-6 rounded-full flex-shrink-0"
                style={{ backgroundColor: getEmotionColor(emotion, 7) }}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium capitalize">{emotion}</span>
                  <span className="text-sm text-muted-foreground">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: getEmotionColor(emotion, 7)
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-muted rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">
            {emotionPercentages[0]?.emotion || 'N/A'}
          </div>
          <div className="text-sm text-muted-foreground">Most Common</div>
        </div>
        <div className="bg-muted rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-secondary">
            {emotionPercentages.length}
          </div>
          <div className="text-sm text-muted-foreground">Unique Emotions</div>
        </div>
        <div className="bg-muted rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-accent">
            {total}
          </div>
          <div className="text-sm text-muted-foreground">Total Messages</div>
        </div>
      </div>
    </div>
  );
};

export default EmotionDistribution;