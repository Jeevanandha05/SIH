import { Block, formatTimestamp, truncateHash } from '@/data/blockchainData';
import { CheckCircle, XCircle, AlertTriangle, Blocks, FileText, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockCardProps {
  block: Block;
  isLast?: boolean;
  delay?: number;
}

export const BlockCard = ({ block, isLast, delay = 0 }: BlockCardProps) => {
  const isGenesis = block.data.genesis;
  const isRevocation = block.data.action === 'REVOKE';
  const isCertificate = block.data.cert_id || block.data.uuid;

  const getStatusIcon = () => {
    if (isGenesis) return <Blocks className="w-5 h-5 text-primary" />;
    if (isRevocation) return <XCircle className="w-5 h-5 text-destructive" />;
    if (block.data.status_class === 'verified') return <CheckCircle className="w-5 h-5 text-success" />;
    return <AlertTriangle className="w-5 h-5 text-warning" />;
  };

  const getStatusBadge = () => {
    if (isGenesis) return <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">Genesis Block</span>;
    if (isRevocation) return <span className="revoked-badge text-xs">Revoked</span>;
    if (block.data.status_class === 'verified') return <span className="verified-badge text-xs">Verified</span>;
    return null;
  };

  return (
    <div 
      className={cn(
        "relative opacity-0 animate-slide-up",
        !isLast && "chain-line"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="glass-strong rounded-2xl p-6 hover:border-primary/40 transition-all duration-300 group">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 group-hover:glow-primary transition-all">
              {getStatusIcon()}
            </div>
            <div>
              <span className="text-lg font-display font-semibold text-foreground">
                Block #{block.index}
              </span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatTimestamp(block.timestamp)}
              </div>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Content */}
        {isGenesis ? (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-sm text-muted-foreground">
              The genesis block - the first block in the chain that initializes the blockchain.
            </p>
          </div>
        ) : isRevocation ? (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
              <p className="text-sm font-medium text-destructive mb-1">Certificate Revoked</p>
              <p className="text-xs text-muted-foreground">
                UUID: <span className="font-mono">{truncateHash(block.data.revokes_uuid || '', 12)}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                By: <span className="font-medium text-foreground">{block.data.actor}</span>
              </p>
            </div>
          </div>
        ) : isCertificate ? (
          <div className="space-y-4">
            {/* Certificate Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Holder Name</p>
                <p className="text-sm font-medium text-foreground">{block.data.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Certificate ID</p>
                <p className="text-sm font-mono text-primary">{block.data.cert_id}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Institution</p>
              <p className="text-sm font-medium text-foreground">{block.data.college}</p>
              <p className="text-xs text-muted-foreground">{block.data.department}</p>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Start: {block.data.start_year}</span>
              <span className="text-primary">→</span>
              <span>End: {block.data.end_year}</span>
            </div>

            {/* Files */}
            {(block.data.files || block.data.filename) && (
              <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-foreground">Attached Documents</span>
                </div>
                <div className="space-y-1">
                  {block.data.files?.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate max-w-[200px]">{file.filename}</span>
                      <span className="font-mono text-primary/70">{truncateHash(file.hash, 6)}</span>
                    </div>
                  ))}
                  {block.data.filename && !block.data.files && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate max-w-[200px]">{block.data.filename}</span>
                      <span className="font-mono text-primary/70">{truncateHash(block.data.hash || '', 6)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer - Hashes */}
        <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Proof of Work</span>
            <span className="font-mono text-xs text-primary">{block.proof}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Previous Hash</span>
            <p className="hash-text mt-1">{block.previous_hash}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
