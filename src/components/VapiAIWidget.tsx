import { VapiWidget } from '@vapi-ai/client-sdk-react';
import '@vapi-ai/client-sdk-react/styles';
import { AlertCircle } from 'lucide-react';

const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;
const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID;

const PLACEHOLDER_VALUES = [
  'your-vapi-public-key-here',
  'your-vapi-assistant-id-here',
];

const isConfigured =
  !!VAPI_PUBLIC_KEY &&
  !PLACEHOLDER_VALUES.includes(VAPI_PUBLIC_KEY) &&
  !!VAPI_ASSISTANT_ID &&
  !PLACEHOLDER_VALUES.includes(VAPI_ASSISTANT_ID);

const WELCOME_MESSAGE =
  'Hello and welcome to LifeManual. I\u2019m your AI companion. How can I help you today?';

export const VapiAIWidget: React.FC = () => {
  if (!isConfigured) {
    return (
      <div
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-spiritual-cream/90 border border-spiritual-gold/30 px-4 py-2 shadow-lg pointer-events-none"
        role="alert"
        aria-label="AI companion unavailable"
      >
        <AlertCircle className="w-4 h-4 text-spiritual-brown/60" />
        <span className="text-xs font-body text-spiritual-brown/60">
          LifeManual AI unavailable
        </span>
      </div>
    );
  }

  return (
    <VapiWidget
      publicKey={VAPI_PUBLIC_KEY}
      assistantId={VAPI_ASSISTANT_ID}
      mode="hybrid"
      position="bottom-right"
      size="full"
      borderRadius="large"
      theme="light"
      baseBgColor="#F5EBD7"
      accentColor="#FFD700"
      ctaButtonColor="#3D2817"
      ctaButtonTextColor="#FFF4CC"
      title="LifeManual AI"
      ctaTitle="LifeManual AI"
      ctaSubtitle="Chat or talk with your AI companion"
      chatFirstMessage={WELCOME_MESSAGE}
      chatPlaceholder="Type your message..."
      chatEmptyMessage="Start a conversation with LifeManual AI"
      hybridEmptyMessage="Choose text chat or voice to begin"
      voiceEmptyMessage="Click start to begin a voice conversation"
      voiceActiveEmptyMessage="Listening..."
      startButtonText="Start Voice"
      endButtonText="End Call"
      voiceShowTranscript={true}
      onError={(error: Error) => {
        console.error('Vapi widget error:', error.message);
      }}
    />
  );
};
