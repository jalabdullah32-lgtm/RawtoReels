# Raw to Reels

## Why I Made This

Raw to Reels helps turn videos into usable, captioned social media content. The core purpose of this application is captioning.

### Long Rant videos

I record very long videos with little or no structure. To turn them into useful content, I can upload the timed JSON transcript to an AI agent and describe the type of video I want to make. The agent can help me find the relevant parts of what I already said. Local hosting is planned, but it is not an immediate change.


### The lack of AI

It does not create my voice, replace my recording, or determine the final edit. I don't know how to quantitize this, but most of the work is being done through code logic. The only AI aspect of this is JSON being analyzed.

I think AI is used like too much of a crutch, and there are still limitations to it. The though of uploading a video into a model and say "edit this" is poor and lazy. People also tell me I have a nice voice. I don't want to hear my voice in a marvel movie in 10 years.

The intended AI usage is limited to helping create the application and generating JSON files to place inside the file for longer videos. The video, audio, transcription, captioning, and editing workflow stays local. This keeps the process economical and avoids sending the same media through AI data centers repeatedly.

### How it works 
__FFmpeg and __Faster are models used by python and the compute on your computer. It allows us to extract audio from videos and transcriube that audio.

The editing is also almost instant. The application gets passed the words from __Faster-. It then uses the timestamps in the JSON to find those moments and place them against the original video, automatically editing them.

## What It Does Now

- Extracts audio locally with **FFmpeg** and transcribes speech locally with **Faster-Whisper**.
- Uses the exact words and timestamps to create captions and find moments in the original video.
- Exports a finished captioned video.

## Open Caption Studio

Double-click `run-raw-to-reels.cmd`. It uses the project virtual environment when present, otherwise the Windows Python launcher, then starts a local server at `127.0.0.1` and opens Caption Studio in your default browser.

Put source videos in `Videos/input`. The **Your videos** library lists them with a preview and shows whether a matching transcript exists. Click **Transcribe new videos** to create a local JSON transcript for each new video, then click a ready card to load its video and captions together. Transcripts live in `Videos/transcripts` and preserve any subfolder structure from `Videos/input`.

You can still use **Load video** and **Load JSON** for files outside the local library. Raw source videos and generated transcripts stay on your computer and are excluded from Git.

## What I Want Next

- Turn a raw voice note into a simple recording outline when useful. This is like a pre planning phase. I would do all of this on a sunday, and then record mon-tue.
- Keep the outline step optional rather than making it part of every workflow.
- Host the AI agent locally when that work begins, likely in a few weeks.
- When testing the app, it made me 3 videos and they were great. I did not have to edit a video I recorded 3 years ago. My only issue was the cuts. They were too granular to the time stamps. It would be really cool to add 2-3 seconds before/after the actual clip to mke eveything more natural and less jerky cuts. Other than that its great.
- The ability to add in overlayed videos. Lets say I am describing something and and to show it on screen. Just being able to upload another video/image/gif whatever would be amazing. Ofc I'd want this to be able to resize these overlays and what not.
- A sound library. Similar to the overlay section. But I might want to have funny trendy noises. Just to name a few, there is a FAHHHHHHHHH audio that is really funny, maybe a little ding noise that I could use when listing somehinbg out on screen as a caption stuff like this.
- I mentioned this above and not sure how I'd actually implement it in the app. But I might say something like "Being lazy(pops up on screen and stays there) Being a bum(Same as being lazy) Being a loser(also pops up on screen). This will be very useful. 


