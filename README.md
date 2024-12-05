# GenUIChat - Experimental Generative UI for ChatGPT

A Chrome extension that adds an interactive generative UI to ChatGPT.

The extension splits ChatGPT interface into two parts:
- Left: Original ChatGPT interface
- Right: Dynamic, context-aware UI generated from the conversation

## Current Features
- Complete raw HTML + JS + CSS generation for each UI update
- Button clicks trigger complete UI regeneration

## Roadmap
- **Stage 1:** Generate helpful, high-quality UI with slow latency to prove there's value.
- **Stage 2:** Increase speed.

## Todo
- Improve API key requesting UI, refactor to support multiple LLM providers
- Add Groq support
- Max one in-flight generation process at a time
- Improve UI generation steps, especially the first one (planning what to show)
- Button loading state
- Generate select boxes and other input elements
- UI regeneration on new messages
- Stretchable and hideable side panel with mobile support

## Testing
1. Download or `git clone` the project
2. Open Chrome and go to [chrome://extensions](chrome://extensions)
3. Click "Load unpacked" and select chrome-extension directory in the project
4. Open or start a conversation in ChatGPT and the extension activates automatically
