// Landing Page
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ticket, Users, Zap, Shield, Sparkles, ArrowRight } from 'lucide-react';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-purple-900/20 to-primary-900/20" />
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="animate-float"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient">
              Sell Memberships, Tickets, and Passes
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Fully on-chain, unstoppable, and automated. Built on Massa blockchain with
              autonomous smart contracts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/creator"
                className="glass px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/20 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Start as Creator
              </Link>
              <Link
                to="/discover"
                className="glass px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/20 transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <Ticket className="w-5 h-5" />
                Browse Passes
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            Why Choose Autopass?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'Autonomous',
                description:
                  'Smart contracts handle renewals, expiry, and payments automatically. No servers, no cron jobs.',
              },
              {
                icon: Shield,
                title: 'Fully On-Chain',
                description:
                  'Everything runs on Massa blockchain. Decentralized, transparent, and unstoppable.',
              },
              {
                icon: Users,
                title: 'For Everyone',
                description:
                  'Perfect for gyms, events, courses, communities, and any membership-based service.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass p-6 rounded-xl card-3d"
              >
                <feature.icon className="w-12 h-12 text-primary-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Connect Wallet', desc: 'Use Bearby or Massa Station' },
              { step: '2', title: 'Create Pass', desc: 'Set price, duration, and features' },
              { step: '3', title: 'Users Buy', desc: 'One-click subscription purchase' },
              { step: '4', title: 'Auto-Renew', desc: 'Smart contracts handle everything' },
            ].map((item, index) => (
              <div key={index} className="glass p-6 rounded-xl text-center">
                <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="glass p-12 rounded-2xl"
          >
            <h2 className="text-4xl font-bold mb-4 text-gradient">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join creators and users building the future of decentralized memberships.
            </p>
            <Link
              to="/discover"
              className="inline-flex items-center gap-2 glass px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/20 transition-all hover:scale-105"
            >
              Explore Passes
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

