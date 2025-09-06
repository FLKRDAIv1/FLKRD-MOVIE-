"use client";

import React from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Filter, Star, Clock, Download } from "lucide-react";

interface SkeletonProps {
  className?: string;
}

// MovieCardSkeleton - For movie poster cards
export const MovieCardSkeleton = ({ className }: SkeletonProps) => {
  return (
    <motion.div
      className={`glass-card p-4 rounded-lg ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Poster skeleton with 2:3 aspect ratio */}
      <div className="relative mb-4">
        <Skeleton className="w-full aspect-[2/3] rounded-md loading-shimmer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-md" />
      </div>
      
      {/* Title skeleton (1-2 lines) */}
      <div className="space-y-2 mb-3">
        <Skeleton className="h-4 w-full loading-shimmer" />
        <Skeleton className="h-4 w-3/4 loading-shimmer" />
      </div>
      
      {/* Rating and year skeletons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-muted-foreground" />
          <Skeleton className="h-3 w-8 loading-shimmer" />
        </div>
        <Skeleton className="h-3 w-12 loading-shimmer" />
      </div>
      
      {/* Genre tags skeleton */}
      <div className="flex gap-2 mt-3">
        <Skeleton className="h-6 w-16 rounded-full loading-shimmer" />
        <Skeleton className="h-6 w-20 rounded-full loading-shimmer" />
      </div>
    </motion.div>
  );
};

// TrendingCarouselSkeleton - For horizontal trending section
export const TrendingCarouselSkeleton = ({ className }: SkeletonProps) => {
  return (
    <motion.div
      className={`glass-panel p-6 rounded-lg ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 loading-shimmer" />
          <Skeleton className="h-4 w-64 loading-shimmer" />
        </div>
        <Skeleton className="h-10 w-24 rounded-md loading-shimmer" />
      </div>
      
      {/* Horizontal scroll container */}
      <div className="custom-scrollbar overflow-x-auto">
        <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
          {Array.from({ length: 8 }).map((_, index) => (
            <motion.div
              key={index}
              className="flex-shrink-0 w-48"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MovieCardSkeleton />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// DetailOverlaySkeleton - For movie detail modal
export const DetailOverlaySkeleton = ({ className }: SkeletonProps) => {
  return (
    <motion.div
      className={`fixed inset-0 z-50 glass-card ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-full overflow-y-auto custom-scrollbar">
        {/* Backdrop skeleton */}
        <div className="relative h-96 md:h-[60vh]">
          <Skeleton className="w-full h-full loading-shimmer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          
          {/* Close button skeleton */}
          <div className="absolute top-4 right-4">
            <Skeleton className="h-10 w-10 rounded-full loading-shimmer" />
          </div>
        </div>
        
        <div className="relative -mt-32 px-6 pb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Movie poster skeleton */}
            <div className="flex-shrink-0">
              <Skeleton className="w-64 h-96 rounded-lg loading-shimmer" />
            </div>
            
            {/* Movie details */}
            <div className="flex-1 space-y-6">
              {/* Title and metadata */}
              <div className="space-y-4">
                <Skeleton className="h-12 w-3/4 loading-shimmer" />
                <div className="flex items-center gap-4">
                  <Skeleton className="h-6 w-20 loading-shimmer" />
                  <Skeleton className="h-6 w-16 loading-shimmer" />
                  <Skeleton className="h-6 w-24 loading-shimmer" />
                </div>
              </div>
              
              {/* Action buttons skeleton */}
              <div className="flex gap-4">
                <Skeleton className="h-12 w-32 rounded-md loading-shimmer" />
                <Skeleton className="h-12 w-32 rounded-md loading-shimmer" />
                <Skeleton className="h-12 w-12 rounded-md loading-shimmer" />
              </div>
              
              {/* Overview skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-6 w-24 loading-shimmer" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full loading-shimmer" />
                  <Skeleton className="h-4 w-full loading-shimmer" />
                  <Skeleton className="h-4 w-3/4 loading-shimmer" />
                </div>
              </div>
              
              {/* Additional metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-20 loading-shimmer" />
                  <Skeleton className="h-4 w-32 loading-shimmer" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24 loading-shimmer" />
                  <Skeleton className="h-4 w-28 loading-shimmer" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Cast list skeleton */}
          <div className="mt-12">
            <Skeleton className="h-8 w-32 mb-6 loading-shimmer" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <motion.div
                  key={index}
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Skeleton className="w-full aspect-square rounded-full loading-shimmer" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-full loading-shimmer" />
                    <Skeleton className="h-3 w-3/4 loading-shimmer" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Streaming sources skeleton */}
          <div className="mt-12">
            <Skeleton className="h-8 w-48 mb-6 loading-shimmer" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <motion.div
                  key={index}
                  className="glass-panel-subtle p-4 rounded-lg space-y-3"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Skeleton className="h-12 w-12 rounded loading-shimmer" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-full loading-shimmer" />
                    <Skeleton className="h-3 w-3/4 loading-shimmer" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// SearchBarSkeleton - For search interface
export const SearchBarSkeleton = ({ className }: SkeletonProps) => {
  return (
    <motion.div
      className={`glass-card p-6 rounded-lg ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Search input skeleton */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Skeleton className="h-12 w-full rounded-md loading-shimmer" />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Skeleton className="h-5 w-5 loading-shimmer" />
          </div>
        </div>
        <Skeleton className="h-12 w-24 rounded-md loading-shimmer" />
      </div>
      
      {/* Filter buttons skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Skeleton className="h-10 w-20 rounded-full loading-shimmer" />
            </motion.div>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Skeleton className="h-10 w-16 rounded-md loading-shimmer" />
        </div>
      </div>
      
      {/* Quick filters */}
      <div className="flex gap-2 mt-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Skeleton className="h-8 w-16 rounded-full loading-shimmer" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// VideoPlayerSkeleton - For video player loading
export const VideoPlayerSkeleton = ({ className }: SkeletonProps) => {
  return (
    <motion.div
      className={`glass-card rounded-lg overflow-hidden ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Video container skeleton */}
      <div className="relative aspect-video bg-black">
        <Skeleton className="w-full h-full loading-shimmer" />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="glass-button p-6 rounded-full"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Play className="h-12 w-12 text-white" />
          </motion.div>
        </div>
        
        {/* Loading indicator */}
        <div className="absolute top-4 left-4">
          <div className="flex items-center gap-2 glass-panel-subtle px-3 py-2 rounded">
            <div className="animate-spin h-4 w-4 border-2 border-netflix-red border-t-transparent rounded-full" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      </div>
      
      {/* Source selection skeleton */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32 loading-shimmer" />
          <Skeleton className="h-8 w-20 rounded loading-shimmer" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <motion.div
              key={index}
              className="glass-panel-subtle p-3 rounded-lg space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Skeleton className="h-8 w-8 rounded loading-shimmer" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-full loading-shimmer" />
                <Skeleton className="h-2 w-3/4 loading-shimmer" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Controls skeleton */}
      <div className="glass-panel p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded loading-shimmer" />
          <Skeleton className="h-10 w-10 rounded loading-shimmer" />
          <Skeleton className="h-10 w-10 rounded loading-shimmer" />
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Skeleton className="h-4 w-16 loading-shimmer" />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded loading-shimmer" />
          <Download className="h-5 w-5 text-muted-foreground" />
          <Skeleton className="h-8 w-8 rounded loading-shimmer" />
        </div>
      </div>
      
      {/* Progress bar skeleton */}
      <div className="px-4 pb-4">
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 h-full bg-netflix-red rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "30%" }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          />
        </div>
      </div>
    </motion.div>
  );
};