// Discover Passes Page
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Ticket, Clock, Users, RefreshCw } from 'lucide-react';
import { PassService, PassData } from '../services/passService';
import toast from 'react-hot-toast';

export const Discover: React.FC = () => {
  const [passes, setPasses] = useState<PassData[]>([]);
  const [filteredPasses, setFilteredPasses] = useState<PassData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const categories = ['all', 'gym', 'event', 'course', 'membership', 'community'];

  useEffect(() => {
    loadPasses();
  }, []);

  useEffect(() => {
    filterPasses();
  }, [searchTerm, selectedCategory, passes]);

  const loadPasses = async () => {
    try {
      setLoading(true);
      const allPasses = await PassService.getAllPasses();
      setPasses(allPasses);
      setFilteredPasses(allPasses);
      if (allPasses.length === 0) {
        toast('No passes found. Be the first to create one!', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Error loading passes:', error);
      toast.error('Failed to load passes');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    PassService.clearCache();
    await loadPasses();
    setRefreshing(false);
    toast.success('Passes refreshed!');
  };

  const filterPasses = () => {
    let filtered = passes;

    if (searchTerm) {
      filtered = filtered.filter(
        (pass) =>
          pass.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pass.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((pass) => pass.category === selectedCategory);
    }

    setFilteredPasses(filtered);
  };

  const formatDuration = (seconds: bigint) => {
    const days = Number(seconds) / 86400;
    if (days >= 30) return `${Math.floor(days / 30)} months`;
    if (days >= 7) return `${Math.floor(days / 7)} weeks`;
    return `${Math.floor(days)} days`;
  };

  const formatPrice = (price: bigint) => {
    return `${Number(price) / 1e9} MAS`;
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-4xl font-bold mb-4 text-gradient">Discover Passes</h1>
            <p className="text-gray-300">Find the perfect membership or ticket for you</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="glass px-4 py-2 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </motion.div>

        {/* Search and Filters */}
        <div className="glass p-6 rounded-xl mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search passes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Passes Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading passes...</p>
          </div>
        ) : filteredPasses.length === 0 ? (
          <div className="text-center py-20">
            <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">No passes found</p>
            <p className="text-gray-500 mt-2">
              {passes.length === 0
                ? 'Be the first to create a pass!'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPasses.map((pass, index) => (
              <motion.div
                key={Number(pass.id)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl overflow-hidden card-3d hover:scale-105 transition-transform"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold">{pass.name}</h3>
                    <span className="px-2 py-1 bg-primary-600/20 text-primary-400 rounded text-xs">
                      {pass.category}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {pass.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(pass.durationSeconds)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {pass.sold} sold
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gradient">
                      {formatPrice(pass.price)}
                    </span>
                    <Link
                      to={`/pass/${Number(pass.id)}`}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


