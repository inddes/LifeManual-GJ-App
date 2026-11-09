import React from 'react';
import { Sparkles, MessageSquare, Mic, Github, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { VapiChatPanel } from '../components/ai-agent/VapiChatPanel';
import { VapiVoicePanel } from '../components/ai-agent/VapiVoicePanel';

const GITHUB_URL = 'https://github.com/your-username/lifemanual-ai-agent';

const FeatureBadge: React.FC<{ icon: React.ReactNode; label: string }> = ({
  icon,
  label,
}) => (
  <div className="flex items-center space-x-2 bg-white/60 rounded-full px-4 py-2 border border-spiritual-gold/20">
    <span className="text-spiritual-gold">{icon}</span>
    <span className="text-sm font-medium text-spiritual-brown">{label}</span>
  </div>
);

export const AIAgent: React.FC = () => {
  const heroRef = useScrollAnimation();
  const panelsRef = useScrollAnimation();

  return (
    <div className="min-h-screen pt-20">
      {/* Hero / Intro */}
      <section className="relative py-16 bg-gradient-to-br from-spiritual-cream via-spiritual-lightGold to-spiritual-cream overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-spiritual-gold/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-spiritual-saffron/20 rounded-full blur-3xl" />
        </div>

        <div
          ref={heroRef.ref}
          className={`relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-700 ${
            heroRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-spiritual-gold/20 rounded-full mb-6">
            <Sparkles className="w-10 h-10 text-spiritual-gold" />
          </div>

          <h1 className="text-4xl md:text-6xl font-heading font-bold text-spiritual-brown mb-4">
            LifeManual <span className="text-gradient">AI Agent</span>
          </h1>

          <p className="text-lg md:text-xl text-spiritual-brown/80 max-w-3xl mx-auto leading-relaxed mb-8">
            A real-time AI assistant powered by the OpenAI Realtime API. Chat by text
            or speak naturally with two-way voice — exploring mindfulness, meditation,
            and the timeless wisdom of the Bhagavad Gita.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <FeatureBadge icon={<MessageSquare className="w-4 h-4" />} label="Streaming Text Chat" />
            <FeatureBadge icon={<Mic className="w-4 h-4" />} label="Real-time Voice" />
            <FeatureBadge icon={<Sparkles className="w-4 h-4" />} label="GPT-4o Powered" />
          </div>
        </div>
      </section>

      {/* Interaction Panels */}
      <section
        ref={panelsRef.ref}
        className={`py-12 bg-spiritual-cream transition-all duration-700 ${
          panelsRef.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Text chat column */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-spiritual-gold/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-spiritual-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-heading font-bold text-spiritual-brown">
                    Text Chat
                  </h2>
                  <p className="text-sm text-spiritual-brown/60">
                    Streaming responses with conversation history
                  </p>
                </div>
              </div>
              <VapiChatPanel />
            </div>

            {/* Voice column */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-spiritual-saffron/20 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-spiritual-saffron" />
                </div>
                <div>
                  <h2 className="text-xl font-heading font-bold text-spiritual-brown">
                    Voice Assistant
                  </h2>
                  <p className="text-sm text-spiritual-brown/60">
                    Two-way speech with live transcription and barge-in
                  </p>
                </div>
              </div>
              <VapiVoicePanel />
            </div>
          </div>

          {/* Capabilities summary */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-spiritual-gold/20 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-spiritual-gold/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-spiritual-gold" />
              </div>
              <h3 className="font-heading font-bold text-spiritual-brown mb-2">
                Conversational Text
              </h3>
              <p className="text-sm text-spiritual-brown/70 leading-relaxed">
                Token-by-token streaming, message timestamps, full conversation
                history, and clear-chat controls — all with graceful loading and
                error states.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-spiritual-gold/20 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-spiritual-saffron/10 flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-spiritual-saffron" />
              </div>
              <h3 className="font-heading font-bold text-spiritual-brown mb-2">
                Natural Voice
              </h3>
              <p className="text-sm text-spiritual-brown/70 leading-relaxed">
                WebRTC-based audio connection to OpenAI Realtime with live
                voice-activity visualization, connection status indicators, and
                AI speech interruption (barge-in).
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-spiritual-gold/20 shadow-sm">
              <div className="w-12 h-12 rounded-lg bg-spiritual-gold/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-spiritual-gold" />
              </div>
              <h3 className="font-heading font-bold text-spiritual-brown mb-2">
                Secure Backend
              </h3>
              <p className="text-sm text-spiritual-brown/70 leading-relaxed">
                Permanent API keys stay server-side. The voice agent uses
                short-lived ephemeral session tokens issued by a secure Edge
                Function endpoint.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GitHub / Project footer CTA */}
      <section className="py-12 bg-white border-t border-spiritual-gold/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-spiritual-brown mb-4">
            Explore the Source Code
          </h2>
          <p className="text-spiritual-brown/70 mb-6 max-w-2xl mx-auto">
            This AI agent is built with React, TypeScript, Supabase Edge Functions,
            and the Vapi platform for unified chat and voice. Review the full
            implementation on GitHub.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-spiritual-brown text-spiritual-lightGold font-semibold px-6 py-3 rounded-full hover:bg-spiritual-darkBrown transition-colors lm-focus-ring"
          >
            <Github className="w-5 h-5" />
            <span>View on GitHub</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <p className="text-xs text-spiritual-brown/40 mt-4">
            Repository link is a placeholder — update it once configured.
          </p>
        </div>
      </section>
    </div>
  );
};
