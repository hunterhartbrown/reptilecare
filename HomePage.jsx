import React, { useState } from 'react';

// Feature flags - DEFAULT ALL FALSE as specified
const USE_HERO = false;
const SHOW_SPECIES_SHORTCUTS = false;
const SHOW_HOW_IT_WORKS = false;
const SHOW_MISSION_MICRO = false;
const SHOW_NEWSLETTER = false;
const SHOW_MIDPAGE_ENCLOSURE_CTA = false;

// Placeholder component for existing homepage
const ExistingHome = () => {
  return (
    <div className="existing-home">
      {/* This represents the current homepage content that must remain unchanged */}
      <div className="content-slider">
        <div className="slide">
          <div className="slide-image">
            <img src="/images/placeholder-reptile.jpg" alt="Current homepage content" />
          </div>
          <div className="overlay-text">
            <h3 className="common-name">Current Homepage</h3>
            <h4 className="species-name">Existing functionality preserved</h4>
          </div>
        </div>
        <div className="dots-container">
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
    </div>
  );
};

// Hero Section Component
const HeroSection = () => {
  return (
    <section data-rc-new="hero" className="bg-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Clear, science-based reptile care.
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
              Get personalized habitat recommendations backed by research and expert knowledge.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a 
                href="/enclosure-builder" 
                data-rc-event="rc_cta_enclosure_builder_click"
                className="bg-black text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors"
              >
                Build My Enclosure
              </a>
              <a 
                href="/all-care-guides" 
                className="border-2 border-black text-black px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors"
              >
                Browse Care Guides
              </a>
            </div>
          </div>
          <div className="flex-1">
            <img 
              src="/images/hero-reptile-habitat.jpg" 
              alt="Well-designed reptile habitat with proper lighting and plants"
              className="w-full h-96 object-cover rounded-lg shadow-lg"
              width="600"
              height="400"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

// Species Shortcuts Component
const SpeciesShortcuts = () => {
  const species = [
    { name: 'Leopard Gecko', slug: 'leopard-gecko', image: '/images/leopard-gecko-tile.jpg' },
    { name: 'Bearded Dragon', slug: 'bearded-dragon', image: '/images/bearded-dragon-tile.jpg' },
    { name: 'Crested Gecko', slug: 'crested-gecko', image: '/images/crested-gecko-tile.jpg' },
    { name: 'Ball Python', slug: 'ball-python', image: '/images/ball-python-tile.jpg' },
    { name: 'Blue Tongue Skink', slug: 'blue-tongue-skink', image: '/images/blue-tongue-skink-tile.jpg' },
    { name: 'Corn Snake', slug: 'corn-snake', image: '/images/corn-snake-tile.jpg' }
  ];

  return (
    <section data-rc-new="species-shortcuts" className="bg-gray-50 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Popular Species
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {species.map((animal) => (
            <a
              key={animal.slug}
              href={`/enclosure-builder?reptile=${animal.slug}`}
              className="group block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              <img
                src={animal.image}
                alt={`${animal.name} care guide`}
                className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                width="200"
                height="128"
                loading="lazy"
              />
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-900 text-center">
                  {animal.name}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

// How It Works Component
const HowItWorks = () => {
  const steps = [
    {
      number: '1',
      title: 'Pick Your Species',
      description: 'Select your reptile from our comprehensive database of care requirements.'
    },
    {
      number: '2',
      title: 'Auto-Size Habitat',
      description: 'Get personalized recommendations for enclosure size, heating, and UVB lighting.'
    },
    {
      number: '3',
      title: 'Add Décor & Export',
      description: 'Customize with plants, hides, and substrate, then export your shopping list.'
    }
  ];

  return (
    <section data-rc-new="how-it-works" className="bg-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Creating the perfect habitat for your reptile has never been easier
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">
            * This site contains affiliate links. We may earn a commission when you purchase through our recommendations.
          </p>
        </div>
      </div>
    </section>
  );
};

// Mission Micro Component
const MissionMicro = () => {
  return (
    <section data-rc-new="mission-micro" className="bg-gray-900 text-white py-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-lg mb-4">
          We believe every reptile deserves a habitat that supports their natural behaviors and promotes long-term health. 
          Our science-based approach helps you create environments where your reptile can truly thrive.
        </p>
        <a 
          href="/about" 
          className="text-blue-400 hover:text-blue-300 font-semibold underline"
        >
          Learn more about our mission
        </a>
      </div>
    </section>
  );
};

// Newsletter Component
const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Client-side mock only - no network request
    if (email) {
      setSubscribed(true);
      setEmail('');
      // TODO: Integrate with actual newsletter service in the future
    }
  };

  return (
    <section data-rc-new="newsletter" className="bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Stay Updated
        </h3>
        <p className="text-gray-600 mb-6">
          Get the latest care tips, species spotlights, and habitat guides delivered to your inbox.
        </p>
        
        {subscribed ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg">
            Thank you for subscribing! We'll be in touch soon.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

// Mid-Page CTA Component
const MidPageCTA = () => {
  return (
    <section data-rc-new="midpage-enclosure-cta" className="bg-black text-white py-8 px-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold mb-2">
            Ready to build the perfect habitat?
          </h3>
          <p className="text-gray-300">
            Our enclosure builder makes it easy to get started.
          </p>
        </div>
        <a 
          href="/enclosure-builder"
          className="bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors whitespace-nowrap"
        >
          Start Building
        </a>
      </div>
    </section>
  );
};

// Main HomePage Component
const HomePage = () => {
  return (
    <div className="homepage">
      {/* Always render existing homepage */}
      <ExistingHome />
      
      {/* Conditionally render new sections based on feature flags */}
      {USE_HERO && <HeroSection />}
      
      {SHOW_SPECIES_SHORTCUTS && <SpeciesShortcuts />}
      
      {SHOW_HOW_IT_WORKS && <HowItWorks />}
      
      {SHOW_MIDPAGE_ENCLOSURE_CTA && <MidPageCTA />}
      
      {SHOW_MISSION_MICRO && <MissionMicro />}
      
      {SHOW_NEWSLETTER && <Newsletter />}
      
      {/* TODO: Future integration points */}
      {/* TODO: Add quiz integration when feature becomes available */}
      {/* TODO: Add advanced analytics tracking for user behavior */}
    </div>
  );
};

export default HomePage;
