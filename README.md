# GenUIChat - Experimental Generative UI for ChatGPT

A Chrome extension that adds an interactive generative UI to ChatGPT.

The extension splits ChatGPT interface into two parts:
- Left: Original ChatGPT interface
- Right: Dynamic, context-aware UI generated from the conversation

## Current Features
- UI regeneration using AI on button clicks

## Roadmap
- TODO

## Todo
- Max one in-flight generation process at a time
- Improve UI generation steps, especially the first one (planning what to show)
- Button loading state
- Generate select boxes and other input elements
- Improve OpenAI API key requesting UI
- UI regeneration on new messages

## Testing
1. Download or `git clone` the project
2. Open Chrome and go to [chrome://extensions](chrome://extensions)
3. Click "Load unpacked" and select chrome-extension directory in the project
4. Open or start a conversation in ChatGPT and the extension activates automatically
