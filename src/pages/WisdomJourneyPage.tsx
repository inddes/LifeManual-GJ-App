import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getTopic } from '../data/wisdomTopics';
import { JourneyHero } from '../components/wisdom/JourneyHero';
import { JourneyProgress } from '../components/wisdom/JourneyProgress';
import { UnderstandingSection } from '../components/wisdom/UnderstandingSection';
import { WisdomSection } from '../components/wisdom/WisdomSection';
import { ReflectionJourney } from '../components/wisdom/ReflectionJourney';
import { GuidedPractice } from '../components/wisdom/GuidedPractice';
import { GoDeeperSection } from '../components/wisdom/GoDeeperSection';

export const WisdomJourneyPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const topic = slug ? getTopic(slug) : undefined;

  if (!topic) {
    return (
      <div className="min-h-screen pt-28 pb-20 bg-spiritual-cream flex items-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-spiritual-gold mb-4">
            Coming Soon
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-spiritual-brown mb-6 leading-tight">
            This journey is still being written
          </h1>
          <p className="text-base sm:text-lg text-spiritual-brown/70 mb-8 leading-relaxed">
            We are carefully composing each LifeManual journey using verified
            Bhagavad Gita teachings. Please check back soon, or explore the
            journeys that are ready today.
          </p>
          <Link
            to="/#what-are-you-facing"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-spiritual-brown text-spiritual-cream rounded-lg font-semibold transition-all duration-300 hover:bg-spiritual-darkBrown hover:shadow-lg lm-focus-ring"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to All Journeys
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <JourneyHero topic={topic} />
      <JourneyProgress />
      <UnderstandingSection topic={topic} />
      <WisdomSection teachings={topic.scriptureTeachings} />
      <ReflectionJourney questions={topic.reflections} topicSlug={topic.slug} />
      <GuidedPractice
        heading={topic.practice.heading}
        intro={topic.practice.intro}
        steps={topic.practice.steps}
        intention={topic.practice.intention}
        durationSeconds={topic.practice.durationSeconds}
      />
      <GoDeeperSection links={topic.relatedContent} />
    </div>
  );
};
