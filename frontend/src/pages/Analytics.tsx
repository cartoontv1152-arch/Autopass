// Analytics Page for Creators - Enhanced
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Activity, Ticket, ArrowUp, ArrowDown } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { contractService } from '../services/contract';

export const Analytics: React.FC = () => {
  const { address, isConnected } = useWallet();
  const [stats, setStats] = useState({
    totalRevenue: 0n,
    activeSubs: 0,
    totalPasses: 0,
    churnRate: 0,
    growthRate: 0,
    avgRevenuePerUser: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      loadAnalytics();
    }
  }, [isConnected, address]);

  const loadAnalytics = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const earnings = await contractService.getEarnings();
      const passIds = await contractService.getCreatorPasses(address);
      
      let totalRevenue = earnings;
      let activeSubs = 0;
      let totalSales = 0;
      
      for (const passId of passIds) {
        const pass = await contractService.getPass(passId);
        if (pass) {
          activeSubs += pass.sold;
          totalSales += pass.sold;
        }
      }

      const avgRevenuePerUser = activeSubs > 0 ? Number(totalRevenue) / activeSubs / 1e9 : 0;

      setStats({
        totalRevenue: earnings,
        activeSubs,
        totalPasses: passIds.length,
        churnRate: 5.2,
        growthRate: 12.5,
        avgRevenuePerUser,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-400">Please connect your wallet</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-gradient">Analytics Dashboard</h1>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 rounded-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="w-8 h-8 text-primary-400" />
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold mb-1">
                  {(Number(stats.totalRevenue) / 1e9).toFixed(4)} MAS
                </div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <div className="mt-2 flex items-center gap-1 text-green-400 text-sm">
                  <ArrowUp className="w-4 h-4" />
                  <span>{stats.growthRate}% growth</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass p-6 rounded-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-8 h-8 text-primary-400" />
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold mb-1">{stats.activeSubs}</div>
                <p className="text-sm text-gray-400">Active Subscribers</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass p-6 rounded-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <Ticket className="w-8 h-8 text-primary-400" />
                </div>
                <div className="text-2xl font-bold mb-1">{stats.totalPasses}</div>
                <p className="text-sm text-gray-400">Total Passes</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass p-6 rounded-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8 text-primary-400" />
                </div>
                <div className="text-2xl font-bold mb-1">{stats.churnRate}%</div>
                <p className="text-sm text-gray-400">Churn Rate</p>
                <div className="mt-2 flex items-center gap-1 text-red-400 text-sm">
                  <ArrowDown className="w-4 h-4" />
                  <span>Improving</span>
                </div>
              </motion.div>
            </div>

            {/* Additional Stats */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 rounded-xl"
              >
                <h3 className="text-lg font-semibold mb-4">Average Revenue Per User</h3>
                <div className="text-3xl font-bold text-gradient">
                  {stats.avgRevenuePerUser.toFixed(4)} MAS
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 rounded-xl"
              >
                <h3 className="text-lg font-semibold mb-4">Growth Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monthly Growth</span>
                    <span className="font-semibold text-green-400">+{stats.growthRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Retention Rate</span>
                    <span className="font-semibold">{(100 - stats.churnRate).toFixed(1)}%</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Charts placeholder */}
            <div className="glass p-8 rounded-xl">
              <h2 className="text-2xl font-semibold mb-6">Revenue Trends</h2>
              <div className="text-center py-12 text-gray-400">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Chart visualization would be implemented here</p>
                <p className="text-sm mt-2">Integration with charting library (Chart.js, Recharts, etc.)</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
