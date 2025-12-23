import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { BlockCard } from '@/components/BlockCard';
import { blockchainData } from '@/data/blockchainData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Blocks, RefreshCw } from 'lucide-react';

const Blockchain = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'certificates' | 'revocations'>('all');

  const filteredBlocks = blockchainData.filter(block => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      block.data.name?.toLowerCase().includes(searchLower) ||
      block.data.college?.toLowerCase().includes(searchLower) ||
      block.data.cert_id?.toLowerCase().includes(searchLower) ||
      block.index.toString().includes(searchTerm);

    // Type filter
    if (filter === 'certificates') {
      return matchesSearch && (block.data.cert_id || block.data.uuid) && !block.data.action;
    }
    if (filter === 'revocations') {
      return matchesSearch && block.data.action === 'REVOKE';
    }
    return matchesSearch;
  }).reverse();

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3 mb-2">
            <Blocks className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-display font-bold text-foreground">Blockchain Explorer</h1>
          </div>
          <p className="text-muted-foreground">Browse and explore the complete certificate blockchain</p>
        </div>

        {/* Filters */}
        <div 
          className="glass-strong rounded-2xl p-6 mb-8 opacity-0 animate-slide-up"
          style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, college, or block ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All Blocks
              </Button>
              <Button
                variant={filter === 'certificates' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('certificates')}
              >
                Certificates
              </Button>
              <Button
                variant={filter === 'revocations' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('revocations')}
              >
                Revocations
              </Button>
            </div>

            {/* Refresh */}
            <Button variant="glass" size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            Showing <span className="text-foreground font-medium">{filteredBlocks.length}</span> of {blockchainData.length} blocks
          </p>
        </div>

        {/* Blocks List */}
        <div className="space-y-6">
          {filteredBlocks.map((block, idx) => (
            <BlockCard 
              key={block.index} 
              block={block} 
              isLast={idx === filteredBlocks.length - 1}
              delay={200 + idx * 50}
            />
          ))}
        </div>

        {filteredBlocks.length === 0 && (
          <div className="text-center py-16">
            <Blocks className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-display font-semibold text-foreground mb-2">No blocks found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Blockchain;
