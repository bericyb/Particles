# Chat Interface

A modern, responsive chat interface for interacting with OpenAI GPT models, built with vanilla JavaScript and integrated with the existing HTTP server.

## Features

- **Modern UI**: Clean, responsive design with a collapsible sidebar
- **Conversation Management**: Create, view, and delete conversations
- **Real-time Chat**: Send messages and receive AI responses
- **History Sidebar**: View and switch between past conversations
- **Responsive Design**: Works on desktop and mobile devices
- **Typing Indicators**: Visual feedback during AI response generation
- **Auto-resize Input**: Text area expands as you type
- **Error Handling**: Graceful error handling with user feedback

## Setup

1. **Install Dependencies** (already done):
   ```bash
   npm install openai
   ```

2. **Set OpenAI API Key**:
   ```bash
   export OPENAI_API_KEY="your-openai-api-key-here"
   ```

3. **Start the Server**:
   ```bash
   npm run dev
   ```

4. **Access the Chat Interface**:
   Open your browser to: `http://localhost:3001/chat/`

## File Structure

```
src/public/chat/
├── index.html          # Main HTML structure
├── chat.css           # Styling and responsive design
└── chat.js            # Frontend JavaScript functionality

src/server/
├── services/
│   ├── chatService.ts        # OpenAI integration
│   └── conversationService.ts # Conversation management
└── routes/
    └── chatRoutes.ts         # API endpoints
```

## API Endpoints

- `POST /api/chat` - Send a message and get AI response
- `GET /api/conversations` - Get all conversations
- `GET /api/conversations/:id` - Get specific conversation
- `POST /api/conversations` - Create new conversation
- `DELETE /api/conversations/:id` - Delete conversation

## Usage

1. **Start New Conversation**: Click the "+ New Chat" button
2. **Send Messages**: Type in the input field and press Enter or click Send
3. **View History**: Click on any conversation in the sidebar to load it
4. **Delete Conversations**: Hover over a conversation and click the × button
5. **Toggle Sidebar**: Click the ← button to collapse/expand the sidebar

## Features in Detail

### Collapsible Sidebar
- Click the toggle button (←) to collapse the sidebar
- On mobile, the sidebar becomes an overlay
- Smooth animations for better user experience

### Message Display
- User messages appear on the right (blue)
- AI responses appear on the left (gray)
- Timestamps are shown for each message
- Messages support line breaks and basic formatting

### Conversation Management
- Conversations are automatically titled based on the first message
- Conversations are sorted by most recent activity
- Delete functionality with confirmation dialog
- Persistent storage using file system

### Error Handling
- Network errors are displayed with retry options
- API errors show user-friendly messages
- Loading states prevent multiple simultaneous requests

## Customization

### Styling
Edit `src/public/chat/chat.css` to customize:
- Colors and themes
- Layout and spacing
- Responsive breakpoints
- Animation timing

### AI Model Settings
Edit `src/server/services/chatService.ts` to modify:
- Model selection (currently gpt-3.5-turbo)
- Temperature and other parameters
- Token limits
- System prompts

### Storage
Conversations are stored in `data/conversations/` as JSON files. You can:
- Change storage location in `conversationService.ts`
- Implement database storage instead of file system
- Add conversation export/import functionality

## Testing

Run the automated test suite:
```bash
node tests/test-chat-interface.js
```

This test verifies:
- HTML structure and required elements
- CSS classes and responsive design
- JavaScript functionality
- API endpoint integration
- Backend service implementation

## Troubleshooting

### Common Issues

1. **"Chat service not configured" error**:
   - Make sure OPENAI_API_KEY environment variable is set
   - Restart the server after setting the API key

2. **Messages not sending**:
   - Check browser console for JavaScript errors
   - Verify the server is running on port 3001
   - Check network tab for failed API requests

3. **Conversations not loading**:
   - Ensure the `data/conversations/` directory exists
   - Check file permissions for the data directory
   - Look for server-side errors in the console

4. **Sidebar not collapsing**:
   - Check for JavaScript errors in browser console
   - Verify CSS classes are loading correctly

### Development Tips

- Use browser developer tools to debug frontend issues
- Check server logs for backend errors
- Test API endpoints directly using curl or Postman
- Use the test suite to verify implementation integrity

## Future Enhancements

Potential improvements that could be added:
- Message search functionality
- Conversation export/import
- Multiple AI model selection
- Message editing and regeneration
- File upload support
- Conversation sharing
- Dark/light theme toggle
- Keyboard shortcuts
- Message reactions
- Conversation folders/tags
