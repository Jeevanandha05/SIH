import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  FileText,
  Upload,
  Hash,
  AlertTriangle,
  Loader2,
  Camera,
  Image as ImageIcon,
  ScanLine,
  Sparkles,
  ShieldAlert,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ExtractedData {
  raw_text?: string;
  certificate_id?: string;
  holder_name?: string;
  institution?: string;
  department?: string;
  degree_type?: string;
  start_date?: string;
  end_date?: string;
  issue_date?: string;
  grade?: string;
  additional_info?: string;
  confidence?: string;
}

interface MatchedCertificate {
  id: string;
  cert_id: string;
  name: string;
  college: string;
  department: string;
  start_year: string;
  end_year: string;
  image_url: string;
  status: string;
}

interface VerificationResult {
  isOriginal: boolean;
  status: 'original' | 'fake' | 'no_match';
  matchScore: number;
  matchedCertificate?: MatchedCertificate;
  message: string;
  extractedData?: ExtractedData;
  differences?: string[];
}

const Verify = () => {
  const [certIdInput, setCertIdInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please upload an image (JPG, PNG) or PDF file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setUploadedImage(base64);
      await processOCRVerification(base64);
    };
    reader.readAsDataURL(file);
  };

  const processOCRVerification = async (imageBase64: string) => {
    setIsVerifying(true);
    setResult(null);

    try {
      toast({
        title: "Analyzing certificate...",
        description: "Extracting data and comparing with registered certificates",
      });

      // Step 1: Extract text using OCR
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('ocr-verify', {
        body: { image: imageBase64 }
      });

      if (ocrError) throw new Error(ocrError.message);
      if (!ocrData.success || !ocrData.extracted) {
        throw new Error('Failed to extract data from image');
      }

      const extracted: ExtractedData = ocrData.extracted;

      // Step 2: Fetch all registered certificates from database
      const { data: certificates, error: dbError } = await supabase
        .from('certificates')
        .select('*')
        .eq('status', 'active');

      if (dbError) throw dbError;

      if (!certificates || certificates.length === 0) {
        setResult({
          isOriginal: false,
          status: 'no_match',
          matchScore: 0,
          message: 'No registered certificates found in the system. Please contact administrator.',
          extractedData: extracted
        });
        return;
      }

      // Step 3: Compare with registered certificates
      let bestMatch: MatchedCertificate | null = null;
      let bestScore = 0;
      let differences: string[] = [];

      for (const cert of certificates) {
        let score = 0;
        const currentDiffs: string[] = [];

        // Compare holder name (most important)
        if (extracted.holder_name && cert.name) {
          const extractedName = normalizeText(extracted.holder_name);
          const certName = normalizeText(cert.name);
          
          if (extractedName === certName) {
            score += 35;
          } else if (extractedName.includes(certName) || certName.includes(extractedName)) {
            score += 25;
          } else if (calculateSimilarity(extractedName, certName) > 0.7) {
            score += 15;
            currentDiffs.push(`Name differs: "${extracted.holder_name}" vs "${cert.name}"`);
          } else {
            currentDiffs.push(`Name mismatch: "${extracted.holder_name}" vs "${cert.name}"`);
          }
        }

        // Compare institution
        if (extracted.institution && cert.college) {
          const extractedInst = normalizeText(extracted.institution);
          const certInst = normalizeText(cert.college);
          
          if (extractedInst === certInst || extractedInst.includes(certInst) || certInst.includes(extractedInst)) {
            score += 25;
          } else if (calculateSimilarity(extractedInst, certInst) > 0.6) {
            score += 15;
            currentDiffs.push(`Institution differs: "${extracted.institution}" vs "${cert.college}"`);
          } else {
            currentDiffs.push(`Institution mismatch: "${extracted.institution}" vs "${cert.college}"`);
          }
        }

        // Compare certificate ID
        if (extracted.certificate_id && cert.cert_id) {
          const extractedId = normalizeText(extracted.certificate_id);
          const certId = normalizeText(cert.cert_id);
          
          if (extractedId === certId) {
            score += 25;
          } else if (extractedId.includes(certId) || certId.includes(extractedId)) {
            score += 15;
            currentDiffs.push(`Certificate ID differs: "${extracted.certificate_id}" vs "${cert.cert_id}"`);
          } else {
            currentDiffs.push(`Certificate ID mismatch: "${extracted.certificate_id}" vs "${cert.cert_id}"`);
          }
        }

        // Compare department
        if (extracted.department && cert.department) {
          const extractedDept = normalizeText(extracted.department);
          const certDept = normalizeText(cert.department);
          
          if (extractedDept === certDept || extractedDept.includes(certDept) || certDept.includes(extractedDept)) {
            score += 15;
          } else {
            currentDiffs.push(`Department differs: "${extracted.department}" vs "${cert.department}"`);
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = cert as MatchedCertificate;
          differences = currentDiffs;
        }
      }

      // Step 4: Determine result
      if (bestMatch && bestScore >= 80) {
        // High match - likely original
        setResult({
          isOriginal: true,
          status: 'original',
          matchScore: bestScore,
          matchedCertificate: bestMatch,
          message: '✅ ORIGINAL CERTIFICATE - This certificate matches our registered records.',
          extractedData: extracted,
          differences: differences.length > 0 ? differences : undefined
        });

        toast({
          title: "Certificate Verified!",
          description: "This is an authentic certificate.",
        });

        // Log verification
        await supabase.from('verification_logs').insert([{
          certificate_id: bestMatch.id,
          result: 'original',
          confidence_score: bestScore,
          extracted_data: JSON.parse(JSON.stringify(extracted)),
          matched_fields: JSON.parse(JSON.stringify({ score: bestScore, differences }))
        }]);

      } else if (bestMatch && bestScore >= 40) {
        setResult({
          isOriginal: false,
          status: 'fake',
          matchScore: bestScore,
          matchedCertificate: bestMatch,
          message: '⚠️ SUSPICIOUS CERTIFICATE - Data partially matches but contains discrepancies.',
          extractedData: extracted,
          differences
        });

        toast({
          title: "Suspicious Certificate Detected!",
          description: "This certificate has discrepancies from the original.",
          variant: "destructive",
        });

        await supabase.from('verification_logs').insert([{
          certificate_id: bestMatch.id,
          result: 'fake',
          confidence_score: bestScore,
          extracted_data: JSON.parse(JSON.stringify(extracted)),
          matched_fields: JSON.parse(JSON.stringify({ score: bestScore, differences }))
        }]);

      } else {
        setResult({
          isOriginal: false,
          status: 'no_match',
          matchScore: bestScore,
          message: '❌ NOT FOUND - This certificate is not registered in our blockchain.',
          extractedData: extracted
        });

        toast({
          title: "Certificate Not Found",
          description: "No matching certificate in the registry.",
          variant: "destructive",
        });

        await supabase.from('verification_logs').insert([{
          result: 'no_match',
          confidence_score: bestScore,
          extracted_data: JSON.parse(JSON.stringify(extracted))
        }]);
      }

    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : "Failed to verify certificate",
        variant: "destructive",
      });
      setResult({
        isOriginal: false,
        status: 'no_match',
        matchScore: 0,
        message: 'Failed to process the certificate. Please try again.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const normalizeText = (text: string): string => {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }
    return matches / longer.length;
  };

  const verifyByCertId = async () => {
    if (!certIdInput.trim()) return;
    
    setIsVerifying(true);
    setResult(null);

    try {
      const { data: cert, error } = await supabase
        .from('certificates')
        .select('*')
        .ilike('cert_id', certIdInput.trim())
        .maybeSingle();

      if (error) throw error;

      if (cert) {
        setResult({
          isOriginal: true,
          status: 'original',
          matchScore: 100,
          matchedCertificate: cert as MatchedCertificate,
          message: '✅ ORIGINAL - Certificate ID found in blockchain registry.'
        });
      } else {
        setResult({
          isOriginal: false,
          status: 'no_match',
          matchScore: 0,
          message: '❌ NOT FOUND - No certificate with this ID exists in our records.'
        });
      }
    } catch (error) {
      console.error('Lookup error:', error);
      toast({
        title: "Lookup Failed",
        description: error instanceof Error ? error.message : "Failed to search certificate",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const clearUpload = () => {
    setUploadedImage(null);
    setResult(null);
    setShowOriginal(false);
  };

  const getStatusStyles = () => {
    if (!result) return {};
    switch (result.status) {
      case 'original':
        return { bg: 'bg-success/10', border: 'border-success/30', icon: CheckCircle, iconColor: 'text-success' };
      case 'fake':
        return { bg: 'bg-destructive/10', border: 'border-destructive/30', icon: ShieldAlert, iconColor: 'text-destructive' };
      case 'no_match':
        return { bg: 'bg-warning/10', border: 'border-warning/30', icon: AlertTriangle, iconColor: 'text-warning' };
    }
  };

  const statusStyles = getStatusStyles();

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-display font-bold text-foreground">Verify Certificate</h1>
          </div>
          <p className="text-muted-foreground">Upload a certificate to check if it's original or fake</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            {/* OCR Upload */}
            <div 
              className={cn(
                "glass-strong rounded-2xl p-6 opacity-0 animate-slide-up transition-all duration-300",
                isDragging && "border-primary border-2 bg-primary/5"
              )}
              style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                  <ScanLine className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
                    AI-Powered Verification
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      OCR
                    </span>
                  </h2>
                  <p className="text-sm text-muted-foreground">Upload certificate to detect if it's original or fake</p>
                </div>
              </div>

              {uploadedImage ? (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden border border-border/50">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded certificate" 
                      className="w-full h-48 object-contain bg-muted/20"
                    />
                    <button
                      onClick={clearUpload}
                      className="absolute top-2 right-2 p-2 rounded-lg bg-background/80 hover:bg-destructive/20 transition-colors"
                    >
                      <XCircle className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                  <Button 
                    onClick={() => processOCRVerification(uploadedImage)}
                    disabled={isVerifying}
                    className="w-full"
                    variant="glow"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ScanLine className="w-4 h-4 mr-2" />
                    )}
                    {isVerifying ? 'Analyzing...' : 'Verify Certificate'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center transition-all",
                      isDragging 
                        ? "border-primary bg-primary/5" 
                        : "border-border/50 hover:border-primary/50 hover:bg-muted/20"
                    )}
                  >
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      className="hidden"
                      id="certificate-upload"
                    />
                    <label htmlFor="certificate-upload" className="cursor-pointer block">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
                          <Camera className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Drop certificate image here</p>
                          <p className="text-sm text-muted-foreground">or click to browse (JPG, PNG, PDF)</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Certificate ID Lookup */}
            <div 
              className="glass-strong rounded-2xl p-6 opacity-0 animate-slide-up"
              style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary border border-border/50">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-foreground">Verify by Certificate ID</h2>
                  <p className="text-sm text-muted-foreground">Enter the certificate ID to check if it's registered</p>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  placeholder="e.g., CERT_2024_001"
                  value={certIdInput}
                  onChange={(e) => setCertIdInput(e.target.value)}
                  className="font-mono"
                />
                <Button 
                  onClick={verifyByCertId}
                  disabled={!certIdInput.trim() || isVerifying}
                  className="w-full"
                  variant="outline"
                >
                  {isVerifying ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  Lookup Certificate
                </Button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {result && (
              <div 
                className={cn(
                  "glass-strong rounded-2xl p-6 opacity-0 animate-scale-in",
                  statusStyles.bg,
                  statusStyles.border,
                  "border"
                )}
                style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
              >
                {/* Status Header */}
                <div className="flex items-center gap-4 mb-6">
                  {statusStyles.icon && (
                    <statusStyles.icon className={cn("w-16 h-16", statusStyles.iconColor)} />
                  )}
                  <div>
                    <h2 className={cn(
                      "text-2xl font-display font-bold",
                      result.status === 'original' && "text-success",
                      result.status === 'fake' && "text-destructive",
                      result.status === 'no_match' && "text-warning"
                    )}>
                      {result.status === 'original' && 'ORIGINAL'}
                      {result.status === 'fake' && 'FAKE DETECTED'}
                      {result.status === 'no_match' && 'NOT FOUND'}
                    </h2>
                    <p className="text-muted-foreground">{result.message}</p>
                  </div>
                </div>

                {/* Match Score */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Match Confidence</span>
                    <span className="font-mono text-foreground">{result.matchScore}%</span>
                  </div>
                  <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        result.matchScore >= 80 && "bg-success",
                        result.matchScore >= 40 && result.matchScore < 80 && "bg-warning",
                        result.matchScore < 40 && "bg-destructive"
                      )}
                      style={{ width: `${result.matchScore}%` }}
                    />
                  </div>
                </div>

                {/* Differences Found */}
                {result.differences && result.differences.length > 0 && (
                  <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <h3 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Discrepancies Detected
                    </h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {result.differences.map((diff, idx) => (
                        <li key={idx}>• {diff}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Extracted vs Original Comparison */}
                {result.extractedData && result.matchedCertificate && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Data Comparison</h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowOriginal(!showOriginal)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {showOriginal ? 'Hide' : 'Show'} Original
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Uploaded Certificate Data */}
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                          Uploaded Certificate
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Name:</span>
                            <span className="ml-2 text-foreground">{result.extractedData.holder_name || '-'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Institution:</span>
                            <span className="ml-2 text-foreground">{result.extractedData.institution || '-'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cert ID:</span>
                            <span className="ml-2 font-mono text-primary">{result.extractedData.certificate_id || '-'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Department:</span>
                            <span className="ml-2 text-foreground">{result.extractedData.department || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Original Certificate Data */}
                      <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                        <h4 className="text-xs font-medium text-success mb-3 uppercase tracking-wider">
                          Registered Original
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Name:</span>
                            <span className="ml-2 text-foreground">{result.matchedCertificate.name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Institution:</span>
                            <span className="ml-2 text-foreground">{result.matchedCertificate.college}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Cert ID:</span>
                            <span className="ml-2 font-mono text-primary">{result.matchedCertificate.cert_id}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Department:</span>
                            <span className="ml-2 text-foreground">{result.matchedCertificate.department}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Show Original Certificate Image */}
                    {showOriginal && result.matchedCertificate.image_url && (
                      <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                        <h4 className="text-sm font-medium text-foreground mb-3">Original Certificate Image</h4>
                        <img 
                          src={result.matchedCertificate.image_url} 
                          alt="Original certificate"
                          className="w-full rounded-lg border border-border/50"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Extracted Data Only (no match) */}
                {result.extractedData && !result.matchedCertificate && (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                    <h4 className="text-sm font-medium text-foreground mb-3">Extracted Data</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <span className="ml-2 text-foreground">{result.extractedData.holder_name || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Institution:</span>
                        <span className="ml-2 text-foreground">{result.extractedData.institution || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cert ID:</span>
                        <span className="ml-2 font-mono text-primary">{result.extractedData.certificate_id || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Department:</span>
                        <span className="ml-2 text-foreground">{result.extractedData.department || '-'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!result && !isVerifying && (
              <div 
                className="glass-strong rounded-2xl p-12 text-center opacity-0 animate-fade-in"
                style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}
              >
                <ShieldCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                  Upload a Certificate
                </h3>
                <p className="text-muted-foreground">
                  AI will compare it against registered originals to detect fakes
                </p>
              </div>
            )}

            {isVerifying && (
              <div className="glass-strong rounded-2xl p-12 text-center">
                <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                  Analyzing Certificate...
                </h3>
                <p className="text-muted-foreground">
                  Extracting data and comparing with blockchain registry
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Verify;
