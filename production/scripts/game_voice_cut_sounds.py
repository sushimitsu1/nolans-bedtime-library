# Cut isolated letter sounds out of Sulafat words (Chirp3 spells "sss" as S-S-S). fric.py logic for s/f/h ("Sun." "Fan." "Hat."):
# keep the high-band frication before the vowel. Voiced l/m/n/r/v/z were cut from "Lap. Map. Nap. Run. Van. Zoo." at the
# vowel-onset energy jump, and "ih" from "It."; each clip was then time-stretched to ~0.5 s, levelled and faded.
# Usage: python game_voice_cut_sounds.py word.mp3:out.wav ...
import sys, subprocess, numpy as np, wave
SR=24000;N=480;H=120
def load(f):
    raw=subprocess.run(["ffmpeg","-loglevel","error","-i",f,"-ac","1","-ar",str(SR),"-f","s16le","-"],capture_output=True).stdout
    return np.frombuffer(raw,np.int16).astype(np.float32)/32768
for f,out in [x.split(':') for x in sys.argv[1:]]:
    a=load(f);fr=np.array([np.abs(np.fft.rfft(a[i:i+N]*np.hanning(N))) for i in range(0,len(a)-N,H)])
    fq=np.fft.rfftfreq(N,1/SR);lf=fr[:,fq<900].sum(1);hf=fr[:,fq>2500].sum(1)
    v=np.argmax(lf>0.15*lf.max())   # vowel/voicing onset
    reg=hf[:v];on=np.argmax(reg>0.15*reg.max());end=v-2
    seg=a[on*H:end*H+N//2]
    with wave.open(out,'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((np.clip(seg,-1,1)*32767).astype(np.int16).tobytes())
    print(out,f"{len(seg)/SR:.3f}s peak={np.abs(seg).max():.2f}")
