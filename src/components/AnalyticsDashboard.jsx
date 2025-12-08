import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Heart, 
  Users, 
  Calendar,
  Award,
  Target,
  Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMessages: 0,
    iStatementsCreated: 0,
    rolePlaySessions: 0,
    averageSessionLength: 0,
    toneBreakdown: {},
    weeklyActivity: [],
    emotionsExplored: [],
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [sessionsRes, messagesRes, iStatementsRes, rolePlayRes] = await Promise.all([
        supabase.from('conres_sessions').select('*', { count: 'exact' }),
        supabase.from('conres_messages').select('*', { count: 'exact' }),
        supabase.from('conres_istatement_history').select('*', { count: 'exact' }),
        supabase.from('conres_roleplay_sessions').select('*', { count: 'exact' })
      ]);

      const messages = messagesRes.data || [];
      const toneBreakdown = messages.reduce((acc, msg) => {
        const tone = msg.tone_analysis?.tone || msg.tone_analysis?.primaryEmotion || msg.tone || 'neutral';
        acc[tone] = (acc[tone] || 0) + 1;
        return acc;
      }, {});

      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = messages.filter(m => m.created_at?.startsWith(dateStr)).length;
        last7Days.push({ date: dateStr, count });
      }

      setStats({
        totalSessions: sessionsRes.count || 0,
        totalMessages: messagesRes.count || 0,
        iStatementsCreated: iStatementsRes.count || 0,
        rolePlaySessions: rolePlayRes.count || 0,
        averageSessionLength: Math.round((messagesRes.count || 0) / Math.max(1, sessionsRes.count || 1)),
        toneBreakdown,
        weeklyActivity: last7Days,
        recentActivity: messages.slice(-5).reverse()
      });
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="glass-card border-border hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const toneColors = {
    calm: '#AEC6CF',
    loving: '#FF69B4',
    empathetic: '#66CDAA',
    anxious: '#FFA500',
    frustrated: '#FF7F50',
    angry: '#CD5C5C',
    hostile: '#8B0000',
    neutral: '#B0B0B0'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Users} 
          label="Couples Sessions" 
          value={stats.totalSessions} 
          color="bg-gradient-to-br from-blue-500 to-cyan-500"
          delay={0}
        />
        <StatCard 
          icon={MessageSquare} 
          label="Messages Sent" 
          value={stats.totalMessages} 
          color="bg-gradient-to-br from-purple-500 to-pink-500"
          delay={0.1}
        />
        <StatCard 
          icon={Heart} 
          label="I-Statements Created" 
          value={stats.iStatementsCreated} 
          color="bg-gradient-to-br from-pink-500 to-rose-500"
          delay={0.2}
        />
        <StatCard 
          icon={Target} 
          label="Role-Play Sessions" 
          value={stats.rolePlaySessions} 
          color="bg-gradient-to-br from-green-500 to-emerald-500"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card border-border">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Weekly Activity
              </h3>
              <div className="h-40 flex items-end gap-2">
                {stats.weeklyActivity.map((day, index) => {
                  const maxCount = Math.max(...stats.weeklyActivity.map(d => d.count), 1);
                  const height = (day.count / maxCount) * 100;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 5)}%` }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t-lg"
                      />
                      <span className="text-xs text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card border-border">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Tone Distribution
              </h3>
              <div className="space-y-3">
                {Object.entries(stats.toneBreakdown).slice(0, 5).map(([tone, count], index) => {
                  const total = Object.values(stats.toneBreakdown).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={tone}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize text-foreground">{tone}</span>
                        <span className="text-muted-foreground">{percentage}%</span>
                      </div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="h-2 rounded-full"
                        style={{ backgroundColor: toneColors[tone] || '#B0B0B0' }}
                      />
                    </div>
                  );
                })}
                {Object.keys(stats.toneBreakdown).length === 0 && (
                  <p className="text-muted-foreground text-sm">No tone data yet. Start chatting!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="glass-card border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/30 rounded-xl">
                <p className="text-2xl font-bold text-foreground">{stats.averageSessionLength}</p>
                <p className="text-xs text-muted-foreground">Avg Messages/Session</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-xl">
                <p className="text-2xl font-bold text-foreground">
                  {Object.keys(stats.toneBreakdown).length}
                </p>
                <p className="text-xs text-muted-foreground">Unique Tones Used</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-xl">
                <p className="text-2xl font-bold text-foreground">
                  {stats.toneBreakdown['calm'] || 0}
                </p>
                <p className="text-xs text-muted-foreground">Calm Messages</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-xl">
                <p className="text-2xl font-bold text-foreground">
                  {Math.round((stats.iStatementsCreated / Math.max(1, stats.totalMessages)) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">I-Statement Usage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;
