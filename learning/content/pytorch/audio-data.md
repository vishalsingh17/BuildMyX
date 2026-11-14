---
title: Prepare audio data and features
description: Decode a local waveform, resample, normalize, extract mel/MFCC features, apply spectral masks and batch variable durations for a model.
course: PyTorch
lesson: CHAPTER 08 OF 20
---

# Prepare audio data and features

## A waveform needs a sample rate {#loading}

A waveform alone does not establish duration: 8,000 samples mean one second at 8 kHz and half a second at 16 kHz. Record sample rate, channel order, amplitude scale and label alignment. Check corrupt inputs, clipping, silence and unexpected channel counts before extracting features.

This core fixture writes and reads a mono, 16-bit PCM WAV using the standard library, so it needs no external codec. General audio decoding is available through `torchaudio.load` and its installed decoder dependencies; current versions may require TorchCodec. Do not assume a codec-dependent loader works merely because `torchaudio.transforms` imports.

```python
import wave
import numpy as np
import torch
import torchaudio

sample_rate = 8000
time = torch.arange(800, dtype=torch.float32) / sample_rate
tone = 0.25 * torch.sin(2 * torch.pi * 440 * time)
pcm = (tone.numpy() * 32767).astype("<i2")
with wave.open("tone.wav", "wb") as file:
    file.setnchannels(1)
    file.setsampwidth(2)
    file.setframerate(sample_rate)
    file.writeframes(pcm.tobytes())
with wave.open("tone.wav", "rb") as file:
    rate = file.getframerate()
    samples = np.frombuffer(file.readframes(file.getnframes()), dtype="<i2").copy()
waveform = torch.from_numpy(samples).float().unsqueeze(0) / 32768
assert waveform.shape == (1, 800)
assert rate == 8000 and torch.isfinite(waveform).all()
```

For a stereo recording, decide whether channels are separate signals or should be mixed to mono. Averaging channels is a choice, not a universal cleaning rule.

## Resample and normalize deliberately {#normalization}

Resampling changes the sampling grid while preserving approximately the same elapsed duration. Standardization can remove an unwanted scale difference, but absolute loudness may carry useful information for some tasks. Use a policy consistent across training and inference and clamp the denominator for nearly silent input.

```python
resampled = torchaudio.transforms.Resample(orig_freq=rate, new_freq=16000)(waveform)
assert resampled.shape[-1] == 1600
standardized = (resampled - resampled.mean(dim=-1, keepdim=True)) / resampled.std(dim=-1, keepdim=True).clamp_min(1e-6)
assert standardized.shape == (1, 1600)
assert torch.isfinite(standardized).all()
torch.testing.assert_close(standardized.mean(), torch.tensor(0.0), atol=1e-5, rtol=0)
```

Fit dataset-level statistics using training data only if the model expects global normalization. Crop, pad or segment duration explicitly; a changing sample rate must not accidentally change the meaning of an annotation timestamp.

## Extract time-frequency features {#features}

A spectrogram represents energy across frequency and time windows. A mel spectrogram groups frequency bins on a perceptual scale. `AmplitudeToDB` converts power to a logarithmic representation. MFCCs further summarize a log-mel representation into cepstral coefficients. Choose window, hop and feature count as part of the model's preprocessing schema.

```python
mel_transform = torchaudio.transforms.MelSpectrogram(sample_rate=16000, n_fft=256, hop_length=80, n_mels=16)
mel = mel_transform(standardized)
log_mel = torchaudio.transforms.AmplitudeToDB(stype="power", top_db=80)(mel)
mfcc = torchaudio.transforms.MFCC(sample_rate=16000, n_mfcc=8,
    melkwargs={"n_fft": 256, "hop_length": 80, "n_mels": 16})(standardized)
assert mel.shape == log_mel.shape == (1, 16, 21)
assert mfcc.shape == (1, 8, 21)
assert torch.isfinite(log_mel).all() and torch.isfinite(mfcc).all()
```

The final frame count depends on padding/centering settings as well as duration and hop length. Verify the actual tensor shape rather than assuming a hand-derived count for every decoder and transform configuration.

## Augment training features {#augmentation}

Time masking and frequency masking hide regions of a feature map, similar to SpecAugment. Noise injection or time stretching can also be useful with suitable labels and parameters. Apply stochastic training augmentation separately from deterministic evaluation preprocessing.

```python
torch.manual_seed(15)
masked = torchaudio.transforms.FrequencyMasking(freq_mask_param=3)(log_mel.clone())
masked = torchaudio.transforms.TimeMasking(time_mask_param=4)(masked)
assert masked.shape == log_mel.shape
assert torch.isfinite(masked).all()
```

A masked log-spectrogram value of zero is a chosen fill value, not necessarily acoustic silence. Inspect what the augmentation actually produces and verify that it does not systematically erase the signal defining a label.

## Batch variable durations and connect a model {#batching-models}

Pad waveforms with a custom collator, retain the original lengths and create a mask from those lengths. Genuine audio samples can be zero, so `waveform != 0` is not a valid general padding mask. A CNN can take `[batch, 1, mel_bins, frames]`; an RNN commonly uses `[batch, frames, features]`.

```python
from torch.nn.utils.rnn import pad_sequence
from torch import nn

clips = [torch.ones(5), torch.tensor([0., 1., 0.])]
lengths = torch.tensor([len(x) for x in clips])
padded = pad_sequence(clips, batch_first=True)
valid = torch.arange(padded.shape[1]).unsqueeze(0) < lengths.unsqueeze(1)
assert valid[1].tolist() == [True, True, True, False, False]
cnn_input = log_mel.unsqueeze(1)
head = nn.Sequential(nn.Conv2d(1, 4, 3, padding=1), nn.ReLU(), nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.Linear(4, 2))
assert head(cnn_input).shape == (1, 2)
rnn_input = log_mel.transpose(1, 2)
assert rnn_input.shape == (1, 21, 16)
```

## Practice

Why can you not concatenate two recordings' sample arrays and assume their combined duration is meaningful if their sample rates differ?

??? question "Check your reasoning"
    Their samples represent different time intervals. Decode and resample to a common documented rate first, retaining segment boundaries and labels. The length of an array has no duration meaning without its sampling rate.
