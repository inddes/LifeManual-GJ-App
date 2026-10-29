import { gitaVerses, type GitaVerse } from './gitaVerses';

export interface ScriptureTeaching {
  verseRef: { chapter: number; verse: number };
  whyItMatters: string;
  applyItToday: string;
}

export interface ReflectionQuestion {
  id: string;
  question: string;
}

export interface PracticeStep {
  number: number;
  text: string;
}

export interface RelatedContentLink {
  label: string;
  description: string;
  link: string;
}

export interface WisdomTopic {
  slug: string;
  title: string;
  eyebrow: string;
  headline: string;
  introduction: string;
  durationLabel: string;
  understanding: {
    heading: string;
    paragraphs: string[];
    transition: string;
  };
  scriptureTeachings: ScriptureTeaching[];
  reflections: ReflectionQuestion[];
  practice: {
    heading: string;
    intro: string;
    steps: PracticeStep[];
    intention: string;
    durationSeconds: number;
  };
  relatedContent: RelatedContentLink[];
}

export const wisdomTopics: Record<string, WisdomTopic> = {
  anxiety: {
    slug: 'anxiety',
    title: 'Anxiety',
    eyebrow: 'Wisdom for Anxiety',
    headline: 'When the future feels heavier than the present',
    introduction:
      'This journey explores Bhagavad Gita teachings related to action and its results, the nature of the restless mind, finding steadiness amid life\u2019s changes, and trusting a perspective larger than our own worries. It is not a treatment for anxiety. It is an invitation to sit with timeless wisdom and let it speak to your experience.',
    durationLabel: 'About 10 minutes',
    understanding: {
      heading: 'Why does uncertainty disturb the mind?',
      paragraphs: [
        'Anxiety often begins with a question we cannot answer: what will happen? The mind races ahead, trying to predict, control, and prepare for outcomes that have not arrived. The more we try to grasp the future, the more it slips through our fingers, and the tighter we hold on.',
        'We confuse our responsibility \u2014 to act wisely, to prepare, to show up \u2014 with an impossible responsibility to guarantee results. When we carry the weight of outcomes we cannot control, the present moment becomes a place we cannot rest in.',
      ],
      transition:
        'The Gita begins by changing where we place our attention: from controlling every outcome to understanding how we act.',
    },
    scriptureTeachings: [
      {
        verseRef: { chapter: 2, verse: 47 },
        whyItMatters:
          'This is the heart of the Gita\u2019s guidance on anxiety. It draws a clear line between what is yours \u2014 the action \u2014 and what is not \u2014 the result. Anxiety thrives when we blur that line, trying to control what was never ours to hold.',
        applyItToday:
          'Pick one situation where you feel anxious about the outcome. Identify the action that is genuinely yours to take. Do it with care, and then consciously set down the weight of the result.',
      },
      {
        verseRef: { chapter: 2, verse: 14 },
        whyItMatters:
          'When anxiety tells you that this feeling will last forever, this verse reminds you that experiences come and go like seasons. Distress is not a permanent condition; it is a passing weather pattern in the mind.',
        applyItToday:
          'The next time anxious sensations arise, notice them as temporary. Say quietly: \u201CThis has come, and it will go.\u201D Let the season pass without fighting it.',
      },
      {
        verseRef: { chapter: 6, verse: 35 },
        whyItMatters:
          'The Gita does not pretend the mind is easy to steady. It calls the mind restless and difficult to restrain \u2014 and then offers a path: practice and detachment. You are not failing because your mind wanders; you are beginning the work every seeker must do.',
        applyItToday:
          'Set aside two minutes to sit quietly. When the mind pulls toward worry, gently bring it back. Do not judge the wandering \u2014 simply return. Each return is the practice.',
      },
      {
        verseRef: { chapter: 9, verse: 22 },
        whyItMatters:
          'Anxiety often comes from feeling that you alone must hold everything together. This verse offers a different ground: when the heart turns toward the Divine with sincerity, you are not carrying the weight alone. What you lack is provided; what you have is preserved.',
        applyItToday:
          'When the burden feels too heavy, try offering it upward. Silently say: \u201CI do what I can; I trust the rest to what is greater than me.\u201D Let that trust be a small experiment, not a demand.',
      },
    ],
    reflections: [
      {
        id: 'r1',
        question: 'What outcome are you trying hardest to control right now?',
      },
      {
        id: 'r2',
        question: 'What part of this situation is actually within your responsibility?',
      },
      {
        id: 'r3',
        question: 'What might acting sincerely without demanding a particular result look like?',
      },
    ],
    practice: {
      heading: 'A moment to return to the present',
      intro: 'A simple two-minute guided reflection. There is nothing to achieve here \u2014 only a gentle return.',
      steps: [
        { number: 1, text: 'Sit comfortably and become still.' },
        { number: 2, text: 'Notice what outcome your mind is trying to control.' },
        { number: 3, text: 'Bring attention back to the action that is yours to perform now.' },
        { number: 4, text: 'Release, for this moment, the demand to control the result.' },
        { number: 5, text: 'Finish with one quiet intention: \u201CLet me act with sincerity and steadiness.\u201D' },
      ],
      intention: 'Let me act with sincerity and steadiness.',
      durationSeconds: 120,
    },
    relatedContent: [
      {
        label: 'Read the related Bhagavad Gita verses',
        description: 'Browse all available verses with Sanskrit, translation, and commentary.',
        link: '/mindfulness',
      },
      {
        label: 'Explore the Meditation page',
        description: 'Guided meditation sessions to steady the mind through practice.',
        link: '/meditation',
      },
      {
        label: 'Visit Step In',
        description: 'Turn wisdom into daily spiritual practice and reflection.',
        link: '/stepin',
      },
      {
        label: 'Back to all LifeManual journeys',
        description: 'Return to the homepage and explore other life situations.',
        link: '/#what-are-you-facing',
      },
    ],
  },
  overthinking: {
    slug: 'overthinking',
    title: 'Overthinking',
    eyebrow: 'Wisdom for Overthinking',
    headline: 'When the mind will not stop turning',
    introduction:
      'This journey explores Bhagavad Gita teachings on the restless mind, the pull of attachment, the weight of imagined outcomes, and the practice of returning attention to what is real and within your hands. It is not a treatment for overthinking or any mental health condition. It is an invitation to sit with timeless wisdom and let it speak to your experience.',
    durationLabel: 'About 10 minutes',
    understanding: {
      heading: 'Why does the mind keep replaying what already happened, or rehearsing what has not?',
      paragraphs: [
        'Overthinking often takes the form of looping. A conversation already ended, yet the mind restages it, searching for the line that should have been said differently. A decision sits open, and the mind circles it, listing every possible outcome until choosing feels more dangerous than waiting.',
        'Behind the looping is a quiet demand for certainty. The mind believes that if it thinks long enough, it can guarantee a safe result. But most of what it rehearses never arrives, and the energy spent preparing for phantom futures leaves little for the only moment that is actually here.',
        'Replaying the past and rehearsing the future share one root: attachment to an outcome the mind cannot control. The more tightly we hold to how things must turn out, the more the mind spins, trying to secure what was never ours to guarantee.',
      ],
      transition:
        'The Gita does not ask the mind to simply stop. It asks us to understand what the mind is reaching for, and to redirect that reach toward what is actually ours to do.',
    },
    scriptureTeachings: [
      {
        verseRef: { chapter: 6, verse: 35 },
        whyItMatters:
          'The Gita names the mind directly: restless, moving, hard to hold. It does not pretend the mind will quiet on its own. But it offers a path, two-fold and patient, practice and detachment. The looping mind is not a sign that something is wrong with you; it is the very condition the Gita addresses.',
        applyItToday:
          'When you notice the loop, do not try to force it silent. Instead, return your attention to one simple, concrete thing in this moment, the breath, the task in front of you, the sensation of your feet on the floor. The point is not to stop the thought; it is to practice coming back.',
      },
      {
        verseRef: { chapter: 2, verse: 47 },
        whyItMatters:
          'Much of overthinking is the mind trying to control results it was never given. This verse draws the line clearly: the action is yours, the outcome is not. When the mind rehearses every possible result, it is carrying a weight the Gita says was never placed on you.',
        applyItToday:
          'Pick one decision the mind has been circling. Separate it into two columns: what is yours to do, and what is not yours to control. Commit to the first column. Let the second one sit, unresolved, for now.',
      },
      {
        verseRef: { chapter: 2, verse: 14 },
        whyItMatters:
          'The mind often treats a passing worry as a permanent fact. This verse reminds us that experiences, including the thoughts and sensations that trouble us now, come and go like seasons. The distress of overthinking is not a fixed condition; it is weather in the mind.',
        applyItToday:
          'The next time the loop tightens, notice it as something that has come, not something that will stay. Say quietly: this has arrived, and it will pass. Let the season move without needing to resolve every thought it carries.',
      },
      {
        verseRef: { chapter: 9, verse: 27 },
        whyItMatters:
          'Overthinking feeds on undirected attention. This verse offers a redirection: whatever you do, do it as an offering. When the mind has a place to go, a purpose larger than its own worry, it has less room to circle itself.',
        applyItToday:
          'Choose one ordinary task, making tea, writing a line, walking to the door. Before you begin, silently offer it. Do it with full attention, as if it mattered, because in this moment it is the only thing being asked of you.',
      },
    ],
    reflections: [
      {
        id: 'r1',
        question: 'What conversation or decision is your mind replaying most often right now?',
      },
      {
        id: 'r2',
        question: 'What outcome are you trying to guarantee by thinking it through one more time?',
      },
      {
        id: 'r3',
        question: 'What part of this is genuinely within your control, and what part is not?',
      },
      {
        id: 'r4',
        question: 'Can you notice the looping without judging yourself for it, simply as the mind doing what minds do?',
      },
    ],
    practice: {
      heading: 'A moment to find the one next step',
      intro:
        'A short practice to pause the loop, sort what is yours from what is not, and choose one constructive action. There is nothing to solve here, only a gentle returning.',
      steps: [
        { number: 1, text: 'Sit comfortably and become still. Let the breath settle.' },
        { number: 2, text: 'Notice what the mind is looping on, without trying to stop it.' },
        { number: 3, text: 'Ask: what is genuinely within my control right now?' },
        { number: 4, text: 'Ask: what am I rehearsing that is not mine to determine?' },
        { number: 5, text: 'Choose one small, concrete next step that is yours to take.' },
        { number: 6, text: 'Finish with one quiet intention: Let me do what is mine, and set down the rest.' },
      ],
      intention: 'Let me do what is mine, and set down the rest.',
      durationSeconds: 120,
    },
    relatedContent: [
      {
        label: 'Read the related Bhagavad Gita verses',
        description: 'Browse all available verses with Sanskrit, translation, and commentary.',
        link: '/mindfulness',
      },
      {
        label: 'Explore the Meditation page',
        description: 'Guided meditation sessions to practice steadying the restless mind.',
        link: '/meditation',
      },
      {
        label: 'Visit Step In',
        description: 'Turn wisdom into daily spiritual practice and reflection.',
        link: '/stepin',
      },
      {
        label: 'Back to all LifeManual journeys',
        description: 'Return to the homepage and explore other life situations.',
        link: '/#what-are-you-facing',
      },
    ],
  },
};

export const getTopic = (slug: string): WisdomTopic | undefined => wisdomTopics[slug];

export const getTeachingVerse = (teaching: ScriptureTeaching): GitaVerse | undefined => {
  return gitaVerses.find(
    v => v.chapter === teaching.verseRef.chapter && v.verse === teaching.verseRef.verse
  );
};
