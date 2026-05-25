// Run: node --experimental-sqlite server/seed-submissions.js
const { DatabaseSync } = require('node:sqlite')
const path = require('path')

const db = new DatabaseSync(path.join(__dirname, '../database/portal.db'))

const samples = [
  {
    applyingFor: 'Software Engineer',
    branch: 'Kuala Lumpur HQ',
    nameNRIC: 'Ahmad Bin Hassan',
    email: 'ahmad.hassan@email.com',
    phoneArea: '+60', phoneNumber: '12-345 6789',
    homeAddress: 'No. 12, Jalan Ampang, 50450 Kuala Lumpur',
    dob: '1995-03-15', maritalStatus: 'Single', religion: 'Islam', race: 'Malay',
    nric: '950315-14-1234', incomeTax: 'SG12345678', epf: '12345678', socso: '12345678',
    highestEducation: "Bachelor's Degree",
    currentJobDesc: 'Full-stack web developer with 4 years experience in React and Node.js',
    leisureActivities: 'Badminton, reading, coding side projects',
    additionalInfo: 'Available to start immediately',
    startDate: '2026-06-01', expectedSalary: '5500',
    familyDetails: [
      { relation: 'Father', name: 'Hassan Bin Ali', age: '58', occupation: 'Retired' },
      { relation: 'Mother', name: 'Zainab Binti Yusof', age: '54', occupation: 'Teacher' },
    ],
    educationHistory: [
      { institution: 'Universiti Malaya', dateJoined: '2013-09', dateGraduated: '2017-06', standardPassed: 'BSc Computer Science (2nd Upper)' }
    ],
    qualifications: [
      { particulars: 'AWS Certified Developer', dateFrom: '2022-01', dateTo: '2025-01' }
    ],
    employmentHistory: [
      { dateFrom: '2020-01', dateTo: '2024-12', employerPosition: 'Tech Solutions Sdn Bhd – Junior Developer', salary: '4500', reasons: 'Career advancement' }
    ],
    references: [
      { name: 'Mr. Lee Chong Wei', jobTitle: 'Senior Manager', contactNo: '03-1234 5678', email: 'lee.cw@techsolutions.com', relationship: 'Direct supervisor' }
    ],
    emergencyContacts: [
      { name: 'Hassan Bin Ali', contactNo: '012-987 6543', relationship: 'Father' }
    ],
    langProf: { 'Bahasa Melayu': { oral: 'Excellent', written: 'Excellent' }, 'English': { oral: 'Good', written: 'Good' }, 'Chinese/Mandarin': { oral: 'Basic', written: 'None' } },
    otherInfo: { convicted: false, dismissed: false, illness: false },
  },
  {
    applyingFor: 'Audit Associate',
    branch: 'Petaling Jaya Branch',
    nameNRIC: 'Lim Wei Ting',
    email: 'lim.weiting@email.com',
    phoneArea: '+60', phoneNumber: '16-788 9012',
    homeAddress: 'Unit 5-3, Damansara Utama, 47400 Petaling Jaya',
    dob: '1998-07-22', maritalStatus: 'Single', religion: 'Buddhism', race: 'Chinese',
    nric: '980722-10-5678', incomeTax: 'OG98765432', epf: '87654321', socso: '87654321',
    highestEducation: "Bachelor's Degree",
    currentJobDesc: 'Audit trainee with 1 year experience in statutory audit and tax compliance',
    leisureActivities: 'Piano, cooking, travelling',
    additionalInfo: 'ACCA Part 2 qualified, pursuing ACCA Finals',
    startDate: '2026-06-15', expectedSalary: '3800',
    familyDetails: [
      { relation: 'Father', name: 'Lim Ah Kow', age: '60', occupation: 'Businessman' },
      { relation: 'Mother', name: 'Tan Siew Lan', age: '57', occupation: 'Homemaker' },
    ],
    educationHistory: [
      { institution: 'Sunway University', dateJoined: '2016-09', dateGraduated: '2019-06', standardPassed: 'Diploma in Accounting (Distinction)' },
      { institution: 'ACCA (Self-study)', dateJoined: '2019-07', dateGraduated: '', standardPassed: 'ACCA Part 2 Qualified' }
    ],
    qualifications: [
      { particulars: 'ACCA Part 2', dateFrom: '2019-07', dateTo: '' }
    ],
    employmentHistory: [
      { dateFrom: '2022-03', dateTo: '2024-11', employerPosition: 'PricewaterhouseCoopers – Audit Trainee', salary: '3200', reasons: 'Better career prospects' }
    ],
    references: [
      { name: 'Ms. Ng Siew Fong', jobTitle: 'Audit Manager', contactNo: '03-2222 3333', email: 'ng.sf@pwc.com', relationship: 'Direct Manager' }
    ],
    emergencyContacts: [
      { name: 'Lim Ah Kow', contactNo: '016-333 4444', relationship: 'Father' }
    ],
    langProf: { 'Bahasa Melayu': { oral: 'Good', written: 'Good' }, 'English': { oral: 'Excellent', written: 'Excellent' }, 'Chinese/Mandarin': { oral: 'Excellent', written: 'Good' } },
    otherInfo: { convicted: false, dismissed: false, illness: false },
  },
  {
    applyingFor: 'Business Development Executive',
    branch: 'Kuala Lumpur HQ',
    nameNRIC: 'Priya a/p Subramaniam',
    email: 'priya.subra@email.com',
    phoneArea: '+60', phoneNumber: '11-2233 4455',
    homeAddress: 'No. 88, Jalan Bangsar, 59000 Kuala Lumpur',
    dob: '1993-11-08', maritalStatus: 'Married', religion: 'Hinduism', race: 'Indian',
    nric: '931108-07-3344', incomeTax: 'TM11223344', epf: '11223344', socso: '11223344',
    highestEducation: "Master's Degree",
    currentJobDesc: 'Business development with 5 years experience in B2B sales and client management',
    leisureActivities: 'Yoga, painting, volunteering at NGOs',
    additionalInfo: 'Bilingual (English/Tamil), holds driving licence',
    startDate: '2026-07-01', expectedSalary: '7000',
    familyDetails: [
      { relation: 'Spouse', name: 'Rajesh Kumar', age: '32', occupation: 'Engineer' },
    ],
    educationHistory: [
      { institution: 'Universiti Putra Malaysia', dateJoined: '2011-09', dateGraduated: '2014-06', standardPassed: 'BBA Marketing (1st Class)' },
      { institution: 'University of Nottingham (Malaysia)', dateJoined: '2015-01', dateGraduated: '2016-12', standardPassed: 'MBA' }
    ],
    qualifications: [
      { particulars: 'Certified Sales Professional (CSP)', dateFrom: '2021-05', dateTo: '2024-05' }
    ],
    employmentHistory: [
      { dateFrom: '2017-01', dateTo: '2021-12', employerPosition: 'Telekom Malaysia – Sales Executive', salary: '5500', reasons: 'Relocation' },
      { dateFrom: '2022-01', dateTo: '2025-04', employerPosition: 'Axiata Group – BD Manager', salary: '6500', reasons: 'Seeking new challenge' }
    ],
    references: [
      { name: 'Mr. David Tan', jobTitle: 'VP Sales', contactNo: '03-7788 9900', email: 'david.tan@axiata.com', relationship: 'Direct Supervisor' },
      { name: 'Ms. Kamala Devi', jobTitle: 'HR Director', contactNo: '03-7788 9901', email: 'kamala@axiata.com', relationship: 'HR Reference' }
    ],
    emergencyContacts: [
      { name: 'Rajesh Kumar', contactNo: '011-5566 7788', relationship: 'Spouse' }
    ],
    langProf: { 'Bahasa Melayu': { oral: 'Good', written: 'Good' }, 'English': { oral: 'Excellent', written: 'Excellent' }, 'Chinese/Mandarin': { oral: 'None', written: 'None' } },
    otherInfo: { convicted: false, dismissed: false, illness: false },
  }
]

const stmt = db.prepare('INSERT INTO form_submissions (form_type, data, submitted_by) VALUES (?, ?, ?)')
samples.forEach((s, i) => {
  stmt.run('job_application', JSON.stringify(s), s.email)
  console.log(`Inserted sample ${i + 1}: ${s.nameNRIC} — ${s.applyingFor}`)
})
console.log('Done! 3 sample job applications added.')
db.close()
