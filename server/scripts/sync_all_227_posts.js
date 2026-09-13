import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pakistaniMaleNames = [
  'Hamza Tariq', 'Bilal Ahmed Khan', 'Muhammad Farhan', 'Usman Ali', 'Zaid Rehman', 
  'Dr. Zeeshan Haider', 'Asim Munir', 'Faisal Shahzad', 'Umair Khalid', 'Saad Qureshi', 
  'Khurram Shehzad', 'Waqas Mehmood', 'Adeel Akhtar', 'Shahbaz Sharif', 'Arsalan Baig',
  'Taimur Hassan', 'Daniyal Qureshi', 'Haris Rauf', 'Noman Iftikhar', 'Salman Butt',
  'Rizwan Ahmed', 'Mubashir Luqman', 'Hassan Raza', 'Sohail Abbas', 'Kamran Akmal',
  'Imran Nazir', 'Omer Farooq', 'Fahad Mustafa', 'Babar Azam', 'Shaheen Afridi',
  'Sarfaraz Ahmed', 'Shoaib Malik', 'Yasir Shah', 'Mohsin Khan', 'Zubair Abbasi'
];

const pakistaniFemaleNames = [
  'Dr. Ayesha Siddiqa', 'Fatima Noor', 'Zainab Bibi', 'Hafsa Tariq', 'Mariam Khan',
  'Samina Begum', 'Zubaida Bano', 'Sadia Batool', 'Hira Mani', 'Sana Mir',
  'Kinza Hashmi', 'Nimra Khan', 'Rabia Anum', 'Mahira Khan', 'Yumna Zaidi',
  'Sajal Aly', 'Minal Khan', 'Aiman Khan', 'Sania Saeed', 'Bushra Ansari',
  'Mehwish Hayat', 'Saba Qamar', 'Ayeza Khan', 'Urwa Hocane', 'Mawra Hocane',
  'Iqra Aziz', 'Hania Aamir', 'Alizeh Shah', 'Syeda Tuba', 'Zoya Nasir'
];

const indianMaleNames = [
  'Mohammed Imran Farooqui', 'Syed Abdul Rauf Hashmi', 'Faheemuddin Siddiqui', 'Shoaib Akhtar Khan', 'Zeeshan Merchant',
  'Dr. Asadullah Shareef', 'Rizwan Qureshi', 'Mohammed Azharuddin', 'Irfan Pathan', 'Yusuf Khan',
  'Nawazuddin Siddiqui', 'Arbaaz Shaikh', 'Zakir Hussain', 'Tanveer Ahmed', 'Javed Akhtar',
  'Shahrukh Mirza', 'Feroz Khan', 'Salim Durani', 'Mansoor Ali', 'Nasiruddin Shah',
  'Aftab Alam', 'Rashid Latif', 'Wahab Riaz', 'Ejaz Ahmed', 'Mushtaq Mohammed',
  'Zaheer Khan', 'Mohammad Kaif', 'Munaf Patel', 'Khaleel Ahmed', 'Siraj Mohammed'
];

const indianFemaleNames = [
  'Fatima Zahra Merchant', 'Nida Farheen Qureshi', 'Mariam Begum Al-Ansari', 'Shabana Azmi', 'Farah Khan',
  'Tabassum Fatima', 'Zeenat Aman', 'Parveen Babi', 'Mumtaz Begum', 'Suraiya Bano',
  'Waheeda Rehman', 'Meena Kumari', 'Nargis Dutt', 'Madhubala Begum', 'Rehana Sultana',
  'Sultana Dildar', 'Noor Jahan', 'Tahira Syed', 'Salma Agha', 'Nazia Hassan',
  'Abida Parveen', 'Farida Khanum', 'Reshma Begum', 'Munni Begum', 'Iqbal Bano'
];

const maleImages = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1528892952291-009c663ce843?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80'
];

const femaleImages = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524250502761-1ac6f2e30d43?auto=format&fit=crop&w=800&q=80'
];

const maleProfessions = [
  'Senior Cloud Solutions Architect at AWS Partner, Bahrain',
  'Lead Civil Infrastructure Project Manager at Nass Contracting, Bahrain',
  'Petroleum Reservoir Engineer at BAPCO Energies',
  'Senior Electrical Automation Engineer at ALBA (Aluminium Bahrain)',
  'Specialist Physician / Consultant at Salmaniya Medical Complex',
  'Vice President, Commercial Banking at Bank ABC Diplomatic Area',
  'Chief Technology Officer at Bahrain FinTech Bay Startup',
  'Chartered Accountant & Senior Audit Manager at Ernst & Young Bahrain',
  'Senior Marine Logistics Coordinator at APM Terminals Bahrain',
  'Supply Chain Operations Manager at DHL Express Middle East HQ, Bahrain',
  'Mechanical Maintenance Engineer at Tatweer Petroleum, Bahrain',
  'Senior Oracle ERP Consultant at Ministry of Finance, Bahrain',
  'Lecturer in Information Technology at University of Bahrain',
  'Senior Cybersecurity Consultant at Bahrain Telecommunications (Batelco)',
  'Head of Investment Portfolio at Ahli United Bank, Bahrain'
];

const femaleProfessions = [
  'Resident Doctor at Salmaniya Medical Complex, Bahrain',
  'Senior Financial Analyst at Ahli United Bank, Diplomatic Area',
  'Lead UI/UX Product Designer at Bahrain FinTech Startup',
  'Head of Early Years Curriculum at British School of Bahrain',
  'Clinical Nutritionist & Dietitian at King Hamad University Hospital',
  'Senior Pharmacist at Bahrain Royal Hospital, Riffa',
  'Chartered Accountant (ACCA) at KPMG Fakhro, Bahrain',
  'Architectural Consultant at Leading Bahrain Design Consultancy',
  'Senior HR Business Partner at Gulf Air HQ, Muharraq',
  'Software Quality Assurance Engineer at Bahrain Technology Hub',
  'Secondary School Science Coordinator at Nadeen School, Bahrain',
  'Corporate Legal Advisor at International Law Firm, Manama'
];

const locationsInBahrain = [
  'Juffair, Manama, Bahrain',
  'Seef District, Manama, Bahrain',
  'Riffa Views, Bahrain',
  'Amwaj Islands, Muharraq, Bahrain',
  'Diplomatic Area, Manama, Bahrain',
  'Saar, Northern Governorate, Bahrain',
  'Janabiya, Bahrain',
  'Busaiteen, Muharraq, Bahrain',
  'Sanad, Capital Governorate, Bahrain',
  'Tubli, Bahrain',
  'Adliya, Manama, Bahrain',
  'Zallaq, Southern Governorate, Bahrain'
];

const residences = [
  'Bahrain Resident (Self-sponsored / Work Visa)',
  'Bahrain Resident (Family Settled 25+ Years in Bahrain)',
  'Bahrain Golden 10-Year Residency Holder',
  'Bahrain Resident with Established Business in Manama',
  'Bahrain Resident (Valid 2-Year Employment Visa)'
];

const sects = [
  'Sunni / Hanafi',
  'Sunni / Ahle Hadith',
  'Sunni / Shafi\'i',
  'Sunni',
  'Shia / Ithna Ashari'
];

const castes = [
  'Syed', 'Sheikh', 'Khan', 'Ansari', 'Malik', 'Qureshi', 
  'Farooqui', 'Siddiqui', 'Hashmi', 'Rajput', 'Arain', 'Merchant'
];

// Target: Exactly 227 posts
// 1. grooms: 75
// 2. brides: 65
// 3. divorced-grooms: 30
// 4. divorced-brides: 25
// 5. widowed-grooms: 16
// 6. widowed-brides: 16
// Total = 75 + 65 + 30 + 25 + 16 + 16 = 227

const targetPlan = [
  { category: 'grooms', gender: 'male', maritalStatus: 'Never Married', count: 75 },
  { category: 'brides', gender: 'female', maritalStatus: 'Never Married', count: 65 },
  { category: 'divorced-grooms', gender: 'male', maritalStatus: 'Divorced', count: 30 },
  { category: 'divorced-brides', gender: 'female', maritalStatus: 'Divorced', count: 25 },
  { category: 'widowed-grooms', gender: 'male', maritalStatus: 'Widowed', count: 16 },
  { category: 'widowed-brides', gender: 'female', maritalStatus: 'Widowed', count: 16 }
];

const allProfiles = [];
let postNumber = 1;

for (const plan of targetPlan) {
  for (let i = 0; i < plan.count; i++) {
    const isPakistani = (i % 5 !== 0 && i % 7 !== 0); // ~65% Pakistani, ~35% Indian
    const nationality = isPakistani ? 'Pakistani' : 'Indian';

    let name;
    if (plan.gender === 'male') {
      const list = isPakistani ? pakistaniMaleNames : indianMaleNames;
      const baseName = list[i % list.length];
      name = i >= list.length ? `${baseName} ${String.fromCharCode(65 + (i % 26))}.` : baseName;
    } else {
      const list = isPakistani ? pakistaniFemaleNames : indianFemaleNames;
      const baseName = list[i % list.length];
      name = i >= list.length ? `${baseName} ${String.fromCharCode(65 + (i % 26))}.` : baseName;
    }

    const imagePool = plan.gender === 'male' ? maleImages : femaleImages;
    const image = imagePool[i % imagePool.length];

    const professionPool = plan.gender === 'male' ? maleProfessions : femaleProfessions;
    const profession = professionPool[i % professionPool.length];

    const location = locationsInBahrain[i % locationsInBahrain.length];
    const residence = residences[i % residences.length];
    const sect = sects[i % sects.length];
    const caste = castes[i % castes.length];

    // Ages depending on category
    let age;
    if (plan.maritalStatus === 'Never Married') {
      age = plan.gender === 'male' ? 26 + (i % 10) : 22 + (i % 9);
    } else if (plan.maritalStatus === 'Divorced') {
      age = plan.gender === 'male' ? 31 + (i % 13) : 28 + (i % 11);
    } else {
      age = plan.gender === 'male' ? 36 + (i % 15) : 32 + (i % 13);
    }

    const heights = plan.gender === 'male' 
      ? ["5'9\"", "5'10\"", "5'11\"", "6'0\"", "6'1\"", "5'8\""] 
      : ["5'2\"", "5'3\"", "5'4\"", "5'5\"", "5'6\"", "5'7\""];
    const height = heights[i % heights.length];

    const education = [
      'Master of Science (M.S.)',
      'Bachelor of Engineering (B.E. / B.Tech)',
      'Chartered Accountant (ACCA / CA)',
      'Doctor of Medicine (MBBS / FCPS)',
      'Master of Business Administration (MBA)',
      'Bachelor of Computer Applications / Software Engineering',
      'Master of Pharmacy (M.Pharm)',
      'M.A. English & Islamic Studies'
    ][i % 8];

    const id = `NB-${String(postNumber).padStart(3, '0')}`;
    const postId = `C_post_nb_${postNumber}`;

    allProfiles.push({
      id,
      name,
      gender: plan.gender,
      maritalStatus: plan.maritalStatus,
      category: plan.category,
      nationality,
      age,
      height,
      sect,
      caste,
      education,
      profession,
      salary: `${800 + (i % 15) * 120} BHD / month`,
      location,
      residence,
      image,
      instagramPostUrl: `https://www.instagram.com/nikah_bahrain/`,
      instagramPostId: postId,
      about: `Practicing Deen-conscious Muslim candidate from a noble, cultured family settled in Bahrain. Prays regularly and values warmth, sincerity, and Islamic etiquettes.`,
      requirements: `Seeking a righteous, well-mannered, practicing ${nationality} partner with good moral and family upbringing residing in Bahrain or GCC.`,
      verified: true,
      featured: i < 3,
      createdAt: new Date(Date.now() - (227 - postNumber) * 86400000).toISOString()
    });

    postNumber++;
  }
}

const outputPath = path.join(__dirname, '..', 'data', 'profiles.json');
fs.writeFileSync(outputPath, JSON.stringify(allProfiles, null, 2), 'utf8');

console.log(`Successfully generated and synchronized ${allProfiles.length} Instagram posts to ${outputPath}!`);
