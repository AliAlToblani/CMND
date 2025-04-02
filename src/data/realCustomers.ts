
import { LifecycleStageProps } from "@/components/lifecycle/LifecycleStage";
import { 
  FileCheck, 
  DollarSign, 
  Calendar, 
  Users, 
  Smartphone, 
  Mail, 
  MessageSquare, 
  Zap,
  CheckSquare,
  Building
} from "lucide-react";

export interface Customer {
  id: string;
  name: string;
  logo?: string;
  segment?: string;
  region?: string;
  stage: string;
  status: "not-started" | "in-progress" | "done" | "blocked";
  contractSize: number;
  owner: {
    id: string;
    name: string;
    role: string;
  };
}

export const customers: Customer[] = [
  // Went Live
  {
    id: "cust-jahez",
    name: "Jahez",
    segment: "Enterprise",
    region: "MENA",
    stage: "Went Live",
    status: "done",
    contractSize: 57000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-aubh",
    name: "AUBH",
    segment: "Education",
    region: "Bahrain",
    stage: "Went Live",
    status: "done",
    contractSize: 8000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-icabinets",
    name: "iCabinets",
    segment: "SMB",
    region: "Bahrain",
    stage: "Went Live",
    status: "done",
    contractSize: 4400,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-doobi",
    name: "Doobi (MVP)",
    segment: "SMB",
    region: "MENA",
    stage: "Went Live",
    status: "done",
    contractSize: 2400,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-eatco",
    name: "Eatco",
    segment: "SMB",
    region: "Bahrain",
    stage: "Went Live",
    status: "done",
    contractSize: 2300,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-apt",
    name: "APT",
    segment: "SMB",
    region: "Bahrain",
    stage: "Went Live",
    status: "done",
    contractSize: 4400,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-elc",
    name: "ELC",
    segment: "SMB",
    region: "Bahrain",
    stage: "Went Live",
    status: "done",
    contractSize: 3000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-alshoala",
    name: "Alshoala Recruitement",
    segment: "SMB",
    region: "Bahrain",
    stage: "Went Live",
    status: "done",
    contractSize: 2300,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-tegdar",
    name: "Tegdar",
    segment: "SMB",
    region: "MENA",
    stage: "Went Live",
    status: "done",
    contractSize: 2300,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-diwan-hub",
    name: "Diwan Hub",
    segment: "SMB",
    region: "MENA",
    stage: "Went Live",
    status: "done",
    contractSize: 2100,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-morshdy",
    name: "Morshdy",
    segment: "SMB",
    region: "MENA",
    stage: "Went Live",
    status: "done",
    contractSize: 2000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-upward",
    name: "Upward",
    segment: "SMB",
    region: "Bahrain",
    stage: "Went Live",
    status: "done",
    contractSize: 3000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  
  // Agreement Signed / Invoice Sent
  {
    id: "cust-click-insurance",
    name: "Click Insurance",
    segment: "Finance",
    region: "Bahrain",
    stage: "Agreement Signed",
    status: "in-progress",
    contractSize: 2300,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  },
  {
    id: "cust-tasheelat",
    name: "Tasheelat",
    segment: "Finance",
    region: "Bahrain",
    stage: "Invoice Sent",
    status: "in-progress",
    contractSize: 15000,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  },
  {
    id: "cust-polytechnic",
    name: "Polytechnic University",
    segment: "Education",
    region: "Bahrain",
    stage: "Invoice Sent",
    status: "in-progress",
    contractSize: 25000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-dar-alhikma",
    name: "Dar Alhikma University",
    segment: "Education",
    region: "Saudi Arabia",
    stage: "Invoice Sent",
    status: "in-progress",
    contractSize: 20000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-grnata",
    name: "Grnata (Phase I)",
    segment: "Real Estate",
    region: "Bahrain",
    stage: "Invoice Sent",
    status: "in-progress",
    contractSize: 4000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-palm-stays",
    name: "Palm Stays",
    segment: "Hospitality",
    region: "Bahrain",
    stage: "Invoice Sent",
    status: "in-progress",
    contractSize: 2300,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-yolo",
    name: "Yolo",
    segment: "SMB",
    region: "Bahrain",
    stage: "Invoice Sent",
    status: "in-progress",
    contractSize: 2300,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-top-delmon",
    name: "Top Delmon",
    segment: "SMB",
    region: "Bahrain",
    stage: "Invoice Sent",
    status: "in-progress",
    contractSize: 2500,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  
  // Proposal Sent
  {
    id: "cust-hqbyhope",
    name: "HQ by Hope",
    segment: "SMB",
    region: "Bahrain",
    stage: "Proposal Sent",
    status: "in-progress",
    contractSize: 2388,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-parcel",
    name: "Parcel",
    segment: "Logistics",
    region: "MENA",
    stage: "Proposal Sent",
    status: "in-progress",
    contractSize: 15000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-orangery",
    name: "The Orangery",
    segment: "Hospitality",
    region: "Bahrain",
    stage: "Proposal Sent",
    status: "in-progress",
    contractSize: 13000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-aldaaysi",
    name: "Aldaaysi",
    segment: "SMB",
    region: "Bahrain",
    stage: "Proposal Sent",
    status: "in-progress",
    contractSize: 5000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-skiplino",
    name: "Skiplino",
    segment: "SaaS",
    region: "Bahrain",
    stage: "Proposal Sent",
    status: "in-progress",
    contractSize: 5000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-lavender",
    name: "Lavender Laundry",
    segment: "SMB",
    region: "Bahrain",
    stage: "Proposal Sent",
    status: "in-progress",
    contractSize: 5000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-benefit",
    name: "Benefit",
    segment: "Finance",
    region: "Bahrain",
    stage: "Proposal Sent",
    status: "in-progress",
    contractSize: 92000,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  },
  {
    id: "cust-yk-almoayyed",
    name: "YK Almoayyed",
    segment: "Enterprise",
    region: "Bahrain",
    stage: "Proposal Sent",
    status: "in-progress",
    contractSize: 21000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  
  // Approved
  {
    id: "cust-reboot",
    name: "Reboot",
    segment: "SMB",
    region: "Bahrain",
    stage: "Approved",
    status: "in-progress",
    contractSize: 8000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-vape",
    name: "Vape in Bahrain",
    segment: "SMB",
    region: "Bahrain",
    stage: "Approved",
    status: "in-progress",
    contractSize: 3000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-bahrain-life",
    name: "Bahrain Life",
    segment: "SMB",
    region: "Bahrain",
    stage: "Approved",
    status: "in-progress",
    contractSize: 2300,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-alawathani",
    name: "alawathani electronics",
    segment: "SMB",
    region: "Bahrain",
    stage: "Approved",
    status: "in-progress",
    contractSize: 3000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-portion",
    name: "Portion",
    segment: "Food",
    region: "Bahrain",
    stage: "Approved",
    status: "in-progress",
    contractSize: 2300,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-ajeeb",
    name: "Ajeeb",
    segment: "Food",
    region: "Bahrain",
    stage: "Approved",
    status: "in-progress",
    contractSize: 2300,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  
  // Pilot Stage
  {
    id: "cust-tamkeen",
    name: "Tamkeen",
    segment: "Government",
    region: "Bahrain",
    stage: "Pilot Stage",
    status: "in-progress",
    contractSize: 25000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-gulf-air",
    name: "Gulf Air Group",
    segment: "Travel",
    region: "MENA",
    stage: "Pilot Stage",
    status: "in-progress",
    contractSize: 120000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-malaeb",
    name: "Malaeb",
    segment: "Sports",
    region: "MENA",
    stage: "Pilot Stage",
    status: "in-progress",
    contractSize: 15000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-flooss",
    name: "Flooss",
    segment: "Finance",
    region: "Bahrain",
    stage: "Pilot Stage",
    status: "in-progress",
    contractSize: 25000,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  },
  {
    id: "cust-lumofy",
    name: "Lumofy",
    segment: "Education",
    region: "Bahrain",
    stage: "Pilot Stage",
    status: "in-progress",
    contractSize: 15000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-tamarran",
    name: "Tamarran",
    segment: "SMB",
    region: "Bahrain",
    stage: "Pilot Stage",
    status: "in-progress",
    contractSize: 3000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-calo",
    name: "Calo",
    segment: "Health",
    region: "Bahrain",
    stage: "Pilot Stage",
    status: "in-progress",
    contractSize: 25000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-unipal",
    name: "Unipal",
    segment: "Education",
    region: "MENA",
    stage: "Pilot Stage",
    status: "in-progress",
    contractSize: 3000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  
  // Demo Stage
  {
    id: "cust-foodics",
    name: "Foodics",
    segment: "Enterprise",
    region: "MENA",
    stage: "Demo Stage",
    status: "in-progress",
    contractSize: 150000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-qic",
    name: "Qatar Insurance Company",
    segment: "Finance",
    region: "Qatar",
    stage: "Demo Stage",
    status: "in-progress",
    contractSize: 50000,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  },
  {
    id: "cust-moc-bahrain",
    name: "Ministry of Commerce (Bahrain)",
    segment: "Government",
    region: "Bahrain",
    stage: "Demo Stage",
    status: "in-progress",
    contractSize: 26000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah", 
      role: "Account Executive"
    }
  },
  {
    id: "cust-gulf-aviation",
    name: "Gulf Aviation Academy",
    segment: "Aviation",
    region: "Bahrain",
    stage: "Demo Stage",
    status: "in-progress",
    contractSize: 8000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-mazad",
    name: "Mazad",
    segment: "Government",
    region: "Bahrain",
    stage: "Demo Stage",
    status: "in-progress",
    contractSize: 25000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-swftbox",
    name: "SWFTBox",
    segment: "Logistics",
    region: "MENA",
    stage: "Demo Stage",
    status: "in-progress",
    contractSize: 15000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-ahlan",
    name: "Ahlan app",
    segment: "SMB",
    region: "Bahrain",
    stage: "Demo Stage",
    status: "in-progress",
    contractSize: 22000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  
  // Interest Captured - Finance, Banking, Enterprise, and Telecom
  {
    id: "cust-alsalam",
    name: "Alsalam Bank",
    segment: "Finance",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 120000,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  },
  {
    id: "cust-qnb",
    name: "Qatar National Bank",
    segment: "Finance",
    region: "Qatar",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 300000,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  },
  {
    id: "cust-zain",
    name: "Zain (Bahrain)",
    segment: "Telecom",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 150000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-stc",
    name: "STC (Bahrain)",
    segment: "Telecom",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 150000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-noon",
    name: "Noon",
    segment: "Enterprise",
    region: "MENA",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 500000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  
  // Interest Captured - SMBs and Others
  {
    id: "cust-spring-travel",
    name: "Spring Travel",
    segment: "Travel",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 4000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-blooming",
    name: "Blooming Flowers",
    segment: "SMB",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 3000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-suppliree",
    name: "Suppliree",
    segment: "B2B",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 3000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-cazasouq",
    name: "CazaSouq",
    segment: "Retail",
    region: "MENA",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 15000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-rain",
    name: "Rain",
    segment: "Finance",
    region: "MENA",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 50000,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  },
  {
    id: "cust-7x",
    name: "7X",
    segment: "Enterprise",
    region: "Saudi Arabia",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 200000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  
  // Interest Captured - Educational Institutions
  {
    id: "cust-gulf-uni",
    name: "Gulf University",
    segment: "Education",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 15000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-applied-science",
    name: "Applied Science University",
    segment: "Education",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 6000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  
  // Interest Captured - Financial and Government
  {
    id: "cust-eazypay",
    name: "EazyPay",
    segment: "Finance",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 50000,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  },
  {
    id: "cust-alzayani",
    name: "Alzayani Investment",
    segment: "Finance",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 50000,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  },
  {
    id: "cust-ila",
    name: "Ila Bank",
    segment: "Finance",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 120000,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  },
  
  // Interest Captured - Tech and SaaS
  {
    id: "cust-ordable",
    name: "Ordable",
    segment: "SaaS",
    region: "MENA",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 50000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-eat-app",
    name: "Eat App",
    segment: "SaaS",
    region: "MENA",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 15000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-bahrain-airport",
    name: "Bahrain Airport Company",
    segment: "Aviation",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 25000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-bahrain-egov",
    name: "Bahrain eGov",
    segment: "Government",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 150000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  
  // Interest Captured - More Tech and SaaS
  {
    id: "cust-playbook",
    name: "PlayBook",
    segment: "SaaS",
    region: "MENA",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 15000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-penny",
    name: "Penny Software",
    segment: "SaaS",
    region: "MENA",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 15000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-bbk",
    name: "Bank of Bahrain and Kuwait",
    segment: "Finance",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 120000,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  },
  
  // Interest Captured - Additional SMBs
  {
    id: "cust-travilege",
    name: "Travilege",
    segment: "Travel",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 2300,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-parkpoint",
    name: "ParkPoint",
    segment: "Smart City",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 25000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-credimax",
    name: "Credimax",
    segment: "Finance",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 2388,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  },
  
  // Interest Captured - Educational Institutions
  {
    id: "cust-university-bahrain",
    name: "University of Bahrain",
    segment: "Education",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 25000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-british-university",
    name: "The British University of Bahrain",
    segment: "Education",
    region: "Bahrain",
    stage: "Interest Captured",
    status: "not-started",
    contractSize: 15000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  
  // High Potential
  {
    id: "cust-annada",
    name: "Annada",
    segment: "SMB",
    region: "Bahrain",
    stage: "High Potential",
    status: "not-started",
    contractSize: 2300,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-healthwatchers",
    name: "healthwatchers",
    segment: "Health",
    region: "Bahrain",
    stage: "High Potential",
    status: "not-started",
    contractSize: 2300,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-be-suited",
    name: "Be Suited",
    segment: "Fashion",
    region: "Bahrain",
    stage: "High Potential",
    status: "not-started",
    contractSize: 3000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-kfm",
    name: "KFM",
    segment: "SMB",
    region: "Bahrain",
    stage: "High Potential",
    status: "not-started",
    contractSize: 5000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-spire",
    name: "Spire Travel",
    segment: "Travel",
    region: "Bahrain",
    stage: "High Potential",
    status: "not-started",
    contractSize: 3000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-nana",
    name: "NANA",
    segment: "Retail",
    region: "Saudi Arabia",
    stage: "High Potential",
    status: "not-started",
    contractSize: 100000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-talabat",
    name: "Talabat",
    segment: "Enterprise",
    region: "MENA",
    stage: "High Potential",
    status: "not-started",
    contractSize: 400000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-virgin",
    name: "Virgin",
    segment: "Enterprise",
    region: "MENA",
    stage: "High Potential",
    status: "not-started",
    contractSize: 300000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-careem",
    name: "Careem",
    segment: "Enterprise",
    region: "MENA",
    stage: "High Potential",
    status: "not-started",
    contractSize: 300000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-faainex",
    name: "FAAINEX",
    segment: "Finance",
    region: "Bahrain",
    stage: "High Potential",
    status: "not-started",
    contractSize: 2300,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  },
  {
    id: "cust-ekar",
    name: "Ekar",
    segment: "Transport",
    region: "MENA",
    stage: "High Potential",
    status: "not-started",
    contractSize: 100000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-morny",
    name: "Morny",
    segment: "Finance",
    region: "MENA",
    stage: "High Potential",
    status: "not-started",
    contractSize: 100000,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  },
  {
    id: "cust-tap",
    name: "Tap Payment",
    segment: "Finance",
    region: "MENA",
    stage: "High Potential",
    status: "not-started",
    contractSize: 50000,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  },
  {
    id: "cust-sharaf-dg",
    name: "Sharaf DG",
    segment: "Retail",
    region: "MENA",
    stage: "High Potential",
    status: "not-started",
    contractSize: 250000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  
  // Potential
  {
    id: "cust-jovia",
    name: "Jovia",
    segment: "SMB",
    region: "Bahrain",
    stage: "Potential",
    status: "not-started",
    contractSize: 780,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-monshaat",
    name: "MonshaatSA",
    segment: "Government",
    region: "Saudi Arabia",
    stage: "Potential",
    status: "not-started",
    contractSize: 300000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-alula",
    name: "The Royal Commission for AlUla",
    segment: "Government",
    region: "Saudi Arabia",
    stage: "Potential",
    status: "not-started",
    contractSize: 150000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-landmark",
    name: "Landmark Group",
    segment: "Retail",
    region: "MENA",
    stage: "Potential",
    status: "not-started",
    contractSize: 2388,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-crust",
    name: "Crust and Crema",
    segment: "Food",
    region: "Bahrain",
    stage: "Potential",
    status: "not-started",
    contractSize: 2388,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  
  // More Potentials
  {
    id: "cust-endeavor",
    name: "Endeavor",
    segment: "SMB",
    region: "Bahrain",
    stage: "Potential",
    status: "not-started",
    contractSize: 2388,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-nice-one",
    name: "Nice One",
    segment: "Retail",
    region: "MENA",
    stage: "Potential",
    status: "not-started",
    contractSize: 2388,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-lean-tech",
    name: "Lean Tech",
    segment: "Technology",
    region: "Bahrain",
    stage: "Potential",
    status: "not-started",
    contractSize: 2388,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  
  // Enterprise Potential
  {
    id: "cust-salla",
    name: "Salla",
    segment: "Enterprise",
    region: "Saudi Arabia",
    stage: "Potential",
    status: "not-started",
    contractSize: 300000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-mozn",
    name: "Mozn",
    segment: "Enterprise",
    region: "Saudi Arabia",
    stage: "Potential",
    status: "not-started",
    contractSize: 200000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-mrsool",
    name: "Mrsool",
    segment: "Enterprise",
    region: "Saudi Arabia",
    stage: "Potential",
    status: "not-started",
    contractSize: 200000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-rasan",
    name: "Rasan",
    segment: "Enterprise",
    region: "Saudi Arabia",
    stage: "Potential",
    status: "not-started",
    contractSize: 15000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-noon-academy",
    name: "Noon Academy",
    segment: "Education",
    region: "MENA",
    stage: "Potential",
    status: "not-started",
    contractSize: 200000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  
  // SMB Potential
  {
    id: "cust-clearscan",
    name: "Clearscan.ai",
    segment: "Technology",
    region: "MENA",
    stage: "Potential",
    status: "not-started",
    contractSize: 2388,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-makan",
    name: "Makan Design",
    segment: "Design",
    region: "Bahrain",
    stage: "Potential",
    status: "not-started",
    contractSize: 2388,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-waffrha",
    name: "Waffrha",
    segment: "SMB",
    region: "Saudi Arabia",
    stage: "Potential",
    status: "not-started",
    contractSize: 2388,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-bin-rajab",
    name: "Bin Rajab Group",
    segment: "SMB",
    region: "Bahrain",
    stage: "Potential",
    status: "not-started",
    contractSize: 12000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-golden-scent",
    name: "Golden Scent",
    segment: "Retail",
    region: "Saudi Arabia",
    stage: "Potential",
    status: "not-started",
    contractSize: 2388,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  
  // Final Batch
  {
    id: "cust-thobi",
    name: "Thobi",
    segment: "Fashion",
    region: "Bahrain",
    stage: "Potential",
    status: "not-started",
    contractSize: 3000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-local-bh",
    name: "LocalBH",
    segment: "SMB",
    region: "Bahrain",
    stage: "Potential",
    status: "not-started",
    contractSize: 3000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-cham",
    name: "Cham Clinics",
    segment: "Healthcare",
    region: "Bahrain",
    stage: "Potential",
    status: "not-started",
    contractSize: 2661,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-anwar",
    name: "al anwar travel",
    segment: "Travel",
    region: "Bahrain",
    stage: "Potential",
    status: "not-started",
    contractSize: 3000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-myhealth",
    name: "myhealth medical center",
    segment: "Healthcare",
    region: "Bahrain",
    stage: "Potential",
    status: "not-started",
    contractSize: 3000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-meattown",
    name: "meattown",
    segment: "Food",
    region: "Bahrain",
    stage: "Potential",
    status: "not-started",
    contractSize: 10000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-elite",
    name: "elite medical center",
    segment: "Healthcare",
    region: "Bahrain",
    stage: "Potential",
    status: "not-started",
    contractSize: 3000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-strathclyde",
    name: "Strathclyde",
    segment: "Education",
    region: "Bahrain",
    stage: "Potential",
    status: "not-started",
    contractSize: 2388,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-dieture",
    name: "Dieture",
    segment: "Healthcare",
    region: "MENA",
    stage: "Potential",
    status: "not-started",
    contractSize: 15000,
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    }
  },
  {
    id: "cust-bolt",
    name: "Bolt",
    segment: "Transport",
    region: "MENA",
    stage: "Potential",
    status: "not-started",
    contractSize: 400000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-zid",
    name: "Zid",
    segment: "Enterprise",
    region: "Saudi Arabia",
    stage: "Potential",
    status: "not-started",
    contractSize: 350000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-noon-sa",
    name: "Noon",
    segment: "Enterprise",
    region: "Saudi Arabia",
    stage: "Potential",
    status: "not-started",
    contractSize: 600000,
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    }
  },
  {
    id: "cust-tabby",
    name: "Tabby",
    segment: "Finance",
    region: "MENA",
    stage: "Potential",
    status: "not-started",
    contractSize: 400000,
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    }
  }
];

// Default lifecycle stages for the real customers
export const defaultCustomerLifecycleStages = [
  // Sales stages
  {
    id: "stage-initial-contact",
    name: "Initial Contact",
    status: "not-started" as const,
    category: "Sales",
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    },
    notes: "First connection with the potential customer.",
    iconName: "Users"
  },
  {
    id: "stage-demo-completed",
    name: "Demo Completed",
    status: "not-started" as const,
    category: "Sales",
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    },
    notes: "Product demonstration for key stakeholders.",
    iconName: "Smartphone"
  },
  {
    id: "stage-proposal-sent",
    name: "Proposal Sent",
    status: "not-started" as const,
    category: "Sales",
    owner: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Ahmed Abdullah",
      role: "Account Executive"
    },
    notes: "Formal proposal shared with pricing and terms.",
    iconName: "FileCheck"
  },
  {
    id: "stage-contract-signed",
    name: "Agreement Signed",
    status: "not-started" as const,
    category: "Finance",
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    },
    notes: "Completed contract with signatures from all parties.",
    iconName: "FileCheck"
  },
  
  // Finance stages
  {
    id: "stage-invoice-sent",
    name: "Invoice Sent",
    status: "not-started" as const,
    category: "Finance",
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    },
    notes: "Initial invoice sent to customer.",
    iconName: "DollarSign"
  },
  {
    id: "stage-payment-received",
    name: "Payment Received",
    status: "not-started" as const,
    category: "Finance",
    owner: {
      id: "00000000-0000-0000-0000-000000000003",
      name: "Khalid Al-Farsi",
      role: "Finance Manager"
    },
    notes: "Payment successfully processed.",
    iconName: "DollarSign"
  },
  
  // Onboarding stages
  {
    id: "stage-kickoff",
    name: "Kickoff Meeting",
    status: "not-started" as const,
    category: "Onboarding",
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    },
    notes: "Initial project kickoff with key stakeholders.",
    iconName: "Calendar"
  },
  {
    id: "stage-requirements",
    name: "Requirements Gathering",
    status: "not-started" as const,
    category: "Onboarding",
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    },
    notes: "Document detailed customer requirements.",
    iconName: "FileCheck"
  },
  {
    id: "stage-account-setup",
    name: "Account Setup",
    status: "not-started" as const,
    category: "Onboarding",
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    },
    notes: "Set up customer account with initial configuration.",
    iconName: "Users"
  },
  
  // Integration stages
  {
    id: "stage-chat-integration",
    name: "Chat Integration",
    status: "not-started" as const,
    category: "Integration",
    owner: {
      id: "00000000-0000-0000-0000-000000000004",
      name: "Mohammed Rahman",
      role: "Integration Engineer"
    },
    notes: "Implement customer chat integration.",
    iconName: "MessageSquare"
  },
  {
    id: "stage-email-integration",
    name: "Email Integration",
    status: "not-started" as const,
    category: "Integration",
    owner: {
      id: "00000000-0000-0000-0000-000000000004",
      name: "Mohammed Rahman",
      role: "Integration Engineer"
    },
    notes: "Configure email integration.",
    iconName: "Mail"
  },
  {
    id: "stage-mobile-integration",
    name: "Mobile App Integration",
    status: "not-started" as const,
    category: "Integration",
    owner: {
      id: "00000000-0000-0000-0000-000000000004",
      name: "Mohammed Rahman",
      role: "Integration Engineer"
    },
    notes: "Configure mobile app settings.",
    iconName: "Smartphone"
  },
  
  // Success stages
  {
    id: "stage-pilot",
    name: "Pilot Program",
    status: "not-started" as const,
    category: "Success",
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    },
    notes: "Limited deployment with key users.",
    iconName: "Users"
  },
  {
    id: "stage-go-live",
    name: "Go Live",
    status: "not-started" as const,
    category: "Success",
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    },
    notes: "Official launch of the solution.",
    iconName: "Zap"
  },
  {
    id: "stage-review",
    name: "Post-Launch Review",
    status: "not-started" as const,
    category: "Success",
    owner: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Fatima Hassan",
      role: "Customer Success Manager"
    },
    notes: "Review after 30 days of live usage.",
    iconName: "CheckSquare"
  }
];

export const icons = {
  Building,
  FileCheck, 
  DollarSign, 
  Calendar, 
  Users, 
  Smartphone, 
  Mail, 
  MessageSquare, 
  Zap,
  CheckSquare
};
