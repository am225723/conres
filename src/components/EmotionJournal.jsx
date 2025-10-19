import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { EMOTIONS } from '../lib/emotionAnalysis';

const EmotionJournal = ({ sessionId, userId }) => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({
    pre_session_emotion: '',
    pre_session_intensity: 5,
    post_session_emotion: '',
    post_session_intensity: 5,
    notes: '',
    insights: ''
  });

  useEffect(() => {
    loadJournalEntries();
  }, [sessionId, userId]);

  const loadJournalEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('emotion_journal')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJournalEntries(data || []);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEntry = async () => {
    try {
      const { data, error } = await supabase
        .from('emotion_journal')
        .insert([{
          user_id: userId,
          session_id: sessionId,
          ...newEntry
        }])
        .select()
        .single();

      if (error) throw error;

      setJournalEntries([data, ...journalEntries]);
      setShowNewEntry(false);
      setNewEntry({
        pre_session_emotion: '',
        pre_session_intensity: 5,
        post_session_emotion: '',
        post_session_intensity: 5,
        notes: '',
        insights: ''
      });
      toast.success('Journal entry saved!');
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error('Failed to save journal entry');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="emotion-journal p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold gradient-text">Emotion Journal</h3>
        <button
          onClick={() => setShowNewEntry(!showNewEntry)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          {showNewEntry ? 'Cancel' : '+ New Entry'}
        </button>
      </div>

      {/* New Entry Form */}
      {showNewEntry && (
        <div className="bg-muted rounded-lg p-6 mb-6">
          <h4 className="font-semibold mb-4">New Journal Entry</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            {/* Pre-Session Emotion */}
            <div>
              <label className="block text-sm font-medium mb-2">
                How did you feel before the session?
              </label>
              <select
                value={newEntry.pre_session_emotion}
                onChange={(e) => setNewEntry({ ...newEntry, pre_session_emotion: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select emotion...</option>
                {Object.keys(EMOTIONS).map(emotion => (
                  <option key={emotion} value={emotion} className="capitalize">
                    {emotion}
                  </option>
                ))}
              </select>
              
              <label className="block text-sm font-medium mt-3 mb-2">
                Intensity: {newEntry.pre_session_intensity}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={newEntry.pre_session_intensity}
                onChange={(e) => setNewEntry({ ...newEntry, pre_session_intensity: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Post-Session Emotion */}
            <div>
              <label className="block text-sm font-medium mb-2">
                How do you feel after the session?
              </label>
              <select
                value={newEntry.post_session_emotion}
                onChange={(e) => setNewEntry({ ...newEntry, post_session_emotion: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select emotion...</option>
                {Object.keys(EMOTIONS).map(emotion => (
                  <option key={emotion} value={emotion} className="capitalize">
                    {emotion}
                  </option>
                ))}
              </select>
              
              <label className="block text-sm font-medium mt-3 mb-2">
                Intensity: {newEntry.post_session_intensity}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={newEntry.post_session_intensity}
                onChange={(e) => setNewEntry({ ...newEntry, post_session_intensity: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Notes
            </label>
            <textarea
              value={newEntry.notes}
              onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
              placeholder="What happened during this session? How did you feel?"
              className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
            />
          </div>

          {/* Insights */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Insights & Learnings
            </label>
            <textarea
              value={newEntry.insights}
              onChange={(e) => setNewEntry({ ...newEntry, insights: e.target.value })}
              placeholder="What did you learn? What could you do differently next time?"
              className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
            />
          </div>

          <button
            onClick={handleSaveEntry}
            disabled={!newEntry.pre_session_emotion || !newEntry.post_session_emotion}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Save Entry
          </button>
        </div>
      )}

      {/* Journal Entries List */}
      <div className="space-y-4">
        {journalEntries.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground">
            No journal entries yet. Start by creating your first entry!
          </div>
        ) : (
          journalEntries.map((entry) => (
            <div key={entry.id} className="bg-card rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">
                  {new Date(entry.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                {/* Before */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h5 className="font-semibold mb-2 text-sm text-muted-foreground">Before Session</h5>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl capitalize font-bold">
                      {entry.pre_session_emotion}
                    </span>
                    <span className="text-lg text-muted-foreground">
                      {entry.pre_session_intensity}/10
                    </span>
                  </div>
                </div>

                {/* After */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h5 className="font-semibold mb-2 text-sm text-muted-foreground">After Session</h5>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl capitalize font-bold">
                      {entry.post_session_emotion}
                    </span>
                    <span className="text-lg text-muted-foreground">
                      {entry.post_session_intensity}/10
                    </span>
                  </div>
                </div>
              </div>

              {/* Emotional Change Indicator */}
              <div className="mb-4">
                {entry.post_session_intensity > entry.pre_session_intensity ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <span className="text-xl">↑</span>
                    <span className="font-medium">Emotional improvement</span>
                  </div>
                ) : entry.post_session_intensity < entry.pre_session_intensity ? (
                  <div className="flex items-center gap-2 text-orange-600">
                    <span className="text-xl">↓</span>
                    <span className="font-medium">Emotional decline</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-blue-600">
                    <span className="text-xl">→</span>
                    <span className="font-medium">Emotional stability</span>
                  </div>
                )}
              </div>

              {entry.notes && (
                <div className="mb-3">
                  <h5 className="font-semibold mb-1 text-sm">Notes:</h5>
                  <p className="text-foreground/80">{entry.notes}</p>
                </div>
              )}

              {entry.insights && (
                <div>
                  <h5 className="font-semibold mb-1 text-sm">Insights:</h5>
                  <p className="text-foreground/80">{entry.insights}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmotionJournal;