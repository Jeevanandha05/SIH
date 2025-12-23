import { Sidebar } from '@/components/Sidebar';
import { StatCard } from '@/components/StatCard';
import { BlockCard } from '@/components/BlockCard';
import { blockchainData, getBlockchainStats } from '@/data/blockchainData';
import { 
  Blocks, 
  FileCheck, 
  ShieldCheck, 
  XCircle, 
  Users, 
  Activity,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const stats = getBlockchainStats();
  const recentBlocks = blockchainData.slice(-3).reverse();

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Blockchain certificate verification system overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard
            title="Total Blocks"
            value={stats.totalBlocks}
            icon={Blocks}
            delay={150}
          />
          <StatCard
            title="Certificates"
            value={stats.totalCertificates}
            icon={FileCheck}
            trend={{ value: 12, isPositive: true }}
            delay={200}
          />
          <StatCard
            title="Verified"
            value={stats.verifiedCertificates}
            icon={ShieldCheck}
            delay={250}
          />
          <StatCard
            title="Revoked"
            value={stats.revokedCertificates}
            icon={XCircle}
            delay={300}
          />
          <StatCard
            title="Users"
            value={stats.totalUsers}
            icon={Users}
            delay={350}
          />
          <StatCard
            title="Chain Integrity"
            value={`${stats.chainIntegrity}%`}
            icon={Activity}
            delay={400}
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Blocks */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold text-foreground">Recent Blocks</h2>
              <Link to="/blockchain">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-6">
              {recentBlocks.map((block, idx) => (
                <BlockCard 
                  key={block.index} 
                  block={block} 
                  isLast={idx === recentBlocks.length - 1}
                  delay={450 + idx * 100}
                />
              ))}
            </div>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-6">
            {/* Chain Health */}
            <div 
              className="glass-strong rounded-2xl p-6 opacity-0 animate-slide-up"
              style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
            >
              <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Chain Health
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Integrity</span>
                    <span className="text-success font-medium">100%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-primary to-success rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Verification Rate</span>
                    <span className="text-primary font-medium">98.5%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-[98.5%] bg-primary rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div 
              className="glass-strong rounded-2xl p-6 opacity-0 animate-slide-up"
              style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
            >
              <h3 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link to="/verify" className="block">
                  <Button variant="glass" className="w-full justify-start">
                    <FileCheck className="w-4 h-4 mr-2" />
                    Verify Certificate
                  </Button>
                </Link>
                <Link to="/blockchain" className="block">
                  <Button variant="glass" className="w-full justify-start">
                    <Blocks className="w-4 h-4 mr-2" />
                    Explore Chain
                  </Button>
                </Link>
              </div>
            </div>

            {/* Network Status */}
            <div 
              className="glass-strong rounded-2xl p-6 opacity-0 animate-slide-up"
              style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                <span className="font-display font-semibold text-foreground">Network Active</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Block</span>
                  <span className="text-foreground">2 minutes ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Block Time</span>
                  <span className="text-foreground">~15 seconds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Difficulty</span>
                  <span className="text-primary font-mono">4 leading zeros</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
