import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { MediaAsset } from '@/types';

interface AudioPlayerProps {
  audio: MediaAsset;
  className?: string;
  compact?: boolean;
}

export function AudioPlayer({ audio, className, compact = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  const reset = () => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setVolume(1)
    setMuted(false)
  }
  
  useEffect(() => {
    reset()

    const audioElement = audioRef.current;
    if (!audioElement) return;
    if (!audio.url) return;

    const updateTime = () => setCurrentTime(audioElement.currentTime);
    const updateDuration = () => setDuration(audioElement.duration || 0);
    const handleEnded = () => setPlaying(false);
    const handleError = () => reset()

    audioElement.addEventListener('timeupdate', updateTime);
    audioElement.addEventListener('loadedmetadata', updateDuration);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('error', handleError);

    audioElement.src = audio.url;
    
    return () => {
      audioElement.removeEventListener('timeupdate', updateTime);
      audioElement.removeEventListener('loadedmetadata', updateDuration);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
    };
  }, [audio?.url]);

  const handlePlayPause = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (playing) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setPlaying(!playing);
  };

  const handleMute = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    audioElement.muted = !muted;
    setMuted(!muted);
  };

  const handleVolumeChange = (newVolume: number) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    audioElement.volume = newVolume;
    setVolume(newVolume);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const millisecs = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${millisecs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    if (!audio?.url) return;
    
    const link = document.createElement('a');
    link.href = audio.url;
    link.download = audio.filename || 'audio.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-2 p-2 bg-white rounded-lg border', className)}>
        <audio ref={audioRef} preload="metadata" />
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handlePlayPause}
          className="h-8 w-8"
          disabled={!audio?.url}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{audio?.filename || 'Audio File'}</p>
          <p className="text-xs text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDownload}
          className="h-8 w-8"
          disabled={!audio?.url}
        >
          <Download className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border p-4', className)}>
      <audio ref={audioRef} preload="metadata" />
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium">{audio?.filename || 'Audio File'}</h3>
          <p className="text-sm text-muted-foreground">
            {Math.round((audio?.size || 0) / 1024)}KB • {formatTime(duration)}
          </p>
        </div>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDownload}
          disabled={!audio?.url}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Progress bar */}
      <div 
        className="w-full bg-muted rounded-full h-2 cursor-pointer mb-4"
        onClick={handleSeek}
      >
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePlayPause}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={handleMute}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={muted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-20"
          />
        </div>
        
        <span className="text-sm text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

      </div>
    </div>
  );
}
