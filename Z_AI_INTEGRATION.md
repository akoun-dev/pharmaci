# Z.ai API Integration for Health Assistant

## Overview

The Health Assistant feature is now powered by Z.ai's Claude API instead of using simulated responses. This provides real AI-generated health advice and medical information.

## Configuration

### 1. API Key Setup

1. **Get your Z.ai API key**:
   - Visit https://z.ai/
   - Create an account and obtain your API key
   - The key should be in the format: `zk-xxxxxxxxxxxxxxxxxxxxxxxx`

2. **Configure the environment**:
   - Copy `lib/core/config/env.example.dart` to `lib/core/config/env.dart`
   - Replace the placeholder with your actual Z.ai API key:

```dart
static const String zaiApiKey = 'your-actual-zai-api-key';
```

### 2. Dependencies

The integration requires the `http` package for API calls:

```bash
flutter pub add http
```

## How It Works

### API Integration

- **Endpoint**: `https://api.z.ai/api/anthropic`
- **Model**: `claude-3-sonnet-20240229`
- **Max Tokens**: 1000
- **System Prompts**: Specialized prompts for each health assistant type

### Health Assistant Types

The system uses specialized prompts for different query types:

1. **Drug Information**: Pharmaceutical expertise for medication details
2. **Symptom Checker**: Medical symptom analysis (no diagnosis)
3. **Dosage Advice**: Medication dosage guidance
4. **Interaction Warning**: Drug interaction information
5. **Emergency Guidance**: Emergency medical advice
6. **General Health**: General health and wellness information

### Confidence Scoring

The system calculates confidence scores based on:
- Query content (emergency keywords increase confidence)
- Query length (longer queries get higher confidence)
- Question format (questions get higher confidence)
- Type of query (emergency queries get highest confidence)

### Fallback System

If the Z.ai API is unavailable, the system falls back to predefined responses:
- Maintains functionality during API outages
- Provides helpful guidance to users
- Recommends professional medical consultation

## Security & Compliance

### Data Privacy
- No personal health data is stored permanently
- Conversations are logged for user history only
- API calls are encrypted end-to-end

### Medical Disclaimer
All AI responses include:
- Clear statements that AI advice is general
- Recommendations to consult healthcare professionals
- Emphasis that AI is not a replacement for medical diagnosis

## Error Handling

The system handles various error scenarios:
- **API Connectivity Issues**: Falls back to predefined responses
- **Invalid API Keys**: Shows appropriate error messages
- **Rate Limiting**: Handles API rate limits gracefully
- **Network Issues**: Provides offline functionality

## Testing

### With Real API
1. Configure your Z.ai API key in `env.dart`
2. Test different query types
3. Verify response quality and confidence scores

### Without API Key (Development Mode)
- The system will use fallback responses
- All features remain functional
- Clear indication of fallback mode

## Usage Examples

### Drug Information Query
```
User: "Quels sont les effets secondaires du paracétamol ?"
AI Response: [Detailed information about paracetamol side effects]
```

### Emergency Query
```
User: "J'ai une douleur thoracique sévère que faire ?"
AI Response: [Emergency guidance with strong recommendation to call 144]
```

### Symptom Checker
```
User: "J'ai de la fièvre et des maux de tête depuis 2 jours"
AI Response: [General symptom analysis with medical consultation recommendation]
```

## Monitoring

The system logs:
- API response times
- Error rates
- Confidence score distributions
- User satisfaction metrics

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify the key is correctly copied
   - Check if the key has API access enabled
   - Ensure the key hasn't expired

2. **Rate Limiting**
   - Implement request queuing
   - Add exponential backoff
   - Consider upgrading API plan if needed

3. **Slow Responses**
   - Check network connectivity
   - Monitor API response times
   - Optimize prompt length

### Support

For Z.ai API issues:
- Check Z.ai documentation: https://docs.z.ai/
- Contact Z.ai support: support@z.ai
- Monitor API status: https://status.z.ai/

## Future Enhancements

1. **Context Awareness**: Include conversation history in API calls
2. **Multi-language Support**: Add language detection and responses
3. **Medical Database Integration**: Cross-reference with local medication databases
4. **Voice Response**: Add text-to-speech for responses
5. **Image Analysis**: Analyze medication photos for identification