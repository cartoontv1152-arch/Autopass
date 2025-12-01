import React from 'react';

export const About: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gradient mb-4">About Autopass</h1>
      <p className="text-gray-300 mb-6">
        Autopass lets creators sell access passes and issue on-chain certificates on Massa.
        Subscriptions renew automatically and access checks happen entirely on-chain.
      </p>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-dark p-6 rounded-xl border border-white/10">
          <h2 className="text-xl font-semibold mb-2">On-chain Access</h2>
          <p className="text-gray-400">Access rights and subscriptions are stored in the smart contract.</p>
        </div>
        <div className="glass-dark p-6 rounded-xl border border-white/10">
          <h2 className="text-xl font-semibold mb-2">Certificates</h2>
          <p className="text-gray-400">Issue verifiable certificates tied to passes and recipients.</p>
        </div>
        <div className="glass-dark p-6 rounded-xl border border-white/10">
          <h2 className="text-xl font-semibold mb-2">Creator Earnings</h2>
          <p className="text-gray-400">Track and withdraw earnings directly from the contract.</p>
        </div>
      </div>
    </div>
  );
};

export default About;
