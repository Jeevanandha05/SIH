import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { blockchainData, formatTimestamp, truncateHash, Block } from '@/data/blockchainData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  FileCheck, 
  CheckCircle, 
  XCircle, 
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Building,
  Calendar,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const Certificates = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { toast } = useToast();

  // Get certificate blocks only (not genesis or revocations)
  const certificateBlocks = blockchainData.filter(
    block => (block.data.cert_id || block.data.uuid) && !block.data.action
  );

  // Check if a certificate is revoked
  const isRevoked = (uuid?: string) => {
    if (!uuid) return false;
    return blockchainData.some(b => b.data.revokes_uuid === uuid);
  };

  const filteredCerts = certificateBlocks.filter(block => {
    const searchLower = searchTerm.toLowerCase();
    return !searchTerm ||
      block.data.name?.toLowerCase().includes(searchLower) ||
      block.data.college?.toLowerCase().includes(searchLower) ||
      block.data.cert_id?.toLowerCase().includes(searchLower) ||
      block.data.department?.toLowerCase().includes(searchLower);
  });

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast({
      title: "Copied!",
      description: "Hash copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3 mb-2">
            <FileCheck className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-display font-bold text-foreground">Certificates</h1>
          </div>
          <p className="text-muted-foreground">View and manage all blockchain-verified certificates</p>
        </div>

        {/* Search */}
        <div 
          className="glass-strong rounded-2xl p-6 mb-8 opacity-0 animate-slide-up"
          style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
        >
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search certificates by name, college, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass rounded-xl p-4 opacity-0 animate-scale-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <div className="text-2xl font-display font-bold text-foreground">{certificateBlocks.length}</div>
            <div className="text-sm text-muted-foreground">Total Certificates</div>
          </div>
          <div className="glass rounded-xl p-4 opacity-0 animate-scale-in" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
            <div className="text-2xl font-display font-bold text-success">
              {certificateBlocks.filter(b => !isRevoked(b.data.uuid)).length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="glass rounded-xl p-4 opacity-0 animate-scale-in" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            <div className="text-2xl font-display font-bold text-destructive">
              {certificateBlocks.filter(b => isRevoked(b.data.uuid)).length}
            </div>
            <div className="text-sm text-muted-foreground">Revoked</div>
          </div>
        </div>

        {/* Certificate List */}
        <div className="space-y-4">
          {filteredCerts.map((block, idx) => {
            const revoked = isRevoked(block.data.uuid);
            const isExpanded = expandedId === block.index;

            return (
              <div
                key={block.index}
                className={cn(
                  "glass-strong rounded-2xl overflow-hidden transition-all duration-300 opacity-0 animate-slide-up",
                  revoked && "border-destructive/30"
                )}
                style={{ animationDelay: `${350 + idx * 50}ms`, animationFillMode: 'forwards' }}
              >
                {/* Header Row */}
                <div 
                  className="p-6 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : block.index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        revoked ? "bg-destructive/10" : "bg-success/10"
                      )}>
                        {revoked ? (
                          <XCircle className="w-6 h-6 text-destructive" />
                        ) : (
                          <CheckCircle className="w-6 h-6 text-success" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                          {block.data.name}
                          <span className="text-sm font-mono text-primary">{block.data.cert_id}</span>
                        </h3>
                        <p className="text-sm text-muted-foreground">{block.data.college}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {revoked ? (
                        <span className="revoked-badge">Revoked</span>
                      ) : (
                        <span className="verified-badge">Verified</span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-border/50">
                    <div className="grid md:grid-cols-2 gap-6 pt-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Holder Name</p>
                            <p className="font-medium text-foreground">{block.data.name}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Building className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Institution</p>
                            <p className="font-medium text-foreground">{block.data.college}</p>
                            <p className="text-sm text-muted-foreground">{block.data.department}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="font-medium text-foreground">
                              {block.data.start_year} → {block.data.end_year}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Blockchain Info */}
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                          <p className="text-xs text-muted-foreground mb-2">Block Information</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Block #</span>
                              <span className="font-mono text-primary">{block.index}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Timestamp</span>
                              <span className="text-foreground">{formatTimestamp(block.timestamp)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Proof</span>
                              <span className="font-mono text-foreground">{block.proof}</span>
                            </div>
                          </div>
                        </div>

                        {block.data.uuid && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">UUID:</span>
                            <code className="text-xs font-mono text-primary">{truncateHash(block.data.uuid, 8)}</code>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-6 h-6"
                              onClick={() => copyHash(block.data.uuid!)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Files */}
                    {(block.data.files || block.data.filename) && (
                      <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/50">
                        <p className="text-sm font-medium text-foreground mb-3">Attached Documents</p>
                        <div className="space-y-2">
                          {block.data.files?.map((file, fidx) => (
                            <div key={fidx} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                              <span className="text-sm text-muted-foreground">{file.filename}</span>
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-mono text-primary">{truncateHash(file.hash, 8)}</code>
                                <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => copyHash(file.hash)}>
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          {block.data.filename && !block.data.files && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                              <span className="text-sm text-muted-foreground">{block.data.filename}</span>
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-mono text-primary">{truncateHash(block.data.hash || '', 8)}</code>
                                <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => copyHash(block.data.hash!)}>
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredCerts.length === 0 && (
          <div className="text-center py-16">
            <FileCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-display font-semibold text-foreground mb-2">No certificates found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Certificates;
