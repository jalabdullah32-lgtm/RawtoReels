"""Extract small, local-only posters for the design previews."""
from pathlib import Path
import json
import av
import numpy as np

root = Path(__file__).resolve().parents[5]
output = Path(__file__).resolve().parents[1] / 'assets'
output.mkdir(parents=True, exist_ok=True)
source = root / 'Videos' / 'input' / 'IMG_0407.MOV'
transcript = json.loads((root / 'Videos' / 'transcripts' / 'IMG_0407.MOV.transcript.json').read_text(encoding='utf-8'))
segments = [{ 'id': i, 'start': s['start'], 'end': s['end'], 'text': s['text'] }
            for i, s in enumerate(transcript['segments']) if s['text'].strip()]
(output / 'transcript.json').write_text(json.dumps({ 'source': 'IMG_0407.MOV', 'duration': segments[-1]['end'], 'segments': segments }, ensure_ascii=False), encoding='utf-8')
print(f'Transcript preview: {len(segments)} segments')

with av.open(str(source)) as container:
    stream = container.streams.video[0]
    for name, seconds in [('poster.jpg', 38), ('frame-1.jpg', 14), ('frame-2.jpg', 28), ('frame-3.jpg', 43)]:
        container.seek(int(seconds / float(stream.time_base)), stream=stream)
        for frame in container.decode(stream):
            if frame.time is not None and frame.time >= seconds:
                # This recording stores portrait footage in a rotated frame.
                width = 720
                height = int(frame.height * width / frame.width)
                rgb = frame.reformat(width=width, height=height, format='rgb24').to_ndarray()
                image = av.VideoFrame.from_ndarray(np.rot90(rgb, 3).copy(), format='rgb24')
                width, height = image.width, image.height
                image = image.reformat(format='yuvj420p')
                codec = av.CodecContext.create('mjpeg', 'w')
                codec.width, codec.height = width, height
                codec.pix_fmt = 'yuvj420p'
                codec.open()
                packets = list(codec.encode(image)) + list(codec.encode(None))
                (output / name).write_bytes(b''.join(bytes(packet) for packet in packets))
                print(f'{name}: {width}x{height}')
                break
