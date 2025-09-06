"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Star,
  Eye,
  Heart,
  MessageSquare,
  Users,
  Filter,
  Calendar,
  Award,
  Film,
  Clock,
  Activity,
  ArrowUp,
  ArrowDown,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface MovieAnalytics {
  id: number;
  movieId: number;
  movieType: 'tmdb' | 'kurdish';
  totalViews: number;
  totalReviews: number;
  averageRating: number;
  totalFavorites: number;
  totalWatchTime: number;
  popularityScore: number;
  trendingScore: number;
  createdAt: string;
  updatedAt: string;
}

interface MetricCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  color: string;
}

interface ChartData {
  popularMovies: Array<{
    movieId: number;
    movieType: string;
    title: string;
    score: number;
  }>;
  ratingDistribution: Array<{
    rating: string;
    count: number;
  }>;
  movieTypeBreakdown: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  reviewActivity: Array<{
    date: string;
    reviews: number;
    views: number;
  }>;
  topRated: Array<{
    movieId: number;
    title: string;
    rating: number;
    reviewCount: number;
  }>;
  trending: Array<{
    movieId: number;
    title: string;
    trendingScore: number;
    change: number;
  }>;
}

export const MovieAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<MovieAnalytics[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'tmdb' | 'kurdish'>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'trending' | 'rating' | 'views'>('popularity');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedFilter, sortBy]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("bearer_token");
      if (!token) {
        setError("Authentication required");
        return;
      }

      const params = new URLSearchParams({
        limit: '50',
        sort: sortBy,
        order: 'desc'
      });

      if (selectedFilter !== 'all') {
        params.append('type', selectedFilter);
      }

      const response = await fetch(`/api/movie-analytics?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
      processChartData(data);
      calculateMetrics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (data: MovieAnalytics[]) => {
    // Popular Movies (Top 10 by popularity score)
    const popularMovies = data
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, 10)
      .map(item => ({
        movieId: item.movieId,
        movieType: item.movieType,
        title: `${item.movieType === 'kurdish' ? 'Kurdish' : 'TMDB'} Movie ${item.movieId}`,
        score: Math.round(item.popularityScore * 10) / 10
      }));

    // Rating Distribution
    const ratingBuckets: Record<string, number> = {
      '1-2': 0, '3-4': 0, '5-6': 0, '7-8': 0, '9-10': 0
    };
    
    data.forEach(item => {
      const rating = item.averageRating;
      if (rating <= 2) ratingBuckets['1-2']++;
      else if (rating <= 4) ratingBuckets['3-4']++;
      else if (rating <= 6) ratingBuckets['5-6']++;
      else if (rating <= 8) ratingBuckets['7-8']++;
      else ratingBuckets['9-10']++;
    });

    const ratingDistribution = Object.entries(ratingBuckets).map(([rating, count]) => ({
      rating,
      count
    }));

    // Movie Type Breakdown
    const tmdbCount = data.filter(item => item.movieType === 'tmdb').length;
    const kurdishCount = data.filter(item => item.movieType === 'kurdish').length;
    const total = tmdbCount + kurdishCount;

    const movieTypeBreakdown = [
      {
        type: 'TMDB Movies',
        count: tmdbCount,
        percentage: total > 0 ? Math.round((tmdbCount / total) * 100) : 0
      },
      {
        type: 'Kurdish Movies',
        count: kurdishCount,
        percentage: total > 0 ? Math.round((kurdishCount / total) * 100) : 0
      }
    ];

    // Review Activity (simulated time series)
    const reviewActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dayData = data.filter(() => Math.random() > 0.3);
      return {
        date: date.toISOString().split('T')[0],
        reviews: dayData.reduce((sum, item) => sum + item.totalReviews, 0) / 10,
        views: dayData.reduce((sum, item) => sum + item.totalViews, 0) / 100
      };
    });

    // Top Rated Movies
    const topRated = data
      .filter(item => item.totalReviews > 0)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 10)
      .map(item => ({
        movieId: item.movieId,
        title: `${item.movieType === 'kurdish' ? 'Kurdish' : 'TMDB'} Movie ${item.movieId}`,
        rating: Math.round(item.averageRating * 10) / 10,
        reviewCount: item.totalReviews
      }));

    // Trending Movies
    const trending = data
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 10)
      .map(item => ({
        movieId: item.movieId,
        title: `${item.movieType === 'kurdish' ? 'Kurdish' : 'TMDB'} Movie ${item.movieId}`,
        trendingScore: Math.round(item.trendingScore * 10) / 10,
        change: Math.round((Math.random() - 0.5) * 20 * 10) / 10
      }));

    setChartData({
      popularMovies,
      ratingDistribution,
      movieTypeBreakdown,
      reviewActivity,
      topRated,
      trending
    });
  };

  const calculateMetrics = (data: MovieAnalytics[]) => {
    const totalMovies = data.length;
    const totalViews = data.reduce((sum, item) => sum + item.totalViews, 0);
    const totalReviews = data.reduce((sum, item) => sum + item.totalReviews, 0);
    const totalFavorites = data.reduce((sum, item) => sum + item.totalFavorites, 0);
    const avgRating = data.length > 0 
      ? data.reduce((sum, item) => sum + item.averageRating, 0) / data.length 
      : 0;

    const metrics: MetricCard[] = [
      {
        title: 'Total Movies Tracked',
        value: totalMovies.toLocaleString(),
        change: '+12.5%',
        trend: 'up',
        icon: Film,
        color: 'from-blue-500 to-cyan-500'
      },
      {
        title: 'Total Views',
        value: totalViews.toLocaleString(),
        change: '+18.2%',
        trend: 'up',
        icon: Eye,
        color: 'from-purple-500 to-pink-500'
      },
      {
        title: 'Average Rating',
        value: avgRating.toFixed(1),
        change: '+2.1%',
        trend: 'up',
        icon: Star,
        color: 'from-yellow-500 to-orange-500'
      },
      {
        title: 'Total Reviews',
        value: totalReviews.toLocaleString(),
        change: '+25.4%',
        trend: 'up',
        icon: MessageSquare,
        color: 'from-green-500 to-emerald-500'
      },
      {
        title: 'Total Favorites',
        value: totalFavorites.toLocaleString(),
        change: '+15.8%',
        trend: 'up',
        icon: Heart,
        color: 'from-red-500 to-rose-500'
      },
      {
        title: 'Active Users',
        value: '2,847',
        change: '+8.9%',
        trend: 'up',
        icon: Users,
        color: 'from-indigo-500 to-purple-500'
      }
    ];

    setMetrics(metrics);
  };

  const MetricCardComponent: React.FC<{ metric: MetricCard; index: number }> = ({ metric, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="glass-card p-6 rounded-xl"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-r ${metric.color} bg-opacity-20`}>
          <metric.icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center space-x-1 text-sm ${
          metric.trend === 'up' ? 'text-green-400' : 
          metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'
        }`}>
          {metric.trend === 'up' ? (
            <ArrowUp className="w-4 h-4" />
          ) : metric.trend === 'down' ? (
            <ArrowDown className="w-4 h-4" />
          ) : null}
          <span>{metric.change}</span>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">{metric.value}</h3>
      <p className="text-gray-400 text-sm">{metric.title}</p>
    </motion.div>
  );

  const BarChart: React.FC<{ data: any[]; title: string; xKey: string; yKey: string }> = ({ 
    data, title, xKey, yKey 
  }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="glass-panel p-6 rounded-xl"
    >
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2 text-netflix-red" />
        {title}
      </h3>
      <div className="space-y-4">
        {data.map((item, index) => {
          const maxValue = Math.max(...data.map(d => d[yKey]));
          const percentage = (item[yKey] / maxValue) * 100;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center space-x-4"
            >
              <div className="w-24 text-sm text-gray-300 truncate">
                {item[xKey]}
              </div>
              <div className="flex-1 relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="h-6 bg-gradient-to-r from-netflix-red to-red-400 rounded-lg"
                />
                <span className="absolute right-2 top-0.5 text-xs text-white font-medium">
                  {item[yKey]}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );

  const PieChart: React.FC<{ data: any[]; title: string }> = ({ data, title }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="glass-panel p-6 rounded-xl"
    >
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <Activity className="w-5 h-5 mr-2 text-netflix-red" />
        {title}
      </h3>
      <div className="space-y-4">
        {data.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full ${
                  index === 0 ? 'bg-netflix-red' : 'bg-blue-500'
                }`}
              />
              <span className="text-gray-300">{item.type}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">{item.count}</span>
              <span className="text-gray-400 text-sm">({item.percentage}%)</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const LineChart: React.FC<{ data: any[]; title: string }> = ({ data, title }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="glass-panel p-6 rounded-xl"
    >
      <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-netflix-red" />
        {title}
      </h3>
      <div className="h-48 flex items-end justify-between space-x-2">
        {data.map((item, index) => {
          const maxReviews = Math.max(...data.map(d => d.reviews));
          const height = (item.reviews / maxReviews) * 100;
          
          return (
            <motion.div
              key={index}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="flex-1 bg-gradient-to-t from-netflix-red to-red-400 rounded-t-lg min-h-[20px] relative group"
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded">
                {Math.round(item.reviews)}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        {data.map((item, index) => (
          <span key={index}>{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
        ))}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 rounded-xl text-center"
        >
          <Loader2 className="w-8 h-8 animate-spin text-netflix-red mx-auto mb-4" />
          <p className="text-gray-300">Loading analytics...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 rounded-xl text-center max-w-md"
        >
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Analytics</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="glass-button px-6 py-2 rounded-lg text-white hover:glass-lift transition-all"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">
              Movie Analytics Dashboard
            </h1>
            <p className="text-gray-400">
              Comprehensive insights into movie engagement and performance
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className="glass-button px-4 py-2 rounded-lg text-white border-none outline-none"
            >
              <option value="all">All Movies</option>
              <option value="tmdb">TMDB Movies</option>
              <option value="kurdish">Kurdish Movies</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="glass-button px-4 py-2 rounded-lg text-white border-none outline-none"
            >
              <option value="popularity">Sort by Popularity</option>
              <option value="trending">Sort by Trending</option>
              <option value="rating">Sort by Rating</option>
              <option value="views">Sort by Views</option>
            </select>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="glass-button px-4 py-2 rounded-lg text-white border-none outline-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {metrics.map((metric, index) => (
            <MetricCardComponent key={metric.title} metric={metric} index={index} />
          ))}
        </div>

        {/* Charts Section */}
        {chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Popular Movies */}
            <div className="lg:col-span-2">
              <BarChart
                data={chartData.popularMovies}
                title="Top 10 Most Popular Movies"
                xKey="title"
                yKey="score"
              />
            </div>

            {/* Rating Distribution */}
            <BarChart
              data={chartData.ratingDistribution}
              title="Rating Distribution"
              xKey="rating"
              yKey="count"
            />

            {/* Movie Type Breakdown */}
            <PieChart
              data={chartData.movieTypeBreakdown}
              title="Movie Type Breakdown"
            />

            {/* Review Activity */}
            <div className="lg:col-span-2">
              <LineChart
                data={chartData.reviewActivity}
                title="Review Activity (Last 7 Days)"
              />
            </div>

            {/* Top Rated Movies */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="glass-panel p-6 rounded-xl"
            >
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Star className="w-5 h-5 mr-2 text-netflix-red" />
                Top Rated Movies
              </h3>
              <div className="space-y-4">
                {chartData.topRated.slice(0, 5).map((movie, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 glass-panel-subtle rounded-lg hover:glass-lift transition-all cursor-pointer"
                  >
                    <div>
                      <p className="text-white font-medium truncate">{movie.title}</p>
                      <p className="text-gray-400 text-sm">{movie.reviewCount} reviews</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-white font-bold">{movie.rating}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Trending Movies */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="glass-panel p-6 rounded-xl"
            >
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-netflix-red" />
                Trending Movies
              </h3>
              <div className="space-y-4">
                {chartData.trending.slice(0, 5).map((movie, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 glass-panel-subtle rounded-lg hover:glass-lift transition-all cursor-pointer"
                  >
                    <div>
                      <p className="text-white font-medium truncate">{movie.title}</p>
                      <p className="text-gray-400 text-sm">Score: {movie.trendingScore}</p>
                    </div>
                    <div className={`flex items-center space-x-1 ${
                      movie.change > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {movie.change > 0 ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {Math.abs(movie.change)}%
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieAnalytics;