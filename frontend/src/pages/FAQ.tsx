import React from 'react';

const faqs = [
  {
    q: 'How do I deploy the contract?',
    a: 'Use the deploy script in the contract folder after building. Set MASSA_PRIVATE_KEY in a .env file.'
  },
  {
    q: 'How do subscriptions work?',
    a: 'When a user buys a pass, a subscription is recorded with an expiry. Auto-renew updates it on-chain.'
  },
  {
    q: 'Where is the contract address configured?',
    a: 'Set VITE_CONTRACT_ADDRESS in frontend/.env to point the app to your deployed contract.'
  }
];

export const FAQ: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gradient mb-6">FAQ</h1>
      <div className="space-y-4">
        {faqs.map((item, idx) => (
          <div key={idx} className="glass-dark p-6 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold mb-2">{item.q}</h3>
            <p className="text-gray-300">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
