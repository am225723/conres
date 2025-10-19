import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { EMOTIONS, getEmotionColor } from '../lib/emotionAnalysis';

const EmotionTimeline = ({ sessionId, userId }) => {
  const [emotionData, setEmotionData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEmotionTimeline();
  }, [sessionId, userId]);

  const loadEmotionTimeline = async () => {
    try {
      const { data, error } = await supabase
        .from('emotion_timeline_view')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setEmotionData(data || []);
    } catch (error) {
      console.error('Error loading emotion timeline:', error);
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

  if (emotionData.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No emotion data available yet. Start chatting to see your emotional journey!
      </div>
    );
  }

  return (
    <div className="emotion-timeline p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-6 gradient-text">Emotion Timeline</h3>
      
      {/* Timeline Graph */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-accent"></div>
        
        {/* Timeline Items */}
        <div className="space-y-6">
          {emotionData.map((item, index) => (
            <div key={index} className="relative pl-16">
              {/* Emotion Indicator */}
              <div 
                className="absolute left-4 w-8 h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: item.emotion_color || getEmotionColor(item.primary_emotion, item.emotion_intensity) }}
              >
                {item.emotion_intensity}
              </div>
              
              {/* Content */}
              <div className="bg-card rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-lg capitalize">
                    {item.primary_emotion}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(item.created_at).toLocaleTimeString()}
                  </span>
                </div>
                
                <p className="text-foreground/80 mb-2">{item.message_text}</p>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Intensity: {item.emotion_intensity}/10
                  </span>
                  {item.sentiment_score !== null && (
                    <span className={`font-medium ${
                      item.sentiment_score > 0 ? 'text-green-600' : 
                      item.sentiment_score < 0 ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      Sentiment: {(item.sentiment_score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmotionTimeline;