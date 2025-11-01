import React, { useState, useRef } from 'react';
import { Mic, Square, Send, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

export const VoiceRecorder = ({ onSendVoiceMessage, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processVoiceMessage(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info('Recording started... Click stop when done');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceMessage = async (audioBlob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice-message.webm');

      const response = await fetch('/api/transcribe-voice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to transcribe voice message');
      }

      const data = await response.json();
      
      if (data.transcription && onSendVoiceMessage) {
        onSendVoiceMessage(data.transcription, data.tone);
      }
    } catch (error) {
      console.error('Error processing voice message:', error);
      toast.error('Could not process voice message');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <button
        disabled
        className="p-3 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-full cursor-not-allowed"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
      </button>
    );
  }

  if (isRecording) {
    return (
      <button
        onClick={stopRecording}
        className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors animate-pulse"
        title="Stop recording"
      >
        <Square className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      className={`p-3 rounded-full transition-colors ${
        disabled
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          : 'bg-blue-500 text-white hover:bg-blue-600'
      }`}
      title="Record voice message"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
};
