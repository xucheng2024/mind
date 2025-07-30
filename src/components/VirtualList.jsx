import React from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { motion } from 'framer-motion';

export default function VirtualList({ 
  items, 
  itemHeight = 60, 
  renderItem, 
  className = '',
  overscanCount = 5 
}) {
  const Row = ({ index, style }) => {
    const item = items[index];
    
    return (
      <motion.div
        style={style}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.05 }}
        className="px-4 py-2"
      >
        {renderItem(item, index)}
      </motion.div>
    );
  };

  return (
    <div className={`h-full ${className}`}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            itemCount={items.length}
            itemSize={itemHeight}
            width={width}
            overscanCount={overscanCount}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

// Optimized table component for large datasets
export const VirtualTable = ({ 
  data, 
  columns, 
  rowHeight = 50,
  className = '' 
}) => {
  const Row = ({ index, style }) => {
    const row = data[index];
    
    return (
      <motion.div
        style={style}
        className="flex border-b border-gray-200 hover:bg-gray-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {columns.map((column, colIndex) => (
          <div
            key={colIndex}
            className={`px-4 py-3 ${column.className || ''}`}
            style={{ width: column.width || 'auto' }}
          >
            {column.render ? column.render(row[column.key], row, index) : row[column.key]}
          </div>
        ))}
      </motion.div>
    );
  };

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex bg-gray-50 border-b border-gray-200">
        {columns.map((column, index) => (
          <div
            key={index}
            className={`px-4 py-3 font-medium text-gray-700 ${column.className || ''}`}
            style={{ width: column.width || 'auto' }}
          >
            {column.header}
          </div>
        ))}
      </div>
      
      {/* Virtualized body */}
      <div className="h-96">
        <AutoSizer>
          {({ height, width }) => (
            <List
              height={height}
              itemCount={data.length}
              itemSize={rowHeight}
              width={width}
              overscanCount={5}
            >
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}; 