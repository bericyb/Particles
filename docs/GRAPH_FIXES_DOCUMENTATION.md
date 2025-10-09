# Graph Rendering and Data Handling Fixes

## Overview

This document outlines the fixes implemented to resolve three critical issues in the Particles project:

1. **Initial render of nodes on index.html not working**
2. **Node labels showing UUID instead of title**
3. **MCP server and HTTP server schema mismatches**

## Issues Fixed

### 1. Initial Render Problem

**Problem**: The graph would not render nodes on initial page load, even when data was successfully fetched from the server.

**Root Cause**: The data fetching logic in `graph.js` was converting the full graph structure (`{nodes: {...}, edges: {...}}`) to only a Map of nodes, losing the edges data. The `drawParticles` function in `utils.js` checks for the presence of both `nodes` and `edges` properties to determine if it should use the new graph rendering format.

**Solution**: 
- Modified the data fetching logic to preserve the full graph structure when available
- Updated data handling throughout the application to support both legacy and new graph formats
- Implemented proper format detection in all relevant functions

**Files Modified**:
- `src/public/graph.js` - Lines 32-50 (data fetching and format handling)
- `src/public/utils.js` - Enhanced format detection in `drawParticles` function

### 2. Node Label Display Issue

**Problem**: When adding new nodes, the labels displayed the UUID key instead of the user-provided title.

**Root Cause**: The `drawGraph` and `drawLegacyParticles` functions in `utils.js` were using the node key (UUID) as the display label instead of checking for a `title` property first.

**Solution**:
- Updated both `drawGraph` and `drawLegacyParticles` functions to use `node.title || nodeKey` for label display
- This ensures titles are shown when available, with UUID as fallback

**Files Modified**:
- `src/public/utils.js` - Lines 103 and 156 (label display logic)

### 3. Data Format Compatibility

**Problem**: The application needed to handle multiple data formats (new graph format, legacy Map format, and legacy object format) consistently across all functions.

**Root Cause**: Various functions throughout the codebase were assuming a single data format, causing errors when different formats were encountered.

**Solution**:
- Implemented consistent format detection logic across all functions
- Updated click handlers, drag handlers, edit/delete functions to work with all formats
- Maintained backward compatibility with existing data

**Files Modified**:
- `src/public/graph.js` - Multiple functions updated for format compatibility
- Event handlers: `handleClick`, `editParticle`, `deleteParticle`, mouse event handlers

## Technical Implementation Details

### Data Format Detection Logic

The application now supports three data formats:

```javascript
// New graph format
{
  nodes: { "uuid": { x, y, title, radius, data }, ... },
  edges: { "edgeId": { source, target, label, directed }, ... }
}

// Legacy Map format
new Map([
  ["uuid", { x, y, title, radius, edges: [...] }],
  ...
])

// Legacy object format
{
  "uuid": { x, y, title, radius, edges: [...] },
  ...
}
```

### Format Detection Implementation

```javascript
function getNodesFromParticles(particles) {
  let nodes;
  if (particles && particles.nodes) {
    // New graph format
    nodes = particles.nodes;
  } else if (particles instanceof Map) {
    // Legacy Map format
    nodes = Object.fromEntries(particles);
  } else {
    // Legacy object format
    nodes = particles;
  }
  return nodes;
}
```

### Label Display Logic

```javascript
// In utils.js - both drawGraph and drawLegacyParticles
const displayLabel = node.title || nodeKey;
ctx.fillText(displayLabel, node.x, node.y - node.radius * 1.4);
```

## Testing

### Automated Test Suite

Created comprehensive test suite (`tests/test-graph-fixes.js`) that validates:

- Initial data loading and structure validation
- Node label display logic
- Legacy format compatibility
- Data format handling across different scenarios
- Node click handling with various data formats
- Server schema consistency

### Running Tests

```bash
# Install test dependencies
npm install --save-dev jsdom

# Run the test suite
node tests/test-graph-fixes.js
```

### Test Coverage

The test suite covers:
- ✅ Graph data structure validation
- ✅ Node label display (title vs UUID)
- ✅ Legacy format backward compatibility
- ✅ Format detection logic
- ✅ Click handling across formats
- ✅ Schema consistency validation

## MCP Server Schema Alignment

### Current Schema Consistency

The MCP tools and HTTP endpoints now use consistent schemas:

**Node Schema**:
```typescript
interface Node {
  x: number;
  y: number;
  title: string;
  radius: number;
  color?: string;
  data?: any;
}
```

**Graph Schema**:
```typescript
interface GraphData {
  nodes: { [key: string]: Node };
  edges: { [edgeId: string]: Edge };
}
```

**Edge Schema**:
```typescript
interface Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
  directed: boolean;
  weight?: number;
  metadata?: any;
}
```

### MCP Tools Validation

All MCP tools in `src/server/mcp/tools.ts` have been verified to:
- Use consistent input/output schemas
- Match HTTP endpoint expectations
- Provide accurate tool descriptions
- Handle both legacy and new data formats appropriately

## Performance Considerations

### Optimizations Implemented

1. **Efficient Format Detection**: Single check determines data format, avoiding repeated type checking
2. **Backward Compatibility**: No data migration required - all formats supported simultaneously
3. **Minimal Overhead**: Format detection adds negligible performance impact
4. **Memory Efficiency**: Reuses existing data structures without unnecessary copying

## Migration Guide

### For Existing Data

No migration is required. The system automatically detects and handles:
- Existing legacy particle data (Map or object format)
- New graph data with separate nodes and edges
- Mixed scenarios during transition periods

### For New Features

When adding new features:
1. Use the `getNodesFromParticles()` pattern for data access
2. Always check for `node.title || nodeKey` for display labels
3. Test with both legacy and new data formats
4. Follow the established format detection patterns

## Troubleshooting

### Common Issues

1. **Nodes not rendering**: Check that data format is properly detected
2. **Labels showing UUIDs**: Ensure `title` property is set on nodes
3. **Click detection failing**: Verify format detection in event handlers
4. **Server errors**: Check schema consistency between client and server

### Debug Information

Enable debug logging by adding to browser console:
```javascript
// Check current data format
console.log('Particles format:', particles);
console.log('Is Map:', particles instanceof Map);
console.log('Has nodes property:', !!particles.nodes);
```

## Future Considerations

### Recommended Improvements

1. **Gradual Migration**: Consider migrating all data to the new graph format over time
2. **Type Safety**: Add TypeScript for better type checking
3. **Schema Validation**: Implement runtime schema validation
4. **Performance Monitoring**: Add metrics for format detection overhead

### Deprecation Path

While legacy formats are fully supported, consider:
1. Adding migration utilities for users who want to upgrade
2. Providing clear documentation on format benefits
3. Eventually deprecating legacy formats (with ample notice)

## Conclusion

The implemented fixes ensure:
- ✅ Proper initial rendering of graph data
- ✅ Correct display of node titles instead of UUIDs
- ✅ Full backward compatibility with existing data
- ✅ Consistent behavior across all data formats
- ✅ Comprehensive test coverage
- ✅ Clear documentation and troubleshooting guides

The system now robustly handles multiple data formats while maintaining performance and user experience quality.
