export interface CertificateFile {
  filename: string;
  hash: string;
}

export interface BlockData {
  genesis?: boolean;
  cert_id?: string;
  uuid?: string;
  name?: string;
  college?: string;
  department?: string;
  start_year?: string;
  end_year?: string;
  filename?: string;
  hash?: string;
  files?: CertificateFile[];
  status?: string;
  status_class?: string;
  revokes_uuid?: string;
  action?: string;
  actor?: string;
}

export interface Block {
  index: number;
  timestamp: number;
  data: BlockData;
  proof: number;
  previous_hash: string;
}

export interface User {
  username: string;
  role: 'admin' | 'uploader' | 'viewer';
  login_count?: number;
}

export const blockchainData: Block[] = [
  {
    index: 1,
    timestamp: 1758858818.9410067,
    data: { genesis: true },
    proof: 100,
    previous_hash: "1"
  },
  {
    index: 2,
    timestamp: 1758858851.0219011,
    data: {
      cert_id: "no_9",
      name: "DS",
      college: "Kumaraguru College of Technology",
      department: "Electrical & Electronics Engineering",
      start_year: "2025-05-21",
      end_year: "2027-07-21",
      filename: "CHEMISTRY_1.pdf",
      hash: "0e8f6ede272184817163b0d727a3bd7e8134d225eaf33f5164834b26eca26f2c",
      status: "✅ ON-CHAIN",
      status_class: "verified"
    },
    proof: 35293,
    previous_hash: "a25177529a74ef18d287bf4841c544cc55addb796953055aa6726c19413695f8"
  },
  {
    index: 3,
    timestamp: 1758862276.904652,
    data: {
      cert_id: "no_9",
      name: "DS",
      college: "SNS College of Engineering",
      department: "Electronics & Communication Engineering",
      start_year: "2025-05-21",
      end_year: "2027-07-21",
      files: [
        { filename: "24UAD143-JEEVANANDHA_G_M3.pdf", hash: "7658c4b7497eac398cb7879d71631c35a011ecd3f8b14abab697c14a83fd5122" },
        { filename: "24UAD143-JEEVANANDHA_G_oops.pdf", hash: "621187e5ca42cc5eda2699508678c9547228923b03a3450b584926a5c2167eb8" },
        { filename: "24UAD143-JEEVANANDHA_G_AI_.pdf", hash: "a39e80132c95806665afcf1ff62ec0b88b2d019d1669de82786e7b225e6ef4a6" },
        { filename: "ANDROID_GRAPHIS.pdf", hash: "1be56515c210aec3c6a951c6bc0508ea68e188cdb456647e86cc1bf3fbb82769" }
      ],
      status: "✅ ON-CHAIN",
      status_class: "verified"
    },
    proof: 35089,
    previous_hash: "dfe14963ec4623e5c37d280899698cb6ee39ed681eb2c6a9e94752cbc2d1343c"
  },
  {
    index: 4,
    timestamp: 1758864992.814656,
    data: {
      uuid: "8137ccff-7cc8-4621-bb5f-2aae0b9f0915",
      cert_id: "No_5",
      name: "pooja",
      college: "Government College of Technology",
      department: "Computer Science & Engineering",
      start_year: "2019-05-01",
      end_year: "2023-05-01",
      files: [
        { filename: "24UAD143-JEEVANANDHA_G_M3.pdf", hash: "7658c4b7497eac398cb7879d71631c35a011ecd3f8b14abab697c14a83fd5122" }
      ],
      status: "✅ ON-CHAIN",
      status_class: "verified"
    },
    proof: 93277,
    previous_hash: "3d1ea07f8f9d26fab50f6e4f7c9e5e06d2f0e8f0c5a1a4b8e3a2c1d5f6b7a8e9"
  },
  {
    index: 5,
    timestamp: 1758870123.456789,
    data: {
      uuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      cert_id: "CERT_2024_001",
      name: "Arjun Kumar",
      college: "PSG College of Technology",
      department: "Information Technology",
      start_year: "2020-08-01",
      end_year: "2024-05-15",
      files: [
        { filename: "degree_certificate.pdf", hash: "abc123def456789012345678901234567890123456789012345678901234" }
      ],
      status: "✅ ON-CHAIN",
      status_class: "verified"
    },
    proof: 78543,
    previous_hash: "5c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d"
  },
  {
    index: 6,
    timestamp: 1758875432.987654,
    data: {
      revokes_uuid: "8137ccff-7cc8-4621-bb5f-2aae0b9f0915",
      action: "REVOKE",
      actor: "admin"
    },
    proof: 45678,
    previous_hash: "7f8e9d0c1b2a3456789012345678901234567890abcdef1234567890abcdef12"
  },
  {
    index: 7,
    timestamp: 1758880000.123456,
    data: {
      uuid: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      cert_id: "CERT_2024_002",
      name: "Priya Sharma",
      college: "Anna University",
      department: "Mechanical Engineering",
      start_year: "2019-07-15",
      end_year: "2023-06-30",
      files: [
        { filename: "BE_certificate.pdf", hash: "def789ghi012345678901234567890123456789012345678901234567890" },
        { filename: "transcript.pdf", hash: "ghi012jkl345678901234567890123456789012345678901234567890123" }
      ],
      status: "✅ ON-CHAIN",
      status_class: "verified"
    },
    proof: 67890,
    previous_hash: "9a8b7c6d5e4f3210fedcba9876543210fedcba9876543210fedcba9876543210"
  }
];

export const usersData: User[] = [
  { username: "admin", role: "admin", login_count: 42 },
  { username: "dhivya", role: "admin" },
  { username: "irsath", role: "admin", login_count: 1 },
  { username: "kathir", role: "viewer", login_count: 12 },
  { username: "akshyaa", role: "uploader", login_count: 7 },
  { username: "akshayaa", role: "viewer", login_count: 2 }
];

export const getBlockchainStats = () => {
  const totalBlocks = blockchainData.length;
  const certificateBlocks = blockchainData.filter(b => b.data.cert_id || b.data.uuid);
  const revokedBlocks = blockchainData.filter(b => b.data.action === 'REVOKE');
  const verifiedCerts = certificateBlocks.filter(b => b.data.status_class === 'verified');
  
  return {
    totalBlocks,
    totalCertificates: certificateBlocks.length,
    verifiedCertificates: verifiedCerts.length,
    revokedCertificates: revokedBlocks.length,
    totalUsers: usersData.length,
    chainIntegrity: 100
  };
};

export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const truncateHash = (hash: string, length: number = 8): string => {
  if (hash.length <= length * 2) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
};
