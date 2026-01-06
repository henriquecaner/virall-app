import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PainPoints } from './components/PainPoints';
import { ProblemStory } from './components/ProblemStory';
import { Solution } from './components/Solution';
import { Bonuses } from './components/Bonuses';
import { SocialProof } from './components/SocialProof';
import { Guarantee } from './components/Guarantee';
import { Scarcity } from './components/Scarcity';
import { Comparison } from './components/Comparison';
import { FAQ } from './components/FAQ';
import { Footer } from './components/Footer';
import { StickyCTA } from './components/StickyCTA';

function App() {
  return (
    <main className="min-h-screen font-sans antialiased text-dark-800 bg-white">
      <Navbar />
      <Hero />
      <PainPoints />
      <ProblemStory />
      <Solution />
      <Bonuses />
      <SocialProof />
      <Guarantee />
      <Scarcity />
      <Comparison />
      <FAQ />
      <Footer />
      <StickyCTA />
    </main>
  );
}

export default App;