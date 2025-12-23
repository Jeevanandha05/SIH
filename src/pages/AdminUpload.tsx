import { useState, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  FileCheck, 
  Loader2, 
  CheckCircle,
  XCircle,
  Camera,
  Sparkles,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

interface UploadedCert {
  id: string;
  imageBase64: string;
  extractedData: ExtractedData | null;
  isProcessing: boolean;
  isSaved: boolean;
  error?: string;
}

const AdminUpload = () => {
  const [uploadedCerts, setUploadedCerts] = useState<UploadedCert[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [manualCertId, setManualCertId] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

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
      const newCert: UploadedCert = {
        id: crypto.randomUUID(),
        imageBase64: base64,
        extractedData: null,
        isProcessing: true,
        isSaved: false
      };
      
      setUploadedCerts(prev => [...prev, newCert]);
      await processOCR(newCert.id, base64);
    };
    reader.readAsDataURL(file);
  };

  const processOCR = async (certId: string, imageBase64: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('ocr-verify', {
        body: { image: imageBase64 }
      });

      if (error) throw new Error(error.message);

      if (!data.success || !data.extracted) {
        throw new Error('Failed to extract data from image');
      }

      setUploadedCerts(prev => prev.map(cert => 
        cert.id === certId 
          ? { ...cert, extractedData: data.extracted, isProcessing: false }
          : cert
      ));

      toast({
        title: "OCR Complete",
        description: "Certificate data extracted successfully!",
      });

    } catch (error) {
      console.error('OCR error:', error);
      setUploadedCerts(prev => prev.map(cert => 
        cert.id === certId 
          ? { ...cert, isProcessing: false, error: 'Failed to extract data' }
          : cert
      ));
      toast({
        title: "OCR Failed",
        description: error instanceof Error ? error.message : "Failed to process image",
        variant: "destructive",
      });
    }
  };

  const saveCertificate = async (cert: UploadedCert) => {
    if (!cert.extractedData) {
      toast({
        title: "No data to save",
        description: "Please wait for OCR processing to complete.",
        variant: "destructive",
      });
      return;
    }

    const extracted = cert.extractedData;
    const certIdToUse = manualCertId || extracted.certificate_id || `CERT_${Date.now()}`;

    try {
      // Upload image to storage
      const fileName = `${certIdToUse}_${Date.now()}.jpg`;
      const base64Data = cert.imageBase64.split(',')[1];
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const { error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(fileName, binaryData, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('certificates')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('certificates')
        .insert({
          cert_id: certIdToUse,
          name: extracted.holder_name || 'Unknown',
          college: extracted.institution || 'Unknown',
          department: extracted.department || '',
          start_year: extracted.start_date || '',
          end_year: extracted.end_date || '',
          extracted_text: extracted.raw_text || '',
          image_url: publicUrl,
          created_by: user?.username || 'admin',
          status: 'active'
        });

      if (dbError) throw dbError;

      setUploadedCerts(prev => prev.map(c => 
        c.id === cert.id ? { ...c, isSaved: true } : c
      ));

      toast({
        title: "Certificate Registered!",
        description: `Certificate ${certIdToUse} saved to blockchain registry.`,
      });

    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Failed to save",
        description: error instanceof Error ? error.message : "Could not save certificate",
        variant: "destructive",
      });
    }
  };

  const removeCert = (certId: string) => {
    setUploadedCerts(prev => prev.filter(c => c.id !== certId));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => handleFileUpload(file));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-3 mb-2">
            <Upload className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-display font-bold text-foreground">Register Certificate</h1>
          </div>
          <p className="text-muted-foreground">Upload original certificates to the blockchain registry for future verification</p>
        </div>

        {/* Upload Zone */}
        <div 
          className={cn(
            "glass-strong rounded-2xl p-8 mb-8 opacity-0 animate-slide-up transition-all duration-300",
            isDragging && "border-primary border-2 bg-primary/5"
          )}
          style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-foreground">AI-Powered Registration</h2>
              <p className="text-sm text-muted-foreground">Upload certificate images - AI will extract all details automatically</p>
            </div>
          </div>

          <div 
            className={cn(
              "border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer",
              isDragging 
                ? "border-primary bg-primary/5" 
                : "border-border/50 hover:border-primary/50 hover:bg-muted/20"
            )}
          >
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                files.forEach(file => handleFileUpload(file));
              }}
              className="hidden"
              id="cert-upload"
            />
            <label htmlFor="cert-upload" className="cursor-pointer block">
              <div className="flex flex-col items-center gap-4">
                <div className="p-5 rounded-full bg-primary/10 border border-primary/20">
                  {isDragging ? (
                    <Upload className="w-10 h-10 text-primary animate-bounce" />
                  ) : (
                    <Camera className="w-10 h-10 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">
                    {isDragging ? 'Drop to upload' : 'Drop certificate images here'}
                  </p>
                  <p className="text-muted-foreground">or click to browse (JPG, PNG, PDF)</p>
                </div>
                <Button variant="glow">
                  <Plus className="w-4 h-4 mr-2" />
                  Select Files
                </Button>
              </div>
            </label>
          </div>
        </div>

        {/* Uploaded Certificates */}
        {uploadedCerts.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-display font-semibold text-foreground">Pending Registrations</h2>
            
            {uploadedCerts.map((cert, idx) => (
              <div 
                key={cert.id}
                className={cn(
                  "glass-strong rounded-2xl p-6 opacity-0 animate-slide-up",
                  cert.isSaved && "border-success/30"
                )}
                style={{ animationDelay: `${200 + idx * 100}ms`, animationFillMode: 'forwards' }}
              >
                <div className="flex gap-6">
                  {/* Preview Image */}
                  <div className="w-48 h-48 rounded-xl overflow-hidden border border-border/50 flex-shrink-0">
                    <img 
                      src={cert.imageBase64} 
                      alt="Certificate" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Extracted Data */}
                  <div className="flex-1">
                    {cert.isProcessing ? (
                      <div className="flex items-center gap-3 h-full">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        <span className="text-muted-foreground">Extracting certificate data...</span>
                      </div>
                    ) : cert.error ? (
                      <div className="flex items-center gap-3 text-destructive">
                        <XCircle className="w-6 h-6" />
                        <span>{cert.error}</span>
                      </div>
                    ) : cert.extractedData ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Holder Name</p>
                            <p className="font-medium text-foreground">{cert.extractedData.holder_name || 'Not detected'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Certificate ID</p>
                            <p className="font-mono text-primary">{cert.extractedData.certificate_id || 'Not detected'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Institution</p>
                            <p className="font-medium text-foreground">{cert.extractedData.institution || 'Not detected'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Department</p>
                            <p className="text-foreground">{cert.extractedData.department || 'Not detected'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="text-foreground">
                              {cert.extractedData.start_date || '?'} → {cert.extractedData.end_date || '?'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Confidence</p>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-xs font-medium",
                              cert.extractedData.confidence === 'high' && "bg-success/20 text-success",
                              cert.extractedData.confidence === 'medium' && "bg-warning/20 text-warning",
                              cert.extractedData.confidence === 'low' && "bg-destructive/20 text-destructive"
                            )}>
                              {cert.extractedData.confidence || 'unknown'}
                            </span>
                          </div>
                        </div>

                        {/* Manual Cert ID Override */}
                        <div className="flex items-center gap-4">
                          <Input
                            placeholder="Override Certificate ID (optional)"
                            value={manualCertId}
                            onChange={(e) => setManualCertId(e.target.value)}
                            className="max-w-xs"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          {cert.isSaved ? (
                            <div className="flex items-center gap-2 text-success">
                              <CheckCircle className="w-5 h-5" />
                              <span className="font-medium">Registered to Blockchain</span>
                            </div>
                          ) : (
                            <>
                              <Button 
                                variant="glow" 
                                onClick={() => saveCertificate(cert)}
                              >
                                <FileCheck className="w-4 h-4 mr-2" />
                                Register to Blockchain
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => removeCert(cert.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Discard
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUpload;
