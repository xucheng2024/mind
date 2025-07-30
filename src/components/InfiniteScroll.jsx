import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function InfiniteScroll({
  items = [],
  loadMore,
  hasMore = true,
  loading = false,
  renderItem,
  className = '',
  threshold = 0.1,
  pageSize = 20
}) {
  const [displayedItems, setDisplayedItems] = useState([]);
  const [page, setPage] = useState(1);
  const loadingRef = useRef(null);
  
  const { ref: inViewRef, inView } = useInView({
    threshold,
    triggerOnce: false,
  });

  // Load more items when scroll reaches bottom
  useEffect(() => {
    if (inView && hasMore && !loading) {
      handleLoadMore();
    }
  }, [inView, hasMore, loading]);

  // Update displayed items when items change
  useEffect(() => {
    const startIndex = 0;
    const endIndex = page * pageSize;
    setDisplayedItems(items.slice(startIndex, endIndex));
  }, [items, page, pageSize]);

  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    try {
      await loadMore();
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more items:', error);
    }
  }, [loadMore, loading, hasMore]);

  const LoadingSpinner = () => (
    <motion.div
      ref={inViewRef}
      className="flex justify-center py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </motion.div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <AnimatePresence>
        {displayedItems.map((item, index) => (
          <motion.div
            key={`${item.id || index}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {hasMore && (
        <LoadingSpinner />
      )}
      
      {!hasMore && displayedItems.length > 0 && (
        <motion.div
          className="text-center py-4 text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          No more items to load
        </motion.div>
      )}
    </div>
  );
}

// Optimized card grid with infinite scroll
export const InfiniteCardGrid = ({
  items = [],
  loadMore,
  hasMore = true,
  loading = false,
  renderCard,
  columns = 3,
  className = ''
}) => {
  const [displayedItems, setDisplayedItems] = useState([]);
  const [page, setPage] = useState(1);
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && hasMore && !loading) {
      handleLoadMore();
    }
  }, [inView, hasMore, loading]);

  useEffect(() => {
    const startIndex = 0;
    const endIndex = page * 12; // Load 12 items per page
    setDisplayedItems(items.slice(startIndex, endIndex));
  }, [items, page]);

  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    try {
      await loadMore();
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more cards:', error);
    }
  }, [loadMore, loading, hasMore]);

  return (
    <div className={className}>
      <div 
        className={`grid gap-4`}
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        <AnimatePresence>
          {displayedItems.map((item, index) => (
            <motion.div
              key={`${item.id || index}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              {renderCard(item, index)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {hasMore && (
        <motion.div
          ref={inViewRef}
          className="flex justify-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </motion.div>
      )}
      
      {!hasMore && displayedItems.length > 0 && (
        <motion.div
          className="text-center py-8 text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          No more items to load
        </motion.div>
      )}
    </div>
  );
}; 