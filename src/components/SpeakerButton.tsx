import React, { useState } from 'react';
import { Volume2, Loader2 } from 'lucide-react';

export function SpeakerButton({ messageId, content, audioUrl }) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [localUrl, setLocalUrl] = useState(audioUrl);

  const handleSpeak = async () => {
    if (playing) return;
    setLoading(true);
    try {
      let url = localUrl;
      if (!url) {
        const res = await fetch('https://module-matrix-409495160162.us-central1.run.app/matrix/execute_module', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module: 'ttsadapter', action: 'synthesize', params: { text: content } })
        });
        const data = await res.json();
        url = data.result.audio_url;
        setLocalUrl(url);
      }
      const audio = new Audio(url);
      audio.onended = () => setPlaying(false);
      await audio.play();
      setPlaying(true);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div className="sticky top-4 flex justify-end pr-2 pointer-events-none z-50">
      <button onClick={handleSpeak} className="pointer-events-auto p-2 bg-gray-800 rounded-full shadow-lg border border-gray-700 hover:bg-gray-700">
        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Volume2 className={`h-5 w-5 ${playing ? 'text-blue-400' : ''}`} />}
      </button>
    </div>
  );
}
