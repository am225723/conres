import React, { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Heart, Clock } from 'lucide-react';
import { 
  calculateHealthScore, 
  getToneDistribution, 
  getConflictPatterns, 
  getTimeBasedInsights,
  getWeeklyProgress 
} from '@/lib/analyticsHelper';
import { getMessageHistory, supabase } from '@/lib/supabase';

export const ConversationDashboard = ({ messages: propMessages }) => {
  const [messages, setMessages] = useState(propMessages || []);
  const [isLoading, setIsLoading] = useState(!propMessages);

  useEffect(() => {
    const fetchAllMessages = async () => {
      try {
        // Fetch recent messages (limited for security and performance)
        // In production, scope this to the authenticated user's sessions
        const { data, error } = await supabase
          .from('conres_messages')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100); // Limit to recent 100 messages for performance

        if (!error && data) {
          setMessages(data.reverse()); // Reverse to chronological order
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        // RLS policies will prevent unauthorized access
      } finally {
        setIsLoading(false);
      }
    };

    if (!propMessages || propMessages.length === 0) {
      fetchAllMessages();
    }
  }, [propMessages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversation analytics...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2">No Messages Yet</h3>
        <p className="text-muted-foreground">Start a conversation in the Couples Texting section to see analytics!</p>
      </div>
    );
  }
  const healthData = useMemo(() => calculateHealthScore(messages), [messages]);
  const toneDistribution = useMemo(() => getToneDistribution(messages), [messages]);
  const conflicts = useMemo(() => getConflictPatterns(messages), [messages]);
  const timeInsights = useMemo(() => getTimeBasedInsights(messages), [messages]);
  const weeklyProgress = useMemo(() => getWeeklyProgress(messages), [messages]);

  const getHealthColor = (score) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    if (score >= 30) return 'text-orange-500';
    return 'text-red-500';
  };

  const getTrendIcon = () => {
    if (weeklyProgress.trend === 'improving') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (weeklyProgress.trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Minus className="w-5 h-5 text-gray-500" />;
  };

  const topTones = Object.entries(toneDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">Conversation Health Dashboard</h2>
        <p className="text-muted-foreground">Track your relationship communication patterns</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Health Score</h3>
            <Heart className="w-5 h-5 text-pink-500" />
          </div>
          <div className={`text-4xl font-bold ${getHealthColor(healthData.score)}`}>
            {healthData.score}
          </div>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{healthData.level}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Weekly Trend</h3>
            {getTrendIcon()}
          </div>
          <div className={`text-4xl font-bold ${weeklyProgress.improvement >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {weeklyProgress.improvement > 0 ? '+' : ''}{weeklyProgress.improvement}
          </div>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{weeklyProgress.trend}</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Messages</h3>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-4xl font-bold text-foreground">
            {messages.length}
          </div>
          <p className="text-sm text-muted-foreground mt-1">All time</p>
        </Card>
      </div>

      {conflicts.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold">Conflict Patterns Detected</h3>
          </div>
          <ul className="space-y-2">
            {conflicts.map((pattern, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-orange-500">•</span>
                {pattern.message}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Communication Tones</h3>
        <div className="space-y-3">
          {topTones.map(([tone, count]) => (
            <div key={tone} className="flex items-center justify-between">
              <span className="text-sm font-medium capitalize">{tone.replace('-', ' ')}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(count / messages.length) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Time-Based Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Most Active Time</p>
            <p className="text-lg font-medium">
              {timeInsights.peakHour}:00 - {timeInsights.peakHour + 1}:00
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Most Active Day</p>
            <p className="text-lg font-medium">{timeInsights.peakDay}</p>
          </div>
          {timeInsights.conflictPeakHour && (
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground mb-1">⚠️ Peak Conflict Time</p>
              <p className="text-lg font-medium text-orange-500">
                {timeInsights.conflictPeakHour}:00 - {parseInt(timeInsights.conflictPeakHour) + 1}:00
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Consider avoiding important conversations during this time
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">💡 Recommendations</h3>
        <ul className="space-y-2">
          {healthData.score < 50 && (
            <li className="text-sm text-muted-foreground flex items-start gap-2">
              <span>•</span>
              <span>Try using more empathetic and compassionate language in your messages</span>
            </li>
          )}
          {conflicts.length > 0 && (
            <li className="text-sm text-muted-foreground flex items-start gap-2">
              <span>•</span>
              <span>Take breaks when you notice conversations escalating</span>
            </li>
          )}
          {weeklyProgress.trend === 'improving' && (
            <li className="text-sm text-green-600 flex items-start gap-2">
              <span>✓</span>
              <span>Great job! Your communication is improving. Keep it up!</span>
            </li>
          )}
          <li className="text-sm text-muted-foreground flex items-start gap-2">
            <span>•</span>
            <span>Use I-statements to express your feelings without blame</span>
          </li>
        </ul>
      </Card>
    </div>
  );
};
