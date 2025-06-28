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

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const updateTime = () => setCurrentTime(audioElement.currentTime);
    const updateDuration = () => setDuration(audioElement.duration);
    const handleEnded = () => setPlaying(false);

    audioElement.addEventListener('timeupdate', updateTime);
    audioElement.addEventListener('loadedmetadata', updateDuration);
    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('timeupdate', updateTime);
      audioElement.removeEventListener('loadedmetadata', updateDuration);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, []);

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
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = audio.url;
    link.download = audio.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-2 p-2 bg-card rounded-lg border', className)}>
        <audio ref={audioRef} src={audio.url} />
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handlePlayPause}
          className="h-8 w-8"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{audio.filename}</p>
          <p className="text-xs text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDownload}
          className="h-8 w-8"
        >
          <Download className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('bg-card rounded-lg border p-4', className)}>
      <audio ref={audioRef} src={audio.url} />
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium">{audio.filename}</h3>
          <p className="text-sm text-muted-foreground">
            {Math.round((audio.size || 0) / 1024)}KB • {formatTime(audio.duration || 0)}
          </p>
        </div>
        
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDownload}
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
